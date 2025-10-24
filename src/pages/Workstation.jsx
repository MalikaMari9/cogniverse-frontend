// ===============================
// Workstation.jsx (Final Optimized)
// ===============================
import "../ws_css.css";
import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import RelationshipGraph from "./Graph";
import ScenarioPage from "./ScenarioPage";
import { AgentSidebar } from "../components/Sidebar";
import {
  getAgents,
  createAgent,
  updateAgent,
  createProjectAgent,
  getProjectAgents,
  updateProjectAgent,
} from "../api/api";
import { usePermission } from "../hooks/usePermission";
import { useNavigate } from "react-router-dom";

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
    case "robot":
      return (
        <svg {...common}>
          <rect x="6" y="8" width="12" height="10" rx="2" />
          <circle cx="9" cy="12" r="1" />
          <circle cx="15" cy="12" r="1" />
          <path d="M12 8V5m-5 13h10" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20a8 8 0 0 1 16 0" />
        </svg>
      );
    case "lock":
      return (
        <svg {...common}>
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6" />
          <path d="M20 20l-4.3-4.3" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}

/* ---------- Agent Card ---------- */
function AgentCard({ agent, onRemove, onEdit }) {
  const trim = (text, len = 50) =>
    !text ? "—" : text.length > len ? text.slice(0, len) + "..." : text;
  const joinTrim = (arr, len = 50) => {
    if (!Array.isArray(arr) || !arr.length) return "—";
    const joined = arr.join(", ");
    return joined.length > len ? joined.slice(0, len) + "..." : joined;
  };

  return (
    <div className="ws-card agent">
      <div className="ws-agent-head">
        <div className="ws-avatar">
          <SvgIcon name="robot" />
        </div>
        <div className="ws-agent-title">
          <div className="ws-name">{agent.agentname}</div>
          <div className="ws-tag">{agent.agentpersonality}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="ws-icon-btn" onClick={() => onEdit?.(agent)} disabled={!onEdit}>✎</button>
<button className="ws-icon-btn ghost" onClick={() => onRemove?.(agent.agentid)} disabled={!onRemove}>✕</button>

        </div>
      </div>

      <div className="ws-kv">
        <div>
          <div className="ws-k">Skills</div>
          <div className="ws-v tooltip">
            {joinTrim(agent.agentskill, 24)}
            <span className="tooltip-text">
              {Array.isArray(agent.agentskill)
                ? agent.agentskill.join(", ")
                : ""}
            </span>
          </div>
        </div>

        <div>
          <div className="ws-k">Constraints</div>
          <div className="ws-v tooltip">
            {joinTrim(agent.agentconstraints, 24)}
            <span className="tooltip-text">
              {Array.isArray(agent.agentconstraints)
                ? agent.agentconstraints.join(", ")
                : ""}
            </span>
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
            <span className="tooltip-text">
              {Array.isArray(agent.agentquirk)
                ? agent.agentquirk.join(", ")
                : ""}
            </span>
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
  const [form, setForm] = useState(
    initial || {
      agentname: "",
      agentpersonality: "INTJ",
      agentskill: "",
      agentbiography: "",
      agentconstraints: "",
      agentquirk: "",
      agentmotivation: "",
    }
  );

  useEffect(() => {
    open ? lockScroll() : unlockScroll();
  }, [open]);

  useEffect(() => {
    if (open)
      setForm(
        initial || {
          agentname: "",
          agentpersonality: "INTJ",
          agentskill: "",
          agentbiography: "",
          agentconstraints: "",
          agentquirk: "",
          agentmotivation: "",
        }
      );
  }, [open, initial]);

  const handle = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  if (!open) return null;

  return createPortal(
    <>
      <div className="ws-backdrop-content" onClick={onClose} />
      <div
        className="ws-card ws-modal ws-center-over-content"
        onClick={(e) => e.stopPropagation()}
      >
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
                ? form.agentskill
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [],
              agentconstraints: Array.isArray(form.agentconstraints)
                ? form.agentconstraints
                : form.agentconstraints
                ? form.agentconstraints
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [],
              agentquirk: Array.isArray(form.agentquirk)
                ? form.agentquirk
                : form.agentquirk
                ? form.agentquirk
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [],
            });
          }}
        >
          <label>
            <span>Name</span>
            <input
              name="agentname"
              value={form.agentname}
              onChange={handle}
              required
            />
          </label>
          <label>
            <span>MBTI</span>
            <input
              name="agentpersonality"
              value={form.agentpersonality}
              onChange={handle}
            />
          </label>
          <label>
            <span>Skills (comma-separated)</span>
            <input
              name="agentskill"
              value={form.agentskill}
              onChange={handle}
            />
          </label>
          <label>
            <span>Biography</span>
            <textarea
              name="agentbiography"
              rows={2}
              value={form.agentbiography}
              onChange={handle}
            />
          </label>
          <label>
            <span>Constraints (comma-separated)</span>
            <textarea
              name="agentconstraints"
              rows={2}
              value={form.agentconstraints}
              onChange={handle}
            />
          </label>
          <label>
            <span>Quirks (comma-separated)</span>
            <textarea
              name="agentquirk"
              rows={2}
              value={form.agentquirk}
              onChange={handle}
            />
          </label>
          <label>
            <span>Motivation</span>
            <textarea
              name="agentmotivation"
              rows={2}
              value={form.agentmotivation}
              onChange={handle}
            />
          </label>

          <div className="ws-modal-actions">
            <button type="button" className="ws-btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ws-btn primary">
              {mode === "add" ? "Add" : "Confirm"}
            </button>
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
      <div
        className="ws-agent-view rel-node-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="rel-close">
          ✕
        </button>
        <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, display: "grid", placeItems: "center" }}>
            <SvgIcon name="robot" size={22} />
          </div>
          <div>
            <h3>{agent.agentname}</h3>
            {agent.agentpersonality && (
              <div style={{ opacity: 0.7, fontSize: ".9em" }}>
                {agent.agentpersonality}
              </div>
            )}
          </div>
        </header>
        <div style={{ fontSize: "1rem", lineHeight: 1.55 }}>
          {agent.agentskill?.length > 0 && (
            <p>
              <b>Skills:</b> {agent.agentskill.join(", ")}
            </p>
          )}
          {agent.agentbiography && (
            <p>
              <b>Bio:</b> {agent.agentbiography}
            </p>
          )}
          {agent.agentconstraints?.length > 0 && (
            <p>
              <b>Constraints:</b> {agent.agentconstraints.join(", ")}
            </p>
          )}
          {agent.agentquirk?.length > 0 && (
            <p>
              <b>Quirks:</b> {agent.agentquirk.join(", ")}
            </p>
          )}
          {agent.agentmotivation && (
            <p>
              <b>Motivation:</b> {agent.agentmotivation}
            </p>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

/* ---------- Main Workstation Page ---------- */
export  function WorkstationPage() {
  const { projectid } = useParams();
  const navigate = useNavigate();
const { level: permission, canRead, canWrite, loading: permLoading } = usePermission("AGENTS");
const [noAccessModal, setNoAccessModal] = useState({ open: false, message: "" });

  const [theme, setTheme] = useState(getStoredTheme());
  const [expanded, setExpanded] = useState(true);
  const handleExpand = () => {
  setExpanded((prev) => !prev);
};
const toggleTheme = () => {
  const newTheme = theme === "dark" ? "light" : "dark";
  setTheme(newTheme);
  localStorage.setItem("theme", newTheme);
  document.documentElement.setAttribute("data-theme", newTheme);
};


  const [agents, setAgents] = useState([]);
  const [selected, setSelected] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [stage, setStage] = useState(() => {
  if (typeof window === "undefined") return "cards";
  const saved = localStorage.getItem(`proj-${projectid}-stage`);
  return saved || "cards";
});

  const [linking, setLinking] = useState(false);
  const [ready, setReady] = useState(false);

  // 🧠 Permission redirect fix
useEffect(() => {
  if (!permLoading && permission === "none") {
    navigate("/unauthorized");
  }
}, [permLoading, permission, navigate]);


  // 🔁 Remember last open stage
useEffect(() => {
  setReady(true); // Stage already restored via initial useState
}, []);

  useEffect(() => {
    localStorage.setItem(`proj-${projectid}-stage`, stage);
  }, [stage, projectid]);

  // Auto scroll to top when switching stages
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stage]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // 💾 Autosave selected agents per project (local draft)
  useEffect(() => {
    if (selected.length > 0) {
      localStorage.setItem(
        `proj-${projectid}-draftAgents`,
        JSON.stringify(selected)
      );
    }
  }, [selected, projectid]);

  // Restore any local draft before fetching real data
  useEffect(() => {
const draft = localStorage.getItem(`proj-${projectid}-draftAgents`);
if (draft) {
  try {
    const parsed = JSON.parse(draft);
    if (Array.isArray(parsed) && parsed.length > 0) {
      console.log("📦 Restored draft agent selection:", parsed);
      // Add this filter:
      const cleaned = parsed.filter(a => a && a.agentid);
      setSelected(cleaned);
    }
  } catch {
    console.warn("⚠️ Failed to parse local draft");
  }
}

  }, [projectid]);

  // 🔁 Parallel load for agents + project agents
  useEffect(() => {
    let active = true;
    const loadAll = async () => {
      try {
        const [allAgents, projectAgents] = await Promise.all([
          getAgents(),
          getProjectAgents(),
        ]);

        if (!active) return;

        setAgents(
          allAgents.sort((a, b) => a.agentname.localeCompare(b.agentname))
        );

        const projectID = Number(projectid);
        const activeLinks = projectAgents.filter(
          (p) => p.projectid === projectID && p.status === "active"
        );
        const restored = activeLinks.map((l) => l.agentsnapshot);
        setSelected(restored);

        console.log("♻️ Loaded agents + restored selected:", restored);
      } catch (err) {
        console.error("Failed to load agent data:", err);
      }
    };

    if (projectid) loadAll();
    return () => {
      active = false;
    };
  }, [projectid]);

  // =============== Handlers ===============
// =============================
// 🧠 Enhanced handleAdd()
// =============================
const handleAdd = async (input) => {
  try {
    // 1️⃣ Create the agent globally
    const newAgent = await createAgent(input);
    setAgents((prev) => [...prev, newAgent]);

    // 2️⃣ Immediately link it to this project
    const projectID = Number(projectid);
    if (projectID) {
      try {
        await createProjectAgent({
          projectid: projectID,
          agentid: newAgent.agentid,
          agentsnapshot: newAgent,
          status: "active",
        });
        console.log(`✅ Auto-linked new agent ${newAgent.agentname} → project ${projectID}`);
      } catch (linkErr) {
        console.warn("⚠️ Failed to auto-link new agent:", linkErr);
      }
    }

    // 3️⃣ Add it visually to the current selection
    setSelected((prev) => [...prev, newAgent]);

    // 4️⃣ Close modal
    setOpenModal(false);
  } catch (err) {
   
    toast.error("Error creating agent: " + err.message);
  }
};


  const handlePickExisting = (ag) => {
    if (
      selected.length >= 5 ||
      selected.find((x) => x.agentid === ag.agentid)
    )
      return;
    setSelected((s) => [...s, ag]);
  };

  const handleEditSave = async (payload) => {
    try {
      const updated = await updateAgent(payload.agentid, payload);
      setSelected((s) =>
        s.map((a) => (a.agentid === updated.agentid ? updated : a))
      );
      setAgents((s) =>
        s.map((a) => (a.agentid === updated.agentid ? updated : a))
      );
      setEditModal(null);
      console.log("✅ Agent updated successfully:", updated.agentname);

      try {
        const links = await getProjectAgents();
        const affected = links.filter((l) => l.agentid === updated.agentid);
        for (const link of affected) {
          await updateProjectAgent(link.projagentid, {
            agentsnapshot: updated,
          });
        }
        console.log(
          `🔄 Synced snapshot for agent ${updated.agentid} to ${affected.length} project(s).`
        );
      } catch (syncErr) {
        console.warn("⚠️ Failed to sync snapshots:", syncErr);
      }
    } catch (err) {
      console.error("Error updating agent:", err);
  
      toast.error( "Failed to save changes: " +
          (err.response?.data?.detail || err.message));
    }
  };

  const handleProceedToGraph = async () => {
    try {
      const projectID = Number(projectid);
      if (!projectID) {
       
        toast.error("No project selected. Please open a valid project workspace.");
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
          if (
            err.response?.status === 400 &&
            err.response?.data?.detail?.includes("already assigned")
          ) {
            console.log(`⚠️ Skipped existing link for ${agent.agentname}`);
            continue;
          }
          throw err;
        }
      }

      localStorage.removeItem(`proj-${projectid}-draftAgents`);
     
      toast.success("Agent Links successfully!");
      setStage("graph");
    } catch (err) {
      
      toast.error("Error linking agents:", err);
      
      toast.error( "❌ Failed to save project agents: " +
          (err.response?.data?.detail || err.message));
    } finally {
      setLinking(false);
    }
  };

  const remove = (id) =>
    setSelected((s) => s.filter((a) => a.agentid !== id));

  // =============== Render ===============
 // =============== Render ===============
if (!ready) return null; // or <div>Loading workspace…</div>

return (
  <div className={`app ws-page ${stage === "scenario" ? "no-sidebar" : ""}`}>
    <Toaster position="top-right" toastOptions={{ duration: 2000 }} />

    {/* ✅ Permission-safe rendering */}
    {permLoading ? (
      <p className="hub-loading">Checking permissions...</p>
    ) : permission === "none" ? (
      <p className="hub-loading">Redirecting...</p>
    ) : (
      <>
        {stage !== "scenario" && (
<AgentSidebar
  variant="workstation"
  expanded={expanded}
  onToggleExpand={handleExpand}
  theme={theme}
  onToggleTheme={toggleTheme}
  onPickExisting={handlePickExisting}
  selectedIds={selected.map(a => a.agentid)}

  
/>
        )}

        <main className="ws-main">
          {stage !== "scenario" && (
            <header className="ws-header">
              <h1>Agents</h1>
              <div className="ws-head-actions">
                <div className="ws-count">
                  Max 5 agents • {selected.length}/5
                </div>
                <button
                  className="ws-btn primary"
                  onClick={() => {
                    if (!canWrite) {
                      setNoAccessModal({
                        open: true,
                        message:
                          "You don't have permission to add agents.",
                      });
                      return;
                    }
                    setOpenModal(true);
                  }}
                  disabled={selected.length >= 5 || !canWrite}
                  title={!canWrite ? "Read-only access" : ""}
                >
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
                    <AgentCard
                      key={ag.agentid}
                      agent={ag}
                      onRemove={canWrite ? remove : undefined}
                      onEdit={canWrite ? setEditModal : undefined}
                    />
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
              <RelationshipGraph
                agents={selected}
                onBack={() => setStage("cards")}
                onNext={() => setStage("scenario")}
              />
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

        <AgentModal
          open={openModal}
          mode="add"
          onClose={() => setOpenModal(false)}
          onSubmit={handleAdd}
        />
        <AgentModal
          open={!!editModal}
          mode="edit"
          initial={editModal || undefined}
          onClose={() => setEditModal(null)}
          onSubmit={handleEditSave}
        />

        {noAccessModal.open && (
          <div className="ad-modal">
            <div className="ad-modal-content ws-card">
              <h3>Access Denied</h3>
              <p>{noAccessModal.message}</p>
              <div className="modal-actions">
                <button
                  className="ws-btn primary"
                  onClick={() =>
                    setNoAccessModal({ open: false, message: "" })
                  }
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )}
  </div>
);

}

// ===============================
// Exports
// ===============================
// ===============================
// Exports (Final)
// ===============================
import { withMaintenanceGuard } from "../components/withMaintenanceGuard";

// ✅ Named exports (helpers)
export { SvgIcon, AgentCard, AgentModal, AgentViewModal };

// ✅ Default export (guarded version)
const GuardedWorkstation = withMaintenanceGuard(WorkstationPage, "Workstation");
export default GuardedWorkstation;
