// components/DebugDock.jsx
import React, { useEffect, useState } from "react";

export default function DebugDock() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(() => window.__apiDebug || []);

  useEffect(() => {
    const handler = (e) => {
      // pull the full array (not just last event) so it survives hot reloads
      setItems([...(window.__apiDebug || [])]);
    };
    document.addEventListener("api-debug", handler);
    return () => document.removeEventListener("api-debug", handler);
  }, []);

  const last = items.slice(-60); // keep UI snappy

  return (
    <div
      style={{
        position: "fixed",
        right: 12,
        bottom: 12,
        zIndex: 99999,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas",
      }}
    >
      <button
        className="ws-btn ghost"
        onClick={() => setOpen((v) => !v)}
        title="Toggle API debug"
      >
        {open ? "🪵 Hide Debug" : "🪵 Show Debug"}
      </button>

      {open && (
        <div
          className="ws-card"
          style={{
            marginTop: 8,
            width: 520,
            maxHeight: 300,
            overflow: "auto",
            fontSize: 12,
            padding: 10,
          }}
        >
          {last.map((it, i) => (
            <div
              key={i}
              style={{
                borderTop: "1px solid rgba(255,255,255,.07)",
                paddingTop: 6,
                marginTop: 6,
              }}
            >
              <div style={{ opacity: 0.7 }}>
                {new Date(it.ts || Date.now()).toLocaleTimeString()} —{" "}
                <b>{it.label}</b> · {it.kind}
                {it.status ? ` · ${it.status}` : ""}
              </div>
              <div style={{ wordBreak: "break-all" }}>
                {it.url ? <div><b>URL:</b> {it.url}</div> : null}
                {it.method ? <div><b>Method:</b> {it.method}</div> : null}
                {it.params ? (
                  <pre>{JSON.stringify(it.params, null, 2)}</pre>
                ) : null}
                {it.data ? <pre>{JSON.stringify(it.data, null, 2)}</pre> : null}
                {it.message ? <div><b>Msg:</b> {it.message}</div> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
