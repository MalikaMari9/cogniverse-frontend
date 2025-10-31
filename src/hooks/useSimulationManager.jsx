// ===============================
// useSimulationManager.jsx
// Centralized hook for managing simulations
// ===============================
import { useState, useRef, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import {
  createSimulation,
  advanceSimulation,
  triggerSimulationFate,
  getSimulationById,
} from "../api/api";

/**
 * useSimulationManager
 * Handles simulation lifecycle, polling, creation, advancement, fate, and reset logic.
 */
export function useSimulationManager({
  mapEventsToLogs,
  fallbackSpeechForAgent,
  gatherAgentIds,
  normalizeName,
  validAgents,
  projectNumericId,
}) {
  const [simulation, setSimulation] = useState(null);
  const [simulationId, setSimulationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [agentBubbles, setAgentBubbles] = useState({ byId: {}, byName: {} });
  const [history, setHistory] = useState([]);
  const [isPolling, setIsPolling] = useState(false);

  const pollRef = useRef(null);

  // ===============================
  // 🔸 Polling Logic
  // ===============================
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
        if (sim) setSimulation(sim);

        const TERMINAL_SIMULATION_STATES = new Set([
          "completed",
          "failed",
          "errored",
          "error",
          "cancelled",
          "canceled",
          "stopped",
        ]);

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
      const tick = () => pollSimulation(id);
      tick();
      pollRef.current = setInterval(tick, 2000);
    },
    [pollSimulation, stopPolling]
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  // ===============================
  // 🔸 Simulation Creation
  // ===============================
  const ensureStringArray = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === "string" && value.trim()) return [value.trim()];
    return [];
  };

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

  const onGenerate = async (scenarioText) => {
    if (!scenarioText?.trim()) {
      toast.error("Please enter a scenario description first.");
      return;
    }

    if (simulation && !["completed", "failed", "stopped"].includes(simulation.status)) {
      toast.error("Finish or clear the current simulation before starting a new one.");
      return;
    }

    if (!validAgents || validAgents.length === 0) {
      toast.error("Select at least one agent to run the simulation.");
      return;
    }

    setLoading(true);
    setLogs([]);
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
        constraints: ensureStringArray(agent.agentconstraints ?? agent.constraints),
        quirks: ensureStringArray(agent.agentquirk ?? agent.quirks),
      }));

      const payload = { scenario: scenarioText.trim() };
      if (customAgents.length > 0) payload.custom_agents = customAgents;

      console.log("Simulation create payload", payload);
      const response = await createSimulation(payload);
      const sim = response?.simulation ?? response;
      if (!sim) throw new Error("Simulation payload missing from response.");

      const id =
        sim.id ??
        sim.simulation_id ??
        sim.simulationId ??
        sim.uuid ??
        sim.identifier;

      if (!id) throw new Error("Simulation identifier missing from response.");

      setSimulation(sim);
      setSimulationId(id);

      // Update history
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

      // Map logs
      const initialLogs = mapEventsToLogs(sim.events);
      if (initialLogs.length > 0) setLogs(initialLogs);
      else {
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

  // ===============================
  // 🔸 Advance Simulation
  // ===============================
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

  // ===============================
  // 🔸 Trigger Fate
  // ===============================
  const handleFate = async () => {
    if (!simulationId) {
      toast.error("No active simulation to twist.");
      return;
    }

    const prompt = window.prompt(
      "Add a Fate Weaver prompt (optional). Leave blank for a surprise twist.",
      ""
    );
    if (prompt === null) return;

    setLoading(true);
    try {
      const cleaned = prompt.trim();
      await triggerSimulationFate(simulationId, cleaned || undefined);
      startPolling(simulationId);
      toast.success("Fate twist queued.");
    } catch (err) {
      console.error("Failed to trigger fate", err);
      toast.error("Failed to trigger fate twist");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // 🔸 Reset Simulation
  // ===============================
  const handleReset = () => {
    stopPolling();
    setSimulation(null);
    setSimulationId(null);
    setLogs([]);
    setAgentBubbles({ byId: {}, byName: {} });
    setLoading(false);
  };

  // ===============================
  // 🔸 Update Agent Bubbles + History
  // ===============================
  useEffect(() => {
    if (!simulation) return;
    const entries = mapEventsToLogs(simulation.events || []);
    if (entries.length === 0) return;

    setLogs((prev) => {
      if (prev.length !== entries.length || prev.at(-1)?.id !== entries.at(-1)?.id)
        return entries;
      return prev;
    });

    const byId = {};
    const byName = {};
    const now = Date.now();

    for (const entry of entries) {
      if (!entry.text || entry.isSystem) continue;
      const payload = { text: entry.text, turn: entry.turn, who: entry.who, updatedAt: now };
      if (entry.agentId) byId[String(entry.agentId)] = payload;
      const key = normalizeName(entry.who);
      if (key) byName[key] = payload;
    }

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
          if (!byId[id]) byId[id] = payload;
        });
        const key = normalizeName(displayName);
        if (key && !byName[key]) byName[key] = payload;
      });
    }

    setAgentBubbles((prev) => {
      const same =
        JSON.stringify(prev.byId) === JSON.stringify(byId) &&
        JSON.stringify(prev.byName) === JSON.stringify(byName);
      return same ? prev : { byId, byName };
    });

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
            const newStatus = simulation.status ?? entry.status;
            if (newStatus !== entry.status) {
              return { ...entry, status: newStatus, updatedAt: new Date().toISOString() };
            }
          }
          return entry;
        });
        return updated ? next : prev;
      });
    }
  }, [simulation?.id, simulation?.status, mapEventsToLogs, fallbackSpeechForAgent]);

  // ===============================
  // 🔸 Return API
  // ===============================
  return {
    simulation,
    simulationId,
    loading,
    logs,
    agentBubbles,
    history,
    isPolling,
    onGenerate,
    handleAdvance,
    handleFate,
    handleReset,
    startPolling,
    stopPolling,
    setSimulation,
    setLogs,
    setHistory,
    setAgentBubbles,
  };
}
