// ===============================
// Workstation.jsx
// ===============================
import "../ws_css.css";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import RelationshipGraph from "./Graph";
import ScenarioPage from "./ScenarioPage";
import { WorkstationSidebar } from "../components/Sidebar";
import { getAgents, createAgent, updateAgent, createProjectAgent, getProjectAgents, updateProjectAgent } from "../api/api";

/* ---------- Theme utilities ---------- */
function getStoredTheme() {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem("theme") || "dark";
}
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

/* ---------- Scroll lock ---------- */
let __scrollLocks = 0;
function lockScroll() {
  if (++__scrollLocks === 1) {
    const el = document.documentElement;
    el.dataset.prevOverflow = el.style.overflow || "";
    el.style.overflow = "hidden";
  }
}
function unlockScroll() {
  if (__scrollLocks > 0 && --__scrollLocks === 0) {
    const el = document.documentElement;
    el.style.overflow = el.dataset.prevOverflow || "";
    delete el.dataset.prevOverflow;
  }
}

/* ---------- SVG Icon ---------- */
function SvgIcon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  switch (name) {
    case "robot": return <svg {...common}><rect x="6" y="8" width="12" height="10" rx="2"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M12 8V5m-5 13h10"/></svg>;
    case "clock": return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case "user": return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/></svg>;
    case "lock": return <svg {...common}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>;
    case "search": return <svg {...common}><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.3-4.3"/></svg>;
    default: return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
  }
}

/* ---------- Agent Card ---------- */
function AgentCard({ agent, onRemove, onEdit }) {
  const trim = (text, len = 50) => (!text ? "—" : text.length > len ? text.slice(0, len) + "..." : text);
  const joinTrim = (arr, len = 50) => {
    if (!Array.isArray(arr) || !arr.length) return "—";
    const joined = arr.join(", ");
    return joined.length > len ? joined.slice(0, len) + "..." : joined;
  };

  return (
    <div className="ws-card agent">
      <div className="ws-agent-head">
        <div className="ws-avatar"><SvgIcon name="robot" /></div>
        <div className="ws-agent-title">
          <div className="ws-name">{agent.agentname}</div>
          <div className="ws-tag">{agent.agentpersonality}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="ws-icon-btn" onClick={() => onEdit(agent)}>✎</button>
          <button className="ws-icon-btn ghost" onClick={() => onRemove(agent.agentid)}>✕</button>
        </div>
      </div>

      <div className="ws-kv">
        <div>
          <div className="ws-k">Skills</div>
          <div className="ws-v tooltip">
            {joinTrim(agent.agentskill, 24)}
            <span className="tooltip-text">{Array.isArray(agent.agentskill) ? agent.agentskill.join(", ") : ""}</span>
          </div>
        </div>

        <div>
          <div className="ws-k">Constraints</div>
          <div className="ws-v tooltip">
            {joinTrim(agent.agentconstraints, 24)}
            <span className="tooltip-text">{Array.isArray(agent.agentconstraints) ? agent.agentconstraints.join(", ") : ""}</span>
          </div>
        </div>

        <div>
          <div className="ws-k">Biography</div>
          <div className="ws-v tooltip">
            {trim(agent.agentbiography, 24)}
            <span className="tooltip-text">{agent.agentbiography}</span>
          </div>
        </div>

        <div>
          <div className="ws-k">Quirks</div>
          <div className="ws-v tooltip">
            {joinTrim(agent.agentquirk, 24)}
            <span className="tooltip-text">{Array.isArray(agent.agentquirk) ? agent.agentquirk.join(", ") : ""}</span>
          </div>
        </div>

        <div>
          <div className="ws-k">Motivation</div>
          <div className="ws-v tooltip">
            {trim(agent.agentmotivation, 24)}
            <span className="tooltip-text">{agent.agentmotivation}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Agent Modal (Add/Edit) ---------- */
function AgentModal({ open, mode = "add", initial, onClose, onSubmit }) {
  const [form, setForm] = useState(initial || {
    agentname: "",
    agentpersonality: "INTJ",
    agentskill: "",
    agentbiography: "",
    agentconstraints: "",
    agentquirk: "",
    agentmotivation: "",
  });

  useEffect(() => { open ? lockScroll() : unlockScroll(); }, [open]);
  useEffect(() => {
    if (open) setForm(initial || {
      agentname: "",
      agentpersonality: "INTJ",
      agentskill: "",
      agentbiography: "",
      agentconstraints: "",
      agentquirk: "",
      agentmotivation: "",
    });
  }, [open, initial]);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  if (!open) return null;

  return createPortal(
    <>
      <div className="ws-backdrop-content" onClick={onClose} />
      <div className="ws-card ws-modal ws-center-over-content" onClick={(e) => e.stopPropagation()}>
        <h3>{mode === "add" ? "Add Agent" : "Edit Agent"}</h3>
        <form
          className="ws-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              ...form,
              agentskill: Array.isArray(form.agentskill)
  ? form.agentskill
  : form.agentskill
    ? form.agentskill.split(",").map((s) => s.trim()).filter(Boolean)
    : [],
agentconstraints: Array.isArray(form.agentconstraints)
  ? form.agentconstraints
  : form.agentconstraints
    ? form.agentconstraints.split(",").map((s) => s.trim()).filter(Boolean)
    : [],
agentquirk: Array.isArray(form.agentquirk)
  ? form.agentquirk
  : form.agentquirk
    ? form.agentquirk.split(",").map((s) => s.trim()).filter(Boolean)
    : [],

            });
          }}
        >
          <label><span>Name</span><input name="agentname" value={form.agentname} onChange={handle} required /></label>
          <label><span>MBTI</span><input name="agentpersonality" value={form.agentpersonality} onChange={handle} /></label>
          <label><span>Skills (comma-separated)</span><input name="agentskill" value={form.agentskill} onChange={handle} /></label>
          <label><span>Biography</span><textarea name="agentbiography" rows={2} value={form.agentbiography} onChange={handle} /></label>
          <label><span>Constraints (comma-separated)</span><textarea name="agentconstraints" rows={2} value={form.agentconstraints} onChange={handle} /></label>
          <label><span>Quirks (comma-separated)</span><textarea name="agentquirk" rows={2} value={form.agentquirk} onChange={handle} /></label>
          <label><span>Motivation</span><textarea name="agentmotivation" rows={2} value={form.agentmotivation} onChange={handle} /></label>

          <div className="ws-modal-actions">
            <button type="button" className="ws-btn ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="ws-btn primary">{mode === "add" ? "Add" : "Confirm"}</button>
          </div>
        </form>
      </div>
    </>,
    document.body
  );
}

/* ---------- Agent View Modal ---------- */
function AgentViewModal({ open, agent, onClose }) {
  useEffect(() => {
    if (!(open && agent)) return;
    lockScroll();
    return () => unlockScroll();
  }, [open, agent]);
  if (!open || !agent) return null;

  return createPortal(
    <>
      <div className="ws-backdrop-content" onClick={onClose} />
      <div className="ws-agent-view rel-node-dialog" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="rel-close">✕</button>
        <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, display: "grid", placeItems: "center" }}>
            <SvgIcon name="robot" size={22} />
          </div>
          <div>
            <h3>{agent.agentname}</h3>
            {agent.agentpersonality && <div style={{ opacity: .7, fontSize: ".9em" }}>{agent.agentpersonality}</div>}
          </div>
        </header>
        <div style={{ fontSize: "1rem", lineHeight: 1.55 }}>
          {agent.agentskill?.length > 0 && <p><b>Skills:</b> {agent.agentskill.join(", ")}</p>}
          {agent.agentbiography && <p><b>Bio:</b> {agent.agentbiography}</p>}
          {agent.agentconstraints?.length > 0 && <p><b>Constraints:</b> {agent.agentconstraints.join(", ")}</p>}
          {agent.agentquirk?.length > 0 && <p><b>Quirks:</b> {agent.agentquirk.join(", ")}</p>}
          {agent.agentmotivation && <p><b>Motivation:</b> {agent.agentmotivation}</p>}
        </div>
      </div>
    </>,
    document.body
  );
}

/* ---------- Main Page ---------- */
export default function WorkstationPage() {
  const { projectid } = useParams();
  const [theme, setTheme] = useState(getStoredTheme());
  const [expanded, setExpanded] = useState(true);
  const [agents, setAgents] = useState([]);
  const [selected, setSelected] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [stage, setStage] = useState("cards");
  const [linking, setLinking] = useState(false);


  console.log("🔍 useParams result:", useParams());

  useEffect(() => { applyTheme(theme); }, [theme]);

  // ✅ Restore linked agents for this project on load
useEffect(() => {
  const loadProjectAgents = async () => {
    try {
      const links = await getProjectAgents();
      const projectID = Number(projectid);
      const activeLinks = links.filter(
        (p) => p.projectid === projectID && p.status === "active"
      );
      const restored = activeLinks.map((l) => l.agentsnapshot);
      setSelected(restored);
      console.log("♻️ Restored selected agents:", restored);
    } catch (err) {
      console.error("Failed to load project agents:", err);
    }
  };
  if (projectid) loadProjectAgents();
}, [projectid]);


  useEffect(() => {
    const loadAgents = async () => {
      try {
        const res = await getAgents();
        setAgents(res);
      } catch (err) {
        console.error("Failed to load agents:", err);
      }
    };
    loadAgents();
  }, []);

  const handleAdd = async (input) => {
    try {
      const newAgent = await createAgent(input);
      setAgents((prev) => [...prev, newAgent]);
      setOpenModal(false);
    } catch (err) {
      alert("Error creating agent: " + err.message);
    }
  };

  const handlePickExisting = (ag) => {
    if (selected.length >= 5 || selected.find((x) => x.agentid === ag.agentid)) return;
    setSelected((s) => [...s, ag]);
  };

  const handleEditSave = async (payload) => {
    try {
      const updated = await updateAgent(payload.agentid, payload);
      setSelected((s) => s.map((a) => (a.agentid === updated.agentid ? updated : a)));
      setAgents((s) => s.map((a) => (a.agentid === updated.agentid ? updated : a)));
      setEditModal(null);
      console.log("✅ Agent updated successfully:", updated.agentname);
      // 🔄 Sync updated snapshot into linked project agents
try {
  const links = await getProjectAgents();
  const affected = links.filter((l) => l.agentid === updated.agentid);
  for (const link of affected) {
    await updateProjectAgent(link.projagentid, { agentsnapshot: updated });
  }
  console.log(`🔄 Synced snapshot for agent ${updated.agentid} to ${affected.length} project(s).`);
} catch (syncErr) {
  console.warn("⚠️ Failed to sync snapshots:", syncErr);
}

    } catch (err) {
      console.error("Error updating agent:", err);
      alert("Failed to save changes: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleProceedToGraph = async () => {
    try {
      const projectID = Number(projectid);
      if (!projectID) {
        alert("No project selected. Please open a valid project workspace.");
        return;
      }

      setLinking(true);
for (const agent of selected) {
  const payload = {
    projectid: projectID,
    agentid: agent.agentid,
    agentsnapshot: agent,
    status: "active",
  };

  try {
    await createProjectAgent(payload);
    console.log(`✅ Linked agent ${agent.agentname} → project ${projectID}`);
  } catch (err) {
    // ⚠️ Bypass duplicate agent-project links
    if (err.response?.status === 400 && err.response?.data?.detail?.includes("already assigned")) {
      console.log(`⚠️ Skipped existing link for ${agent.agentname}`);
      continue;
    }
    throw err; // rethrow if it's any other error
  }
}


      alert("✅ Agents linked successfully!");
      setStage("graph");
    } catch (err) {
      console.error("Error linking agents:", err);
      alert("❌ Failed to save project agents: " + (err.response?.data?.detail || err.message));
    } finally {
      setLinking(false);
    }
  };

  const remove = (id) => setSelected((s) => s.filter((a) => a.agentid !== id));

  return (
    <div className={`app ws-page ${stage === "scenario" ? "no-sidebar" : ""}`}>
      {stage !== "scenario" && (
        <WorkstationSidebar
          expanded={expanded}
          onToggleExpand={() => setExpanded((e) => !e)}
          theme={theme}
          onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          onPickExisting={handlePickExisting}
          selectedIds={selected.map((a) => a.agentid)}
          refreshKey={agents.length}
        />
      )}

      <main className="ws-main">
        {stage !== "scenario" && (
          <header className="ws-header">
            <h1>Agents</h1>
            <div className="ws-head-actions">
              <div className="ws-count">Max 5 agents • {selected.length}/5</div>
              <button className="ws-btn primary" onClick={() => setOpenModal(true)} disabled={selected.length >= 5}>
                + Add Agent
              </button>
            </div>
          </header>
        )}

        <section className="ws-board">
          {stage === "cards" && (
            <>
              <div className="ws-board-head">
                <h3>Your team</h3>
                <span className="ws-count">{selected.length}/5</span>
              </div>

              <div className="ws-grid">
                {selected.map((ag) => (
                  <AgentCard key={ag.agentid} agent={ag} onRemove={remove} onEdit={setEditModal} />
                ))}
                {selected.length === 0 && (
                  <div className="ws-empty">
                    <p>No agents yet.</p>
                    <p>Add a new agent or pick one from the sidebar.</p>
                  </div>
                )}
              </div>

              <div className="ws-next">
                <button
                  className="ws-btn primary"
                  onClick={handleProceedToGraph}
                  disabled={selected.length < 2 || linking}
                >
                  {linking ? "Linking..." : "Next"}
                </button>
              </div>
            </>
          )}

          {stage === "graph" && (
            <RelationshipGraph agents={selected} onBack={() => setStage("cards")} onNext={() => setStage("scenario")} />
          )}

          {stage === "scenario" && (
            <ScenarioPage
              theme={theme}
              onBackToWorkstation={() => setStage("cards")}
              onBackToGraph={() => setStage("graph")}
              selectedAgents={selected}
            />
          )}
        </section>
      </main>

      <AgentModal open={openModal} mode="add" onClose={() => setOpenModal(false)} onSubmit={handleAdd} />
      <AgentModal open={!!editModal} mode="edit" initial={editModal || undefined} onClose={() => setEditModal(null)} onSubmit={handleEditSave} />
    </div>
  );
}

// ===============================
// Exports
// ===============================
export { SvgIcon, AgentCard, AgentModal, AgentViewModal };
