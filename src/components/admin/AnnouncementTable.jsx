// ===============================
// AnnouncementTable.jsx — With Permission Control
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

export default function AnnouncementTable({ Icon }) {
  // ===============================
  // 🔹 STATES
  // ===============================
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [modal, setModal] = React.useState({ open: false, data: null });
  const [view, setView] = React.useState({ open: false, data: null });
  const [noAccessModal, setNoAccessModal] = React.useState({
    open: false,
    message: "",
  });

  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("created_at");
  const [sortDir, setSortDir] = React.useState("desc");
  const [page, setPage] = React.useState(1);
  const pageSize = 8;

  const { level: permission, canRead, canWrite, loading: permLoading } =
    usePermission("ANNOUNCEMENTS");

  // ===============================
  // 🔹 LOAD ANNOUNCEMENTS
  // ===============================
  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAnnouncements();
      setRows(data);
    } catch (err) {
      console.error("❌ Failed to load announcements:", err);
      setError("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!permLoading && canRead) loadAnnouncements();
  }, [permLoading, canRead]);

  // ===============================
  // 🔹 PERMISSION CHECK
  // ===============================
  const requireWrite = (action = "modify") => {
    if (!canWrite) {
      setNoAccessModal({
        open: true,
        message: `You don't have permission to ${action} announcements.`,
      });
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
      : setNoAccessModal({
          open: true,
          message: "You don't have permission to add announcements.",
        });

  const openEdit = (r) =>
    canWrite
      ? setModal({ open: true, data: r })
      : setNoAccessModal({
          open: true,
          message: "You don't have permission to edit announcements.",
        });

  const openView = (r) => setView({ open: true, data: r });
  const closeModal = () => setModal({ open: false, data: null });
  const closeView = () => setView({ open: false, data: null });

  const saveRow = async (form) => {
    if (!requireWrite(form.announcementid ? "update" : "create")) return;
    try {
      setError("");
      let result;
      if (form.announcementid) {
        result = await updateAnnouncement(form.announcementid, form);
        setRows((old) =>
          old.map((r) => (r.announcementid === form.announcementid ? result : r))
        );
      } else {
        result = await createAnnouncement(form);
        setRows((old) => [result, ...old]);
      }
      closeModal();
    } catch (err) {
      console.error("❌ Failed to save announcement:", err);
      setError("Failed to save announcement");
    }
  };

  const delRow = async (id) => {
    if (!requireWrite("delete")) return;
    if (!window.confirm("Are you sure you want to delete this announcement?"))
      return;
    try {
      await deleteAnnouncement(id);
      setRows((old) => old.filter((r) => r.announcementid !== id));
    } catch (err) {
      console.error("❌ Failed to delete announcement:", err);
      setError("Failed to delete announcement");
    }
  };

  // ===============================
  // 🔹 FILTER + SORT + PAGINATION
  // ===============================
  const filtered = rows.filter((r) => {
    if (q) {
      const hay = `${r.title} ${r.content} ${r.created_by_username} ${r.status}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    if (status !== "all" && r.status !== status) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    const A = a[sortBy],
      B = b[sortBy];
    if (["created_at", "updated_at"].includes(sortBy))
      return (new Date(A) - new Date(B)) * dir;
    return String(A).localeCompare(String(B)) * dir;
  });

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const downloadCSV = (list) => {
    const header = [
      "announcementid",
      "title",
      "content",
      "created_by",
      "status",
      "created_at",
      "updated_at",
    ];
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
        <p style={{ color: "var(--ink-3)", marginTop: 6 }}>
          You don’t have permission to view Announcements.
        </p>
      </section>
    );

  // ===============================
  // 🔹 MAIN RENDER
  // ===============================
  return (
    <div className="adm-card">
      {error && (
        <div className="ad-alert error" style={{ marginBottom: "1rem" }}>
          {error}
          <button
            onClick={() => setError("")}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "inherit",
              cursor: "pointer",
            }}
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
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
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
          <button className="ws-btn ghost" onClick={() => downloadCSV(sorted)}>
            Export CSV
          </button>
          <button
            className="ws-btn primary"
            onClick={openCreate}
            disabled={!canWrite}
            title={!canWrite ? "Read-only access" : ""}
          >
            <Icon name="plus" /> New
          </button>
        </div>
      </header>

      <div className="adm-table-wrap">
        <table className="adm-table">
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
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="adm-empty">No announcements</div>
                </td>
              </tr>
            ) : (
              pageRows.map((r) => (
                <tr key={r.announcementid}>
                  <td>
                    <button
                      className="ws-btn ghost"
                      onClick={() => openView(r)}
                    >
                      {r.title}
                    </button>
                  </td>
                  <td className="truncate">{r.content}</td>
                  <td>{r.created_by_username || "—"}</td>
                  <td>
                    <StatusPill value={r.status} />
                  </td>
                  <td className="mono">{fmtDate(r.created_at)}</td>
                  <td className="mono">{fmtDate(r.updated_at)}</td>
                  <td className="actions">
                    <button
                      className="ad-icon"
                      title={canWrite ? "Edit" : "View-only"}
                      onClick={() => openEdit(r)}
                      disabled={!canWrite}
                    >
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
        <div>Page {safePage}/{pages}</div>
        <div className="adm-pager">
          <button
            className="ws-btn ghost"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <button
            className="ws-btn ghost"
            disabled={safePage >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
          >
            Next
          </button>
        </div>
      </footer>

      {/* 🔹 Modals */}
      {modal.open && (
        <AnnouncementModal
          open={modal.open}
          initial={modal.data}
          onClose={closeModal}
          onSave={saveRow}
        />
      )}

      {view.open && (
        <AnnouncementViewModal
          open={view.open}
          data={view.data}
          onClose={closeView}
        />
      )}

      {/* 🔹 No Access Modal */}
      {noAccessModal.open && (
        <div className="ad-modal">
          <div className="ad-modal-content ws-card">
            <h3>Access Denied</h3>
            <p>{noAccessModal.message}</p>
            <div className="modal-actions">
              <button
                className="ws-btn primary"
                onClick={() => setNoAccessModal({ open: false, message: "" })}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* --------- Create/Edit Modal --------- */
function AnnouncementModal({ open, initial, onClose, onSave }) {
  const [form, setForm] = React.useState(initial || {});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setForm(initial || { title: "", content: "", status: "active" });
    }
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
    <>
      <div className="ad-backdrop" onClick={onClose} />
      <div className="ad-modal ws-card">
        <div className="ad-modal-head">
          <h3>{form.announcementid ? "Edit announcement" : "New announcement"}</h3>
          <button className="ad-icon" onClick={onClose}>✕</button>
        </div>
        <form className="ad-form" onSubmit={handleSubmit}>
          <label>
            <span>Title *</span>
            <input
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              required
            />
          </label>
          <label className="row2">
            <span>Content *</span>
            <textarea
              rows={4}
              value={form.content}
              onChange={(e) => handleChange("content", e.target.value)}
              required
            />
          </label>
          <label>
            <span>Status</span>
            <select
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <div className="ad-actions">
            <button type="button" className="ws-btn ghost" onClick={onClose}>
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

/* --------- View Modal --------- */
function AnnouncementViewModal({ open, data, onClose }) {
  if (!open || !data) return null;
  return (
    <>
      <div className="ad-backdrop" onClick={onClose} />
      <div className="ad-modal ws-card">
        <div className="ad-modal-head">
          <h3>{data.title}</h3>
          <button className="ad-icon" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <div><strong>created_by:</strong> {data.created_by_username || "—"}</div>
          <div><strong>status:</strong> <StatusPill value={data.status} /></div>
          <div><strong>content:</strong></div>
          <div className="adm-content">{data.content}</div>
          <div className="muted">
            created_at: {fmtDate(data.created_at)} | updated_at: {fmtDate(data.updated_at)}
          </div>
        </div>
      </div>
    </>
  );
}
