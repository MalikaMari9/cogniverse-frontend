// src/utils/simHelpers.js

export const ensureStringArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
};

export const normalizeName = (value) => {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.toLowerCase() : null;
};

export const toNumeric = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

export const gatherAgentIds = (agent) => {
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

export const mapEventsToLogs = (events) => {
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
        if (nestedIds.length > 0) agentId = nestedIds[0];
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
};

export const fallbackSpeechForAgent = (agent, displayName) => {
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
};

// Factory so it can close over validAgents
export const makeIconForAgent = (validAgents) => (agent, index = 0) => {
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
    if (matchById?.icon) return matchById.icon;
  }

  const simName = normalizeName(
    simAgent?.name ?? simAgent?.agent_name ?? simAgent?.agentname
  );
  if (simName) {
    const matchByName = validAgents.find(
      (candidate) =>
        normalizeName(candidate.agentname ?? candidate.name) === simName
    );
    if (matchByName?.icon) return matchByName.icon;
  }

  if (index < validAgents.length && validAgents[index]?.icon) {
    return validAgents[index].icon;
  }

  return "user";
};
