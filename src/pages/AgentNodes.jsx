import React, { useEffect, useMemo, useRef, useState } from "react";

/* ---------- Theme utilities (same as Workstation) ---------- */
function getStoredTheme() {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem("theme") || "dark";
}
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

/* ---------- Demo agents (fallback if nothing is passed) ---------- */
const EXISTING = [
  { id:"a1", name:"Aurora", mbti:"INTJ",
    bio:"Systems thinker; strategizes long-term outcomes.",
    constraints:"Needs clear problem definitions; low noise.",
    quirks:"Over-optimizes; loves flow charts.",
    motivation:"Elegant, scalable solutions.", icon:"bolt"
  },
  { id:"a2", name:"Volt", mbti:"ENTP",
    bio:"Ideas stormer; thrives on rapid iteration.",
    constraints:"Gets bored by routine; needs autonomy.",
    quirks:"Collects obscure APIs.",
    motivation:"Winning via creative pivots.", icon:"flame"
  },
  { id:"a3", name:"Sable", mbti:"INFJ",
    bio:"Human-centric analyst; reads team morale.",
    constraints:"Needs purpose alignment.",
    quirks:"Annotates everything.",
    motivation:"Positive user impact.", icon:"owl"
  },
  { id:"a4", name:"Orion", mbti:"ISTP",
    bio:"Quiet debugger; surgical with edge cases.",
    constraints:"No micromanagement; concise specs.",
    quirks:"Benchmark addict.",
    motivation:"Make things actually fast.", icon:"puzzle"
  },
  { id:"a5", name:"Pixel", mbti:"ISFP",
    bio:"Detail-loving UI artisan.",
    constraints:"Time for polish.",
    quirks:"Carries palette cards.",
    motivation:"Interfaces that feel alive.", icon:"star"
  }
];

/* ---------- Minimal SVG icon set (same feel as your WS) ---------- */
function SvgIcon({ name, size=22 }) {
  const common = { width:size, height:size, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"1.8", strokeLinecap:"round", strokeLinejoin:"round" };
  switch (name) {
    case "bolt":   return <svg {...common}><path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z"/></svg>;
    case "brain":  return <svg {...common}><path d="M9 3a3 3 0 0 0-3 3v3a3 3 0 0 0 3 3v6m6-15a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3v6"/></svg>;
    case "robot":  return <svg {...common}><rect x="6" y="8" width="12" height="10" rx="2"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M12 8V5m-5 13h10"/></svg>;
    case "owl":    return <svg {...common}><path d="M4 9a8 8 0 0 1 16 0v6a8 8 0 0 1-16 0z"/><circle cx="9" cy="11" r="2"/><circle cx="15" cy="11" r="2"/></svg>;
    case "puzzle": return <svg {...common}><path d="M10 3a2 2 0 0 1 4 0v2h2a2 2 0 1 1 0 4h-2v2h2a2 2 0 1 1 0 4h-2v2a2 2 0 1 1-4 0v-2H8a2 2 0 1 1 0-4h2v-2H8a2 2 0 1 1 0-4h2V3z"/></svg>;
    case "star":   return <svg {...common}><path d="M12 2l2.9 6.9L22 10l-5 4.9L18.2 22 12 18.6 5.8 22 7 14.9 2 10l7.1-1.1z"/></svg>;
    default:       return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
  }
}

/* ---------- Small helpers ---------- */
function mid(a,b){ return { x:(a.x+b.x)/2, y:(a.y+b.y)/2 }; }
function keyAB(a,b){ return [a,b].sort().join("|"); }  // stable key for an undirected pair

/* ---------- Node (agent) tooltip ---------- */
function NodeTip({ agent }) {
  if (!agent) return null;
  return (
    <div className="an-tip">
      <div className="an-tip-head">
        <div className="an-tip-avatar"><SvgIcon name={agent.icon || "robot"} /></div>
        <div className="an-tip-title">
          <b>{agent.name}</b>
          <span className="tag">{agent.mbti}</span>
        </div>
      </div>
      <div className="an-tip-kv"><span>Bio</span><p>{agent.bio || "—"}</p></div>
      <div className="an-tip-kv"><span>Constraints</span><p>{agent.constraints || "—"}</p></div>
      <div className="an-tip-kv"><span>Quirks</span><p>{agent.quirks || "—"}</p></div>
      <div className="an-tip-kv"><span>Motivation</span><p>{agent.motivation || "—"}</p></div>
    </div>
  );
}

/* ---------- Edge hover panel (two-way weights) ---------- */
function EdgePanel({ a, b, pos, values, setValues, onClose }) {
  if (!a || !b || !pos) return null;
  const k = keyAB(a.id, b.id);
  const v = values[k] || { ab: 0.0, ba: 0.0 };

  const set = (side, num) => {
    setValues((prev) => ({ ...prev, [k]: { ...v, [side]: num } }));
  };

  return (
    <div className="an-rel-panel" style={{ left: pos.x, top: pos.y }} onMouseLeave={onClose}>
      <div className="rel-row">
        <span className="pill">{a.name}</span>
        <div className="arrow"><span className="arr" /></div>
        <input className="winput" type="number" step="0.05" min="0" max="1"
               value={v.ab} onChange={(e)=> set("ab", Number(e.target.value))}/>
        <span className="lbl">weight</span>
      </div>
      <div className="rel-row">
        <span className="pill">{b.name}</span>
        <div className="arrow flip"><span className="arr" /></div>
        <input className="winput" type="number" step="0.05" min="0" max="1"
               value={v.ba} onChange={(e)=> set("ba", Number(e.target.value))}/>
        <span className="lbl">weight</span>
      </div>
    </div>
  );
}

/* ---------- Main page ---------- */
export default function AgentNodesPage({ team }) {
  const [theme, setTheme] = useState(getStoredTheme());
  useEffect(() => applyTheme(theme), [theme]);

  // If nothing is passed, use the 5-demo fallback
  const agents = team && team.length ? team : EXISTING;

  // Canvas size for positions
  const wrapRef = useRef(null);
  const [box, setBox] = useState({ w: 900, h: 560 });

  useEffect(() => {
    const ro = new ResizeObserver(([ent]) => {
      const cr = ent.contentRect;
      setBox({ w: cr.width, h: cr.height });
    });
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // Arrange nodes on a circle
  const positions = useMemo(() => {
    const cx = box.w / 2, cy = box.h / 2;
    const R = Math.min(box.w, box.h) * 0.34; // radius
    return agents.map((ag, i) => {
      const a = (-90 + i * (360 / agents.length)) * Math.PI/180; // start at top
      return { id: ag.id, x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
    });
  }, [agents, box]);

  // Hover states
  const [hoverNode, setHoverNode] = useState(null);
  const [hoverEdge, setHoverEdge] = useState(null); // {a,b,pos}
  const [weights, setWeights] = useState({});

  // Map agent id -> data and -> position
  const byId = useMemo(() => Object.fromEntries(agents.map((a) => [a.id, a])), [agents]);
  const posBy = useMemo(() => Object.fromEntries(positions.map((p) => [p.id, p])), [positions]);

  // Build all edges fully connected (or you can plug in your own list)
  const edges = [];
  for (let i = 0; i < agents.length; i++) {
    for (let j = i + 1; j < agents.length; j++) {
      edges.push([agents[i].id, agents[j].id]);
    }
  }

  return (
    <div className="an-page galaxy">
      <header className="an-topbar">
        <div className="left">
          <h1>Agent graph</h1>
          <div className="muted">{agents.length} nodes • fully connected</div>
        </div>
        <div className="right">
          <button className="ws-btn" onClick={() => setTheme(t => t==="dark" ? "light" : "dark")}>
            Toggle theme
          </button>
          <a className="ws-btn" href="/workstation">&larr; Back</a>
          <a className="ws-btn primary" href="/workstation/relationships">Next</a>
        </div>
      </header>

      <section className="an-canvas" ref={wrapRef}>
        {/* SVG edges */}
        <svg className="an-lines" width="100%" height="100%">
          {edges.map(([a,b]) => {
            const pa = posBy[a], pb = posBy[b];
            if (!pa || !pb) return null;
            const k = keyAB(a,b);
            const isActive = hoverEdge && keyAB(hoverEdge.a.id, hoverEdge.b.id) === k;
            return (
              <g key={k}
                 onMouseEnter={() => setHoverEdge({ a: byId[a], b: byId[b], pos: mid(pa,pb) })}
                 onMouseLeave={() => setHoverEdge(null)}
              >
                {/* thick transparent hit-area */}
                <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                      stroke="transparent" strokeWidth="14" />
                {/* visible stroke */}
                <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                      className={`an-edge ${isActive ? "is-active":""}`} />
              </g>
            );
          })}
        </svg>

        {/* Nodes */}
        {positions.map((p, i) => {
          const ag = agents[i];
          return (
            <div
              key={ag.id}
              className="an-node"
              style={{ left: p.x, top: p.y }}
              onMouseEnter={() => setHoverNode(ag)}
              onMouseLeave={() => setHoverNode(null)}
            >
              <div className="node-avatar"><SvgIcon name={ag.icon || "robot"} /></div>
              <div className="node-name">{ag.name}</div>

              {/* Node tooltip */}
              {hoverNode && hoverNode.id === ag.id && (
                <NodeTip agent={ag} />
              )}
            </div>
          );
        })}

        {/* Edge hover panel */}
        {hoverEdge && (
          <EdgePanel
            a={hoverEdge.a}
            b={hoverEdge.b}
            pos={hoverEdge.pos}
            values={weights}
            setValues={setWeights}
            onClose={() => setHoverEdge(null)}
          />
        )}
      </section>
    </div>
  );
}
