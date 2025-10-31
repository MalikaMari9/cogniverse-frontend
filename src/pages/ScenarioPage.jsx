// ===============================
// ScenarioPage.jsx (updated with backend integration + AI integration markers)
// ===============================
import React, { useEffect, useRef, useState, useCallback } from "react";
import { SvgIcon } from "./Workstation";
import { AgentCard } from "./Workstation";
import NavProduct from "../components/NavProduct";
import ScenarioHistory from "../pages/ScenarioHistory";
import { deleteScenario, getResultsByScenario } from "../api/api";
import "../ws_css.css";
import {
  createScenario,
  getScenarios,
  getResultsByAgentScenarioType,
  getResults,
  // 🧩 Simulation routes
  createSimulation,
  getSimulationById,
  advanceSimulation,
  triggerSimulationFate,
} from "../api/api";
import { buildSimPayload, startSimulation, pollSimulation, getAgentMemory, getAgentPosition , normalizeEvents} from "../hooks/simulationHelper";
import { useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import AgentLogModal from "../components/AgentLogModal";

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
  const validAgents = (selectedAgents || []).filter(a => a && a.agentid);
const [showHistory, setShowHistory] = useState(false);
const [replaying, setReplaying] = useState(false);
const [simulation, setSimulation] = useState(null);
const seenEventIdsRef = useRef(new Set());
const pollTimerRef = useRef(null);
const [isPolling, setIsPolling] = useState(false);
const pollingRef = useRef(false);
const [forwarding, setForwarding] = useState(false);
const [running, setRunning] = useState(false);
const [showAgentModal, setShowAgentModal] = useState(null);

//Place holder pause and stop
const [isPaused, setIsPaused] = useState(false);
const [stopped, setStopped] = useState(false);
//Place holder pause and stop


  // local theme label that always flips correctly
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

  // ---------------- helpers ----------------
  const hasOutput = loading || logs.length > 0;
// ===============================
// 🔹 Trigger Simulation Button (Frontend trigger) — with clean console logging
// ===============================
const handleRunSimulation = async () => {
  try {
    setRunning(true); // 🌀 show spinner
    // 1) payload
    const payload = buildSimPayload(scenarioText, validAgents);

    console.log("%c[Simulation Payload]", "color:#22aaff;font-weight:bold;");
    console.log(JSON.stringify(payload, null, 2));

    // 2) start
    const sim = await startSimulation(payload);
    setSimulation(sim);
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
      if (pollingRef.current) return;
      pollingRef.current = true;

      try {
        const { sim: updated, delta } = await pollSimulation(
          sim.id,
          seenEventIdsRef.current
        );

        setSimulation(updated);

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

        const status = String(updated.status || "").toLowerCase();
        if (["completed", "failed", "stopped"].includes(status)) {
          clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
          setIsPolling(false);
          toast.success(`Simulation ${status}`);
        }
      } catch (err) {
        console.error("⚠️ Polling failed:", err);
        toast.error("Polling error");
      } finally {
        pollingRef.current = false;
      }
    };

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(tick, 2500);
    setIsPolling(true);
  } catch (err) {
    console.error("❌ Simulation trigger failed:", err);
    toast.error("Failed to trigger simulation");
  } finally {
    setRunning(false); // 🌀 hide spinner
  }
};


const handleStopSimulation = useCallback(() => {
  if (pollTimerRef.current) {
    clearInterval(pollTimerRef.current);
    pollTimerRef.current = null;
    pollingRef.current = false;

  }
  setIsPolling(false);
  //Placeholder stop and Pause
  setIsPolling(false);
  setIsPaused(false);
  //Placeholder stop and Pause
  toast("🛑 Simulation stopped (frontend only)");
}, []);


// ===============================
// 🔹 Pause Simulation (soft pause)
// ===============================
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

// ===============================
// 🔹 Resume Simulation (soft resume)
// ===============================
const handleResumeSimulation = useCallback(async () => {
  if (!simulation?.id) {
    toast.error("No active simulation to resume.");
    return;
  }
  setIsPaused(false);
  toast("▶ Resuming simulation...");

  // Resume polling loop
  const tick = async () => {
    if (pollingRef.current) return;
    pollingRef.current = true;
    try {
      const { sim: updated, delta } = await pollSimulation(
        simulation.id,
        seenEventIdsRef.current
      );

      setSimulation(updated);

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
      }

      const status = String(updated.status || "").toLowerCase();
      if (["completed", "failed", "stopped"].includes(status)) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
        setIsPolling(false);
        toast.success(`Simulation ${status}`);
      }
    } catch (err) {
      console.error("⚠️ Polling failed:", err);
      toast.error("Polling error");
    } finally {
      pollingRef.current = false;
    }
  };

  pollTimerRef.current = setInterval(tick, 2500);
  setIsPolling(true);
}, [simulation]);



// ===============================
// 🔹 Advance Simulation by One Step
// ===============================
const handleAdvance = async () => {
  if (!simulation?.id) {
    toast.error("No active simulation to advance.");
    return;
  }

  try {
    setForwarding(true); // 🌀 start spinner
    toast.loading("Advancing simulation...", { id: "adv" });

    const res = await advanceSimulation(simulation.id, { steps: 1 });
    const updated = res?.simulation ?? res;

    setSimulation(updated);

// 🧩 Normalize events to filter out system/meta noise
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
      toast.success(
        `Advanced by 1 step (${delta.length} new event${delta.length > 1 ? "s" : ""})`,
        { id: "adv" }
      );
    } else {
      toast.success("Advanced by 1 step (no new events)", { id: "adv" });
    }
  } catch (err) {
    console.error("❌ Advance simulation failed:", err);
    toast.error("Advance failed", { id: "adv" });
  } finally {
    setForwarding(false); // 🌀 end spinner
  }
};



//HERE IS THE STOP SIMULATION, As of now I only stopped fetching APIs calls, I am afraid, it might continue
//working in the AI server so please check it


  // ---------------- Bubble Thought Fetcher ----------------
  // Fetches latest "thought" results for the given agent.
  // 🧠 [AI THOUGHT INTEGRATION POINT]
  // In the future, replace this call to `getResultsByAgentScenarioType`
  // with an AI endpoint that dynamically generates the agent's "thought"
  // such as: POST /simulate/agent-thought { projectagentid, scenarioid, context }
  const bubbleTextFor = async (agent) => {
    try {
      if (!agent.projectagentid || !currentScenario)
        return `${agent.name} is thinking...`;

      const thoughts = await getResultsByAgentScenarioType(
        agent.projectagentid,
        currentScenario.scenarioid,
        "thought"
      );

      if (thoughts.length > 0) {
        const r = thoughts[Math.floor(Math.random() * thoughts.length)];
        return r.resulttext || `${agent.name} is pondering something.`;
      } else {
        return `${agent.name} is quietly observing.`;
      }
    } catch (err) {
      console.warn("⚠️ Failed to fetch thought for agent", agent.name, err);
      return `${agent.name} is quietly observing.`;
    }
  };

  // Flip bubble to avoid clipping (top/bottom/left/right)
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
      tY = -110; // default: above, centered
    if (nearTop) tY = 10; // show below
    if (nearBottom) tY = -110; // show above
    if (nearLeft) tX = 0; // nudge right
    if (nearRight) tX = -100; // nudge left

    return { x, y, transform: `translate(${tX}%, ${tY}%)` };
  };

  // ---------------- node layout: always visible, evenly spaced ----------------
// ---------------- node layout: always visible, evenly spaced ----------------
const layoutNodes = () => {
  const el = boundsRef.current;
  if (!el || !validAgents || validAgents.length === 0) {
    setNodes([]); // clear old nodes if no agents
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

// Run layout when agent count changes
useEffect(() => {
  layoutNodes();
}, [validAgents.length]);

// Attach resize observer once
useEffect(() => {
  const el = boundsRef.current;
  if (!el) return;
  const ro = new ResizeObserver(() => layoutNodes());
  ro.observe(el);
  return () => ro.disconnect();
}, []);

  // ---------------- 🧩 Load all scenarios ----------------
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const data = await getScenarios();
        const filtered = data.filter((s) => s.projectid === Number(projectid));
        setScenarios(filtered);
        console.log("✅ Loaded scenarios:", data);
      } catch (err) {
        console.error("❌ Failed to load scenarios:", err);
      }
    };
    fetchScenarios();
  }, []);

  useEffect(() => {
  return () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }
  };
}, []);


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
      text: `${ag.agentname} ${
        acts[Math.floor(Math.random() * acts.length)]
      }`,
    };
  };

  const onGenerate = async () => {
    if (!scenarioText.trim()) {
      toast.error("Please enter a scenario description first.");
      return;
    }
    if (currentScenario) {
      toast.error("Finish or clear the current scenario before generating a new one.");
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
      setCurrentScenario(scenarioPayload); // 🟢 Store active scenario

      // ---------------- Fetch all simulation results (any type) ----------------
      // 🧩 [AI RESULT INTEGRATION POINT]
      // In the future, replace this section with a unified simulation call like:
      // POST /simulate/scenario { projectid, scenarioid }
      // The backend AI service should generate and persist all result types.
      try {
        const allResults = await getResults();
        const filtered = allResults.filter(
          (r) => r.scenarioid === scenarioPayload.scenarioid
        );
        const formatted = filtered.map((r, i) => ({
          id: r.resultid,
          who:
            validAgents.find(
              (a) => a.projectagentid === r.projectagentid
            )?.agentname || "Unknown",
          turn: r.sequence_no || i + 1,
          text: r.resulttext,
        }));
        setLogs(formatted);
      } catch (fetchErr) {
        console.error("❌ Failed to fetch scenario results:", fetchErr);
      }

      // 🪄 Local fallback — only used if backend has no AI output yet
      const L = [];
      const total = Math.max(6, validAgents.length * 2);
      for (let i = 0; i < total; i++) {
        const ag =
          validAgents[Math.floor(Math.random() * validAgents.length)];
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
          <button
            className="ws-btn primary"
            onClick={onGenerate}
            disabled={loading || !!currentScenario}
          >
            {loading ? "Generating..." : "Generate"}
          </button>

{/* =============================== */}
{/* 🎛️ Simulation Controls (Soft Pause/Resume/Stop placeholders) */}
{/* =============================== */}
{!isPolling && (
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

{/* 🔸 Soft Pause Placeholder — purely frontend */}
{simulation && isPolling && !isPaused && !stopped && (
  <button
    className="ws-btn ghost"
    onClick={handlePauseSimulation}
  >
    ⏸ Pause
  </button>
)}

{/* 🔸 Soft Resume Placeholder — purely frontend */}
{simulation && isPaused && !stopped && (
  <button
    className="ws-btn ghost"
    onClick={handleResumeSimulation}
  >
    ▶ Resume
  </button>
)}

{/* 🔸 Soft Stop Placeholder — cuts off polling only */}
{isPolling && (
  <button
    className="ws-btn danger"
    onClick={handleStopSimulation}
  >
    ⏹ Stop Simulation
  </button>
)}

{simulation && !["completed", "failed", "stopped"].includes(String(simulation.status).toLowerCase()) && (
  <span className="sc-running">
    ⏳ Running... ({simulation.events?.length || 0} events)
  </span>
)}

{/* =============================== */}
{/* End of soft controls — Replace with real backend pause/stop later */}
{/* =============================== */}

{simulation && !isPolling && (
  <button
    className={`ws-btn ghost ${forwarding ? "loading" : ""}`}
    onClick={handleAdvance}
    disabled={forwarding}
  >
    {forwarding ? (
      <>
        <div className="sc-spinner mini" />
        &nbsp;Forwarding...
      </>
    ) : (
      "⏩ Advance Step"
    )}
  </button>
)}



        </label>
      </section>
{/* Header toolbar above grid */}

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
  (simulation?.agents?.length ? simulation.agents : validAgents).map((n, i) => {
    // use backend position if available, otherwise fallback to our circular layout
    const pos =
      getAgentPosition(simulation, n.id || n.agentid) ||
      nodes[i] || 
      { x: 0, y: 0 };

    // handle missing names/icons gracefully
    const displayName = n.name || n.agentname || `Agent ${i + 1}`;
    const displayIcon = n.icon || "user";
    const displayEmotion = n.emotional_state || n.agentemotion || "neutral";
    const mem = getAgentMemory(simulation, n.id || n.agentid) || [];

    return (
      <div
        key={`${n.id || n.agentid || i}`}
        className="sc-node"
        style={{ left: pos.x, top: pos.y }}
        
onMouseEnter={async () => {
  const p = bubbleFor(pos.x, pos.y);
  const emotion = n.emotional_state || n.agentemotion || "";
  const thoughts = Array.isArray(n.thought_process) ? n.thought_process : [];
  console.log("🧠 Agent Thoughts", n.name, n.thought_process);

  // Build readable recent thoughts (limit to last 2)
  const recentThoughts = thoughts.filter(Boolean).slice(-2);
  const thoughtSection = recentThoughts.length
    ? `🧠 Thoughts:\n${recentThoughts.map(t => `- ${t}`).join("\n")}`
    : "";

  // If both emotion and thoughtSection are empty → fallback
  let text = "";
  if (!emotion && !thoughtSection) {
    text = `${displayName} is thinking...`;
  } else {
    text = `${thoughtSection ? thoughtSection + "\n\n" : ""}${
      emotion ? `💭 Emotion: ${emotion}` : ""
    }`;
  }

  setHover({
    x: p.x,
    y: p.y,
    text: text.trim(),
    transform: p.transform,
  });
}}


        onMouseLeave={() => setHover(null)}
      >
        <div className="sc-chip">
          <SvgIcon name={displayIcon} size={18} />
        </div>
        <div className="sc-name">
          {displayName}
        
        </div>
      </div>
    );
  })}

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
          {/* Debug simulation state */}
{simulation && (
  <div className="ws-card compact sc-sim-debug">
    <div className="sc-sim-header">
      <b>Simulation Debug</b>
    </div>
    <div className="sc-sim-body">
      <p>
        <b>ID:</b> {simulation.id}
      </p>
      <p>
        <b>Status:</b> {simulation.status || "loading..."}
      </p>
      <p>
        <b>Agents:</b>{" "}
        {simulation.agents?.length
          ? simulation.agents.map((a) => a.name).join(", ")
          : "None"}
      </p>
      <p>
        <b>Events:</b> {simulation.events?.length ?? 0}
      </p>
    </div>
  </div>
)}

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
          <div className="sc-log-head">Simulation Log</div>
          {loading ? (
            <div className="sc-center">
              <div className="sc-spinner" />
            </div>
          ) : (
            <div className="sc-log-list">
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
            </div>
          )}
        </aside>


        {/* Roster */}
{/* Roster */}
<div className="sc-roster">
  {validAgents.map((ag) => (
    <div
      className="agent-card-wrap"
      key={`${ag.agentid || ag.id}`}
      onClick={() => setShowAgentModal(ag)}
      style={{ cursor: "pointer" }}
    >
      <AgentCard agent={ag} onRemove={() => {}} onEdit={() => {}} />
    </div>
  ))}
</div>


{/* Agent Log Modal */}
{showAgentModal && (
  <AgentLogModal
    agent={showAgentModal}
    simulation={simulation}
    onClose={() => setShowAgentModal(null)}
  />
)}

      </section>

     
      {showHistory && (
  <ScenarioHistory
    scenarios={scenarios}
    onReplay={async (s) => {
      setShowHistory(false);
      setReplaying(true);
      setCurrentScenario(s);
      setLogs([]);
      try {
        const data = await getResultsByScenario(s.scenarioid);
        for (let i = 0; i < data.length; i++) {
          const r = data[i];
          setLogs((prev) => [
            ...prev,
            {
              id: r.resultid,
              who:
                validAgents.find(
                  (a) => a.projectagentid === r.projectagentid
                )?.agentname || "Unknown",
              turn: i + 1,
              text: r.resulttext,
            },
          ]);
          await new Promise((r) => setTimeout(r, 700)); // smooth playback
        }
      } catch (err) {
        toast.error("Failed to replay scenario");
      } finally {
        setReplaying(false);
      }
    }}
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

    </div>
  );
}