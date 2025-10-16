import '../ws_css.css'
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";


/* ---------- Theme utilities ---------- */
function getStoredTheme() {
  if (typeof window === "undefined") return "dark";
  return localStorage.getItem("theme") || "dark";
}
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

// ----- global, reference-counted scroll lock -----
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


/* ---------- Existing agents for the sidebar ---------- */
const EXISTING = [
  { id:"a1", name:"Aurora", mbti:"INTJ",
    bio:"Systems thinker; strategizes long-term outcomes.",
    constraints:"Needs clear problem definitions; low noise.",
    quirks:"Over-optimizes; loves flow charts.",
    motivation:"Elegant, scalable solutions."
  },
  { id:"a2", name:"Volt", mbti:"ENTP",
    bio:"Ideas stormer; thrives on rapid iteration.",
    constraints:"Gets bored by routine; needs autonomy.",
    quirks:"Collects obscure APIs.",
    motivation:"Winning via creative pivots."
  },
  { id:"a3", name:"Sable", mbti:"INFJ",
    bio:"Human-centric analyst; reads team morale.",
    constraints:"Needs purpose alignment.",
    quirks:"Annotates everything.",
    motivation:"Positive user impact."
  },
  { id:"a4", name:"Orion", mbti:"ISTP",
    bio:"Quiet debugger; surgical with edge cases.",
    constraints:"No micromanagement; concise specs.",
    quirks:"Benchmark addict.",
    motivation:"Make things actually fast."
  },
  { id:"a5", name:"Pixel", mbti:"ISFP",
    bio:"Detail-loving UI artisan.",
    constraints:"Time for polish.",
    quirks:"Carries palette cards.",
    motivation:"Interfaces that feel alive."
  },
  { id:"a6", name:"Nova", mbti:"ENFJ",
    bio:"Orchestrates team synergy.",
    constraints:"Needs real-time feedback loops.",
    quirks:"Post-it galaxy on desk.",
    motivation:"Collective wins."
  },
  { id:"a7", name:"Quark", mbti:"INTP",
    bio:"Hypothesis-driven; research first.",
    constraints:"Time for exploration.",
    quirks:"Footnotes everything.",
    motivation:"Truth via models."
  },
  { id:"a8", name:"Echo", mbti:"ESFP",
    bio:"User-voice amplifier; tests in the wild.",
    constraints:"Needs audience access.",
    quirks:"Sends voice notes.",
    motivation:"Happy users, loud signals."
  }
];

/* ---------- SVG avatar set (unique among selected) ---------- */
const ICONS = [
  "bolt","brain","robot","owl","tiger","octo","gem","flame",
  "wave","moon","star","puzzle","shield","lab","target","sat","map","bulb"
];

/* ===== Unified dialog primitives (content-only, sidebar-safe) ===== */
function ContentBackdrop(props){
  return <div className="ws-backdrop-content" {...props} />;
}
function ContentModal({ className = "", ...rest }){
  // same surface + centering math as your rel-node dialog
  return (
    <div
      className={`ws-card ws-modal rel-center-over-content ${className}`}
      {...rest}
    />
  );
}




/* A tiny SVG library so we don’t rely on emojis */
function SvgIcon({ name, size=20 }) {
 
  const common = { width:size, height:size, viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"1.8", strokeLinecap:"round", strokeLinejoin:"round" };
  switch (name) {
    case "bolt":   return <svg {...common}><path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z"/></svg>;
    case "brain":  return <svg {...common}><path d="M9 3a3 3 0 0 0-3 3v3a3 3 0 0 0 3 3v6m6-15a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3v6"/><path d="M9 6a3 3 0 0 0-3-3M15 6a3 3 0 0 1 3-3"/></svg>;
    case "robot":  return <svg {...common}><rect x="6" y="8" width="12" height="10" rx="2"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M12 8V5m-5 13h10"/></svg>;
    case "owl":    return <svg {...common}><path d="M4 9a8 8 0 0 1 16 0v6a8 8 0 0 1-16 0z"/><circle cx="9" cy="11" r="2"/><circle cx="15" cy="11" r="2"/></svg>;
    case "tiger":  return <svg {...common}><path d="M4 10a8 8 0 0 1 16 0v5a8 8 0 0 1-16 0z"/><path d="M8 10v3m8-3v3"/></svg>;
    case "octo":   return <svg {...common}><circle cx="12" cy="10" r="4"/><path d="M4 20c2-2 3-2 4-4m12 4c-2-2-3-2-4-4M6 18c2 1 4 0 6 0s4 1 6 0"/></svg>;
    case "gem":    return <svg {...common}><path d="M3 9l9-6 9 6-9 12z"/><path d="M3 9h18"/></svg>;
    case "flame":  return <svg {...common}><path d="M12 2s5 5 5 9a5 5 0 1 1-10 0c0-4 5-9 5-9z"/></svg>;
    case "wave":   return <svg {...common}><path d="M2 16s2-3 6-3 6 3 10 3 4-3 4-3"/></svg>;
    case "moon":   return <svg {...common}><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z"/></svg>;
    case "star":   return <svg {...common}><path d="M12 2l2.9 6.9L22 10l-5 4.9L18.2 22 12 18.6 5.8 22 7 14.9 2 10l7.1-1.1z"/></svg>;
    case "puzzle": return <svg {...common}><path d="M10 3a2 2 0 0 1 4 0v2h2a2 2 0 1 1 0 4h-2v2h2a2 2 0 1 1 0 4h-2v2a2 2 0 1 1-4 0v-2H8a2 2 0 1 1 0-4h2v-2H8a2 2 0 1 1 0-4h2V3z"/></svg>;
    case "shield": return <svg {...common}><path d="M12 2l7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z"/></svg>;
    case "lab":    return <svg {...common}><path d="M10 2v6l-6 10h16L14 8V2"/><path d="M6 14h12"/></svg>;
    case "target": return <svg {...common}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>;
    case "sat":    return <svg {...common}><path d="M14 10l6-6m-10 2l4 4m-8-2l10 10M2 22l8-8"/></svg>;
    case "map":    return <svg {...common}><path d="M2 7l7-3 6 3 7-3v13l-7 3-6-3-7 3z"/><path d="M9 4v13m6-10v13"/></svg>;
    case "bulb":   return <svg {...common}><path d="M9 18h6M9 14a6 6 0 1 1 6 0c-1.5 1-1.5 2-1.5 4h-3C10.5 16 10.5 15 9 14z"/></svg>;
    case "clock":   return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case "user":    return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/></svg>;
    case "lock":    return <svg {...common}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>;
    default:       return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
    case "search":
  return (
    <svg {...common}>
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-4.3-4.3" />
    </svg>
  );
  }
}


/* ---------- Custom MBTI dropdown (replaces native popup) ---------- */
function MbtiSelect({ label="Personality (MBTI)", name="mbti", value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(-1);
  const wrapRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onEsc); };
  }, [open]);

  const commit = (val) => {
    // keep signature compatible with your handle(e)
    onChange({ target: { name, value: val } });
    setOpen(false);
  };

  const onTriggerKey = (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setTimeout(() => {
        setFocusIdx(Math.max(0, options.indexOf(value)));
        listRef.current?.focus();
      }, 0);
    }
  };

  const onListKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusIdx((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusIdx((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = options[focusIdx >= 0 ? focusIdx : 0];
      if (pick) commit(pick);
    }
  };

  useEffect(() => {
    if (!open) return;
    const node = listRef.current?.querySelectorAll(".ws-dd-opt")[focusIdx];
    node?.scrollIntoView({ block: "nearest" });
  }, [focusIdx, open]);

  return (
    <label className="ws-select ws-select--custom" ref={wrapRef}>
      <span>{label}</span>

      <button
        type="button"
        className="ws-dd-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKey}
      >
        {value}
        <svg className="chev" width="14" height="14" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
      </button>

      {open && (
        <ul
          className="ws-dd"
          role="listbox"
          tabIndex={-1}
          ref={listRef}
          onKeyDown={onListKey}
        >
          {options.map((opt, idx) => {
            const active = value === opt;
            const focus = idx === focusIdx;
            return (
              <li
                key={opt}
                role="option"
                aria-selected={active}
                className={`ws-dd-opt ${active ? "is-active" : ""} ${focus ? "is-focus" : ""}`}
                onMouseDown={(e)=> e.preventDefault()}
                onClick={()=> commit(opt)}
              >
                {opt}
              </li>
            );
          })}
        </ul>
      )}
    </label>
  );
}

/* ---------- Agent Card ---------- */
function AgentCard({ agent, onRemove, onEdit }) {
  return (
    <div className="ws-card agent">
      <div className="ws-agent-head">
        <div className="ws-avatar">
          <SvgIcon name={agent.icon} />
        </div>
        <div className="ws-agent-title">
          <div className="ws-name">{agent.name}</div>
          <div className="ws-tag">{agent.mbti}</div>
        </div>
        <div style={{marginLeft:"auto", display:"flex", gap:8}}>
          <button className="ws-icon-btn" title="Edit agent" onClick={() => onEdit(agent)}>✎</button>
          <button className="ws-icon-btn ghost" title="Remove agent" onClick={() => onRemove(agent.id)}>✕</button>
        </div>
      </div>

      <div className="ws-kv">
        <div><div className="ws-k">Constraints</div><div className="ws-v">{agent.constraints || "—"}</div></div>
        <div><div className="ws-k">Biography</div><div className="ws-v">{agent.bio || "—"}</div></div>
        <div><div className="ws-k">Quirks</div><div className="ws-v">{agent.quirks || "—"}</div></div>
        <div><div className="ws-k">Motivation</div><div className="ws-v">{agent.motivation || "—"}</div></div>
      </div>
    </div>
  );
}

function AgentModal({ open, mode = "add", initial, onClose, onSubmit, usedIcons }) {
  const [form, setForm] = useState(
    initial || { name:"", mbti:"INTJ", bio:"", constraints:"", quirks:"", motivation:"" }
  );

  // lock page scroll while open
  useEffect(() => {
   if (!open) return;
   lockScroll();
   return () => unlockScroll();
  }, [open]);

  // hydrate/reset form when opening
  useEffect(() => {
    if (!open) return;
    setForm(initial || { name:"", mbti:"INTJ", bio:"", constraints:"", quirks:"", motivation:"" });
  }, [open, initial]);

  const mbtiOpts = ["INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP","ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"];
  const handle    = (e) => setForm((f)=>({ ...f, [e.target.name]: e.target.value }));

  const pickIcon = () => {
    const pool = ICONS.filter((ic) => !usedIcons.includes(ic));
    return pool[Math.floor(Math.random()*pool.length)] || "brain";
  };

  const submit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (mode === "add" && !payload.icon) payload.icon = pickIcon();
    onSubmit(payload);
  };

  if (!open) return null;

  // re-mount the backdrop on first theme toggle (fixes “changes on 2nd switch”)
  const theme =
    document.documentElement.getAttribute("data-theme") ||
    document.body.getAttribute("data-theme") || "light";

  return createPortal(
    <>
      {/* sidebar-safe blur/dim that *excludes* the sidebar */}
      <div
        className="ws-backdrop-content"
        data-theme={theme}
        key={theme}
        onClick={onClose}
      />

      {/* centered over *content* area; responsive bounds inline to avoid touching CSS */}
      <div
        className="ws-card ws-modal ws-modal-solid ws-center-over-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="agentEditTitle"
        style={{
          /* Same responsive caps the rel dialog uses:
             - width never exceeds available inline space (viewport - sidebar - gutter)
             - height clamps and scrolls internally on small viewports */
          width:     "min(clamp(260px, 64svw, 560px), var(--dlg-max-inline))",
          maxWidth:  "var(--dlg-max-inline)",
          maxHeight: "min(78svh, 580px)",
          overflow:  "auto",
          zIndex:    600
        }}
      >
        <h3 id="agentEditTitle">{mode === "add" ? "Add Agent" : "Edit Agent"}</h3>

        <form className="ws-form" onSubmit={submit}>
          <div className="ws-form-row two">
            <label className="is-name">
              <span>Name</span>
              <input name="name" value={form.name} onChange={handle} required />
            </label>

            <label className="is-mbti">
              <span>Personality (MBTI)</span>
              <select className="mbti-select" name="mbti" value={form.mbti} onChange={handle}>
                {mbtiOpts.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
          </div>

          <label>
            <span>Biography</span>
            <textarea rows={3} name="bio" value={form.bio} onChange={handle} />
          </label>
          <label>
            <span>Constraints</span>
            <textarea rows={2} name="constraints" value={form.constraints} onChange={handle} />
          </label>
          <label>
            <span>Quirks</span>
            <textarea rows={2} name="quirks" value={form.quirks} onChange={handle} />
          </label>
          <label>
            <span>Motivation</span>
            <textarea rows={2} name="motivation" value={form.motivation} onChange={handle} />
          </label>

          <div className="ws-modal-actions">
            <button type="button" className="ws-btn ghost" onClick={onClose}>Cancel</button>
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


function AgentViewModal({ open, agent, onClose }) {
  
   React.useEffect(() => {
    if (!(open && agent)) return;
    lockScroll();
   return () => unlockScroll();
 }, [open, agent]);

  if (!open || !agent) return null;
  // CHANGED: read theme to force a backdrop re-mount on first toggle
  const theme =
    document.documentElement.getAttribute("data-theme") ||
    document.body.getAttribute("data-theme") || "light";

  return createPortal(
    <>
      {/* CHANGED: use themed, keyed backdrop (no inline color/blur here) */}
      <div
        className="ws-backdrop-content"
        data-theme={theme}   // CHANGED
        key={theme}          // CHANGED
        onClick={onClose}
      />

      {/* Centered card; surface colors come from CSS (.ws-agent-view) */}
      <div
        className="ws-agent-view rel-node-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="agentViewTitle"
        style={{
          position: "fixed",
          left: "calc(var(--sidebar-w) + (100svw - var(--sidebar-w))/2)",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width:
            "min(clamp(320px, 68svw, 720px), calc(100svw - var(--sidebar-w) - var(--dlg-gutter-l,16px) - var(--dlg-gutter-r,24px)))",
          maxHeight: "calc(100svh - var(--dlg-top-gap,16px) - 24px)",
          overflow: "auto",
          zIndex: 600,
          // CHANGED: remove inline background/backdropFilter; CSS handles theme
          borderRadius: 18,
          boxShadow: "0 22px 60px rgba(6,10,20,.28)"
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close" className="rel-close"
          style={{
            position: "absolute",
            right: 12,
            top: 12,
            width: 32,
            height: 32,
            borderRadius: 10,
            display: "grid",
            placeItems: "center",
            background: "rgba(0,0,0,.05)",
            border: "none",
            cursor: "pointer"
          }}
        >
          ✕
        </button>

        <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              // CHANGED: icon chip follows theme via currentColor
              color: "inherit",
              background: "rgba(0,0,0,.06)"
            }}
          >
            <SvgIcon name={agent.icon || "robot"} size={22} />
          </div>
          <div>
            <h3 id="agentViewTitle" style={{ margin: 0 }}>{agent.name}</h3>
            {agent.mbti && <div style={{ opacity: .7, fontSize: ".9em" }}>{agent.mbti}</div>}
          </div>
        </header>

        <div style={{ fontSize: "1rem", lineHeight: 1.55 }}>
          {agent.bio &&         <p style={{ margin: "10px 0" }}><b>Bio:</b> {agent.bio}</p>}
          {agent.constraints && <p style={{ margin: "10px 0" }}><b>Constraints:</b> {agent.constraints}</p>}
          {agent.quirks &&      <p style={{ margin: "10px 0" }}><b>Quirks:</b> {agent.quirks}</p>}
          {agent.motivation &&  <p style={{ margin: "10px 0" }}><b>Motivation:</b> {agent.motivation}</p>}
        </div>
      </div>
    </>,
    document.body
  );
}





/* ---------- Sidebar (expandable) ---------- */
function Sidebar({
  expanded,
  onToggleExpand,
  theme,
  onToggleTheme,
  existingAgents,
  onPickExisting,
  selectedIds
}) {




  const [query, setQuery] = React.useState("");
  const [searchType, setSearchType] = React.useState("all");
  const [viewAgent, setViewAgent] = React.useState(null); // for the View modal

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return existingAgents;
    const read = (ag) => {
      switch (searchType) {
        case "name":        return ag.name;
        case "mbti":        return ag.mbti;
        case "bio":         return ag.bio;
        case "constraints": return ag.constraints;
        case "quirks":      return ag.quirks;
        case "motivation":  return ag.motivation;
        default:
          return [ag.name, ag.mbti, ag.bio, ag.constraints, ag.quirks, ag.motivation].join(" ");
      }
    };
    return existingAgents.filter((ag) => (read(ag) || "").toLowerCase().includes(q));
  }, [existingAgents, query, searchType]);

React.useEffect(() => {
   if (!viewAgent) {
    // in case a lock slipped through
     const el = document.documentElement;
     el.style.overflow = "";
     delete el.dataset.prevOverflow;
   }
 }, [viewAgent]);

  // Make sure this lives in Workstation.jsx (top level of the page/component)
React.useEffect(() => {
  const root = document.documentElement;
  const side = document.querySelector('.ws-sidebar');
  if (!side) return;

  const setW = () => {
    const w = Math.max(0, Math.round(side.getBoundingClientRect().width));
    root.style.setProperty('--sidebar-w', `${w}px`);
  };

  setW();                                      // initialize on first load
  const ro = new ResizeObserver(setW);         // track width changes
  ro.observe(side);
  window.addEventListener('resize', setW);     // safety for layout shifts

  return () => { ro.disconnect(); window.removeEventListener('resize', setW); };
}, [expanded /* <- whatever state toggles your sidebar open/closed */]);


  return (
    <aside className={`ws-sidebar ${expanded ? "expanded" : ""}`}>
      <div className="ws-sidebar-scroll">
        {/* top row */}
        <div className="ws-side-top">
          <div className="ws-brand">
            <span className="logo"><img src="logo.png" alt="" /></span>
            {expanded && <span className="brand-text">Workstation</span>}
          </div>
          <button className="ws-toggle-exp" onClick={onToggleExpand}>{expanded ? "«" : "»"}</button>
        </div>

        {/* Search (expanded only) */}
        {expanded && (
          <div className="ws-searchbar">
            <div className="ws-search">
              <span className="ico"><SvgIcon name="search" size={16} /></span>
              <input
                type="text"
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
                placeholder="Search agents..."
                aria-label="Search agents"
              />
              {query && (
                <button className="ws-search-clear" onClick={()=>setQuery("")} aria-label="Clear search">Ã—</button>
              )}
            </div>

            <select
              className="ws-search-type"
              value={searchType}
              onChange={(e)=>setSearchType(e.target.value)}
              aria-label="Search type"
            >
              <option value="all">All fields</option>
              <option value="name">Name</option>
              <option value="mbti">MBTI</option>
              <option value="bio">Biography</option>
              <option value="constraints">Constraints</option>
              <option value="quirks">Quirks</option>
              <option value="motivation">Motivation</option>
            </select>
          </div>
        )}

       {/* Agents list (scrolls) */}
<div className="ws-side-section agents">
  {expanded && <div className="ws-sec-title">Agents</div>}
  <ul className="ws-agent-list">
    {filtered.map((ag) => {
      const inUse = selectedIds?.includes(ag.id);

      return (
        <li
          key={ag.id}
          className={`ws-agent-pill ${inUse ? "disabled" : ""}`}
          // ✅ KEEP your row onClick. If you already have a handler, it will be used.
          //    Otherwise it falls back to adding (same as before).
          onClick={() => {
            if (typeof onAgentClick === "function") return onAgentClick(ag);
            if (!inUse) onPickExisting(ag);
          }}
        >
          <span className="ico avatar"><SvgIcon name="robot" /></span>
          {expanded && <span className="lbl">{ag.name}</span>}

          {expanded && (
            <span className="ws-agent-actions">
              <button
                type="button"
                className="ws-mini-btn"
                disabled={inUse}
                // ⛔ stop bubbling so row onClick doesn’t fire
                onClick={(e) => { e.stopPropagation(); if (!inUse) onPickExisting(ag); }}
                title={inUse ? "Already added" : "Add to board"}
              >
                Add
              </button>
              <button
                type="button"
                className="ws-mini-btn ghost"
                onClick={(e) => { e.stopPropagation(); setViewAgent(ag); }}
                title="View details"
              >
                View
              </button>
            </span>
          )}
        </li>
      );
    })}
  </ul>
</div>

        {/* Theme + bottom nav */}
        <div className="ws-side-spacer" />
        <div className="ws-side-section">
          <button
            className={`ws-theme-switch ${theme}`}
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            type="button"
          />

          <a className="ws-row-btn" href="#">
            <span className="ico"><SvgIcon name="clock" /></span>
            {expanded && <span>History</span>}
          </a>
          <a className="ws-row-btn" href="#">
            <span className="ico"><SvgIcon name="user" /></span>
            {expanded && <span>Profile</span>}
          </a>
          <a className="ws-row-btn" href="#">
            <span className="ico"><SvgIcon name="logout" /></span>
            {expanded && <span>Login / Logout</span>}
          </a>
        </div>
      </div>

      {/* View modal lives at the end of the sidebar */}
      <AgentViewModal open={!!viewAgent} agent={viewAgent} onClose={()=>setViewAgent(null)} />
    </aside>
  );
}





/* ---------- Page ---------- */
export default function WorkstationPage() {
  const [theme, setTheme] = useState(getStoredTheme());
  const [expanded, setExpanded] = useState(true);
  const [selected, setSelected] = useState([]);         // selected agents on the board
  const [openModal, setOpenModal] = useState(false);
  const [editModal, setEditModal] = useState(null);     // the agent being edited (or null)
  const [stage, setStage] = useState("cards"); // "cards" | "graph"
  // Always restore scroll when this screen unmounts (defensive)
React.useEffect(() => {
  return () => { document.documentElement.style.overflow = ""; };
}, []);

// Anywhere inside WorkstationPage component
React.useEffect(() => {
  // we know about add/edit modals here
  const nothingOpen = !openModal && !editModal;
  if (nothingOpen && __scrollLocks === 0) {
    const el = document.documentElement;
    el.style.overflow = "";
    delete el.dataset.prevOverflow;
  }
}, [openModal, editModal]);

React.useEffect(() => {
  const root = document.documentElement;
  if (stage === "scenario") root.style.setProperty('--sidebar-w', '0px');
}, [stage]);


  useEffect(() => { applyTheme(theme); }, [theme]);

  const usedIconNames = useMemo(
    () => selected.map((a) => a.icon).filter(Boolean),
    [selected]
  );

  const pickUniqueIcon = () => {
    const pool = ICONS.filter((n) => !usedIconNames.includes(n));
    return pool[Math.floor(Math.random() * pool.length)] || "brain";
  };

  const handlePickExisting = (ag) => {
    if (selected.length >= 5 || selected.find((x) => x.id === ag.id)) return;
    setSelected((s) => [...s, { ...ag, icon: pickUniqueIcon() }]);
  };

  const handleAdd = (input) => {
    if (selected.length >= 5) return;
    const id = "u" + Math.random().toString(36).slice(2, 8);
    setSelected((s) => [...s, { ...input, id, icon: input.icon || pickUniqueIcon() }]);
    setOpenModal(false);
  };

  const handleEditOpen = (ag) => setEditModal(ag);
  const handleEditSave = (payload) => {
    setSelected((s) => s.map((a) => (a.id === payload.id ? { ...a, ...payload } : a)));
    setEditModal(null);
  };

  const remove = (id) => setSelected((s) => s.filter((a) => a.id !== id));

  return (
      <div className={`app ws-page ${stage === "scenario" ? "no-sidebar" : ""}`}>
    {/* Sidebar — hide on Scenario */}
    {stage !== "scenario" && (
      <Sidebar
        expanded={expanded}
        onToggleExpand={() => setExpanded((e) => !e)}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        existingAgents={EXISTING}
        onPickExisting={handlePickExisting}
        selectedIds={selected.map((a) => a.id)}
      />
    )}

    {/* Main */}
    <main className="ws-main">
      {/* Top header — not shown on Scenario */}
      {stage !== "scenario" && (
        <header className="ws-header">
          <h1>Agents</h1>
          <div className="ws-head-actions">
            <div className="ws-count">Max 5 agents • {selected.length}/5</div>
            <button
              className="ws-btn primary"
              onClick={() => setOpenModal(true)}
              disabled={selected.length >= 5}
            >
              + Add Agent
            </button>
          </div>
        </header>
      )}

      {/* Page body */}
      <section className="ws-board">
        {stage === "cards" && (
          <>
            <div className="ws-board-head">
              <h3>Your team</h3>
              <span className="ws-count">{selected.length}/5</span>
            </div>

            <div className="ws-grid">
              {selected.map((ag) => (
                <AgentCard key={ag.id} agent={ag} onRemove={remove} onEdit={handleEditOpen} />
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
                onClick={() => setStage("graph")}
                disabled={selected.length < 2}
              >
                Next
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
            theme={document.documentElement.getAttribute("data-theme") || "dark"}
            onBackToWorkstation={() => setStage("cards")}
            onBackToGraph={() => setStage("graph")}
            selectedAgents={selected}
          />
        )}
      </section>
  

      </main>

      {/* Add modal */}
      <AgentModal
        open={openModal}
        mode="add"
        onClose={() => setOpenModal(false)}
        onSubmit={handleAdd}
        usedIcons={usedIconNames}
      />

      {/* Edit modal */}
      <AgentModal
        open={!!editModal}
        mode="edit"
        initial={editModal || undefined}
        onClose={() => setEditModal(null)}
        onSubmit={handleEditSave}
        usedIcons={usedIconNames}
      />
    </div>




    
  );
}

function RelationshipGraph({ agents, onBack, onNext }) {
  const svgRef = React.useRef(null);
  const [openEdge, setOpenEdge] = React.useState(null);
  const [weights, setWeights]   = React.useState(() => ({})); // "a|b" -> number
  const [nodeDialog, setNodeDialog] = React.useState(null);   // click modal
// top of Workstation page component
const [stage, setStage] = useState("cards"); // "cards" | "graph" | "scenario"

  // --- Layout (same coordinates as your current version) ---
  const CX = 520, CY = 300;
  const R  = 260;

  const layout = React.useMemo(() => {
    const n = Math.max(agents.length, 1);
    return agents.map((ag, i) => {
      const t = (-Math.PI / 2) + (i * 2 * Math.PI / n);
      return { id: ag.id, x: CX + R * Math.cos(t), y: CY + R * Math.sin(t) };
    });
  }, [agents]);

  // Always restore scroll when this screen unmounts (defensive)
React.useEffect(() => {
  return () => { document.documentElement.style.overflow = ""; };
}, []);


  // --- Publish live sidebar width -> CSS var (for dialog centering) ---
  React.useEffect(() => {
    const root = document.documentElement;
    const side = document.querySelector('.ws-sidebar');
    if (!side) {
      root.style.setProperty('--sidebar-w', '0px');
      return;
    }
    const setW = (w) => root.style.setProperty('--sidebar-w', `${Math.max(0, Math.floor(w))}px`);
    setW(side.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => setW(entry.contentRect.width));
    ro.observe(side);
    return () => ro.disconnect();
  }, []);

  const posOf = (id) => layout.find(p => p.id === id) || { x: CX, y: CY };

  const edges = React.useMemo(() => {
    const out = [];
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) out.push({ a: agents[i].id, b: agents[j].id });
    }
    return out;
  }, [agents]);

  const key  = (a,b) => `${a}|${b}`;
  const getW = (a,b) => weights[key(a,b)] ?? 0;
  const setW = (a,b,v) => setWeights(s => ({ ...s, [key(a,b)]: v }));

  // Label side (unchanged)
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

  // Body scroll lock while a dialog is open
  React.useEffect(() => {
    const hasDialog = !!nodeDialog || !!openEdge;
    if (!hasDialog) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = prev; };
  }, [nodeDialog, openEdge]);

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
        {/* Edges + thick hit lines */}
        {edges.map(({ a, b }) => {
          const A = posOf(a), B = posOf(b);
          return (
            <g key={`e-${a}-${b}`}>
              <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} className="rel-edge" />
              <line
                x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                className="rel-edge-hit"
                onClick={(e) => { e.stopPropagation(); setOpenEdge({ a, b }); }}
              />
            </g>
          );
        })}

        {/* Nodes + labels (click to open centered details) */}
        {layout.map(({ id, x, y }) => {
          const ag   = agents.find(a => a.id === id) || {};
          const side = labelSideFor(x, y);
          const NODE_R = 34;
          const LABEL_GAP = 27;
          const dx = side === "left" ? -(NODE_R + LABEL_GAP) : (NODE_R + LABEL_GAP);
          const anchor = side === "left" ? "end" : "start";
          const labelY = y + 6;

          return (
            <g key={id}>
              {/* Big invisible hit target */}
              <circle
                cx={x} cy={y} r="50"
                className="rel-node-hit"
                onClick={() => setNodeDialog(ag)}
              />
              {/* Visible node */}
              <circle cx={x} cy={y} r={NODE_R} className="rel-node" onClick={() => setNodeDialog(ag)} />
              {ag.icon ? (
                <g className="rel-node-icon" transform={`translate(${x - 12}, ${y - 12})`}>
                  <SvgIcon name={ag.icon} size={24} />
                </g>
              ) : (
                <text x={x} y={y + 7} className="rel-emoji" textAnchor="middle">🤖</text>
              )}
              <text x={x + dx} y={labelY} className={`rel-label ${side}`} textAnchor={anchor}>
                {ag.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Node Details (centered over content area) */}
      {nodeDialog && (
        <>
          <div className="rel-backdrop" onClick={() => setNodeDialog(null)} />
          <div className="rel-node-dialog rel-center-over-content" role="dialog" aria-modal="true" aria-labelledby="nodeDlgTitle">
            <button className="rel-close" onClick={() => setNodeDialog(null)} aria-label="Close">✕</button>

            <header className="rel-node-head">
              <div className="rel-node-avatar">
                <SvgIcon name={nodeDialog.icon || 'robot'} size={22} />
              </div>
              <div className="rel-node-title">
                <h3 id="nodeDlgTitle">{nodeDialog.name}</h3>
                {nodeDialog.mbti && <div className="rel-node-sub">{nodeDialog.mbti}</div>}
              </div>
            </header>

            <div className="rel-node-body">
              {nodeDialog.bio && <p><b>Bio:</b> {nodeDialog.bio}</p>}
              {nodeDialog.constraints && <p><b>Constraints:</b> {nodeDialog.constraints}</p>}
              {nodeDialog.quirks && <p><b>Quirks:</b> {nodeDialog.quirks}</p>}
              {nodeDialog.motivation && <p><b>Motivation:</b> {nodeDialog.motivation}</p>}
            </div>
          </div>
        </>
      )}

      {/* Edge Weights panel (also centered over content area) */}
      {openEdge && (
        <>
          <div className="rel-backdrop" onClick={() => setOpenEdge(null)} />
          <div className="rel-panel rel-center-over-content" role="dialog" aria-modal="true">
            <button className="rel-close" onClick={() => setOpenEdge(null)} aria-label="Close panel">✕</button>
            <div className="rel-panel-title">WEIGHT</div>
            
            {/* Direction A -> B */}
            {/* TOP: A -> B weight */}
            <div className="rel-weight">
              <span className="rel-chip">WEIGHT</span>
              <input
                className="rel-num"
                type="number"
                inputMode="numeric"
                min="-100"
                max="100"
                step="1"
                value={getW(openEdge.a, openEdge.b)}
                onChange={(e)=>setW(openEdge.a, openEdge.b, Number(e.target.value || 0))}
              />
            </div>

            {/* CENTER: two directional arrows between endpoints */}
            <div className="rel-arrows">
              <div className="rel-dir">
                <span className="rel-end">{agents.find(a => a.id === openEdge.a)?.name}</span>
                <span className="rel-line rel-to-right" aria-hidden />
                <span className="rel-end">{agents.find(a => a.id === openEdge.b)?.name}</span>
              </div>
              <div className="rel-dir">
                <span className="rel-end">{agents.find(a => a.id === openEdge.b)?.name}</span>
                <span className="rel-line rel-to-left" aria-hidden />
                <span className="rel-end">{agents.find(a => a.id === openEdge.a)?.name}</span>
              </div>
            </div>

            {/* BOTTOM: B -> A weight */}
            <div className="rel-weight">
              <span className="rel-chip">WEIGHT</span>
              <input
                className="rel-num"
                type="number"
                inputMode="numeric"
                min="-100"
                max="100"
                step="1"
                value={getW(openEdge.b, openEdge.a)}
                onChange={(e)=>setW(openEdge.b, openEdge.a, Number(e.target.value || 0))}
              />
            </div>


          </div>
        </>
      )}

      {/* Sticky actions that follow horizontal + vertical scroll of the graph */}
      <div className="rel-affix">
        <div className="rel-affix-inner">
          <button className="ws-btn ghost" onClick={onBack}>Back</button>
          <button className="ws-btn primary" onClick={onNext}>Next</button>
        </div>
      </div>

    </div>
  );
}





















function ScenarioPage({ theme, onBackToWorkstation, onBackToGraph, selectedAgents }) {
  // ---------------- state ----------------
  const [scenarioText, setScenarioText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [logs, setLogs] = React.useState([]);
  const [nodes, setNodes] = React.useState([]);            // [{id,name,icon,x,y}]
  const [hover, setHover] = React.useState(null);          // {x,y,text,transform}
  const boundsRef = React.useRef(null);

  // local theme label that always flips correctly
  const [t, setT] = React.useState(
    () => document.documentElement.getAttribute("data-theme") || "dark"
  );
  const toggleTheme = () => {
    const next = t === "dark" ? "light" : "dark";
    if (typeof applyTheme === "function") {
      applyTheme(next);
    } else {
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch {}
    }
    setT(next);
  };

  // ---------------- helpers ----------------
  const hasOutput = loading || logs.length > 0;

  const bubbleTextFor = (name) => {
    const feels = ["curious","focused","skeptical","excited","confident","cautious"];
    const acts  = ["sketching ideas","testing a hunch","pairing on a fix","checking signals","writing a note"];
    return `${name} feels ${feels[Math.floor(Math.random()*feels.length)]} and is ${acts[Math.floor(Math.random()*acts.length)]}.`;
  };

  // Flip bubble to avoid clipping (top/bottom/left/right)
  const bubbleFor = (nx, ny) => {
    const el = boundsRef.current;
    if (!el) return { x: nx, y: ny, transform: "translate(-50%, -110%)" };

    const W = el.clientWidth, H = el.clientHeight;
    const pad = 12, edge = 96;

    let x = Math.max(pad, Math.min(W - pad, nx));
    let y = Math.max(pad, Math.min(H - pad, ny));

    const nearTop    = y < edge;
    const nearBottom = y > H - edge;
    const nearLeft   = x < edge;
    const nearRight  = x > W - edge;

    let tX = -50, tY = -110;           // default: above, centered
    if (nearTop)    tY =  10;          // show below
    if (nearBottom) tY = -110;         // show above
    if (nearLeft)   tX =   0;          // nudge right
    if (nearRight)  tX = -100;         // nudge left

    return { x, y, transform: `translate(${tX}%, ${tY}%)` };
  };

  // ---------------- node layout: always visible, evenly spaced ----------------
  const layoutNodes = React.useCallback(() => {
    const el = boundsRef.current;
    if (!el) return;

    const W = el.clientWidth;
    const H = el.clientHeight;

    const PAD = 72;
    const n = Math.max(1, selectedAgents.length);
    const cx = W / 2;
    const cy = H / 2;
    const R  = Math.max(40, Math.min(W, H) / 2 - PAD);

    if (n === 1) {
      const ag = selectedAgents[0];
      setNodes([{ id: ag.id, name: ag.name, icon: ag.icon || "user", x: Math.round(cx), y: Math.round(cy) }]);
      return;
    }

    const pts = selectedAgents.map((ag, i) => {
      const t = (-Math.PI / 2) + (i * 2 * Math.PI / n);
      const x = cx + R * Math.cos(t);
      const y = cy + R * Math.sin(t);
      const xC = Math.max(PAD, Math.min(W - PAD, x));
      const yC = Math.max(PAD, Math.min(H - PAD, y));
      return { id: ag.id, name: ag.name, icon: ag.icon || "user", x: Math.round(xC), y: Math.round(yC) };
    });
    setNodes(pts);
  }, [selectedAgents]);

  React.useEffect(() => {
    layoutNodes();
    const el = boundsRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => layoutNodes());
    ro.observe(el);
    return () => ro.disconnect();
  }, [layoutNodes]);

  // ---------------- fake generation ----------------
  const genLine = (ag, i) => {
    const acts = [
      "proposes a quick prototype. “Thin slice first, then iterate.”",
      "is analyzing trade-offs. “Define ‘done’ clearly.”",
      "calls out a risky assumption.",
      "aligns the team on success metrics.",
      "shares a concern about scope."
    ];
    return { id:`${ag.id}-${i}`, who:ag.name, turn:i+1, text:`${ag.name} ${acts[Math.floor(Math.random()*acts.length)]}` };
  };

  const onGenerate = () => {
    setLoading(true); setLogs([]); setHover(null);
    setTimeout(() => {
      const L = [];
      const total = Math.max(6, selectedAgents.length * 2);
      for (let i = 0; i < total; i++) {
        const ag = selectedAgents[Math.floor(Math.random() * selectedAgents.length)];
        L.push(genLine(ag, i));
      }
      setLogs(L); setLoading(false);
    }, 1600);
  };

  // ---------------- render ----------------
  return (
    <div className="sc-page">
      {/* NAV */}
      <header className="sc-nav ws-card sc-nav-pretty">
        <div className="sc-brand">
          <div className="ws-brand">
            <span className="logo"><img src="logo.png" alt="" /></span>
            
          </div>
          <div className="sc-divider" />
          <nav className="sc-tabs">
            <button className="sc-tab" onClick={onBackToWorkstation}>Workstation</button>
            <button className="sc-tab" onClick={onBackToGraph}>Graph</button>
            <button className="sc-tab ghost">History</button>
          </nav>
        </div>

        <div className="right sc-right">
          <button
          type="button"
          className={`ws-theme-switch ${t}`}   // <- same class used in the sidebar
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
            onChange={(e)=>setScenarioText(e.target.value)}
            placeholder="Describe the situation you want to simulate…"
          />
          <button className="ws-btn primary" onClick={onGenerate}>Generate</button>
        </label>
      </section>

      {/* MAIN grid: row1 canvas+log, row2 roster (spanning both columns) */}
      <section className={`sc-main ${hasOutput ? "has-output" : ""}`}>
        {/* Canvas */}
        <div className={`sc-canvas sc-grid ws-card ${hasOutput ? "post" : "pre"}`} ref={boundsRef}>
          {loading && (
            <div className="sc-center"><div className="sc-spinner big" /></div>
          )}

          {!loading && nodes.map((n) => (
            <div
              key={n.id}
              className="sc-node"
              style={{ left: n.x, top: n.y }}
              onMouseEnter={() => {
                const p = bubbleFor(n.x, n.y);
                setHover({ x: p.x, y: p.y, text: bubbleTextFor(n.name), transform: p.transform });
              }}
              onMouseLeave={() => setHover(null)}
            >
              <div className="sc-chip"><SvgIcon name={n.icon} size={18} /></div>
              <div className="sc-name">{n.name}</div>
            </div>
          ))}

          {hover && (
            <div className="sc-bubble" style={{ left: hover.x, top: hover.y, transform: hover.transform }}>
              {hover.text}
            </div>
          )}
        </div>

        {/* Log (compact + pretty scroll) */}
        <aside className="sc-log ws-card compact">
          <div className="sc-log-head">Simulation Log</div>
          {loading ? (
            <div className="sc-center"><div className="sc-spinner" /></div>
          ) : (
            <div className="sc-log-list">
              {logs.map(item => (
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

        {/* Roster (second row, spans both columns) */}
        <div className="sc-roster">
          {selectedAgents.map(ag => (
            <div className="agent-card-wrap" key={ag.id}>
              <AgentCard agent={ag} onRemove={()=>{}} onEdit={()=>{}} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
