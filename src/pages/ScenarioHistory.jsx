// ===============================
// ScenarioHistory.jsx — Drift-free Stable Modal
// ===============================
import React from "react";
import "../ws_css.css";

export default function ScenarioHistory({
  scenarios = [],
  onReplay,
  onDelete,
  onClose,
}) {
  const ordered = [...scenarios]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);

  return (
    <div
      className="sc-history-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="sc-history-modal ws-card" onClick={(e) => e.stopPropagation()}>
        <header className="sc-history-head">
          <h3>Scenario History</h3>
          <button className="ws-icon-btn" onClick={onClose}>✕</button>
        </header>

        {ordered.length === 0 ? (
          <div className="sc-empty">No past scenarios found.</div>
        ) : (
          <ul className="sc-history-list">
            {ordered.map((s) => (
              <li key={s.scenarioid}>
                <div className="sc-h-title">{s.scenarioname}</div>
                <div className="sc-h-sub">
                  {s.scenarioprompt?.slice(0, 100) || "(no description provided)"}
                  {s.scenarioprompt?.length > 100 ? "…" : ""}
                </div>
                <div className="sc-h-meta">
                  <span>
                    {new Date(s.created_at).toLocaleString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <div className="sc-h-actions">
                    <button className="ws-btn mini" onClick={() => onReplay?.(s)}>▶ Replay</button>
                    <button className="ws-btn ghost mini" onClick={() => onDelete?.(s.scenarioid)}>🗑</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* inline CSS to avoid transform reflow */}
<style>{`
  /* Overlay centered with flex (no transform, fixed true center) */
  .sc-history-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.55);
    z-index: 999;
    backdrop-filter: blur(2px);
    padding: 2rem; /* ensures breathing room on smaller screens */
  }

  /* Modal box — perfect center alignment */
  .sc-history-modal {
    background: var(--glass);
    border: 1px solid var(--glass-bdr);
    border-radius: 1rem;
    padding: 1.2rem 1.4rem;
    width: min(640px, 90%);
    max-height: 600px;
    overflow-y: auto;
    box-shadow: 0 4px 40px rgba(0,0,0,0.3);
    animation: fadeInOpacity 0.25s ease;
    transform: none !important;
    left:auto;
    top:auto;
    margin: auto;            /* ✅ ensures centering in flex grid */
  }

  @keyframes fadeInOpacity {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .sc-history-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.8rem;
  }

  .sc-history-list li {
    border-bottom: 1px solid var(--glass-bdr);
    padding: 0.6rem 0;
  }
  .sc-history-list li:last-child { border-bottom: none; }

  .sc-h-title { font-weight: 600; font-size: 1.05em; }
  .sc-h-sub { opacity: 0.85; font-size: 0.9em; margin-top: 0.2rem; line-height: 1.3em; }

  .sc-h-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.4rem;
    font-size: 0.85em;
    opacity: 0.7;
  }

  .sc-h-actions { display: flex; gap: 0.4rem; }
  .sc-empty { text-align: center; opacity: 0.7; padding: 1rem 0; }
`}</style>

    </div>
  );
}
