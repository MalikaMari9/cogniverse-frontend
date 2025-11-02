// ===============================
// ScenarioPage.jsx — polished (keep all features) — FIXED
// ===============================
import React, { useEffect, useRef, useState, useCallback } from "react";
import { SvgIcon } from "./Workstation";
import { AgentCard } from "./Workstation";
import NavProduct from "../components/NavProduct";
import ScenarioHistory from "../pages/ScenarioHistory";
import {
  // core crud
  deleteScenario,
  getResultsByScenario,
  getReplayData,
  createScenario,
  getScenarios,
  getResultsByAgentScenarioType,
  getResults,
  // 🧩 Simulation routes
  createSimulation,
  getSimulationById,
  advanceSimulation,
} from "../api/api";
import {
  buildSimPayload,
  startSimulation,
  pollSimulation,
  getAgentMemory,
  getAgentPosition,
  normalizeEvents,
  triggerFate,
  saveSimulationFlow,
} from "../hooks/simulationHelper";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import AgentLogModal from "../components/AgentLogModal";
import { getProjectAgents } from "../api/api";

export default function ScenarioPage({
  theme,
  onBackToWorkstation,
  onBackToGraph,
  selectedAgents,
}) {
  const { projectid } = useParams();

  // ---------------- state ----------------
  const [scenarioText, setScenarioText] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [nodes, setNodes] = useState([]); // [{id,name,icon,x,y}]
  const [hover, setHover] = useState(null); // {x,y,text,transform}
  const [scenarios, setScenarios] = useState([]); // ✅ store history
  const boundsRef = useRef(null);
  const [currentScenario, setCurrentScenario] = useState(null);
  // ✅ Prevent crash from undefined agents
  const validAgents = (selectedAgents || []).filter((a) => a && a.agentid);
  const [showHistory, setShowHistory] = useState(false);

  const [simulation, setSimulation] = useState(null);
  const seenEventIdsRef = useRef(new Set());
  const pollTimerRef = useRef(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef(false);
  const [forwarding, setForwarding] = useState(false);
  const [running, setRunning] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(null);
  const [expandedLog, setExpandedLog] = useState(false);

  const [isPaused, setIsPaused] = useState(false);
  const [agentLogs, setAgentLogs] = useState({});
  // Fate modal state
  const [showFate, setShowFate] = useState(false);
  const [fatePrompt, setFatePrompt] = useState("");
  const [weaving, setWeaving] = useState(false);

  // 💾 Save
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);

  // 🧩 Replay System State
  const [replaying, setReplaying] = useState(false);
  const [replayTimeline, setReplayTimeline] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isReplayPlaying, setIsReplayPlaying] = useState(false);

  const keyFor = (agent) => {
    if (!agent) return null;
    if (typeof agent === "string") return agent.toLowerCase();
    return (
      agent.id ||
      agent.agentid ||
      agent.projectagentid ||
      (agent.name && agent.name.toLowerCase()) ||
      (agent.agentname && agent.agentname.toLowerCase())
    );
  };

  // theme
  const [t, setT] = useState(() =>
    document.documentElement.getAttribute("data-theme") || "dark"
  );
  const toggleTheme = () => {
    const next = t === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setT(next);
  };

  // helpers
  const hasOutput = loading || logs.length > 0;
  const logEndRef = useRef(null);
  const logContainerRef = useRef(null);
  const pollErrorCountRef = useRef(0);

  // ✅ Generic error handler
  const handleError = (context, err) => {
    console.error(`⚠️ ${context} failed:`, err);
    pollErrorCountRef.current += 1;
    toast.error(`${context} error (${pollErrorCountRef.current}/5)`);

    if (pollErrorCountRef.current >= 5) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
      setIsPolling(false);
      toast.error("🚫 Too many errors — simulation stopped automatically.");
      setLogs((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          who: "System",
          turn: prev.length + 1,
          text: "⚠ Simulation stopped automatically after repeated errors.",
        },
      ]);
      return true; // stop
    }
    return false; // continue
  };

  // =========================
  // 🎞 Replay
  // =========================
  const applyReplayStep = (step) => {
    if (!step) return;

    // System logs
    if (step.type === "system") {
      setLogs((prev) => [
        ...prev,
        {
          id: `sys-${step.turn}`,
          who: step.who || "System",
          turn: step.turn,
          text: step.text || "",
        },
      ]);
      return;
    }

    // Normalize to lowercase string key for matching
    const stepKey =
      typeof step.agent === "string"
        ? step.agent.toLowerCase()
        : keyFor(step.agent);

    // Emotions
    if (step.type === "emotion") {
      setAgentLogs((prev) => ({
        ...prev,
        [step.agent]: [
          ...(prev[step.agent] || []),
          { time: step.time, emotion: step.emotion },
        ],
      }));

      // 🧠 Update live agent emotion too
      setSimulation((prev) => {
        if (!prev) return prev;
        const updated = (prev.agents || []).map((a) => {
          const aKey = (
            a.id ||
            a.agentid ||
            a.projectagentid ||
            a.name ||
            a.agentname ||
            ""
          )
            .toString()
            .toLowerCase();
        const match = aKey === stepKey;
          return match ? { ...a, emotional_state: step.emotion } : a;
        });

        return { ...prev, agents: updated };
      });
      return;
    }

    // Positions
    if (step.type === "position") {
      setSimulation((prev) => {
        if (!prev) return prev;
        const updated = (prev.agents || []).map((a) => {
          const aKey = (
            a.id ||
            a.agentid ||
            a.projectagentid ||
            a.name ||
            a.agentname ||
            ""
          )
            .toString()
            .toLowerCase();
          const match = aKey === stepKey;
          return match
            ? { ...a, position: { x: step.x, y: step.y, facing: step.facing } }
            : a;
        });

        return { ...prev, agents: updated };
      });
    }
  };

  // 🧠 Step through timeline
  const playTimeline = async () => {
    for (let i = currentStep; i < replayTimeline.length; i++) {
      if (!isReplayPlaying) break;
      const step = replayTimeline[i];
      applyReplayStep(step);
      setCurrentStep(i + 1);
      await new Promise((r) => setTimeout(r, 800));
    }
    setIsReplayPlaying(false);
  };

  // ▶️ Pause / Play toggle
  const handleReplayPlayPause = () => {
    setIsReplayPlaying((prev) => {
      const next = !prev;
      if (next) playTimeline();
      return next;
    });
  };

  // ⏩ Next step manually
  const handleReplayNextStep = () => {
    const step = replayTimeline[currentStep];
    if (step) {
      applyReplayStep(step);
      setCurrentStep((s) => Math.min(s + 1, replayTimeline.length));
    }
  };

  const handleReplayScenario = async (s) => {
    try {
      toast.loading("Loading replay...", { id: "replay" });
      setReplaying(true);
      setLogs([]);
      setAgentLogs({});
      setSimulation(null);
      setCurrentStep(0);

      const replay = await getReplayData(s.scenarioid);
      const allAgents = new Set([
        ...(replay.position?.map((p) => p.agent) || []),
        ...(replay.emotion?.map((e) => e.agent) || []),
      ]);

      const merged = [];
      (replay.system || []).forEach((e, i) =>
        merged.push({ type: "system", turn: i + 1, ...e })
      );
      (replay.emotion || []).forEach((e) =>
        merged.push({ type: "emotion", ...e })
      );
      (replay.position || []).forEach((e) =>
        merged.push({ type: "position", ...e })
      );

      setReplayTimeline(merged);
      setSimulation({
        id: s.scenarioid,
        agents: Array.from(allAgents).map((aName) => {
          const pos = replay.position?.find((p) => p.agent === aName);
          const emo = replay.emotion?.find((e) => e.agent === aName);
          return {
            name: aName,
            position: {
              x: pos?.x ?? 0,
              y: pos?.y ?? 0,
              facing: pos?.facing ?? null,
            },
            emotional_state: emo?.emotion || "(none)",
          };
        }),
      });

      // Debug (left intact)
      console.log("[Replay] raw:", replay);
      console.log("[Replay] counts:", {
        system: replay.system?.length,
        emotion: replay.emotion?.length,
        position: replay.position?.length,
      });
      console.log("[Replay] merged timeline sample:", merged.slice(0, 8));
      console.log("[Replay] initial sim agents:", {
        names: (replay.position || []).map((p) => p.agent),
      });

      toast.success(`Replay loaded (${merged.length} steps)`, { id: "replay" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load replay", { id: "replay" });
    }
  };

  // ===============================
  // 🔹 Trigger Simulation Button
  // ===============================
  const handleRunSimulation = async () => {
    try {
      setRunning(true);
      const payload = buildSimPayload(scenarioText, validAgents);
      const sim = await startSimulation(payload);

      // Inject projectagentid for each agent if missing
const injected = {
  ...sim,
  agents: (sim.agents || []).map((a) => {
    const simName = (a.name || a.agentname || "").trim().toLowerCase();

    const base = validAgents.find((b) => {
      const bName = (b.agentname || b.name || "").trim().toLowerCase();
      return bName === simName;
    });

    return { ...a, projectagentid: base?.projectagentid ?? null };
    
  }),
};

      setSimulation(injected);

      toast.success(`Simulation started (ID: ${sim.id})`);

      seenEventIdsRef.current = new Set((sim.events || []).map((e) => e.id));

      if (sim.events?.length) {
        setLogs((prev) => [
          ...prev,
          ...sim.events.map((e, idx) => ({
            id: e.id,
            who: e.actor,
            turn: prev.length + 1 + idx,
            text: e.text,
          })),
        ]);
      }

      const tick = async () => {
        try {
          const { sim: updatedSim, delta } = await pollSimulation(
            sim.id,
            seenEventIdsRef.current
          );
          pollErrorCountRef.current = 0;

          // 🧩 Merge without skipping React updates
          setSimulation((prev) => {
            const merged = {
              ...prev,
              id: updatedSim.id,
              status: updatedSim.status,
              agents: (updatedSim.agents || []).map((a) => {
                const base = (prev?.agents || []).find(
                  (b) =>
                    b.agentid === a.agentid ||
                    b.name === a.name ||
                    b.agentname === a.name
                );
                return { ...a, projectagentid: base?.projectagentid || null };
              }),
              events: updatedSim.events || prev.events || [],
            };
            // deep copy was forcing re-render; not needed if refs change properly
            return merged;
          });

          // 🧩 Capture snapshots into agentLogs on each poll
          setAgentLogs((prev) => {
            const next = { ...prev };
            let changed = false;

            for (const a of updatedSim.agents || []) {
              const key =
                a.id ||
                a.agentid ||
                a.projectagentid ||
                (a.name && a.name.toLowerCase()) ||
                (a.agentname && a.agentname.toLowerCase());
              if (!key) continue;

              const emotion = a.emotional_state || a.agentemotion || null;
              const memory = Array.isArray(a.memory)
                ? a.memory[a.memory.length - 1]
                : a.memory || null;
              const corrosion = Array.isArray(a.corroded_memory)
                ? a.corroded_memory[a.corroded_memory.length - 1]
                : a.corroded_memory || null;
              const position = {
                x: a.position?.x ?? 0,
                y: a.position?.y ?? 0,
                facing: a.position?.facing ?? null,
              };

              const snapshot = {
                time: new Date().toLocaleTimeString(),
                emotion,
                memory,
                corrosion,
                position,
              };

              const existing = next[key] || [];
              const last = existing[existing.length - 1];

              const lastSig = last
                ? `${last.emotion}||${last.memory}||${last.corrosion}||${last.position?.x},${last.position?.y}`
                : "";
              const newSig = `${snapshot.emotion}||${snapshot.memory}||${snapshot.corrosion}||${snapshot.position.x},${snapshot.position.y}`;

              if (lastSig !== newSig) {
                next[key] = [...existing, snapshot];
                changed = true;
              }
            }

            return changed ? next : prev;
          });

          if (delta.length) {
            for (const d of delta) seenEventIdsRef.current.add(d.id);
            setLogs((prev) => [
              ...prev,
              ...delta.map((e, idx) => ({
                id: e.id,
                who: e.actor,
                turn: prev.length + 1 + idx,
                text: e.text,
              })),
            ]);
          }

          const status = String(updatedSim.status || "").toLowerCase();
          if (["completed", "failed", "stopped"].includes(status)) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
            setIsPolling(false);
            toast.success(`Simulation ${status}`);
          }
        } catch (err) {
          if (handleError("Polling", err)) return;
        } finally {
          // only used by resume tick guard, safe to leave here
          pollingRef.current = false;
        }
      };

      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      pollErrorCountRef.current = 0;
      pollTimerRef.current = setInterval(tick, 2500);
      setIsPolling(true);
    } catch (err) {
      console.error("❌ Simulation trigger failed:", err);
      toast.error("Failed to trigger simulation");
    } finally {
      setRunning(false);
    }
  };

  const handleStopSimulation = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
      pollingRef.current = false;
    }
    setIsPolling(false);
    setIsPaused(false);
    pollErrorCountRef.current = 0;
    toast("🛑 Simulation stopped (frontend only)");
    // 👉 Ask user if they want to save
    setShowSaveModal(true);
  }, []);

  const handleConfirmSave = async () => {
    if (!simulation) {
      toast.error("No simulation data to save.");
      return;
    }
    setSaving(true);
    try {
      const { scenarioid, summary } = await saveSimulationFlow({
        projectid: Number(projectid),
        simulation,
        logs,
        agentLogs,
        selectedAgents: validAgents, // ✅ added to link projectagentid
        scenarioname: saveName || `Simulation ${new Date().toLocaleString()}`,
        scenarioprompt: scenarioText,
      });
      toast.success(
        `Saved ${summary?.counts?.system || 0} logs to scenario #${scenarioid}`
      );
      setShowSaveModal(false);
      setSaveName("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save simulation results");
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Pause Simulation (soft)
  const handlePauseSimulation = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
      pollingRef.current = false;
    }
    setIsPolling(false);
    setIsPaused(true);
    toast("⏸ Simulation paused");
  }, []);

  // 🔹 Resume Simulation (soft)
  const handleResumeSimulation = useCallback(async () => {
    if (!simulation?.id) {
      toast.error("No active simulation to resume.");
      return;
    }
    // 🧩 Sync once before resuming — ensures fate or manual changes are reflected
    try {
      const { sim: syncedSim, delta } = await pollSimulation(
        simulation.id,
        seenEventIdsRef.current
      );
      setSimulation(syncedSim);

      // Merge unseen events (e.g., newly woven fate events)
      if (delta.length) {
        for (const d of delta) seenEventIdsRef.current.add(d.id);
        setLogs((prev) => [
          ...prev,
          ...delta.map((e, idx) => ({
            id: e.id,
            who: e.actor || "System",
            turn: prev.length + 1 + idx,
            text: e.text || "(no text)",
          })),
        ]);
      }
    } catch (err) {
      console.error("⚠️ Sync before resume failed:", err);
    }

    setIsPaused(false);
    toast("▶ Resuming simulation...");

    const tick = async () => {
      if (pollingRef.current) return;
      pollingRef.current = true;
      try {
        const { sim: updatedSim, delta } = await pollSimulation(
          simulation.id,
          seenEventIdsRef.current
        );
        pollErrorCountRef.current = 0;

        // Flatten: ensure agents live under simulation root
        setSimulation((prev) => ({
          ...prev,
          ...updatedSim,
          agents: (updatedSim?.agents || prev?.agents || []).map((a) => {
            const base = (prev?.agents || []).find(
              (b) =>
                b.agentid === a.agentid ||
                b.name === a.name ||
                b.agentname === a.name
            );
            return {
              ...a,
              projectagentid: base?.projectagentid || a.projectagentid || null,
            };
          }),
        }));

        if (delta.length) {
          for (const d of delta) seenEventIdsRef.current.add(d.id);
          setLogs((prev) => [
            ...prev,
            ...delta.map((e, idx) => ({
              id: e.id,
              who: e.actor,
              turn: prev.length + 1 + idx,
              text: e.text,
            })),
          ]);
        }

        const status = String(updatedSim.status || "").toLowerCase();
        if (["completed", "failed", "stopped"].includes(status)) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
          setIsPolling(false);
          toast.success(`Simulation ${status}`);
        }
      } catch (err) {
        if (handleError("Polling", err)) return;
      } finally {
        pollingRef.current = false;
      }
    };

    pollErrorCountRef.current = 0;
    pollTimerRef.current = setInterval(tick, 2500);
    setIsPolling(true);
  }, [simulation]);

  // 🔹 Advance one step
  const handleAdvance = async () => {
    if (!simulation?.id) {
      toast.error("No active simulation to advance.");
      return;
    }

    try {
      setForwarding(true);
      toast.loading("Advancing simulation...", { id: "adv" });

      const res = await advanceSimulation(simulation.id, { steps: 1 });
      const updated = res?.simulation ?? res;
      setSimulation(updated);

      const allEvents = normalizeEvents(updated.events || []);
      const delta = allEvents.filter((e) => !seenEventIdsRef.current.has(e.id));

      if (delta.length) {
        for (const d of delta) seenEventIdsRef.current.add(d.id);
        setLogs((prev) => [
          ...prev,
          ...delta.map((e, idx) => ({
            id: e.id,
            who: e.actor || "System",
            turn: prev.length + 1 + idx,
            text: e.summary || e.text || "(no text)",
          })),
        ]);
        pollErrorCountRef.current = 0;
        toast.success(
          `Advanced by 1 step (${delta.length} new event${
            delta.length > 1 ? "s" : ""
          })`,
          { id: "adv" }
        );
      } else {
        toast.success("Advanced by 1 step (no new events)", { id: "adv" });
      }
    } catch (err) {
      if (!handleError("Advance", err)) {
        toast.error("Advance failed", { id: "adv" });
      }
    } finally {
      setForwarding(false);
    }
  };

  // 🔮 Trigger Fate (usable during pause)
  const handleTriggerFate = async () => {
    if (!simulation?.id) {
      toast.error("No active simulation.");
      return;
    }
    try {
      setWeaving(true);
      toast.loading("Weaving fate...", { id: "fate" });

      const { sim: updated, delta } = await triggerFate(
        simulation.id,
        fatePrompt
      );
      setSimulation(updated);

      const newEvents = normalizeEvents(updated.events || []);
      const unseen = newEvents.filter(
        (e) => !seenEventIdsRef.current.has(e.id)
      );
      if (unseen.length) {
        unseen.forEach((e) => seenEventIdsRef.current.add(e.id));
        setLogs((prev) => [
          ...prev,
          ...unseen.map((e, idx) => ({
            id: e.id,
            who: e.actor || "System",
            turn: prev.length + 1 + idx,
            text: e.text || "(no text)",
          })),
        ]);
      }
      toast.success("Fate woven.", { id: "fate" });
      setShowFate(false);
    } catch (err) {
      console.error(err);
      toast.error("Fate failed.", { id: "fate" });
    } finally {
      setWeaving(false);
    }
  };

  // ---------------- Bubble layout helpers ----------------
  const bubbleFor = (nx, ny) => {
    const el = boundsRef.current;
    if (!el) return { x: nx, y: ny, transform: "translate(-50%, -110%)" };
    const W = el.clientWidth,
      H = el.clientHeight;
    const pad = 12,
      edge = 96;
    let x = Math.max(pad, Math.min(W - pad, nx));
    let y = Math.max(pad, Math.min(H - pad, ny));

    const nearTop = y < edge;
    const nearBottom = y > H - edge;
    const nearLeft = x < edge;
    const nearRight = x > W - edge;

    let tX = -50,
      tY = -110;
    if (nearTop) tY = 10;
    if (nearBottom) tY = -110;
    if (nearLeft) tX = 0;
    if (nearRight) tX = -100;

    return { x, y, transform: `translate(${tX}%, ${tY}%)` };
  };

  // 🧭 Ensure all agents stay within the visible canvas area
  const enforceAgentBounds = useCallback(() => {
    const el = boundsRef.current;
    if (!el || !simulation?.agents?.length) return;

    const W = el.clientWidth;
    const H = el.clientHeight;
    const margin = 80; // padding from border

    // Check and correct agent positions
    const adjustedAgents = simulation.agents.map((agent) => {
      const x = agent.position?.x ?? agent.x ?? 0;
      const y = agent.position?.y ?? agent.y ?? 0;

      const clampedX = Math.min(Math.max(margin, x), W - margin);
      const clampedY = Math.min(Math.max(margin, y), H - margin);

      // Return corrected agent if outside bounds
      if (x !== clampedX || y !== clampedY) {
        console.debug(
          `🧭 Shifted ${agent.name || agent.agentname}: (${x}, ${y}) → (${clampedX}, ${clampedY})`
        );
        return {
          ...agent,
          position: { x: clampedX, y: clampedY },
          __moved: true,
        };
      }
      return agent;
    });

    // If any agent was adjusted, update simulation
    const changed = adjustedAgents.some((a, i) => {
      const orig = simulation.agents[i];
      return (
        a.position?.x !== orig.position?.x || a.position?.y !== orig.position?.y
      );
    });

    if (changed) {
      setSimulation((prev) => ({
        ...prev,
        agents: adjustedAgents,
      }));
    }
  }, [simulation]);

  // ---------------- node layout: evenly spaced ----------------
  const layoutNodes = () => {
    const el = boundsRef.current;
    if (!el || !validAgents || validAgents.length === 0) {
      setNodes([]);
      return;
    }

    const W = el.clientWidth;
    const H = el.clientHeight;
    const PAD = 72;
    const n = Math.max(1, validAgents.length);
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.max(40, Math.min(W, H) / 2 - PAD);

    const pts =
      n === 1
        ? [
            {
              id: validAgents[0].agentid,
              name: validAgents[0].agentname,
              projectagentid: validAgents[0].projectagentid,
              icon: validAgents[0].icon || "user",
              x: Math.round(cx),
              y: Math.round(cy),
            },
          ]
        : validAgents.map((ag, i) => {
            const t = -Math.PI / 2 + (i * 2 * Math.PI) / n;
            const x = Math.max(PAD, Math.min(W - PAD, cx + R * Math.cos(t)));
            const y = Math.max(PAD, Math.min(H - PAD, cy + R * Math.sin(t)));
            return {
              id: ag.agentid,
              name: ag.agentname,
              projectagentid: ag.projectagentid,
              icon: ag.icon || "user",
              x: Math.round(x),
              y: Math.round(y),
            };
          });

    setNodes(pts);
  };

  // ✅ Ensure every selected agent carries a valid projectagentid (fallback patch)
useEffect(() => {
  if (!validAgents?.length) return;
  const patched = validAgents.map((a, i) => ({
    ...a,
    // assign fallback projectagentid if missing (temporary for name matching)
    projectagentid: a.projectagentid ?? a.id ?? a.agentid ?? i + 1,
  }));
  console.log("🩹 Patched selectedAgents with projectagentid:", patched);
}, [validAgents]);



useEffect(() => {
  if (!validAgents?.length) {
    setNodes([]);
    return;
  }
  layoutNodes();
  // only recalc when agent count changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [validAgents?.length]);

  // 🧩 Periodically ensure agents stay within bounds
 useEffect(() => {
  if (!simulation?.agents?.length) return;
  const moved = simulation.agents.some(a => a.__moved);
  if (!moved) enforceAgentBounds();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [simulation?.agents?.length]);

  useEffect(() => {
    const el = boundsRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => layoutNodes());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 🧠 Update agent logs: dedupe only if all tracked fields are identical
  useEffect(() => {
    const simData = simulation?.simulation || simulation;
    if (!simData?.agents?.length) return;

    setAgentLogs((prev) => {
      const next = { ...prev };
      let changed = false;

      for (const a of simData.agents) {
        const key =
          a.id ||
          a.agentid ||
          a.projectagentid ||
          (a.name && a.name.toLowerCase()) ||
          (a.agentname && a.agentname.toLowerCase());
        if (!key) continue;

        const emotion = a.emotional_state || a.agentemotion || null;
        const memory = Array.isArray(a.memory)
          ? a.memory[a.memory.length - 1]
          : a.memory || null;
        const corrosion = Array.isArray(a.corroded_memory)
          ? a.corroded_memory[a.corroded_memory.length - 1]
          : a.corroded_memory || null;

        // 🧭 new: capture current position
        const position = {
          x: a.position?.x ?? 0,
          y: a.position?.y ?? 0,
          facing: a.position?.facing ?? null,
        };

        // skip entirely if agent has no emotional/memory/corrosion and hasn’t moved
        if (!emotion && !memory && !corrosion && position.x === 0 && position.y === 0)
          continue;

        const snapshot = {
          projectagentid: a.projectagentid ?? null, 
          time: new Date().toLocaleTimeString(),
          emotion,
          memory,
          corrosion,
          position, // ✅ added
        };

        const existing = next[key] || [];
        const last = existing[existing.length - 1];

        // build combined signatures for comparison (now includes position)
        const lastSig = last
          ? `${last.emotion}||${last.memory}||${
              Array.isArray(last.corrosion)
                ? last.corrosion.join(",")
                : last.corrosion
            }||${last.position?.x ?? ""},${last.position?.y ?? ""},${
              last.position?.facing ?? ""
            }`
          : "";

        const newSig = `${snapshot.emotion}||${snapshot.memory}||${
          Array.isArray(snapshot.corrosion)
            ? snapshot.corrosion.join(",")
            : snapshot.corrosion
        }||${snapshot.position.x},${snapshot.position.y},${
          snapshot.position.facing ?? ""
        }`;

        // ✅ append if *any* of the tracked fields (emotion/memory/corrosion/position) changed
        if (lastSig !== newSig) {
          next[key] = [...existing, snapshot];
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [simulation]);

  // load scenarios
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const data = await getScenarios();
        const filtered = data.filter((s) => s.projectid === Number(projectid));
        setScenarios(filtered);
      } catch (err) {
        console.error("❌ Failed to load scenarios:", err);
      }
    };
    fetchScenarios();
  }, [projectid]);

  // clear poller on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // autoscroll log
  useEffect(() => {
    const el = logContainerRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [logs]);

  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && setExpandedLog(false);
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // (kept) replay cleanup — safe enough in practice for this component
  useEffect(() => {
    if (!replaying) return;
    return () => {
      setReplaying(false);
      setReplayTimeline([]);
      setCurrentStep(0);
      setIsReplayPlaying(false);
    };
  }, [replaying]);

  // ---------------- fake generation + backend save ----------------
  const genLine = (ag, i) => {
    const acts = [
      "proposes a quick prototype. “Thin slice first, then iterate.”",
      "is analyzing trade-offs. “Define ‘done’ clearly.”",
      "calls out a risky assumption.",
      "aligns the team on success metrics.",
      "shares a concern about scope.",
    ];
    return {
      id: `${ag.agentid}-${i}`,
      who: ag.agentname,
      turn: i + 1,
      text: `${ag.agentname} ${acts[Math.floor(Math.random() * acts.length)]}`,
    };
  };

  const onGenerate = async () => {
    if (!scenarioText.trim()) {
      toast.error("Please enter a scenario description first.");
      return;
    }
    if (currentScenario) {
      toast.error(
        "Finish or clear the current scenario before generating a new one."
      );
      return;
    }

    setLoading(true);
    setLogs([]);
    setHover(null);

    try {
      const scenarioPayload = {
        scenarioname: scenarioText || "Untitled Scenario",
        scenarioprompt: scenarioText,
        projectid: Number(projectid),
        status: "active",
      };

      await createScenario(scenarioPayload);
      toast.success("Scenario saved successfully!");
      setCurrentScenario(scenarioPayload);

      try {
        const allResults = await getResults();
        const filtered = allResults.filter(
          (r) => r.scenarioid === scenarioPayload.scenarioid
        );
        const formatted = filtered.map((r, i) => ({
          id: r.resultid,
          who:
            validAgents.find((a) => a.projectagentid === r.projectagentid)
              ?.agentname || "Unknown",
          turn: r.sequence_no || i + 1,
          text: r.resulttext,
        }));
        setLogs(formatted);
      } catch (fetchErr) {
        console.error("❌ Failed to fetch scenario results:", fetchErr);
      }

      const L = [];
      const total = Math.max(6, validAgents.length * 2);
      for (let i = 0; i < total; i++) {
        const ag = validAgents[Math.floor(Math.random() * validAgents.length)];
        L.push(genLine(ag, i));
      }
      setLogs(L);
    } catch (err) {
      toast.error("Failed to create scenario");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- render ----------------
  return (
    <div className="sc-page">
      {/* NAV */}
      <NavProduct
        theme={theme}
        onToggleTheme={toggleTheme}
        active="workstation"
        onGoWorkstation={() => (window.location.href = "/workstation")}
        onGoGraph={() => (window.location.href = "/graph")}
        onGoHistory={() => (window.location.href = "/history")}
      />

      {/* Scenario input */}
      <section className="sc-input ws-card">
        <label className="sc-input-row">
          <span>Scenario</span>
          <textarea
            rows={2}
            value={scenarioText}
            onChange={(e) => setScenarioText(e.target.value)}
            placeholder="Describe the situation you want to simulate…"
          />

          {replaying && (
            <div className="sc-sim-controls replay">
              <button className="ws-btn primary" onClick={handleReplayPlayPause}>
                {isReplayPlaying ? "⏸ Pause Replay" : "▶ Play Replay"}
              </button>
              <button className="ws-btn ghost" onClick={handleReplayNextStep}>
                ⏩ Next Step
              </button>
              <span style={{ marginLeft: 12, opacity: 0.7 }}>
                Step {currentStep}/{replayTimeline.length}
              </span>
            </div>
          )}

          {/* =============================== */}
          {/* 🎛️ Simulation Controls — improved layout */}
          {/* =============================== */}
          {!replaying && (
            <div className="sc-sim-controls">
              {!simulation && (
                <button
                  className={`ws-btn primary ${running ? "loading" : ""}`}
                  onClick={handleRunSimulation}
                  disabled={loading || running}
                >
                  {running ? (
                    <>
                      <div className="sc-spinner mini" />
                      &nbsp;Running...
                    </>
                  ) : (
                    "▶ Run Simulation"
                  )}
                </button>
              )}

              {simulation && (
                <>
                  {!isPolling && (
                    <button
                      className={`ws-btn primary ${running ? "loading" : ""}`}
                      onClick={
                        isPaused ? handleResumeSimulation : handleRunSimulation
                      }
                      disabled={running}
                    >
                      {isPaused ? "▶ Resume" : "▶ Run Simulation"}
                    </button>
                  )}

                  {isPolling && !isPaused && (
                    <button
                      className="ws-btn ghost"
                      onClick={handlePauseSimulation}
                    >
                      ⏸ Pause
                    </button>
                  )}

                  {(isPolling || isPaused) && (
                    <button
                      className="ws-btn danger"
                      onClick={handleStopSimulation}
                    >
                      ⏹ Stop
                    </button>
                  )}

                  {!isPolling && (
                    <button
                      className={`ws-btn ghost ${
                        forwarding ? "loading" : ""
                      }`}
                      onClick={handleAdvance}
                    >
                      {forwarding ? (
                        <>
                          <div className="sc-spinner mini" />
                          &nbsp;Forwarding…
                        </>
                      ) : (
                        "⏩ Advance"
                      )}
                    </button>
                  )}

                  {isPaused && !isPolling && (
                    <button
                      className="ws-btn ghost"
                      onClick={() => setShowFate(true)}
                    >
                      🕯 Weave Fate
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </label>
      </section>

      <button className="ws-btn ghost" onClick={() => setShowHistory(true)}>
        📜 History
      </button>

      {/* MAIN grid */}
      <section className={`sc-main ${hasOutput ? "has-output" : ""}`}>
        {/* Canvas */}
        <div
          className={`sc-canvas sc-grid ws-card ${hasOutput ? "post" : "pre"}`}
          ref={boundsRef}
        >
          {loading && (
            <div className="sc-center">
              <div className="sc-spinner big" />
            </div>
          )}

          {!loading &&
            (simulation?.agents?.length ? simulation.agents : validAgents).map(
              (n, i) => {
                const layout =
                  nodes[i] ||
                  nodes.find(
                    (p) =>
                      p.id === (n.id || n.agentid) ||
                      p.name === (n.name || n.agentname)
                  ) || { x: 0, y: 0 };

                const pos = {
                  x: n.position?.x ?? layout.x,
                  y: n.position?.y ?? layout.y,
                };

                const displayName = n.name || n.agentname || `Agent ${i + 1}`;
                const displayIcon = n.icon || layout.icon || "user";

                return (
                  <div
                    key={`${n.id || n.agentid || i}`}
                    className={`sc-node ${n.__moved ? "moved" : ""}`}
                    style={{ left: pos.x, top: pos.y }}
                    onMouseEnter={() => {
                      const p = bubbleFor(pos.x, pos.y);
                      const emotion = n.emotional_state || n.agentemotion || "";

                      let text = "";
                      if (!emotion) text = `${displayName} is thinking...`;
                      else text = `💭 Emotion: ${emotion}`;

                      setHover({
                        x: p.x,
                        y: p.y,
                        text: text.trim(),
                        transform: p.transform,
                      });
                    }}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => setShowAgentModal(n)}
                  >
                    <div className="sc-chip">
                      <SvgIcon name={displayIcon} size={18} />
                    </div>
                    <div className="sc-name">{displayName}</div>
                  </div>
                );
              }
            )}

          {hover && (
            <div
              className="sc-bubble"
              style={{
                left: hover.x,
                top: hover.y,
                transform: hover.transform,
              }}
            >
              {hover.text}
            </div>
          )}
        </div>

        {/* Log */}
        <aside className="sc-log ws-card compact">
          {/* Optional debug card kept commented */}

          {currentScenario && (
            <div className="sc-current compact">
              <div className="sc-cur-title">
                <b>Current Scenario:</b>{" "}
                {currentScenario.scenarioname || "Untitled Scenario"}
              </div>
              <div className="sc-cur-desc">
                {currentScenario.scenarioprompt?.slice(0, 100)}
                {currentScenario.scenarioprompt?.length > 100 ? "…" : ""}
              </div>
              <button
                className="ws-btn ghost mini"
                onClick={() => setCurrentScenario(null)}
              >
                ✖ Create New Scenario
              </button>
            </div>
          )}

          <div
            className="sc-log-head"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <span>Simulation Log</span>
            <button
              className="ws-btn ghost mini"
              onClick={() => setExpandedLog(true)}
            >
              ⛶ Enlarge
            </button>
          </div>

          {loading ? (
            <div className="sc-center">
              <div className="sc-spinner" />
            </div>
          ) : (
            <div className="sc-log-list" ref={logContainerRef}>
              {logs.map((item) => (
                <div key={`${item.id || item.turn}`} className="sc-log-item">
                  <div className="who">
                    <span className="dot" />
                    <b>{item.who}</b>
                    <span className="turn">Turn {item.turn}</span>
                  </div>
                  <p>{item.text}</p>
                </div>
              ))}
              {isPolling && (
                <div className="sc-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
              <div ref={logEndRef} />
            </div>
          )}
        </aside>

        {/* ===============================
            🧠 Agent Roster + Agent Log Modal
           =============================== */}
        <div className="sc-roster">
          {validAgents.map((baseAg) => {
            const liveAg = (simulation?.agents || []).find(
              (s) =>
                s.id === baseAg.agentid ||
                s.agentid === baseAg.agentid ||
                s.name === baseAg.agentname
            );

            const logKey =
              (liveAg && (liveAg.id || liveAg.agentid)) ||
              baseAg.agentid ||
              baseAg.id ||
              (baseAg.agentname && baseAg.agentname.toLowerCase()) ||
              (baseAg.name && baseAg.name.toLowerCase());

            const merged = { ...baseAg, ...(liveAg || {}), __logKey: logKey };

            return (
              <div
                key={merged.agentid || merged.id || merged.__logKey}
                className="agent-card-wrap"
                style={{ cursor: "pointer" }}
                onClick={() => setShowAgentModal(merged)}
              >
                <AgentCard agent={merged} onRemove={() => {}} onEdit={() => {}} />
              </div>
            );
          })}
        </div>

        {/* Modal */}
        {showAgentModal && (
          <AgentLogModal
            agent={showAgentModal}
            entries={
              agentLogs[
                showAgentModal.__logKey ||
                  showAgentModal.id ||
                  showAgentModal.agentid ||
                  showAgentModal.projectagentid ||
                  (showAgentModal.name &&
                    showAgentModal.name.toLowerCase()) ||
                  (showAgentModal.agentname &&
                    showAgentModal.agentname.toLowerCase())
              ] || []
            }
            simulation={simulation}
            isPolling={isPolling}
            onClose={() => setShowAgentModal(null)}
          />
        )}
      </section>

      {showHistory && (
        <ScenarioHistory
          scenarios={scenarios}
          onReplay={handleReplayScenario}
          onDelete={async (id) => {
            try {
              await deleteScenario(id);
              setScenarios((prev) => prev.filter((x) => x.scenarioid !== id));
              toast.success("Scenario deleted");
            } catch {
              toast.error("Delete failed");
            }
          }}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* 🔮 Fate Modal */}
      {showFate && (
        <div className="agent-log-modal">
          <div className="agent-log-content" style={{ maxWidth: 640 }}>
            <div className="sc-sim-header">
              <b>Weave Fate</b>
            </div>
            <div className="sc-sim-body">
              <textarea
                rows={3}
                value={fatePrompt}
                onChange={(e) => setFatePrompt(e.target.value)}
                placeholder="Describe the fate to weave..."
                style={{ width: "100%" }}
              />
            </div>
            <div
              className="sc-sim-footer"
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button className="ws-btn ghost" onClick={() => setShowFate(false)}>
                Cancel
              </button>
              <button
                className={`ws-btn primary ${weaving ? "loading" : ""}`}
                onClick={handleTriggerFate}
              >
                {weaving ? (
                  <>
                    <div className="sc-spinner mini" />
                    &nbsp;Weaving…
                  </>
                ) : (
                  "Trigger Fate"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {expandedLog && (
        <div className="sc-log-expand">
          <div className="sc-log-expand-content">
            <div className="sc-log-expand-header">
              <h3>📜 Simulation Log</h3>
              <button
                className="ws-btn ghost mini"
                onClick={() => setExpandedLog(false)}
              >
                ✖ Close
              </button>
            </div>

            <div className="sc-log-expand-body">
              {logs.length === 0 ? (
                <p style={{ opacity: 0.7 }}>No log entries yet.</p>
              ) : (
                logs.map((item) => (
                  <div key={item.id || item.turn} className="sc-log-item">
                    <div className="who">
                      <span className="dot" />
                      <b>{item.who}</b>
                      <span className="turn">Turn {item.turn}</span>
                    </div>
                    <p>{item.text}</p>
                  </div>
                ))
              )}
              {isPolling && (
                <div className="sc-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 💾 Save Simulation Modal */}
      {showSaveModal && (
        <div className="agent-log-modal">
          <div className="agent-log-content" style={{ maxWidth: 480 }}>
            <div className="sc-sim-header">
              <b>Save Simulation</b>
            </div>
            <div className="sc-sim-body">
              <p style={{ opacity: 0.8 }}>
                Name this scenario for later replay:
              </p>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Scenario name..."
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "6px",
                  marginTop: "8px",
                  border: "1px solid var(--border-color, #444)",
                }}
              />
            </div>
            <div
              className="sc-sim-footer"
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button
                className="ws-btn ghost"
                onClick={() => setShowSaveModal(false)}
              >
                Cancel
              </button>
              <button
                className={`ws-btn primary ${saving ? "loading" : ""}`}
                onClick={handleConfirmSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="sc-spinner mini" />
                    &nbsp;Saving…
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
