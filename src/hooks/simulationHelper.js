// src/hooks/simulationHelper.js
// ultra-thin wrapper around your existing api + a bit of normalization.
import { useState, useEffect } from "react";
import { saveSimulationResults, createScenarioQuick } from "../api/api";

import { createSimulation, getSimulationById } from "../api/api";

/** Build provider-friendly payload from your selected agents */
export function buildSimPayload(scenarioText, validAgents) {
  // 🧩 Build summarized traits for each agent
  const agentProfiles = (validAgents || []).slice(0, 5).map((a, i) => {
    const name = a.agentname ?? a.name ?? `Agent ${i + 1}`;
    const role = a.agentrole ?? a.role ?? "";
    const persona = a.agentpersonality ?? a.persona ?? "";
    const mbti = a.agentmbti ?? a.mbti ?? "";
    const motivation = a.agentmotivation ?? a.motivation ?? "";
    const skills = a.agentskill ?? a.skills ?? [];
    const quirks = a.agentquirk ?? a.quirks ?? [];
    const biography = a.agentbiography ?? a.biography ?? "";
    const constraints = a.agentconstraints ?? a.constraints ?? [];
    const emotional_state = a.agentemotion ?? a.emotional_state ?? "";
    const cognitive_bias = a.agentbias ?? a.cognitive_bias ?? "";
    const thought_process = a.thought_process ?? a.thought_process ?? undefined;

    // 🧩 Compose readable trait text
    const profileBlock = [
      `Agent ${i + 1}: ${name}`,
      role ? `Role: ${role}` : "",
      persona ? `Persona: ${persona}` : "",
      mbti ? `MBTI: ${mbti}` : "",
      motivation ? `Motivation: ${motivation}` : "",
      skills.length ? `Skills: ${skills.join(", ")}` : "",
      quirks.length ? `Quirks: ${quirks.join(", ")}` : "",
      biography ? `Biography: ${biography}` : "",
      constraints.length ? `Constraints: ${constraints.join(", ")}` : "",
      emotional_state ? `Current Emotion: ${emotional_state}` : "",
      cognitive_bias ? `Cognitive Bias: ${cognitive_bias}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    return profileBlock;
  });

  // 🧠 Merge everything into one unified prompt
  const mergedScenario = [
    "=== Agent Profiles ===",
    agentProfiles.join("\n\n"),
    "======================",
    scenarioText?.trim() || "Untitled Simulation",
  ].join("\n\n");

  // 🧩 Return final payload (same structure, but scenario enriched)
  return {
    scenario: mergedScenario,
    custom_agents: (validAgents || []).slice(0, 5).map((a, i) => ({
      slot: i,
      name: a.agentname ?? a.name ?? `Agent ${i + 1}`,
      role: a.agentrole ?? a.role ?? undefined,
      persona: a.agentpersonality ?? a.persona ?? undefined,
      cognitive_bias: a.agentbias ?? a.cognitive_bias ?? undefined,
      emotional_state: a.agentemotion ?? a.emotional_state ?? undefined,
      thought_process: a.thought_process ?? a.thought_process ?? undefined,
      mbti: a.agentmbti ?? a.mbti ?? undefined,
      motivation: a.agentmotivation ?? a.motivation ?? undefined,
      skills: a.agentskill ?? a.skills ?? [],
      constraints: a.agentconstraints ?? a.constraints ?? [],
      quirks: a.agentquirk ?? a.quirks ?? [],
      biography: a.agentbiography ?? a.biography ?? undefined,
    })),
  };
}


/** Create the simulation. Returns the simulation object (must have id). */
export async function startSimulation(payload) {
  const res = await createSimulation(payload);
  const sim = res?.simulation ?? res;
  if (!sim?.id) throw new Error("Simulation ID missing from backend response");
  return normalizeSimulation(sim);
}

/**
 * Poll a simulation once. You pass a Set of seen event ids (or empty Set),
 * we return the normalized sim and the *new* events only.
 */
export async function pollSimulation(simId, seenEventIds = new Set()) {
  const res = await getSimulationById(simId); // uses your existing API
  const sim = normalizeSimulation(res?.simulation ?? res);
  const all = sim.events || [];
  const delta = all.filter((e) => !seenEventIds.has(e.id));
  return { sim, delta };
}

import { triggerSimulationFate } from "../api/api";

/**
 * Trigger a Fate event for a simulation (usable during pause or active runs).
 * Returns normalized simulation + new events for the caller to merge.
 *
 * @param {string} simId
 * @param {string|object} fatePayload - Usually a string prompt, but may be an object (prompt, scope, etc.)
 */
export async function triggerFate(simId, fatePayload) {
  if (!simId) throw new Error("Simulation ID required for fate trigger");

  // If only a string is provided, convert to { prompt }
  const body =
    typeof fatePayload === "string" ? { prompt: fatePayload } : fatePayload || {};

  // 🔮 API call
  const res = await triggerSimulationFate(simId, body?.prompt || "");

  // 🧩 Normalize simulation (to match start/poll behavior)
  const sim = normalizeSimulation(res?.simulation ?? res);
  const all = sim.events || [];
  const delta = normalizeEvents(all);

  return { sim, delta };
}


export function normalizeSimulation(sim) {
  return {
    id: sim.id,
    scenario: sim.scenario,
    status: sim.status,
    created_at: sim.created_at,
    updated_at: sim.updated_at,
    active_agent_index: sim.active_agent_index ?? null,

    agents: (sim.agents || []).map((a) => ({
      id: a.id,
      name: a.name,
      role: a.role,
      emotional_state: a.emotional_state,
      last_action: a.last_action ?? null,
      turn_count: a.turn_count ?? 0,

      // 🔹 memory-related (server may send either string or list)
      memory: Array.isArray(a.memory)
        ? a.memory
        : typeof a.memory === "string"
        ? a.memory.split("\n").filter(Boolean)
        : [],

        thought_process: Array.isArray(a.thought_process)
    ? a.thought_process.filter(Boolean)
    : typeof a.thought_process === "string"
    ? a.thought_process.split("\n").filter(Boolean)
    : [],

      // 🔹 corroded memory (optional)
      corroded_memory: Array.isArray(a.corroded_memory)
        ? a.corroded_memory
        : typeof a.corroded_memory === "string"
        ? a.corroded_memory.split("\n").filter(Boolean)
        : [],

      // 🔹 position (support both explicit XY or abstract placement)
      position:
  typeof a.position === "object"
    ? normalizePosition(a.position)
    : { x: 0, y: 0, facing: null },


      // 🔹 metadata
      mbti: a.mbti ?? a.persona ?? null,
      motivation: a.motivation ?? null,
    })),

    events: normalizeEvents(sim.events || []),
  };
}
/** Drop noisy meta-events & flatten shape for the UI log */
export function normalizeEvents(events) {
  return events
.filter((e) => {
  const t = (e.summary || e.text || "").toLowerCase();
  return (
    t &&
    !t.includes("memory corrosion applied") && // noisy meta
    !t.includes("internal reasoning") // 🧠 skip system filler
  );
})

    .map((e, i) => ({
      id: e.id ?? `evt-${i}`,
      type: e.type ?? "agent",
      actor: e.actor ?? e.actor_name ?? "System",
      text: e.summary ?? e.text ?? "",
      timestamp: e.timestamp ?? new Date().toISOString(),
    }));
}

/** Basic provider → app normalization (extended for memory + position) */


/** get agent memory text array for UI rendering */
export function getAgentMemory(sim, agentId) {
  const ag = (sim?.agents || []).find((a) => a.id === agentId);
  if (!ag) return [];
  return ag.memory || [];
}

/** get agent position — returns {x,y,facing} or null */
export function getAgentPosition(sim, agentId) {
  const ag = (sim?.agents || []).find((a) => a.id === agentId);
  return ag?.position || null;
}

/** Normalize backend XY to fit inside canvas roughly centered */
function normalizePosition(pos) {
  const x = Number(pos.x);
  const y = Number(pos.y);
  const facing = pos.facing ?? null;

  // if backend uses [0–1] range → scale to [100–600] for canvas
  if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
    return {
      x: 100 + x * 500,
      y: 100 + y * 400,
      facing,
    };
  }

  // if backend uses raw pixel but top-right origin (too small/large)
  if (x < 50 && y < 50) {
    return {
      x: 200 + x * 10,
      y: 200 + y * 10,
      facing,
    };
  }

  // fallback (already good)
  return { x, y, facing };
}




// ===============================
// 🪄 useTypewriter Hook
// ===============================
export function useTypewriter(text, speed = 20) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!text) return setDisplayed("");
    let index = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      index++;
      setDisplayed(text.slice(0, index));
      if (index >= text.length) clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return displayed;
}



/**
 * Save a completed simulation to backend (scenario + results).
 * @param {object} opts
 * @param {number} opts.projectid
 * @param {object} opts.simulation
 * @param {Array} opts.logs
 * @param {object} opts.agentLogs
 * @param {Array} opts.positions - array of agent positions (x, y, facing)
 * @param {string} [opts.scenarioname]
 * @param {string} [opts.scenarioprompt]
 */
export async function saveSimulationFlow({
  projectid,
  simulation,
  logs,
  agentLogs,
  selectedAgents = [],
  scenarioname,
  scenarioprompt,
}) {
  if (!projectid) throw new Error("projectid required");

  // 1) Create scenario first
  const scenarioPayload = {
    scenarioname: scenarioname || "Untitled Simulation",
    scenarioprompt: scenarioprompt || "Auto-saved from simulation",
    projectid,
    status: "active",
  };
  const scenarioRes = await createScenarioQuick(scenarioPayload);
  const scenarioid = scenarioRes?.scenario?.scenarioid || scenarioRes?.scenarioid;
  if (!scenarioid) throw new Error("Scenario creation failed");

  // 2) Build a robust lookup for projectagentid (pid)
  const pidByKey = {};
  (selectedAgents || []).forEach((a) => {
    const pid = a.projectagentid ?? null;
    if (!pid) return;
    const keys = [
      a.id,
      a.agentid,
      a.projectagentid,
      a.name?.toLowerCase?.(),
      a.agentname?.toLowerCase?.(),
      String(a.agentid ?? "").toLowerCase(),
      (a.agentname || a.name || "").trim().toLowerCase(),
    ].filter(Boolean);
    keys.forEach((k) => (pidByKey[k] = pid));
  });

  // Helper to aggressively resolve a PID for any agent-like object
  const resolvePid = (ag) => {
    if (!ag) return null;
    const candidates = [
      ag.projectagentid,
      ag.agentid,
      ag.id,
      ag.name?.toLowerCase?.(),
      ag.agentname?.toLowerCase?.(),
      String(ag.agentid ?? "").toLowerCase(),
      (ag.name || ag.agentname || "").trim().toLowerCase(),
    ].filter(Boolean);
    for (const k of candidates) {
      if (k in pidByKey) return pidByKey[k];
    }
    return null;
  };

  // 3) Re-map agentLogs → keys are numeric projectagentid
  const enrichedAgentLogs = {};
  const incomingKeys = Object.keys(agentLogs || {});
  incomingKeys.forEach((k) => {
    // Try to treat k as an agent identifier and resolve to pid
    const fakeAg = { id: k, name: k, agentname: k, agentid: k, projectagentid: k };
    const pidFromKey = resolvePid(fakeAg);

    if (pidFromKey) {
      enrichedAgentLogs[pidFromKey] = agentLogs[k];
    } else {
      // Try to match against live simulation agents
      const simAg = (simulation?.agents || []).find((a) => {
        const cands = [
          a.id,
          a.agentid,
          a.projectagentid,
          a.name?.toLowerCase?.(),
          a.agentname?.toLowerCase?.(),
          String(a.agentid ?? "").toLowerCase(),
          (a.name || a.agentname || "").trim().toLowerCase(),
        ].filter(Boolean);
        return cands.includes(k) || cands.includes(String(k).toLowerCase());
      });
      const pid = resolvePid(simAg);
      if (pid) enrichedAgentLogs[pid] = agentLogs[k];
    }
  });

  // 4) If agentLogs ended up empty, create a FALLBACK snapshot from live agents
  if (Object.keys(enrichedAgentLogs).length === 0) {
    (simulation?.agents || []).forEach((a) => {
      const pid = resolvePid(a);
      if (!pid) return;
      const emotion = a.emotional_state || a.agentemotion || null;
      const memory = Array.isArray(a.memory) ? a.memory[a.memory.length - 1] : a.memory || null;
      const corrosion = Array.isArray(a.corroded_memory)
        ? a.corroded_memory[a.corroded_memory.length - 1]
        : a.corroded_memory || null;
      const position = {
        x: a.position?.x ?? 0,
        y: a.position?.y ?? 0,
        facing: a.position?.facing ?? null,
      };
      // Only create a snapshot if there's something meaningful OR position not at (0,0)
      if (emotion || memory || corrosion || position.x !== 0 || position.y !== 0) {
        if (!enrichedAgentLogs[pid]) enrichedAgentLogs[pid] = [];
        enrichedAgentLogs[pid].push({
          time: new Date().toLocaleTimeString(),
          emotion,
          memory,
          corrosion,
          position,
        });
      }
    });
  }

  // 5) Positions payload with robust pid mapping
  const positions = (simulation?.agents || []).map((a) => {
    const pid =
      resolvePid(a) ||
      resolvePid({ id: a.id }) ||
      resolvePid({ name: a.name, agentname: a.agentname }) ||
      null;
    return {
      agent: a.name || a.agentname || a.id,
      projectagentid: pid,
      x: a.position?.x ?? 0,
      y: a.position?.y ?? 0,
      facing: a.position?.facing ?? null,
    };
  });

  const resultPayload = {
    scenarioid,
    projectid,
    logs,
    agentLogs: enrichedAgentLogs,
    positions,
  };

  // 🔎 Deep debug so we see exactly what we're sending
  console.log(
    "🧠 [saveSimulationFlow] agentLogs keys in payload:",
    Object.keys(enrichedAgentLogs),
    "positions with pid:",
    positions.map((p) => ({ agent: p.agent, pid: p.projectagentid }))
  );
  console.log("🧩 [saveSimulationFlow] Full payload preview ↓", JSON.stringify(resultPayload, null, 2));

  const res = await saveSimulationResults(resultPayload);
  return { scenarioid, summary: res };
}
