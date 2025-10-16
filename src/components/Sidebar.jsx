// ===============================
// components/Sidebar.jsx
// ===============================
import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { SvgIcon, AgentViewModal } from "../pages/Workstation";
import { getCurrentUserFromToken } from "../utils/auth";
import { handleLogout } from "../utils/logout";
import { getAgents, createAgent } from "../api/api";
import "../ws_css.css";

/* ---------- Custom MBTI dropdown ---------- */
function MbtiSelect({ label = "Personality (MBTI)", name = "agentpersonality", value, onChange }) {
  const options = [
    "INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP",
    "ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"
  ];
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const commit = (val) => {
    onChange({ target: { name, value: val } });
    setOpen(false);
  };

  return (
    <label className="ws-select ws-select--custom" ref={wrapRef}>
      <span>{label}</span>
      <button
        type="button"
        className="ws-dd-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {value}
        <svg className="chev" width="14" height="14" viewBox="0 0 24 24">
          <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </button>
      {open && (
        <ul className="ws-dd" role="listbox">
          {options.map((opt) => (
            <li
              key={opt}
              role="option"
              aria-selected={value === opt}
              className={`ws-dd-opt ${value === opt ? "is-active" : ""}`}
              onClick={() => commit(opt)}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </label>
  );
}

/* ---------- Scroll Lock ---------- */
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

/* =====================================================================
   🔹 Add Agent Modal
   ===================================================================== */
function AddAgentModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
    agentname: "",
    agentpersonality: "INTJ",
    agentskill: "",
    agentbiography: "",
    agentconstraints: "",
    agentquirk: "",
    agentmotivation: "",
  });

  useEffect(() => {
    if (open) lockScroll();
    else unlockScroll();
  }, [open]);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  if (!open) return null;

  return createPortal(
    <>
      <div className="ws-backdrop-content" onClick={onClose} />
      <div
        className="ws-card ws-modal ws-center-over-content"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(440px, 92vw)", padding: "24px" }}
      >
        <h3 style={{ textAlign: "center", marginBottom: 16 }}>➕ Add Agent</h3>
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
          <label>
            <span>Name</span>
            <input
              name="agentname"
              value={form.agentname}
              onChange={handle}
              required
            />
          </label>

          <MbtiSelect
            label="Personality (MBTI)"
            name="agentpersonality"
            value={form.agentpersonality}
            onChange={handle}
          />

          <label>
            <span>Skills (comma-separated)</span>
            <input
              name="agentskill"
              value={form.agentskill}
              onChange={handle}
              placeholder="e.g. negotiation, empathy, data analysis"
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

          <div className="ws-modal-actions" style={{ display: "flex", justifyContent: "center", gap: 12 }}>
            <button type="button" className="ws-btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ws-btn primary">
              Create
            </button>
          </div>
        </form>
      </div>
    </>,
    document.body
  );
}

/* =====================================================================
   1️⃣ Workstation Sidebar
   ===================================================================== */
export function WorkstationSidebar({
  expanded,
  onToggleExpand,
  theme,
  onToggleTheme,
  onPickExisting,
  selectedIds = [],
  refreshKey,
}) {
  const [query, setQuery] = useState("");
  const [viewAgent, setViewAgent] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openAdd, setOpenAdd] = useState(false);

  const loadAgents = async () => {
    try {
      const res = await getAgents();
      setAgents(res);
    } catch (err) {
      console.error("Failed to load agents:", err);
      setError("Failed to load agents");
    } finally {
      setLoading(false);
    }
  };
 useEffect(() => { loadAgents(); }, [refreshKey]);
 

  const handleAddAgent = async (data) => {
    try {
      const newA = await createAgent(data);
      setAgents((prev) => [...prev, newA]);
      setOpenAdd(false);
    } catch (err) {
      console.error("Error creating agent:", err);
      alert("Error creating agent: " + err.message);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter((ag) =>
      [ag.agentname, ag.agentpersonality, ag.agentbiography, ag.agentconstraints]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [agents, query]);

  return (
    <>
      <aside className={`ws-sidebar ${expanded ? "expanded" : ""}`}>
        <div className="ws-sidebar-scroll">
          <div className="ws-side-top">
            <div className="ws-brand">
              <span className="logo"><img src="logo.png" alt="" /></span>
              {expanded && (
                <span className="brand-text" onClick={() => (window.location.href = "/workstation")} style={{ cursor: "pointer" }}>
                  Workstation
                </span>
              )}
            </div>
            <button className="ws-toggle-exp" onClick={onToggleExpand}>
              {expanded ? "«" : "»"}
            </button>
          </div>

          {/* Search */}
          {expanded && (
            <div className="ws-searchbar">
              <div className="ws-search">
                <span className="ico"><SvgIcon name="search" size={16} /></span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search agents..."
                />
                {query && (
                  <button className="ws-search-clear" onClick={() => setQuery("")}>
                    ×
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Agents */}
          <div className="ws-side-section agents">
            {expanded && (
              <div className="ws-sec-title" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Agents</span>
                <button className="ws-mini-btn primary" onClick={() => setOpenAdd(true)}>+</button>
              </div>
            )}
            {loading ? (
              <p style={{ padding: "12px", opacity: 0.6 }}>Loading agents...</p>
            ) : error ? (
              <p style={{ color: "red", padding: "12px" }}>{error}</p>
            ) : filtered.length === 0 ? (
              <p style={{ padding: "12px", opacity: 0.6 }}>No agents found.</p>
            ) : (
              <ul className="ws-agent-list">
                {filtered.map((ag) => {
                  const inUse = selectedIds.includes(ag.agentid);
                  return (
                    <li key={ag.agentid} className={`ws-agent-pill ${inUse ? "disabled" : ""}`} onClick={() => !inUse && onPickExisting(ag)}>
                      <span className="ico avatar"><SvgIcon name="robot" /></span>
                      {expanded && <span className="lbl">{ag.agentname}</span>}
                      {expanded && (
                        <span className="ws-agent-actions">
                          <button className="ws-mini-btn" disabled={inUse} onClick={(e) => { e.stopPropagation(); if (!inUse) onPickExisting(ag); }}>
                            Add
                          </button>
                          <button className="ws-mini-btn ghost" onClick={(e) => { e.stopPropagation(); setViewAgent(ag); }}>
                            View
                          </button>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="ws-side-section">
            <button className={`ws-theme-switch ${theme}`} onClick={onToggleTheme} />
            <a className="ws-row-btn" href="#"><span className="ico"><SvgIcon name="clock" /></span>{expanded && <span>History</span>}</a>
            <a className="ws-row-btn" href="#"><span className="ico"><SvgIcon name="user" /></span>{expanded && <span>Profile</span>}</a>
            <button className="ws-row-btn" onClick={handleLogout}><span className="ico"><SvgIcon name="lock" /></span>{expanded && <span>Logout</span>}</button>
          </div>
        </div>

        <AgentViewModal open={!!viewAgent} agent={viewAgent} onClose={() => setViewAgent(null)} />
      </aside>

      <AddAgentModal open={openAdd} onClose={() => setOpenAdd(false)} onSubmit={handleAddAgent} />
    </>
  );
}

/* =====================================================================
   2️⃣ Workstation Hub Sidebar
   ===================================================================== */
export function WorkstationHubSidebar({ expanded, onToggleExpand, theme, onToggleTheme }) {
  const [query, setQuery] = useState("");
  const [viewAgent, setViewAgent] = useState(null);
  const [agents, setAgents] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [openAdd, setOpenAdd] = useState(false);

  useEffect(() => {
    const decoded = getCurrentUserFromToken();
    if (decoded) setUserInfo(decoded);
    (async () => {
      try {
        const res = await getAgents();
        setAgents(res);
      } catch (err) {
        console.warn("Failed to fetch agents:", err);
      }
    })();
  }, []);

  const handleAddAgent = async (data) => {
    try {
      const newA = await createAgent(data);
      setAgents((prev) => [...prev, newA]);
      setOpenAdd(false);
    } catch (err) {
      alert("Error creating agent: " + err.message);
    }
  };

  const filtered = agents.filter((ag) => ag.agentname.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <aside className={`ws-sidebar ${expanded ? "expanded" : ""}`}>
        <div className="ws-sidebar-scroll">
          <div className="ws-side-top">
            <div className="ws-brand">
              <span className="logo"><img src="logo.png" alt="" /></span>
              {expanded && (
                <span className="brand-text" onClick={() => (window.location.href = "/workstation")} style={{ cursor: "pointer" }}>
                  Workstation
                </span>
              )}
            </div>
            <button className="ws-toggle-exp" onClick={onToggleExpand}>
              {expanded ? "«" : "»"}
            </button>
          </div>

          {expanded && (
            <div className="ws-searchbar">
              <div className="ws-search">
                <span className="ico"><SvgIcon name="search" size={16} /></span>
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search agents..." />
                {query && <button className="ws-search-clear" onClick={() => setQuery("")}>×</button>}
              </div>
            </div>
          )}

          <div className="ws-side-section agents">
            {expanded && (
              <div className="ws-sec-title" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Agents</span>
                <button className="ws-mini-btn primary" onClick={() => setOpenAdd(true)}>+</button>
              </div>
            )}
            {filtered.map((ag) => (
              <li key={ag.agentid} className="ws-agent-pill">
                <span className="ico avatar"><SvgIcon name="robot" /></span>
                {expanded && <span className="lbl">{ag.agentname}</span>}
                {expanded && (
                  <button className="ws-mini-btn ghost" style={{ marginLeft: "auto" }} onClick={() => setViewAgent(ag)}>
                    View
                  </button>
                )}
              </li>
            ))}
          </div>

          <div className="ws-side-section">
            {userInfo ? (
              <div className="ws-user-greeting" style={{ padding: "10px 16px" }}>
                Hi, {userInfo.username || `User #${userInfo.user_id}`} 👋
              </div>
            ) : (
              <div className="ws-user-greeting" style={{ padding: "10px 16px", opacity: 0.6 }}>
                Not logged in
              </div>
            )}

            <button className={`ws-theme-switch ${theme}`} onClick={onToggleTheme} />
            <a className="ws-row-btn" href="#"><span className="ico"><SvgIcon name="clock" /></span>{expanded && <span>History</span>}</a>
            <a className="ws-row-btn" href="#"><span className="ico"><SvgIcon name="user" /></span>{expanded && <span>Profile</span>}</a>
            <button className="ws-row-btn" onClick={handleLogout}><span className="ico"><SvgIcon name="lock" /></span>{expanded && <span>Logout</span>}</button>
          </div>
        </div>

        <AgentViewModal open={!!viewAgent} agent={viewAgent} onClose={() => setViewAgent(null)} />
      </aside>

      <AddAgentModal open={openAdd} onClose={() => setOpenAdd(false)} onSubmit={handleAddAgent} />
    </>
  );
}
