// ===============================
// ScenarioPage.jsx (updated with backend integration + AI integration markers)
// ===============================
import React, { useEffect, useRef, useState, useCallback } from "react";
import { SvgIcon } from "./Workstation";
import { AgentCard } from "./Workstation";
import NavProduct from "../components/NavProduct";

import "../ws_css.css";

const TERMINAL_SIMULATION_STATES = new Set([
  "completed",
  "failed",
  "errored",
  "error",
  "cancelled",
  "canceled",
  "stopped",
]);
import {
  advanceSimulation,
  createSimulation,
  getSimulationById,
  triggerSimulationFate,
} from "../api/api";
import { useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

export default function ScenarioPage({
  theme,
  onBackToWorkstation,
  onBackToGraph,
  selectedAgents,
}) {
  const { projectid } = useParams();
  const projectNumericId =
    projectid && !Number.isNaN(Number(projectid)) ? Number(projectid) : undefined;

  // ---------------- state ----------------
  const [scenarioText, setScenarioText] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [nodes, setNodes] = useState([]); // [{id,name,icon,x,y}]
  const [hover, setHover] = useState(null); // {x,y,text,transform}
  const [agentBubbles, setAgentBubbles] = useState({ byId: {}, byName: {} });
  const [history, setHistory] = useState([]); // store simulation history
  const [simulation, setSimulation] = useState(null);
  const [simulationId, setSimulationId] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const boundsRef = useRef(null);
  const pollRef = useRef(null);
  // ✅ Prevent crash from undefined agents
  const validAgents = (selectedAgents || []).filter(a => a && a.agentid);

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
  const hasOutput = loading || logs.length > 0 || Boolean(simulation);
  const simulationStatus = simulation?.status
    ? String(simulation.status).toLowerCase()
    : null;
  const isSimulationActive =
    Boolean(simulation) &&
    !TERMINAL_SIMULATION_STATES.has(simulationStatus || "");
  const ensureStringArray = (value) => {
    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }
    if (typeof value === "string" && value.trim()) {
      return [value.trim()];
    }
    return [];
  };

  const normalizeName = (value) => {
    if (!value || typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed ? trimmed.toLowerCase() : null;
  };

  const toNumeric = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  };

  const gatherAgentIds = (agent) => {
    if (!agent || typeof agent !== "object") return [];
    const candidates = [
      agent.id,
      agent.agent_id,
      agent.agentId,
      agent.agent_uuid,
      agent.agentUuid,
      agent.agentid,
      agent.project_agent_id,
      agent.projectagentid,
      agent.projectAgentId,
      agent.projectAgentID,
      agent.external_id,
      agent.externalId,
    ];
    const unique = new Set();
    candidates.forEach((val) => {
      if (val === null || val === undefined) return;
      const key = String(val);
      if (key) unique.add(key);
    });
    return Array.from(unique);
  };

  const mapEventsToLogs = useCallback((events) => {
    if (!Array.isArray(events)) return [];
    return events
      .map((evt, index) => {
        const who =
          evt?.actor ??
          evt?.agent ??
          evt?.agent_name ??
          evt?.agentName ??
          evt?.who ??
          "System";
        const turn =
          evt?.turn ??
          evt?.round ??
          evt?.step ??
          evt?.sequence ??
          evt?.counter ??
          index + 1;
        const text =
          evt?.text ??
          evt?.content ??
          evt?.message ??
          evt?.summary ??
          evt?.description ??
          "";

        const directAgentId =
          evt?.actor_id ??
          evt?.actorId ??
          evt?.agent_id ??
          evt?.agentId ??
          evt?.agent_uuid ??
          evt?.agentUuid ??
          evt?.subject_id ??
          evt?.subjectId ??
          null;

        let agentId = directAgentId ? String(directAgentId) : null;
        if (!agentId) {
          const nestedIds = [
            ...gatherAgentIds(evt?.actor),
            ...gatherAgentIds(evt?.agent),
            ...gatherAgentIds(evt?.subject),
          ];
          if (nestedIds.length > 0) {
            agentId = nestedIds[0];
          }
        }

        const rawType =
          (typeof evt?.type === "string" && evt.type) ||
          (typeof evt?.event_type === "string" && evt.event_type) ||
          (typeof evt?.category === "string" && evt.category) ||
          null;
        const normalizedType = rawType ? rawType.toLowerCase() : "";
        const normalizedWho = normalizeName(who);
        const isSystem =
          normalizedType === "system" ||
          normalizedType === "simulation" ||
          normalizedWho === "system";

        return {
          id: evt?.id ?? `${who}-${turn}-${index}`,
          who,
          turn,
          text,
          agentId,
          type: rawType,
          timestamp:
            evt?.timestamp ??
            evt?.time ??
            evt?.created_at ??
            evt?.createdAt ??
            null,
          isSystem,
          raw: evt,
        };
      })
      .filter((entry) => entry.text);
  }, []);

  const getBubbleForAgent = useCallback(
    (agent) => {
      if (!agent) return null;
      const searchSources = [
        agent,
        agent.simAgent,
        agent.nodeAgent,
        agent.original,
      ].filter(Boolean);
      const idSet = new Set();
      searchSources.forEach((src) => {
        gatherAgentIds(src).forEach((id) => idSet.add(id));
      });
      if (Array.isArray(agent.ids)) {
        agent.ids
          .filter((id) => id !== null && id !== undefined)
          .forEach((id) => idSet.add(String(id)));
      }
      for (const id of idSet) {
        const bubble = agentBubbles.byId?.[id];
        if (bubble) return bubble;
      }

      const nameSources = [
        agent.name,
        agent.agentname,
        agent.agent_name,
        agent.displayName,
        agent.label,
        agent.who,
      ];
      if (agent.simAgent) {
        nameSources.push(
          agent.simAgent.name,
          agent.simAgent.agent_name,
          agent.simAgent.agentname
        );
      }
      for (const value of nameSources) {
        const key = normalizeName(value);
        if (key && agentBubbles.byName?.[key]) {
          return agentBubbles.byName[key];
        }
      }
      return null;
    },
    [agentBubbles]
  );

  const fallbackSpeechForAgent = useCallback((agent, displayName) => {
    if (!agent) {
      return displayName
        ? `${displayName} is awaiting their next move.`
        : "Awaiting next move.";
    }
    const candidates = [
      agent.last_action,
      agent.lastAction,
      agent.current_action,
      agent.currentAction,
      agent.state_description,
      agent.stateDescription,
      agent.activity,
      agent.status,
      agent.summary,
      agent.description,
      agent.last_action_text,
      agent.note,
      agent.observation,
      agent.agenda,
    ];
    for (const value of candidates) {
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
    if (agent.simAgent && agent.simAgent !== agent) {
      const nested = fallbackSpeechForAgent(agent.simAgent, displayName);
      if (nested) return nested;
    }
    return displayName
      ? `${displayName} is awaiting their next move.`
      : "Awaiting next move.";
  }, []);

  const iconForAgent = useCallback(
    (agent, index = 0) => {
      const pickString = (value) =>
        value && typeof value === "string" ? value.trim() : "";

      const iconCandidates = [
        pickString(agent?.icon),
        pickString(agent?.icon_name),
        pickString(agent?.iconName),
        pickString(agent?.avatar),
        pickString(agent?.avatarName),
        pickString(agent?.profile_icon),
        pickString(agent?.badge),
      ].filter(Boolean);
      if (iconCandidates.length > 0) {
        return iconCandidates[0];
      }

      const simAgent = agent?.simAgent || agent;
      const slot = Number.isInteger(simAgent?.slot)
        ? simAgent.slot
        : Number.isInteger(simAgent?.index)
        ? simAgent.index
        : null;
      if (
        slot !== null &&
        slot >= 0 &&
        slot < validAgents.length &&
        validAgents[slot]?.icon
      ) {
        return validAgents[slot].icon;
      }

      const simIds = gatherAgentIds(simAgent);
      if (simIds.length > 0) {
        const matchById = validAgents.find((candidate) => {
          const candidateIds = gatherAgentIds(candidate);
          return candidateIds.some((id) => simIds.includes(id));
        });
        if (matchById?.icon) {
          return matchById.icon;
        }
      }

      const simName = normalizeName(
        simAgent?.name ?? simAgent?.agent_name ?? simAgent?.agentname
      );
      if (simName) {
        const matchByName = validAgents.find(
          (candidate) =>
            normalizeName(candidate.agentname ?? candidate.name) === simName
        );
        if (matchByName?.icon) {
          return matchByName.icon;
        }
      }

      if (index < validAgents.length && validAgents[index]?.icon) {
        return validAgents[index].icon;
      }

      return "user";
    },
    [validAgents]
  );

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const pollSimulation = useCallback(
    async (id) => {
      try {
        const res = await getSimulationById(id);
        const sim = res?.simulation ?? res;
        if (sim) {
          setSimulation(sim);
        }
        if (
          sim?.status &&
          TERMINAL_SIMULATION_STATES.has(String(sim.status).toLowerCase())
        ) {
          stopPolling();
        }
      } catch (err) {
        console.error("Failed to refresh simulation", err);
        stopPolling();
        toast.error("Failed to refresh simulation state.");
      }
    },
    [stopPolling]
  );

  const startPolling = useCallback(
    (id) => {
      if (!id) return;
      stopPolling();
      setIsPolling(true);
      const tick = () => {
        pollSimulation(id);
      };
      tick();
      pollRef.current = setInterval(tick, 2000);
    },
    [pollSimulation, stopPolling]
  );

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);


  // ---------------- Bubble Thought Fetcher ----------------
  // Fetches the most recent utterance for the hovered agent.
  // 🧠 [AI THOUGHT INTEGRATION POINT]
  // Replace this once a dedicated agent-thought endpoint goes live.
  const bubbleTextFor = async (agent) => {
    const displayName =
      agent?.name ||
      agent?.agentname ||
      agent?.displayName ||
      agent?.agent_name ||
      agent?.label ||
      "Agent";
    const fallback = `${displayName} is ready for the next turn.`;

    const bubble = getBubbleForAgent(agent);
    if (bubble?.text) {
      return bubble.text;
    }

    const events = simulation?.events;
    if (!events || events.length === 0) {
      return fallback;
    }

    const normalized = normalizeName(displayName);
    const entries = mapEventsToLogs(events);
    if (normalized) {
      for (let i = entries.length - 1; i >= 0; i -= 1) {
        const entry = entries[i];
        if (normalizeName(entry.who) === normalized && entry.text) {
          return entry.text;
        }
      }
    }

    const last = entries.length > 0 ? entries[entries.length - 1] : null;
    return last?.text || fallback;
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

  const layoutNodes = useCallback(() => {
    const el = boundsRef.current;
    if (!el) {
      setNodes([]);
      return;
    }

    const W = el.clientWidth || 0;
    const H = el.clientHeight || 0;
    const PAD = 72;
    const usableWidth = Math.max(40, W - PAD * 2);
    const usableHeight = Math.max(40, H - PAD * 2);

    const simAgents =
      simulation && Array.isArray(simulation.agents)
        ? simulation.agents
        : null;

    if (simAgents && simAgents.length > 0) {
      const mapped = simAgents.map((agent, index) => {
        const pos =
          agent?.position ??
          agent?.coordinates ??
          agent?.location ??
          agent?.pose ??
          agent?.layout ??
          agent?.pos ??
          {};
        const rawX = toNumeric(pos?.x);
        const rawY = toNumeric(pos?.y);
        return {
          agent,
          index,
          x: rawX ?? index * 1.6,
          y: rawY ?? 0,
        };
      });

      const valuesOrDefault = (arr, fallbackSpan = 1) => {
        if (!arr || arr.length === 0) {
          return [-fallbackSpan, fallbackSpan];
        }
        const min = Math.min(...arr);
        const max = Math.max(...arr);
        if (!Number.isFinite(min) || !Number.isFinite(max)) {
          return [-fallbackSpan, fallbackSpan];
        }
        if (min === max) {
          const pad = Math.max(1, Math.abs(min) || 1);
          return [min - pad, max + pad];
        }
        const span = max - min;
        const pad = span * 0.15 || 1;
        return [min - pad, max + pad];
      };

      const xs = mapped.map((entry) => entry.x);
      const ys = mapped.map((entry) => entry.y);
      const [minX, maxX] = valuesOrDefault(xs);
      const [minY, maxY] = valuesOrDefault(ys);
      const spanX = maxX - minX || 1;
      const spanY = maxY - minY || 1;

      const next = mapped.map(({ agent, index, x, y }) => {
        const normalizedX = spanX === 0 ? 0.5 : (x - minX) / spanX;
        const normalizedY = spanY === 0 ? 0.5 : (y - minY) / spanY;
        const px = PAD + normalizedX * usableWidth;
        const py = PAD + (1 - normalizedY) * usableHeight;

        const displayName =
          agent?.name ??
          agent?.agent_name ??
          agent?.agentname ??
          agent?.displayName ??
          `Agent ${index + 1}`;

        const agentId =
          agent?.id ??
          agent?.agent_id ??
          agent?.agentId ??
          `sim-${index}`;

        const icon = iconForAgent(agent, index);
        const bubbleData = getBubbleForAgent(agent);
        const fallbackText = bubbleData?.text
          ? null
          : fallbackSpeechForAgent(agent, displayName);
        const bubble =
          (bubbleData && bubbleData.text
            ? bubbleData
            : fallbackText
            ? {
                text: fallbackText,
                turn:
                  bubbleData?.turn ??
                  agent?.turn_count ??
                  agent?.turnCount ??
                  null,
              }
            : null);
        const placement =
          bubble && bubble.text ? bubbleFor(px, py) : null;

        return {
          id: agentId,
          name: displayName,
          icon,
          x: Math.round(px),
          y: Math.round(py),
          agentId: agent?.id ?? agent?.agent_id ?? agent?.agentId ?? null,
          projectagentid:
            agent?.project_agent_id ?? agent?.projectagentid ?? null,
          bubble:
            bubble && bubble.text
              ? {
                  ...bubble,
                  position: placement,
                }
              : null,
          simAgent: agent,
          isActive:
            typeof simulation?.active_agent_index === "number"
              ? simulation.active_agent_index === index
              : false,
        };
      });

      setNodes(next);
      return;
    }

    if (!validAgents || validAgents.length === 0) {
      setNodes([]);
      return;
    }

    const n = Math.max(1, validAgents.length);
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.max(40, Math.min(W, H) / 2 - PAD);

    const fallbackNodes =
      n === 1
        ? (() => {
            const ag = validAgents[0];
            const displayName = ag.agentname ?? ag.name ?? "Agent";
            const bubbleData = getBubbleForAgent(ag);
            const fallbackText = bubbleData?.text
              ? null
              : fallbackSpeechForAgent(ag, displayName);
            const bubble =
              (bubbleData && bubbleData.text
                ? bubbleData
                : fallbackText
                ? { text: fallbackText }
                : null);
            const placement =
              bubble && bubble.text
                ? bubbleFor(Math.round(cx), Math.round(cy))
                : null;
            return [
              {
                id: ag.agentid ?? ag.id ?? "agent-0",
                name: displayName,
                projectagentid: ag.projectagentid ?? null,
                icon: iconForAgent(ag, 0),
                x: Math.round(cx),
                y: Math.round(cy),
                bubble:
                  bubble && bubble.text
                    ? { ...bubble, position: placement }
                    : null,
                simAgent: ag,
              },
            ];
          })()
        : validAgents.map((ag, i) => {
            const t = -Math.PI / 2 + (i * 2 * Math.PI) / n;
            const x = Math.max(PAD, Math.min(W - PAD, cx + R * Math.cos(t)));
            const y = Math.max(PAD, Math.min(H - PAD, cy + R * Math.sin(t)));

            const displayName = ag.agentname ?? ag.name ?? `Agent ${i + 1}`;
            const bubbleData = getBubbleForAgent(ag);
            const fallbackText = bubbleData?.text
              ? null
              : fallbackSpeechForAgent(ag, displayName);
            const bubble =
              (bubbleData && bubbleData.text
                ? bubbleData
                : fallbackText
                ? { text: fallbackText }
                : null);
            const placement =
              bubble && bubble.text ? bubbleFor(x, y) : null;

            return {
              id: ag.agentid ?? ag.id ?? `agent-${i}`,
              name: displayName,
              projectagentid: ag.projectagentid ?? null,
              icon: iconForAgent(ag, i),
              x: Math.round(x),
              y: Math.round(y),
              bubble:
                bubble && bubble.text
                  ? { ...bubble, position: placement }
                  : null,
              simAgent: ag,
            };
          });

    setNodes(fallbackNodes);
  }, [
    getBubbleForAgent,
    iconForAgent,
    simulation,
    validAgents,
    fallbackSpeechForAgent,
  ]);

  useEffect(() => {
    layoutNodes();
  }, [layoutNodes]);

  useEffect(() => {
    const el = boundsRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => layoutNodes());
    ro.observe(el);
    return () => ro.disconnect();
  }, [layoutNodes]);

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

    if (isSimulationActive) {
      toast.error("Finish or clear the current simulation before starting a new one.");
      return;
    }

    if (validAgents.length === 0) {
      toast.error("Select at least one agent to run the simulation.");
      return;
    }

    setLoading(true);
    setLogs([]);
    setHover(null);

    try {
      const customAgents = validAgents.slice(0, 5).map((agent, index) => ({
        slot: index,
        name: agent.agentname ?? agent.name ?? "Agent",
        role: agent.agentrole ?? agent.role ?? undefined,
        persona: agent.agentpersonality ?? agent.personality ?? undefined,
        cognitive_bias: agent.agentbias ?? agent.cognitive_bias ?? undefined,
        emotional_state: agent.agentemotion ?? agent.emotional_state ?? undefined,
        mbti: agent.agentmbti ?? agent.mbti ?? undefined,
        motivation: agent.agentmotivation ?? agent.motivation ?? undefined,
        biography: agent.agentbiography ?? agent.bio ?? undefined,
        skills: ensureStringArray(agent.agentskill ?? agent.skills),
        constraints: ensureStringArray(
          agent.agentconstraints ?? agent.constraints
        ),
        quirks: ensureStringArray(agent.agentquirk ?? agent.quirks),
      }));

      const payload = {
        scenario: scenarioText.trim(),
      };

      if (customAgents.length > 0) {
        payload.custom_agents = customAgents;
      }

      console.log("Simulation create payload", payload);
      const response = await createSimulation(payload);
      const sim = response?.simulation ?? response;

      if (!sim) {
        throw new Error("Simulation payload missing from response.");
      }

      const id =
        sim.id ??
        sim.simulation_id ??
        sim.simulationId ??
        sim.uuid ??
        sim.identifier;

      if (!id) {
        throw new Error("Simulation identifier missing from response.");
      }

      setSimulation(sim);
      setSimulationId(id);
      setHistory((prev) => {
        const next = [
          {
            id,
            scenario: sim.scenario ?? scenarioText.trim(),
            status: sim.status ?? "pending",
            createdAt: new Date().toISOString(),
            projectId: projectNumericId,
          },
          ...prev.filter((entry) => entry.id !== id),
        ];
        return next.slice(0, 10);
      });

      const initialLogs = mapEventsToLogs(sim.events);
      if (initialLogs.length > 0) {
        setLogs(initialLogs);
      } else if (validAgents.length > 0) {
        const fallback = [];
        const total = Math.max(6, validAgents.length * 2);
        for (let i = 0; i < total; i++) {
          const ag = validAgents[i % validAgents.length];
          fallback.push(genLine(ag, i));
        }
        setLogs(fallback);
      }

      startPolling(id);
      toast.success("Simulation queued.");
    } catch (err) {
      console.error("Failed to create simulation", err);
      toast.error("Failed to create simulation");
      stopPolling();
    } finally {
      setLoading(false);
    }
  };

  const handleAdvance = async (steps = 1) => {
    if (!simulationId) {
      toast.error("No active simulation to advance.");
      return;
    }

    setLoading(true);
    try {
      await advanceSimulation(simulationId, steps);
      startPolling(simulationId);
      toast.success(`Advanced ${steps} turn${steps > 1 ? "s" : ""}.`);
    } catch (err) {
      console.error("Failed to advance simulation", err);
      toast.error("Failed to advance simulation");
    } finally {
      setLoading(false);
    }
  };

  const handleFate = async () => {
    if (!simulationId) {
      toast.error("No active simulation to twist.");
      return;
    }

    const prompt = window.prompt(
      "Add a Fate Weaver prompt (optional). Leave blank for a surprise twist.",
      ""
    );
    if (prompt === null) {
      return;
    }

    setLoading(true);
    try {
      const cleaned = prompt.trim();
      await triggerSimulationFate(
        simulationId,
        cleaned ? cleaned : undefined
      );
      startPolling(simulationId);
      toast.success("Fate twist queued.");
    } catch (err) {
      console.error("Failed to trigger fate", err);
      toast.error("Failed to trigger fate twist");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    stopPolling();
    setSimulation(null);
    setSimulationId(null);
    setLogs([]);
    setAgentBubbles({ byId: {}, byName: {} });
    setHover(null);
    setLoading(false);
  };

  useEffect(() => {
    if (!simulation) {
      setAgentBubbles({ byId: {}, byName: {} });
      return;
    }

    const entries = mapEventsToLogs(simulation.events);
    if (entries.length > 0) {
      setLogs(entries);
    }

    const byId = {};
    const byName = {};
    const now = Date.now();

    entries.forEach((entry) => {
      if (!entry || !entry.text || entry.isSystem) {
        return;
      }
      const payload = {
        text: entry.text,
        turn: entry.turn,
        who: entry.who,
        updatedAt: now,
      };
      if (entry.agentId) {
        byId[String(entry.agentId)] = payload;
      }
      const key = normalizeName(entry.who);
      if (key) {
        byName[key] = payload;
      }
    });

    if (Array.isArray(simulation.agents)) {
      simulation.agents.forEach((agent, index) => {
        const displayName =
          agent?.name ?? agent?.agent_name ?? agent?.agentname ?? `Agent ${index + 1}`;
        const fallback = fallbackSpeechForAgent(agent, displayName);
        if (!fallback) return;
        const payload = {
          text: fallback,
          turn: agent?.turn_count ?? agent?.turnCount ?? null,
          who: displayName,
          updatedAt: now,
        };
        gatherAgentIds(agent).forEach((id) => {
          if (!byId[id]) {
            byId[id] = payload;
          }
        });
        const key = normalizeName(displayName);
        if (key && !byName[key]) {
          byName[key] = payload;
        }
      });
    }

    setAgentBubbles({ byId, byName });

    const id =
      simulation.id ??
      simulation.simulation_id ??
      simulation.simulationId ??
      simulationId ??
      simulation.uuid ??
      simulation.identifier;

    if (id) {
      setHistory((prev) => {
        let updated = false;
        const next = prev.map((entry) => {
          if (entry.id === id) {
            updated = true;
            return {
              ...entry,
              status: simulation.status ?? entry.status,
              updatedAt: new Date().toISOString(),
            };
          }
          return entry;
        });
        return updated ? next : prev;
      });
    }
  }, [simulation, simulationId, mapEventsToLogs, fallbackSpeechForAgent]);
  // ---------------- render ----------------
  return (
    <div className="sc-page">
      <Toaster position="top-right" />
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
            disabled={loading || isSimulationActive}
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </label>
      </section>

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
            nodes.map((n) => (
              <React.Fragment key={n.id}>
                {n.bubble?.text && n.bubble.position && (
                  <div
                    className={`sc-node-bubble ${n.isActive ? "is-active" : ""}`}
                    style={{
                      left: n.bubble.position.x,
                      top: n.bubble.position.y,
                      transform: n.bubble.position.transform,
                    }}
                  >
                    <p>{n.bubble.text}</p>
                    {n.bubble.turn ? (
                      <span className="turn">Turn {n.bubble.turn}</span>
                    ) : null}
                  </div>
                )}
                <div
                  className={`sc-node ${n.isActive ? "is-active" : ""}`}
                  style={{ left: n.x, top: n.y }}
                  onMouseEnter={async () => {
                    const p = bubbleFor(n.x, n.y);
                    const text = await bubbleTextFor(n);
                    setHover({
                      x: p.x,
                      y: p.y,
                      text,
                      transform: p.transform,
                    });
                  }}
                  onMouseLeave={() => setHover(null)}
                >
                  <div className="sc-chip">
                    <SvgIcon name={n.icon} size={18} />
                  </div>
                  <div className="sc-name">{n.name}</div>
                </div>
              </React.Fragment>
            ))}

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

        {simulation && (
          <div className="sc-current ws-card">
            <div className="sc-current-head">
              <h3>Scenario</h3>
              <span className="sc-status">
                {simulation.status ?? "pending"}
                {isPolling ? " (updating)" : ""}
              </span>
            </div>
            <p>{simulation.scenario ?? scenarioText}</p>
            <div className="sc-actions">
              <button
                className="ws-btn"
                onClick={() => handleAdvance(1)}
                disabled={loading || !simulationId}
              >
                Advance 1 turn
              </button>
              <button
                className="ws-btn"
                onClick={() => handleAdvance(5)}
                disabled={loading || !simulationId}
              >
                Advance 5 turns
              </button>
              <button
                className="ws-btn ghost"
                onClick={handleFate}
                disabled={loading || !simulationId}
              >
                Trigger Fate
              </button>
            </div>
          </div>
        )}

        {/* Log */}
        <aside className="sc-log ws-card compact">
          <div className="sc-log-head">Simulation Log</div>
          {loading ? (
            <div className="sc-center">
              <div className="sc-spinner" />
            </div>
          ) : (
            <div className="sc-log-list">
              {logs.map((item) => (
                <div key={item.id} className="sc-log-item">
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

        {simulation && !loading && !isSimulationActive && (
          <div className="sc-clear">
            <button
              className="ws-btn ghost"
              onClick={handleReset}
            >
              + New Scenario
            </button>
          </div>
        )}

        {/* Roster */}
        <div className="sc-roster">
          {validAgents.map((ag) => (
            <div className="agent-card-wrap" key={ag.agentid}>
              <AgentCard agent={ag} onRemove={() => {}} onEdit={() => {}} />
            </div>
          ))}
        </div>
      </section>

      {/* ✅ Scenario History */}
      {history.length > 0 && (
        <section className="sc-history ws-card">
          <h3>Simulation History</h3>
          <ul className="sc-history-list">
            {history.map((run) => (
              <li key={run.id}>
                <b>{run.scenario}</b>
                <p>Status: {run.status ?? "pending"}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

























