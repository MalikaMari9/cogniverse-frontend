// ===============================
// 🧠 AgentLogModal.jsx — Emotion + Corrosion Timeline (Memory commented out)
// ===============================
import React, { useEffect, useRef } from "react";

export default function AgentLogModal({
  agent,
  entries = [],
  simulation,
  isPolling = false,
  onClose,
}) {
  const tableRef = useRef(null);
  const agentName = agent?.name || agent?.agentname || "Unknown";

  useEffect(() => {
    const el = tableRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [entries.length]);

  return (
    <div className="agent-log-modal">
      <div className="agent-log-content">
        {/* Header */}
        <div className="agent-log-header">
          <h2>
            {agentName} — Emotion / Corrosion{" "}
            {simulation?.status && (
              <span className="dim">({simulation.status.toUpperCase()})</span>
            )}
          </h2>
          <button className="ws-btn mini danger" onClick={onClose}>
            ✖ Close
          </button>
        </div>

        {/* Body */}
        <div className="agent-log-body">
          {entries.length === 0 ? (
            <p className="dim">— No data yet —</p>
          ) : (
            <div className="agent-log-table-wrap" ref={tableRef}>
              <table className="agent-log-table">
                <thead>
                  <tr>
                    <th style={{ width: "140px" }}>Time</th>
                    <th style={{ width: "200px" }}>Emotion</th>
                    {/* <th style={{ width: "240px" }}>Memory</th> */}
                    <th style={{ width: "260px" }}>Corrosion</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((row, i) => (
                    <tr key={i}>
                      <td>{row.time}</td>
                      <td>{row.emotion}</td>
                      {/* <td>{row.memory}</td> */}
                      <td className="corroded">
                        {Array.isArray(row.corrosion)
                          ? row.corrosion.join(", ")
                          : row.corrosion}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="agent-log-footer">
          <p className="dim">
            Showing {entries.length} entries — Last updated:{" "}
            {entries.length ? entries[entries.length - 1].time : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
