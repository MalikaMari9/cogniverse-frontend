// src/hooks/simulationHelper.js
// ultra-thin wrapper around your existing api + a bit of normalization.
import { useState, useEffect } from "react";

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
