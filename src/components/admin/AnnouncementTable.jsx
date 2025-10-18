import React from "react";
import { fmtDate, StatusPill } from "./helpers";
import { 
  getAnnouncements, 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement 
} from "../../api/api";

export default function AnnouncementTable({ Icon }) {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [currentUser, setCurrentUser] = React.useState(null);
  
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [sortBy, setSortBy] = React.useState("created_at");
  const [sortDir, setSortDir] = React.useState("desc");
  const [page, setPage] = React.useState(1);
  const pageSize = 8;

  const [modal, setModal] = React.useState({ open: false, data: null });
  const [view, setView] = React.useState({ open: false, data: null });

  // Get current user info on component mount
  React.useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser({ 
          id: payload.user_id, 
          username: payload.sub || payload.username || "Current User" 
        });
      } catch (err) {
        console.warn("Could not decode token");
      }
    }
  }, []);

  // Load announcements from backend
  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAnnouncements();
      
      // Add username placeholders
      const dataWithUsernames = data.map(ann => ({
        ...ann,
        created_by_username: `User ${ann.created_by}` // Temporary placeholder
      }));
      
      setRows(dataWithUsernames);
    } catch (err) {
      console.error("Failed to load announcements:", err);
      setError("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadAnnouncements();
  }, []);

  // Helpers
  const toggleSort = (key) => {
    if (sortBy === key) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(key); setSortDir("asc"); }
  };

  const openCreate = () => setModal({ open: true, data: null });
  const openEdit = (r) => setModal({ open: true, data: r });
  const closeModal = () => setModal({ open: false, data: null });
  const openView = (r) => setView({ open: true, data: r });
  const closeView = () => setView({ open: false, data: null });

  // Save announcement (create or update)
  const saveRow = async (form) => {
    try {
      setError(null);
      let result;
      
      if (form.announcementid) {
        // Update existing
        result = await updateAnnouncement(form.announcementid, form);
        setRows(old => old.map(r => r.announcementid === form.announcementid ? {
          ...result,
          created_by_username: `User ${result.created_by}`
        } : r));
      } else {
        // Create new - add username for immediate display
        result = await createAnnouncement(form);
        const newAnnWithUsername = {
          ...result,
          created_by_username: currentUser?.username || `User ${result.created_by}`
        };
        setRows(old => [newAnnWithUsername, ...old]);
      }
      closeModal();
    } catch (err) {
      console.error("Failed to save announcement:", err);
      setError("Failed to save announcement");
    }
  };

  // Delete announcement
  const delRow = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    
    try {
      setError(null);
      await deleteAnnouncement(id);
      setRows(old => old.filter(r => r.announcementid !== id));
    } catch (err) {
      console.error("Failed to delete announcement:", err);
      setError("Failed to delete announcement");
    }
  };

  const downloadCSV = (list) => {
    const header = ["announcementid", "title", "content", "created_by", "status", "created_at", "updated_at"];
    const esc = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const body = list.map(r => header.map(h => esc(r[h])).join(",")).join("\n");
    const csv = header.join(",") + "\n" + body;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); 
    a.href = url; 
    a.download = "announcements.csv";
    document.body.appendChild(a); 
    a.click(); 
    a.remove(); 
    URL.revokeObjectURL(url);
  };

  // Filter
  const filtered = rows.filter(r => {
    if (q) {
      const hay = `${r.title} ${r.content} ${r.created_by_username} ${r.status}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    if (status !== "all" && r.status !== status) return false;
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    const A = a[sortBy], B = b[sortBy];
    if (["created_at", "updated_at"].includes(sortBy)) {
      return (new Date(A) - new Date(B)) * dir;
    }
    if (typeof A === "number" && typeof B === "number") return (A - B) * dir;
    return String(A).localeCompare(String(B)) * dir;
  });

  // Page
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (loading) {
    return (
      <div className="adm-card">
        <div className="adm-empty">Loading announcements...</div>
      </div>
    );
  }

  return (
    <div className="adm-card">
      {error && (
        <div className="ad-alert error" style={{ marginBottom: '1rem' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>×</button>
        </div>
      )}
      
      <header className="adm-head">
        <div className="adm-title">Announcements</div>
        <div className="adm-tools">
          <input className="adm-input" placeholder="Search title/content…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          <select className="adm-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="all">All status</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="archived">archived</option>
          </select>
          <button className="ws-btn ghost" onClick={() => downloadCSV(sorted)}>Export CSV</button>
          <button className="ws-btn primary" onClick={openCreate}><Icon name="plus" /> New</button>
        </div>
      </header>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort("title")} aria-sort={sortBy === "title" ? sortDir : "none"}>title</th>
              <th>content</th>
              <th onClick={() => toggleSort("created_by")} aria-sort={sortBy === "created_by" ? sortDir : "none"}>created_by</th>
              <th onClick={() => toggleSort("status")} aria-sort={sortBy === "status" ? sortDir : "none"}>status</th>
              <th onClick={() => toggleSort("created_at")} aria-sort={sortBy === "created_at" ? sortDir : "none"}>created_at</th>
              <th onClick={() => toggleSort("updated_at")} aria-sort={sortBy === "updated_at" ? sortDir : "none"}>updated_at</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr><td colSpan={7}><div className="adm-empty">No announcements</div></td></tr>
            ) : pageRows.map(r => (
              <tr key={r.announcementid}>
                <td data-label="title">
                  <button className="ws-btn ghost" title="View" onClick={() => openView(r)}>{r.title}</button>
                </td>
                <td data-label="content" className="truncate">{r.content}</td>
                <td data-label="created_by">{r.created_by_username || `User ${r.created_by}`}</td>
                <td data-label="status"><span className={`ad-chip ${r.status}`}>{r.status}</span></td>
                <td data-label="created_at" className="mono">{fmtDate(r.created_at)}</td>
                <td data-label="updated_at" className="mono">{fmtDate(r.updated_at)}</td>
                <td className="actions" data-label="actions">
                  <button className="ad-icon" title="Edit" onClick={() => openEdit(r)}><Icon name="edit" /></button>
                  <button className="ad-icon danger" title="Delete" onClick={() => delRow(r.announcementid)}><Icon name="trash" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="adm-foot">
        <div>Page {safePage}/{pages}</div>
        <div className="adm-pager">
          <button className="ws-btn ghost" disabled={safePage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
          <button className="ws-btn ghost" disabled={safePage >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))}>Next</button>
        </div>
      </footer>

      {/* Create/Edit */}
      <AnnouncementModal open={modal.open} initial={modal.data} onClose={closeModal} onSave={saveRow} currentUser={currentUser} />
      {/* View full content */}
      <AnnouncementViewModal open={view.open} data={view.data} onClose={closeView} />
    </div>
  );
}

/* --------- Modal for Create/Edit Announcement --------- */
function AnnouncementModal({ open, initial, onClose, onSave, currentUser }) {
  const [form, setForm] = React.useState(initial || {});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setForm(initial || {
        title: "",
        content: "",
        status: "active"
      });
    }
  }, [initial, open]);

  const updateField = (key, value) => setForm(s => ({ ...s, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) return;
    
    setSaving(true);
    try {
      // Prepare data for submission
      const submissionData = {
        ...form,
        // For new announcements, include created_by if we have current user
        ...(!form.announcementid && currentUser && { created_by: currentUser.id })
      };
      
      await onSave(submissionData);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="ad-backdrop" onClick={onClose} />
      <div className="ad-modal ws-card">
        <div className="ad-modal-head">
          <h3>{form.announcementid ? "Edit announcement" : "New announcement"}</h3>
          <button className="ad-icon" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form className="ad-form" onSubmit={handleSubmit}>
          {/* Show current user info for new announcements */}
          {!form.announcementid && currentUser && (
            <div style={{ 
              padding: '8px 12px', 
              background: 'var(--bg-muted)', 
              borderRadius: '4px', 
              marginBottom: '16px',
              fontSize: '0.9em',
              color: 'var(--text-muted)'
            }}>
              <strong>Creating as:</strong> {currentUser.username} (User #{currentUser.id})
            </div>
          )}
          
          <label>
            <span>Title *</span>
            <input
              value={form.title || ""}
              onChange={(e) => updateField("title", e.target.value)}
              required
              disabled={saving}
              placeholder="Enter announcement title"
            />
          </label>
          
          <label className="row2">
            <span>Content *</span>
            <textarea
              rows={4}
              value={form.content || ""}
              onChange={(e) => updateField("content", e.target.value)}
              required
              disabled={saving}
              placeholder="Enter announcement content"
            />
          </label>
          
          <label>
            <span>Status</span>
            <select
              value={form.status || "active"}
              onChange={(e) => updateField("status", e.target.value)}
              disabled={saving}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <div className="ad-actions">
            <button type="button" className="ws-btn ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button className="ws-btn primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

/* --------- Read-only "View" modal for full content --------- */
function AnnouncementViewModal({ open, data, onClose }) {
  if (!open || !data) return null;
  
  return (
    <>
      <div className="ad-backdrop" onClick={onClose} />
      <div className="ad-modal ws-card">
        <div className="ad-modal-head">
          <h3>{data.title}</h3>
          <button className="ad-icon" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div style={{ display: "grid", gap: 10, padding: "0 4px 6px" }}>
          <div><strong>created_by:</strong> {data.created_by_username || `User ${data.created_by}`}</div>
          <div><strong>status:</strong> <span className={`ad-chip ${data.status}`}>{data.status}</span></div>
          <div><strong>content:</strong></div>
          <div className="adm-content">{data.content}</div>
          <div className="muted">
            created_at: {fmtDate(data.created_at)} &nbsp;|&nbsp; 
            updated_at: {fmtDate(data.updated_at)}
          </div>
        </div>
      </div>
    </>
  );
}