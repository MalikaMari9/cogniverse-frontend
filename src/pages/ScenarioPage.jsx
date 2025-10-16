// ===============================
// ScenarioPage.jsx (updated with backend integration)
// ===============================
import React, { useEffect, useRef, useState, useCallback } from "react";
import { SvgIcon } from "./Workstation";
import { AgentCard } from "./Workstation";
import "../ws_css.css";
import { createScenario, getScenarios } from "../api/api"; // ✅ added

export default function ScenarioPage({ theme, onBackToWorkstation, onBackToGraph, selectedAgents }) {
  // ---------------- state ----------------
  const [scenarioText, setScenarioText] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [nodes, setNodes] = useState([]); // [{id,name,icon,x,y}]
  const [hover, setHover] = useState(null); // {x,y,text,transform}
  const [scenarios, setScenarios] = useState([]); // ✅ store history
  const boundsRef = useRef(null);

  // local theme label that always flips correctly
  const [t, setT] = useState(() => document.documentElement.getAttribute("data-theme") || "dark");
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

  const bubbleTextFor = (name) => {
    const feels = ["curious", "focused", "skeptical", "excited", "confident", "cautious"];
    const acts = ["sketching ideas", "testing a hunch", "pairing on a fix", "checking signals", "writing a note"];
    return `${name} feels ${feels[Math.floor(Math.random() * feels.length)]} and is ${acts[Math.floor(Math.random() * acts.length)]}.`;
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
  const layoutNodes = useCallback(() => {
    const el = boundsRef.current;
    if (!el) return;

    const W = el.clientWidth;
    const H = el.clientHeight;

    const PAD = 72;
    const n = Math.max(1, selectedAgents.length);
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.max(40, Math.min(W, H) / 2 - PAD);

    if (n === 1) {
      const ag = selectedAgents[0];
      setNodes([
        { id: ag.id, name: ag.name, icon: ag.icon || "user", x: Math.round(cx), y: Math.round(cy) },
      ]);
      return;
    }

    const pts = selectedAgents.map((ag, i) => {
      const t = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const x = cx + R * Math.cos(t);
      const y = cy + R * Math.sin(t);
      const xC = Math.max(PAD, Math.min(W - PAD, x));
      const yC = Math.max(PAD, Math.min(H - PAD, y));
      return { id: ag.id, name: ag.name, icon: ag.icon || "user", x: Math.round(xC), y: Math.round(yC) };
    });
    setNodes(pts);
  }, [selectedAgents]);

  useEffect(() => {
    layoutNodes();
    const el = boundsRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => layoutNodes());
    ro.observe(el);
    return () => ro.disconnect();
  }, [layoutNodes]);

  // ---------------- 🧩 Load all scenarios ----------------
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const data = await getScenarios();
        setScenarios(data);
        console.log("✅ Loaded scenarios:", data);
      } catch (err) {
        console.error("❌ Failed to load scenarios:", err);
      }
    };
    fetchScenarios();
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
      id: `${ag.id}-${i}`,
      who: ag.name,
      turn: i + 1,
      text: `${ag.name} ${acts[Math.floor(Math.random() * acts.length)]}`,
    };
  };

  const onGenerate = async () => {
    setLoading(true);
    setLogs([]);
    setHover(null);

    try {
      // 🧠 Save scenario to backend
      const scenarioPayload = {
        scenarioname: scenarioText || "Untitled Scenario",
        scenarioprompt: scenarioText,
        projectid: 1, // TODO: replace with actual project id context if available
        status: "active",
      };
      await createScenario(scenarioPayload);
      console.log("✅ Scenario saved:", scenarioPayload);

      // 🪄 Local fake log generation
      const L = [];
      const total = Math.max(6, selectedAgents.length * 2);
      for (let i = 0; i < total; i++) {
        const ag = selectedAgents[Math.floor(Math.random() * selectedAgents.length)];
        L.push(genLine(ag, i));
      }
      setLogs(L);
    } catch (err) {
      console.error("❌ Scenario creation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- render ----------------
  return (
    <div className="sc-page">
      {/* NAV */}
      <header className="sc-nav ws-card sc-nav-pretty">
        <div className="sc-brand">
          <div className="ws-brand">
            <span className="logo">
              <img src="logo.png" alt="" />
            </span>
          </div>
          <div className="sc-divider" />
          <nav className="sc-tabs">
            <button className="sc-tab" onClick={onBackToWorkstation}>
              Workstation
            </button>
            <button className="sc-tab" onClick={onBackToGraph}>
              Graph
            </button>
            <button className="sc-tab ghost">History</button>
          </nav>
        </div>

        <div className="right sc-right">
          <button
            type="button"
            className={`ws-theme-switch ${t}`}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          />
          <div className="sc-user" role="button" tabIndex={0} aria-label="User profile">
            <div className="avatar" aria-hidden="true">A</div>
            <div className="meta">
              <div className="name">Alex</div>
              <div className="role">Pro</div>
            </div>
          </div>
        </div>
      </header>

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
          <button className="ws-btn primary" onClick={onGenerate}>
            Generate
          </button>
        </label>
      </section>

      {/* MAIN grid */}
      <section className={`sc-main ${hasOutput ? "has-output" : ""}`}>
        {/* Canvas */}
        <div className={`sc-canvas sc-grid ws-card ${hasOutput ? "post" : "pre"}`} ref={boundsRef}>
          {loading && (
            <div className="sc-center">
              <div className="sc-spinner big" />
            </div>
          )}

          {!loading &&
            nodes.map((n) => (
              <div
                key={n.id}
                className="sc-node"
                style={{ left: n.x, top: n.y }}
                onMouseEnter={() => {
                  const p = bubbleFor(n.x, n.y);
                  setHover({
                    x: p.x,
                    y: p.y,
                    text: bubbleTextFor(n.name),
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
            ))}

          {hover && (
            <div className="sc-bubble" style={{ left: hover.x, top: hover.y, transform: hover.transform }}>
              {hover.text}
            </div>
          )}
        </div>

        {/* Log */}
        <aside className="sc-log ws-card compact">
          <div className="sc-log-head">Simulation Log</div>
          {loading ? (
            <div className="sc-center"><div className="sc-spinner" /></div>
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

        {/* Roster */}
        <div className="sc-roster">
          {selectedAgents.map((ag) => (
            <div className="agent-card-wrap" key={ag.id}>
              <AgentCard agent={ag} onRemove={() => {}} onEdit={() => {}} />
            </div>
          ))}
        </div>
      </section>

      {/* ✅ Scenario History */}
      {scenarios.length > 0 && (
        <section className="sc-history ws-card">
          <h3>Scenario History</h3>
          <ul className="sc-history-list">
            {scenarios.map((s) => (
              <li key={s.scenarioid}>
                <b>{s.scenarioname}</b>
                <p>{s.scenarioprompt}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
