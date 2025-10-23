// ===============================
// ScenarioPage.jsx (updated with backend integration + AI integration markers)
// ===============================
import React, { useEffect, useRef, useState, useCallback } from "react";
import { SvgIcon } from "./Workstation";
import { AgentCard } from "./Workstation";
import NavProduct from "../components/NavProduct";

import "../ws_css.css";
import {
  createScenario,
  getScenarios,
  getResultsByAgentScenarioType,
  getResults,
} from "../api/api";
import { useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

export default function ScenarioPage({
  theme,
  onBackToWorkstation,
  onBackToGraph,
  selectedAgents,
}) {
  const { projectid } = useParams();

  // ---------------- state ----------------
  const [scenarioText, setScenarioText] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [nodes, setNodes] = useState([]); // [{id,name,icon,x,y}]
  const [hover, setHover] = useState(null); // {x,y,text,transform}
  const [scenarios, setScenarios] = useState([]); // ✅ store history
  const boundsRef = useRef(null);
  const [currentScenario, setCurrentScenario] = useState(null);
  // ✅ Prevent crash from undefined agents
  const validAgents = (selectedAgents || []).filter(a => a && a.agentid);

  // local theme label that always flips correctly
  const [t, setT] = useState(() =>
    document.documentElement.getAttribute("data-theme") || "dark"
  );
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

  // ---------------- Bubble Thought Fetcher ----------------
  // Fetches latest "thought" results for the given agent.
  // 🧠 [AI THOUGHT INTEGRATION POINT]
  // In the future, replace this call to `getResultsByAgentScenarioType`
  // with an AI endpoint that dynamically generates the agent's "thought"
  // such as: POST /simulate/agent-thought { projectagentid, scenarioid, context }
  const bubbleTextFor = async (agent) => {
    try {
      if (!agent.projectagentid || !currentScenario)
        return `${agent.name} is thinking...`;

      const thoughts = await getResultsByAgentScenarioType(
        agent.projectagentid,
        currentScenario.scenarioid,
        "thought"
      );

      if (thoughts.length > 0) {
        const r = thoughts[Math.floor(Math.random() * thoughts.length)];
        return r.resulttext || `${agent.name} is pondering something.`;
      } else {
        return `${agent.name} is quietly observing.`;
      }
    } catch (err) {
      console.warn("⚠️ Failed to fetch thought for agent", agent.name, err);
      return `${agent.name} is quietly observing.`;
    }
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
// ---------------- node layout: always visible, evenly spaced ----------------
const layoutNodes = () => {
  const el = boundsRef.current;
  if (!el || !validAgents || validAgents.length === 0) {
    setNodes([]); // clear old nodes if no agents
    return;
  }

  const W = el.clientWidth;
  const H = el.clientHeight;
  const PAD = 72;
  const n = Math.max(1, validAgents.length);
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.max(40, Math.min(W, H) / 2 - PAD);

  const pts =
    n === 1
      ? [
          {
            id: validAgents[0].agentid,
            name: validAgents[0].agentname,
            projectagentid: validAgents[0].projectagentid,
            icon: validAgents[0].icon || "user",
            x: Math.round(cx),
            y: Math.round(cy),
          },
        ]
      : validAgents.map((ag, i) => {
          const t = -Math.PI / 2 + (i * 2 * Math.PI) / n;
          const x = Math.max(PAD, Math.min(W - PAD, cx + R * Math.cos(t)));
          const y = Math.max(PAD, Math.min(H - PAD, cy + R * Math.sin(t)));
          return {
            id: ag.agentid,
            name: ag.agentname,
            projectagentid: ag.projectagentid,
            icon: ag.icon || "user",
            x: Math.round(x),
            y: Math.round(y),
          };
        });

  setNodes(pts);
};

// Run layout when agent count changes
useEffect(() => {
  layoutNodes();
}, [validAgents.length]);

// Attach resize observer once
useEffect(() => {
  const el = boundsRef.current;
  if (!el) return;
  const ro = new ResizeObserver(() => layoutNodes());
  ro.observe(el);
  return () => ro.disconnect();
}, []);

  // ---------------- 🧩 Load all scenarios ----------------
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const data = await getScenarios();
        const filtered = data.filter((s) => s.projectid === Number(projectid));
        setScenarios(filtered);
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
      id: `${ag.agentid}-${i}`,
      who: ag.agentname,
      turn: i + 1,
      text: `${ag.agentname} ${
        acts[Math.floor(Math.random() * acts.length)]
      }`,
    };
  };

  const onGenerate = async () => {
    if (!scenarioText.trim()) {
      toast.error("Please enter a scenario description first.");
      return;
    }
    if (currentScenario) {
      toast.error("Finish or clear the current scenario before generating a new one.");
      return;
    }

    setLoading(true);
    setLogs([]);
    setHover(null);

    try {
      const scenarioPayload = {
        scenarioname: scenarioText || "Untitled Scenario",
        scenarioprompt: scenarioText,
        projectid: Number(projectid),
        status: "active",
      };

      await createScenario(scenarioPayload);
      toast.success("Scenario saved successfully!");
      setCurrentScenario(scenarioPayload); // 🟢 Store active scenario

      // ---------------- Fetch all simulation results (any type) ----------------
      // 🧩 [AI RESULT INTEGRATION POINT]
      // In the future, replace this section with a unified simulation call like:
      // POST /simulate/scenario { projectid, scenarioid }
      // The backend AI service should generate and persist all result types.
      try {
        const allResults = await getResults();
        const filtered = allResults.filter(
          (r) => r.scenarioid === scenarioPayload.scenarioid
        );
        const formatted = filtered.map((r, i) => ({
          id: r.resultid,
          who:
            validAgents.find(
              (a) => a.projectagentid === r.projectagentid
            )?.agentname || "Unknown",
          turn: r.sequence_no || i + 1,
          text: r.resulttext,
        }));
        setLogs(formatted);
      } catch (fetchErr) {
        console.error("❌ Failed to fetch scenario results:", fetchErr);
      }

      // 🪄 Local fallback — only used if backend has no AI output yet
      const L = [];
      const total = Math.max(6, validAgents.length * 2);
      for (let i = 0; i < total; i++) {
        const ag =
          validAgents[Math.floor(Math.random() * validAgents.length)];
        L.push(genLine(ag, i));
      }
      setLogs(L);
    } catch (err) {
      toast.error("Failed to create scenario");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- render ----------------
  return (
    <div className="sc-page">
      {/* NAV */}
        <NavProduct
           theme={theme}
           onToggleTheme={toggleTheme}
           active="workstation"
           onGoWorkstation={() => (window.location.href = "/workstation")}
           onGoGraph={() => (window.location.href = "/graph")}
           onGoHistory={() => (window.location.href = "/history")}
         />

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
          <button
            className="ws-btn primary"
            onClick={onGenerate}
            disabled={loading || !!currentScenario}
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </label>
      </section>

      {/* MAIN grid */}
      <section className={`sc-main ${hasOutput ? "has-output" : ""}`}>
        {/* Canvas */}
        <div
          className={`sc-canvas sc-grid ws-card ${hasOutput ? "post" : "pre"}`}
          ref={boundsRef}
        >
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
                onMouseEnter={async () => {
                  const p = bubbleFor(n.x, n.y);
                  const text = await bubbleTextFor(n);
                  setHover({
                    x: p.x,
                    y: p.y,
                    text,
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
            <div
              className="sc-bubble"
              style={{
                left: hover.x,
                top: hover.y,
                transform: hover.transform,
              }}
            >
              {hover.text}
            </div>
          )}
        </div>

        {currentScenario && (
          <div className="sc-current ws-card">
            <h3>Scenario:</h3>
            <p>{currentScenario.scenarioprompt}</p>
          </div>
        )}

        {/* Log */}
        <aside className="sc-log ws-card compact">
          <div className="sc-log-head">Simulation Log</div>
          {loading ? (
            <div className="sc-center">
              <div className="sc-spinner" />
            </div>
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

        {currentScenario && !loading && (
          <div className="sc-clear">
            <button
              className="ws-btn ghost"
              onClick={() => setCurrentScenario(null)}
            >
              + New Scenario
            </button>
          </div>
        )}

        {/* Roster */}
        <div className="sc-roster">
          {validAgents.map((ag) => (
            <div className="agent-card-wrap" key={ag.agentid}>
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
