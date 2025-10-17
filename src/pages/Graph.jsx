// ===============================
// Graph.jsx
// ===============================
import React from "react";
import { SvgIcon } from "./Workstation";
import { useParams } from "react-router-dom";
import { useRef } from "react";
import toast,{Toaster} from "react-hot-toast";
import { getAgentRelations, createAgentRelation } from "../api/api";

function RelationshipGraph({ agents, onBack, onNext }) {
  const { projectid } = useParams();
  const svgRef = React.useRef(null);
  const [openEdge, setOpenEdge] = React.useState(null);
  
  const [weights, setWeights] = React.useState(() => ({})); // "a|b" -> number
  const [nodeDialog, setNodeDialog] = React.useState(null);
  const [stage, setStage] = React.useState("graph");
  const saveTimers = useRef({}); // 🕒 one timer per relation key

  const CX = 520, CY = 300;
const R = 200 + Math.max(0, (6 - agents.length) * 10); // auto-spacing for smaller teams


  // --- Layout ---
  const layout = React.useMemo(() => {
    const n = Math.max(agents.length, 1);
    return agents.map((ag, i) => {
      const t = (-Math.PI / 2) + (i * 2 * Math.PI / n);
      return { id: ag.agentid, x: CX + R * Math.cos(t), y: CY + R * Math.sin(t) };
    });
  }, [agents]);

  // Restore scroll
  React.useEffect(() => {
    return () => { document.documentElement.style.overflow = ""; };
  }, []);

  // Sidebar width sync
  React.useEffect(() => {
    const root = document.documentElement;
    const side = document.querySelector(".ws-sidebar");
    if (!side) {
      root.style.setProperty("--sidebar-w", "0px");
      return;
    }
    const setW = (w) => root.style.setProperty("--sidebar-w", `${Math.max(0, Math.floor(w))}px`);
    setW(side.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => setW(entry.contentRect.width));
    ro.observe(side);
    return () => ro.disconnect();
  }, []);

  const posOf = (id) => layout.find(p => p.id === id) || { x: CX, y: CY };

  // Edges between every pair
  const edges = React.useMemo(() => {
    const out = [];
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        out.push({ a: agents[i].agentid, b: agents[j].agentid });
      }
    }
    return out;
  }, [agents]);

  const key = (a, b) => `${a}|${b}`;
  const getW = (a, b) => weights[key(a, b)] ?? 0;

  // =============================
  // 🔄 Load existing relations
  // =============================
  React.useEffect(() => {
    const loadRelations = async () => {
      try {
        const res = await getAgentRelations();
        const projectID = Number(projectid);
        const relevant = res.filter(r => r.projectid === projectID && r.status === "active");

        const map = {};
        for (const r of relevant) {
          map[`${r.agenta_id}|${r.agentb_id}`] = r.relationatob;
          map[`${r.agentb_id}|${r.agenta_id}`] = r.relationbtoa;
        }

        setWeights(map);
        console.log("♻️ Loaded existing relations:", relevant);
      } catch (err) {
        console.error("❌ Failed to load relations:", err);
      }
    };
    if (projectid) loadRelations();
  }, [projectid]);

  // =============================
  // 💾 Save relation (create/update)
  // =============================
// 💾 Save relation (create/update) — debounced 500 ms
// 💾 Save relation (create/update) — debounced 500 ms, per relation key
const saveRelation = React.useCallback((a, b, v) => {
  const projectID = Number(projectid);
  if (!projectID || !a || !b) return;

  const payload = {
    projectid: projectID,
    agenta_id: a,
    agentb_id: b,
    relationatob: v,
    relationbtoa: weights[key(b, a)] ?? 0,
    return_state: false,
    status: "active",
  };

  const relationKey = key(a, b);
  if (saveTimers.current[relationKey]) clearTimeout(saveTimers.current[relationKey]);

  saveTimers.current[relationKey] = setTimeout(async () => {
    try {
      await createAgentRelation(payload);
      console.log(`✅ Synced relation ${a} ↔ ${b}: ${v}`);
      toast.success(`Relation updated: ${a} ↔ ${b}`, { duration: 1800 });
    } catch (err) {
      console.warn("⚠️ Failed to sync relation:", err);
      toast.error("Failed to sync relation");
    }
  }, 500);
}, [projectid, weights]);



  // =============================
  // 🧮 Update local + backend
  // =============================
  const setW = (a, b, v) => {
    setWeights((s) => ({ ...s, [key(a, b)]: v }));
    saveRelation(a, b, v);
  };

  const labelSideFor = (x, y) => {
    if (Math.abs(x - CX) < 24 && y < CY) return "right";
    return x < CX ? "left" : "right";
  };

  // ESC closes dialogs
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { setOpenEdge(null); setNodeDialog(null); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lock scroll when dialog open
  React.useEffect(() => {
    const hasDialog = !!nodeDialog || !!openEdge;
    if (!hasDialog) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = prev; };
  }, [nodeDialog, openEdge]);

  // =============================
  // 🖼️ Render
  // =============================
  return (
    <div className="rel-wrap">
     
      <svg
        ref={svgRef}
        className="rel-svg"
        width="100%"
        height="560"
        viewBox="0 0 1040 620"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Lines between agents */}
        {edges.map(({ a, b }, idx) => {
          const A = posOf(a), B = posOf(b);
          const keySafe = `edge-${a}-${b}-${idx}`;
          return (
            <g key={keySafe}>
              <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} className="rel-edge" />
              <line
                x1={A.x}
                y1={A.y}
                x2={B.x}
                y2={B.y}
                className="rel-edge-hit"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenEdge({ a, b });
                }}
              />
            </g>
          );
        })}

        {/* Nodes */}
        {layout.map(({ id, x, y }) => {
          const ag = agents.find((a) => a.agentid === id) || {};
          const side = labelSideFor(x, y);
          const NODE_R = 34;
          const LABEL_GAP = 27;
          const dx = side === "left" ? -(NODE_R + LABEL_GAP) : NODE_R + LABEL_GAP;
          const anchor = side === "left" ? "end" : "start";
          const labelY = y + 6;

          return (
            <g key={id}>
              <circle
                cx={x}
                cy={y}
                r="50"
                className="rel-node-hit"
                onClick={() => setNodeDialog(ag)}
              />
              <circle cx={x} cy={y} r={NODE_R} className="rel-node" onClick={() => setNodeDialog(ag)} />
              <text x={x} y={y + 7} className="rel-emoji" textAnchor="middle">🤖</text>
              <text x={x + dx} y={labelY} className={`rel-label ${side}`} textAnchor={anchor}>
                {ag.agentname}
              </text>
            </g>
          );
        })}
      </svg>
      {/* Relation chart below graph */}
<div className="rel-chart">
  <h3 className="rel-chart-title">Relation Overview</h3>
  <div className="rel-chart-table">
    <table>
      <thead>
        <tr>
          <th>From</th>
          <th>To</th>
          <th>Strength</th>
        </tr>
      </thead>
<tbody>
  {edges.map(({ a, b }) => {
    const agentA = agents.find(x => x.agentid === a);
    const agentB = agents.find(x => x.agentid === b);
    const valAB = getW(a, b);
    const valBA = getW(b, a);
    const color = v => v > 0 ? "pos" : v < 0 ? "neg" : "neu";

    return (
      <tr key={`${a}-${b}`}>
        <td>{agentA?.agentname}</td>
        <td>{agentB?.agentname}</td>
        <td className={color(valAB)}>{valAB}</td>
        <td className={color(valBA)}>{valBA}</td>
      </tr>
    );
  })}
</tbody>

    </table>
  </div>
</div>


      {/* Node dialog */}
      {nodeDialog && (
        <>
          <div className="rel-backdrop" onClick={() => setNodeDialog(null)} />
          <div className="rel-node-dialog rel-center-over-content" role="dialog" aria-modal="true">
            <button className="rel-close" onClick={() => setNodeDialog(null)}>✕</button>
            <header className="rel-node-head">
              <div className="rel-node-avatar"><SvgIcon name="robot" size={22} /></div>
              <div className="rel-node-title">
                <h3>{nodeDialog.agentname}</h3>
                <div className="rel-node-sub">{nodeDialog.agentpersonality}</div>
              </div>
            </header>
            <div className="rel-node-body">
               {nodeDialog.agentskill&& <p><b>Skill:</b> {nodeDialog.agentskill}</p>}
              {nodeDialog.agentbiography && <p><b>Bio:</b> {nodeDialog.agentbiography}</p>}
              {nodeDialog.agentconstraints && <p><b>Constraints:</b> {nodeDialog.agentconstraints.join(", ")}</p>}
              {nodeDialog.agentquirk && <p><b>Quirks:</b> {nodeDialog.agentquirk.join(", ")}</p>}
              {nodeDialog.agentmotivation && <p><b>Motivation:</b> {nodeDialog.agentmotivation}</p>}
            </div>
          </div>
        </>
      )}

      {/* Edge weight dialog */}
      {openEdge && (
        <>
          <div className="rel-backdrop" onClick={() => setOpenEdge(null)} />
          <div className="rel-panel rel-center-over-content" role="dialog" aria-modal="true">
            <button className="rel-close" onClick={() => setOpenEdge(null)}>✕</button>
            <div className="rel-panel-title">RELATION STRENGTH</div>

           {/* A → B */}
<div className="rel-weight">
  <span className="rel-chip">A → B</span>
  <input
    className="rel-num"
    type="number"
    min="-100"
    max="100"
    value={getW(openEdge.a, openEdge.b)}
    onChange={(e) => {
      let val = Number(e.target.value || 0);
      if (val > 100) val = 100;
      if (val < -100) val = -100;
      setW(openEdge.a, openEdge.b, val);
    }}
  />
</div>


            <div className="rel-arrows">
              <div className="rel-dir">
                <span>{agents.find(a => a.agentid === openEdge.a)?.agentname}</span>
                <span className="rel-line rel-to-right" />
                <span>{agents.find(a => a.agentid === openEdge.b)?.agentname}</span>
              </div>
              <div className="rel-dir">
                <span>{agents.find(a => a.agentid === openEdge.b)?.agentname}</span>
                <span className="rel-line rel-to-left" />
                <span>{agents.find(a => a.agentid === openEdge.a)?.agentname}</span>
              </div>
            </div>

   {/* B → A */}
<div className="rel-weight">
  <span className="rel-chip">B → A</span>
  <input
    className="rel-num"
    type="number"
    min="-100"
    max="100"
    value={getW(openEdge.b, openEdge.a)}
    onChange={(e) => {
      let val = Number(e.target.value || 0);
      if (val > 100) val = 100;
      if (val < -100) val = -100;
      setW(openEdge.b, openEdge.a, val);
    }}
  />
</div>

          </div>
        </>
      )}

      {/* Sticky actions */}
      <div className="rel-affix">
        <div className="rel-affix-inner">
          <button className="ws-btn ghost" onClick={onBack}>Back</button>
          <button
  className="ws-btn primary"
  onClick={async () => {
    // Flush pending relation saves before moving on
    for (const t of Object.values(saveTimers.current)) clearTimeout(t);
    saveTimers.current = {};
    toast.success("All relations synced!");
    onNext();
  }}
>
  Next
</button>

        </div>
      </div>
    </div>
    
  );
}

export default RelationshipGraph;
