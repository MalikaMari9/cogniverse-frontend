// ===============================
// AnnouncementTable.jsx — With Permission Control (fixed)
// ===============================
import React from "react";
import { fmtDate, StatusPill } from "./helpers";
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../api/api";
import { usePermission } from "../../hooks/usePermission";
import ModalPortal from "./ModalPortal";

export default function AnnouncementTable({ Icon }) {
  // ===============================
  // 🔹 STATES
  // ===============================
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [modal, setModal] = React.useState({ open: false, data: null });
  const [view, setView] = React.useState({ open: false, data: null });
  const [noAccessModal, setNoAccessModal] = React.useState({ open: false, message: "" });

  const [limit, setLimit] = React.useState(null);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);

  const [page, setPage] = React.useState(1);

  // server-side filters
  const [status, setStatus] = React.useState("all");
  const [q, setQ] = React.useState("");
  // debounce for q so we don’t spam requests
  const [searchTerm, setSearchTerm] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setQ(searchTerm), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // client-side sort (for the current page only; server still controls pagination)
  const [sortBy, setSortBy] = React.useState("created_at");
  const [sortDir, setSortDir] = React.useState("desc");
  const toggleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const { level: permission, canRead, canWrite, loading: permLoading } = usePermission("ANNOUNCEMENTS");

  
  // ===============================
  // 🔹 LOAD ANNOUNCEMENTS (server-side search + pagination)
  // ===============================
  const loadAnnouncements = React.useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = { page, q, status };
      const data = await getAnnouncements(params);
      setRows(data.items || []);
      setTotal(data.total || 0);
      setLimit(data.limit || null);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error("❌ Failed to load announcements:", err);
      setError("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, [page, q, status]);

  // single effect only — avoids double loading
  React.useEffect(() => {
    if (!permLoading && canRead) loadAnnouncements();
  }, [permLoading, canRead, loadAnnouncements]);

  // prevent body scroll when any modal open
  React.useEffect(() => {
    const hasModal = modal?.open || view?.open || noAccessModal?.open;
    document.body.classList.toggle("modal-open", !!hasModal);
  }, [modal?.open, view?.open, noAccessModal?.open]);

  // ===============================
  // 🔹 PERMISSION CHECK
  // ===============================
  const requireWrite = (action = "modify") => {
    if (!canWrite) {
      setNoAccessModal({ open: true, message: `You don't have permission to ${action} announcements.` });
      return false;
    }
    return true;
  };

  // ===============================
  // 🔹 CRUD HANDLERS
  // ===============================
  const openCreate = () =>
    canWrite
      ? setModal({ open: true, data: null })
      : setNoAccessModal({ open: true, message: "You don't have permission to add announcements." });

  const openEdit = (r) =>
    canWrite
      ? setModal({ open: true, data: r })
      : setNoAccessModal({ open: true, message: "You don't have permission to edit announcements." });

  const openView = (r) => setView({ open: true, data: r });
  const closeModal = () => setModal({ open: false, data: null });
  const closeView = () => setView({ open: false, data: null });

  const saveRow = async (form) => {
    if (!requireWrite(form.announcementid ? "update" : "create")) return;
    try {
      setError("");
      if (form.announcementid) {
        await updateAnnouncement(form.announcementid, form);
      } else {
        await createAnnouncement(form);
        // after creating, go back to first page to see newest
        setPage(1);
      }
      closeModal();
      await loadAnnouncements(); // keep totals/pagination correct
    } catch (err) {
      console.error("❌ Failed to save announcement:", err);
      setError("Failed to save announcement");
    }
  };

  const delRow = async (id) => {
    if (!requireWrite("delete")) return;
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await deleteAnnouncement(id);
      // reload to keep totals right
      const nextPage = rows.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      await loadAnnouncements();
    } catch (err) {
      console.error("❌ Failed to delete announcement:", err);
      setError("Failed to delete announcement");
    }
  };

  // ===============================
  // 🔹 CLIENT-SIDE SORT FOR CURRENT PAGE
  // ===============================
  const displayedRows = React.useMemo(() => {
    const arr = [...rows];
    const dir = sortDir === "asc" ? 1 : -1;
    return arr.sort((a, b) => {
      const A = a[sortBy];
      const B = b[sortBy];
      if (["created_at", "updated_at"].includes(sortBy)) {
        return (new Date(A) - new Date(B)) * dir;
      }
      return String(A ?? "").localeCompare(String(B ?? "")) * dir;
    });
  }, [rows, sortBy, sortDir]);

  const downloadCSV = (list) => {
    const header = ["announcementid", "title", "content", "created_by", "status", "created_at", "updated_at"];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const body = list.map((r) => header.map((h) => esc(r[h])).join(",")).join("\n");
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

  // ===============================
  // 🔹 CONDITIONAL PERMISSION RENDER
  // ===============================
  if (permLoading)
    return (
      <section className="ad-card ws-card">
        <div className="ad-loading">Checking permissions...</div>
      </section>
    );

  if (permission === "none")
    return (
      <section className="ad-card ws-card ad-empty">
        <h2 style={{ color: "var(--ink-1)" }}>Access Denied</h2>
        <p style={{ color: "var(--ink-3)", marginTop: 6 }}>You don’t have permission to view Announcements.</p>
      </section>
    );

  // ===============================
  // 🔹 MAIN RENDER
  // ===============================
  return (
    <section className="ad-card ws-card">
      {error && (
        <div className="ad-alert error" style={{ marginBottom: "1rem" }}>
          {error}
          <button
            onClick={() => setError("")}
            style={{ marginLeft: "auto", background: "none", border: "none", color: "inherit", cursor: "pointer" }}
          >
            ×
          </button>
        </div>
      )}

      <header className="adm-head">
        <div className="adm-title">Announcements</div>
        <div className="adm-tools">
          <input
            className="adm-input"
            placeholder="Search title/content…"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="adm-select"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All status</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="archived">archived</option>
          </select>
          <button className="ws-btn ghost" onClick={() => downloadCSV(displayedRows)}>
            Export CSV
          </button>
          <button className="ws-btn primary" onClick={openCreate} disabled={!canWrite} title={!canWrite ? "Read-only access" : ""}>
            <Icon name="plus" /> New
          </button>
        </div>
      </header>

      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort("title")}>title</th>
              <th>content</th>
              <th onClick={() => toggleSort("created_by")}>created_by</th>
              <th onClick={() => toggleSort("status")}>status</th>
              <th onClick={() => toggleSort("created_at")}>created_at</th>
              <th onClick={() => toggleSort("updated_at")}>updated_at</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <div className="adm-center">
                    <div className="sc-spinner" />
                  </div>
                </td>
              </tr>
            ) : displayedRows.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="adm-empty">No announcements</div>
                </td>
              </tr>
            ) : (
              displayedRows.map((r) => (
                <tr key={r.announcementid}>
                  <td data-label="Title">
                    <button className="ws-btn ghost" onClick={() => openView(r)}>
                      {r.title}
                    </button>
                  </td>
                  <td className="truncate mono" data-label="Content">
                    {r.content}
                  </td>
                  <td data-label="Publisher" className="truncate mono">
                    {r.created_by_username || "—"}
                  </td>
                  <td data-label="Status" className="truncate mono">
                    <StatusPill value={r.status} />
                  </td>
                  <td className="mono" data-label="Created">
                    {fmtDate(r.created_at)}
                  </td>
                  <td className="mono" data-label="Updated">
                    {fmtDate(r.updated_at)}
                  </td>
                  <td className="mono" data-label="Actions">
                    <button className="ad-icon" title={canWrite ? "Edit" : "View-only"} onClick={() => openEdit(r)} disabled={!canWrite}>
                      <Icon name="edit" />
                    </button>
                    <button
                      className="ad-icon danger"
                      title={canWrite ? "Delete" : "View-only"}
                      onClick={() => delRow(r.announcementid)}
                      disabled={!canWrite}
                    >
                      <Icon name="trash" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="adm-foot">
        <div>Page {page}/{totalPages} • showing {limit ?? "?"} per page • {total} total</div>
        <div className="adm-pager">
          <button className="ws-btn ghost" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Prev
          </button>
          <button className="ws-btn ghost" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Next
          </button>
        </div>
      </footer>

      {/* 🔹 Modals */}
      {modal.open && (
        <ModalPortal>
          <AnnouncementModal open={modal.open} initial={modal.data} onClose={closeModal} onSave={saveRow} />
        </ModalPortal>
      )}

      {view.open && (
        <ModalPortal>
          <AnnouncementViewModal open={view.open} data={view.data} onClose={closeView} />
        </ModalPortal>
      )}

      {/* 🔹 No Access Modal */}
      {noAccessModal.open && (
        <ModalPortal>
          <div className="ad-modal">
            <div className="ad-modal-content ws-card">
              <h3>Access Denied</h3>
              <p>{noAccessModal.message}</p>
              <div className="modal-actions">
                <button className="ws-btn primary" onClick={() => setNoAccessModal({ open: false, message: "" })}>
                  OK
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </section>
  );
}

/* --------- Create/Edit Modal --------- */
function AnnouncementModal({ open, initial, onClose, onSave }) {
  const [form, setForm] = React.useState(initial || {});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) setForm(initial || { title: "", content: "", status: "active" });
  }, [initial, open]);

  const handleChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };
  if (!open) return null;

  return (
    <div className="ad-modal">
      <div className="ad-modal-content ws-card">
        <div className="ad-modal-head">
          <h3>{form.announcementid ? "Edit announcement" : "New announcement"}</h3>
        </div>
        <form className="ad-form" onSubmit={handleSubmit}>
          <label>
            <span>Title *</span>
            <input value={form.title} onChange={(e) => handleChange("title", e.target.value)} required />
          </label>
          <label className="row2">
            <span>Content *</span>
            <textarea rows={4} value={form.content} onChange={(e) => handleChange("content", e.target.value)} required />
          </label>
          <label>
            <span>Status</span>
            <select value={form.status} onChange={(e) => handleChange("status", e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <div className="ad-actions">
            <button type="button" className="ws-btn ghost" onClick={onClose}>Cancel</button>
            <button className="ws-btn primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* --------- View Modal --------- */
function AnnouncementViewModal({ open, data, onClose }) {
  if (!open || !data) return null;
  return (
    <div className="ad-modal">
      <div className="ad-modal-content ws-card">
        <div className="ad-modal-head">
          <h3>{data.title}</h3>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <div><strong>created_by:</strong> {data.created_by_username || "—"}</div>
          <div><strong>status:</strong> <StatusPill value={data.status} /></div>
          <div><strong>content:</strong></div>
          <div className="adm-content">{data.content}</div>
          <div className="muted">created_at: {fmtDate(data.created_at)} | updated_at: {fmtDate(data.updated_at)}</div>
        </div>
        <div className="ad-actions" style={{ marginTop: 12 }}>
          <button className="ws-btn ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
