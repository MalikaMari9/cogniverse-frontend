import React from "react";
import { fmtDate,StatusPill } from "./helpers";

export default function AnnouncementTable({Icon}) {
  // Seed (swap to your API fetch later)
  const seed = [
    { announcementID: 1, title: "Planned maintenance", content: "We will be upgrading databases tonight 00:00–01:00 UTC. Expect brief read-only windows.", created_by: "system", status: "active", created_at: "2025-06-01 09:00", updated_at: "2025-06-01 09:10", announcement_time: "2025-06-02 00:00" },
    { announcementID: 2, title: "New features",        content: "Access Control got CSV export and sorting. Try it under Admin → Access Control.", created_by: "nova",   status: "active", created_at: "2025-06-03 12:12", updated_at: "2025-06-03 12:12", announcement_time: "2025-06-05 09:00" },
    { announcementID: 3, title: "Bug fix",              content: "Resolved login throttling glitch for VPN users.", created_by: "orion", status: "inactive", created_at: "2025-05-22 16:30", updated_at: "2025-05-23 08:02", announcement_time: "2025-05-24 10:00" },
  ];

  const [rows, setRows] = React.useState(seed);
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [sortBy, setSortBy] = React.useState("created_at");
  const [sortDir, setSortDir] = React.useState("desc");
  const [page, setPage] = React.useState(1);
  const pageSize = 8;

  const [modal, setModal] = React.useState({ open:false, data:null });
  const [view,  setView]  = React.useState({ open:false, data:null });

  // Helpers
  const toggleSort = (key) => {
    if (sortBy === key) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(key); setSortDir("asc"); }
  };
  const openCreate = () => setModal({ open:true, data:null });
  const openEdit   = (r) => setModal({ open:true, data:r });
  const closeModal = () => setModal({ open:false, data:null });
  const openView   = (r) => setView({ open:true, data:r });
  const closeView  = () => setView({ open:false, data:null });

  const saveRow = (form) => {
    setRows(old => {
      if (form.announcementID) {
        const i = old.findIndex(x => x.announcementID === form.announcementID);
        const copy = old.slice(); copy[i] = form; return copy;
      }
      return [{ ...form, announcementID: Math.floor(Math.random()*1e6) }, ...old];
    });
    closeModal();
  };
  const delRow = (id) => setRows(old => old.filter(r => r.announcementID !== id));

  const downloadCSV = (list) => {
    const header = ["announcementID","title","content","created_by","status","created_at","updated_at","announcement_time"];
    const esc = v => `"${String(v ?? "").replace(/"/g,'""')}"`;
    const body = list.map(r => header.map(h => esc(r[h])).join(",")).join("\n");
    const csv  = header.join(",") + "\n" + body;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "announcements.csv";
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  // Filter
  const filtered = rows.filter(r => {
    if (q) {
      const hay = `${r.title} ${r.content} ${r.created_by} ${r.status}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    if (status !== "all" && r.status !== status) return false;
    if (from && new Date(r.announcement_time) < new Date(from)) return false;
    if (to   && new Date(r.announcement_time) > new Date(to))   return false;
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    const A = a[sortBy], B = b[sortBy];
    if (["created_at","updated_at","announcement_time"].includes(sortBy)) {
      return (new Date(A) - new Date(B)) * dir;
    }
    if (typeof A === "number" && typeof B === "number") return (A - B) * dir;
    return String(A).localeCompare(String(B)) * dir;
  });

  // Page
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pages);
  const pageRows = sorted.slice((safePage-1)*pageSize, safePage*pageSize);

  return (
    <div className="adm-card">
      <header className="adm-head">
        <div className="adm-title">Announcements</div>
        <div className="adm-tools">
          <input className="adm-input" placeholder="Search title/content…" value={q} onChange={(e)=>{ setQ(e.target.value); setPage(1); }} />
          <select className="adm-select" value={status} onChange={(e)=>{ setStatus(e.target.value); setPage(1); }}>
            <option value="all">All status</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
          <input className="adm-input" type="date" value={from} onChange={(e)=>{ setFrom(e.target.value); setPage(1); }} />
          <span className="adm-date-sep">–</span>
          <input className="adm-input" type="date" value={to} onChange={(e)=>{ setTo(e.target.value); setPage(1); }} />
          <button className="ws-btn ghost" onClick={()=>downloadCSV(sorted)}>Export CSV</button>
          <button className="ws-btn primary" onClick={openCreate}><Icon name="plus" /> New</button>
        </div>
      </header>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th onClick={()=>toggleSort("announcement_time")} aria-sort={sortBy==="announcement_time"?sortDir:"none"}>announcement_time</th>
              <th onClick={()=>toggleSort("title")}             aria-sort={sortBy==="title"?sortDir:"none"}>title</th>
              <th>content</th>
              <th onClick={()=>toggleSort("created_by")}        aria-sort={sortBy==="created_by"?sortDir:"none"}>created_by</th>
              <th onClick={()=>toggleSort("status")}            aria-sort={sortBy==="status"?sortDir:"none"}>status</th>
              <th onClick={()=>toggleSort("created_at")}        aria-sort={sortBy==="created_at"?sortDir:"none"}>created_at</th>
              <th onClick={()=>toggleSort("updated_at")}        aria-sort={sortBy==="updated_at"?sortDir:"none"}>updated_at</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr><td colSpan={8}><div className="adm-empty">No announcements</div></td></tr>
            ) : pageRows.map(r => (
              <tr key={r.announcementID}>
                <td data-label="announcement_time" className="mono">{fmtDate(r.announcement_time)}</td>
                <td data-label="title">
                  <button className="ws-btn ghost" title="View" onClick={()=>openView(r)}>{r.title}</button>
                </td>
                <td data-label="content" className="truncate">{r.content}</td>
                <td data-label="created_by">{r.created_by}</td>
                <td data-label="status"><span className={`ad-chip ${r.status}`}>{r.status}</span></td>
                <td data-label="created_at" className="mono">{r.created_at}</td>
                <td data-label="updated_at" className="mono">{r.updated_at}</td>
                <td className="actions" data-label="actions">
                  <button className="ad-icon" title="Edit" onClick={()=>openEdit(r)}><Icon name="edit" /></button>
                  <button className="ad-icon danger" title="Delete" onClick={()=>delRow(r.announcementID)}><Icon name="trash" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="adm-foot">
        <div>Page {safePage}/{pages}</div>
        <div className="adm-pager">
          <button className="ws-btn ghost" disabled={safePage<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
          <button className="ws-btn ghost" disabled={safePage>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}>Next</button>
        </div>
      </footer>

      {/* Create/Edit */}
      <AnnouncementModal open={modal.open} initial={modal.data} onClose={closeModal} onSave={saveRow}/>
      {/* View full content */}
      <AnnouncementViewModal open={view.open} data={view.data} onClose={closeView}/>
    </div>
  );
}

/* --------- Modal for Create/Edit Announcement --------- */
function AnnouncementModal({ open, initial, onClose, onSave }) {
  const [form, setForm] = React.useState(initial || {});
  React.useEffect(()=> setForm(initial || {
    title: "", content: "", created_by: "", status: "active",
    created_at: new Date().toISOString().slice(0,16).replace("T"," "),
    updated_at: new Date().toISOString().slice(0,16).replace("T"," "),
    announcement_time: new Date().toISOString().slice(0,16)
  }), [initial, open]);

  const u = (k,v)=> setForm(s=>({ ...s, [k]: v, updated_at: new Date().toISOString().slice(0,16).replace("T"," ") }));

  if (!open) return null;
  const submit = (e) => { e.preventDefault(); if (!form.title) return; onSave(form); };

  return (
    <>
      <div className="ad-backdrop" onClick={onClose}/>
      <div className="ad-modal ws-card">
        <div className="ad-modal-head">
          <h3>{form.announcementID ? "Edit announcement" : "New announcement"}</h3>
          <button className="ad-icon" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form className="ad-form" onSubmit={submit}>
          <label>
            <span>title</span>
            <input value={form.title} onChange={(e)=>u("title", e.target.value)} required />
          </label>
          <label>
            <span>created_by</span>
            <input value={form.created_by} onChange={(e)=>u("created_by", e.target.value)} placeholder="username or system" />
          </label>
          <label className="row2">
            <span>content</span>
            <textarea rows={4} value={form.content} onChange={(e)=>u("content", e.target.value)} />
          </label>
          <label>
            <span>Status</span>
            <select value={form.status} onChange={(e)=>u("status", e.target.value)}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </label>
          <label>
            <span>announcement_time</span>
            <input type="datetime-local"
                   value={form.announcement_time?.slice(0,16) || ""}
                   onChange={(e)=>u("announcement_time", e.target.value)}
            />
          </label>

          <div className="ad-actions">
            <button type="button" className="ws-btn ghost" onClick={onClose}>Cancel</button>
            <button className="ws-btn primary" type="submit">Save</button>
          </div>
        </form>
      </div>
    </>
  );
}

/* --------- Read-only “View” modal for full content --------- */
function AnnouncementViewModal({ open, data, onClose }) {
  if (!open || !data) return null;
  return (
    <>
      <div className="ad-backdrop" onClick={onClose}/>
      <div className="ad-modal ws-card">
        <div className="ad-modal-head">
          <h3>{data.title}</h3>
          <button className="ad-icon" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div style={{display:"grid", gap:10, padding:"0 4px 6px"}}>
          <div><strong>announcement_time:</strong> {fmtDate(data.announcement_time)}</div>
          <div><strong>created_by:</strong> {data.created_by || "—"}</div>
          <div><strong>status:</strong> <span className={`ad-chip ${data.status}`}>{data.status}</span></div>
          <div><strong>content:</strong></div>
          <div className="adm-content">{data.content}</div>
          <div className="muted">created_at: {data.created_at} &nbsp;|&nbsp; updated_at: {data.updated_at}</div>
        </div>
      </div>
    </>
  );
}
