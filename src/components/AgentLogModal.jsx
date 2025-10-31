// ===============================
// 🧠 AgentLogModal.jsx — Emotion/Memory Timeline (Deduped + Auto-Scroll)
// ===============================
import React, { useState, useEffect, useRef } from "react";
import { pollSimulation } from "../hooks/simulationHelper";

export default function AgentLogModal({ agent, simulation, onClose }) {
  const [logEntries, setLogEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const tableBodyRef = useRef(null);
  const lastSnapshotRef = useRef(null); // to detect duplicates

  // Auto-scroll when new entries appear
  useEffect(() => {
    const el = tableBodyRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [logEntries.length]);

  useEffect(() => {
    if (!simulation?.id || (!agent?.id && !agent?.agentid)) return;

    let timer;
    const seen = new Set();

    const fetchAgentData = async () => {
      try {
        setLoading(true);
        const { sim } = await pollSimulation(simulation.id, seen);

        // Find current agent
        const updated = sim?.agents?.find(
          (a) =>
            a.id === agent.id ||
            a.id === agent.agentid ||
            a.name === agent.name ||
            a.name === agent.agentname
        );

        if (updated) {
          const now = new Date();
          const snapshot = {
            emotion: updated.emotional_state || "neutral",
            memory: Array.isArray(updated.memory)
              ? updated.memory.join(", ")
              : updated.memory || "— none —",
            corrosion: Array.isArray(updated.corroded_memory)
              ? updated.corroded_memory.join(", ")
              : updated.corroded_memory || "— none —",
          };

          // Avoid adding duplicate consecutive state
          const last = lastSnapshotRef.current;
          const isDuplicate =
            last &&
            last.emotion === snapshot.emotion &&
            last.memory === snapshot.memory &&
            last.corrosion === snapshot.corrosion;

          if (!isDuplicate) {
            setLogEntries((prev) => [
              ...prev,
              { time: now.toLocaleTimeString(), ...snapshot },
            ]);
            lastSnapshotRef.current = snapshot;
          }

          setLastUpdated(now.toLocaleTimeString());
        }
      } catch (err) {
        console.warn("⚠️ Agent log poll failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentData();
    timer = setInterval(fetchAgentData, 3000);

    return () => clearInterval(timer);
  }, [simulation?.id, agent?.id, agent?.agentid]);

  return (
    <div className="agent-log-modal">
      <div className="agent-log-content">
        <div className="agent-log-header">
          <h2>{agent.name || agent.agentname} — Cognitive Log</h2>
          <button className="ws-btn mini danger" onClick={onClose}>
            ✖ Close
          </button>
        </div>

        <div className="agent-log-body">
          {loading && <p className="dim">⏳ Fetching latest state...</p>}

          {logEntries.length === 0 && !loading && (
            <p className="dim">— No data yet —</p>
          )}

          {logEntries.length > 0 && (
            <div className="agent-log-table-wrap" ref={tableBodyRef}>
              <table className="agent-log-table">
                <thead>
                  <tr>
                    <th style={{ width: "120px" }}>Time</th>
                    <th style={{ width: "160px" }}>Emotion</th>
                    <th>Memory</th>
                    <th>Corroded Memory</th>
                  </tr>
                </thead>
                <tbody>
                  {logEntries.map((entry, i) => (
                    <tr key={i}>
                      <td>{entry.time}</td>
                      <td>{entry.emotion}</td>
                      <td>{entry.memory}</td>
                      <td className="corroded">{entry.corrosion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="agent-log-footer">
          <p className="dim">Last updated: {lastUpdated || "—"}</p>
        </div>
      </div>
    </div>
  );
}
