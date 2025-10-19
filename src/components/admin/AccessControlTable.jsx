import React from "react";
import {
  getAllAccessControls,
  createAccessControl,
  updateAccessControl,
  deleteAccessControl,
} from "../../api/api"; // ✅ your API file

export default function AccessControlTable({ Icon }) {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [critical, setCritical] = React.useState("all"); // all|critical|noncritical
  const [sortBy, setSortBy] = React.useState("module_key");
  const [sortDir, setSortDir] = React.useState("asc");
  const [page, setPage] = React.useState(1);
  const [modal, setModal] = React.useState({ open: false, data: null });
  const pageSize = 8;

  // ===============================
  // 🔹 FETCH DATA
  // ===============================
  const fetchAccessControls = async () => {
    try {
      setLoading(true);
      const data = await getAllAccessControls();
      // Format dates and consistency
      setRows(
        data.map((r) => ({
          accessID: r.accessid,
          module_key: r.module_key,
          module_desc: r.module_desc,
          user_access: r.user_access === "write" || r.user_access === "read" || r.user_access === "full",
          admin_access: r.admin_access === "write" || r.admin_access === "read" || r.admin_access === "full",
          superadmin_access:
            r.superadmin_access === "write" || r.superadmin_access === "read" || r.superadmin_access === "full",
          is_critical: r.is_critical,
          status: r.status,
          created_at: r.created_at
            ? new Date(r.created_at).toISOString().slice(0, 16).replace("T", " ")
            : "-",
          updated_at: r.updated_at
            ? new Date(r.updated_at).toISOString().slice(0, 16).replace("T", " ")
            : "-",
        }))
      );
    } catch (err) {
      console.error("❌ Failed to fetch access controls:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAccessControls();
  }, []);

  // ===============================
  // 🔹 SORT + FILTER
  // ===============================
  const toggleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const filtered = rows.filter((r) => {
    const hay = `${r.accessID} ${r.module_key} ${r.module_desc} ${r.status}`.toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (status !== "all" && r.status !== status) return false;
    if (critical === "critical" && !r.is_critical) return false;
    if (critical === "noncritical" && r.is_critical) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    const A = a[sortBy],
      B = b[sortBy];
    if (typeof A === "boolean" && typeof B === "boolean") return ((A ? 1 : 0) - (B ? 1 : 0)) * dir;
    if (["created_at", "updated_at"].includes(sortBy)) return (new Date(A) - new Date(B)) * dir;
    if (typeof A === "number" && typeof B === "number") return (A - B) * dir;
    return String(A).localeCompare(String(B)) * dir;
  });

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  // ===============================
  // 🔹 CRUD HANDLERS
  // ===============================
  const setSwitch = async (id, field) => {
    try {
      const target = rows.find((r) => r.accessID === id);
      if (!target) return;

      const updated = { ...target, [field]: !target[field] };
      setRows((old) =>
        old.map((r) =>
          r.accessID === id
            ? {
                ...r,
                [field]: !r[field],
                updated_at: new Date().toISOString().slice(0, 16).replace("T", " "),
              }
            : r
        )
      );

      await updateAccessControl(id, {
        [field]: updated[field],
      });
    } catch (err) {
      console.error("❌ Failed to update switch:", err);
    }
  };

  const openCreate = () => setModal({ open: true, data: null });
  const openEdit = (r) => setModal({ open: true, data: r });
  const closeModal = () => setModal({ open: false, data: null });

  const saveRow = async (form) => {
    try {
      if (form.accessID) {
        await updateAccessControl(form.accessID, {
          module_desc: form.module_desc,
          user_access: form.user_access ? "write" : "none",
          admin_access: form.admin_access ? "write" : "none",
          superadmin_access: form.superadmin_access ? "write" : "none",
          is_critical: form.is_critical,
          status: form.status,
        });
      } else {
        await createAccessControl({
          module_key: form.module_key,
          module_desc: form.module_desc,
          user_access: form.user_access ? "write" : "none",
          admin_access: form.admin_access ? "write" : "none",
          superadmin_access: form.superadmin_access ? "write" : "none",
          is_critical: form.is_critical,
          status: form.status,
        });
      }
      await fetchAccessControls();
    } catch (err) {
      console.error("❌ Failed to save row:", err);
    } finally {
      closeModal();
    }
  };

  const delRow = async (id) => {
    if (!window.confirm("Delete this access record?")) return;
    try {
      await deleteAccessControl(id);
      await fetchAccessControls();
    } catch (err) {
      console.error("❌ Failed to delete access control:", err);
    }
  };

  const downloadCSV = (list) => {
    const header = [
      "accessID",
      "module_key",
      "module_desc",
      "user_access",
      "admin_access",
      "superadmin_access",
      "is_critical",
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
    a.download = "access-control.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ===============================
  // 🔹 RENDER
  // ===============================
  return (
    <div className="adm-card">
      <header className="adm-head">
        <div className="adm-title">Access Control</div>
        <div className="adm-tools">
          <input
            className="adm-input"
            placeholder="Search module…"
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
          </select>
          <select
            className="adm-select"
            value={critical}
            onChange={(e) => {
              setCritical(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All modules</option>
            <option value="critical">Critical only</option>
            <option value="noncritical">Non-critical</option>
          </select>
          <button className="ws-btn ghost" onClick={() => downloadCSV(sorted)}>
            Export CSV
          </button>
          <button className="ws-btn primary" onClick={openCreate}>
            <Icon name="plus" /> New
          </button>
        </div>
      </header>

      {loading ? (
        <div className="adm-empty">Loading access controls…</div>
      ) : (
        <div className="acx-table-wrap">
          <table className="acx-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort("module_key")} aria-sort={sortBy === "module_key" ? sortDir : "none"}>
                  module_key
                </th>
                <th>module_desc</th>
                <th>user</th>
                <th>admin</th>
                <th>superadmin</th>
                <th>critical</th>
                <th>status</th>
                <th onClick={() => toggleSort("updated_at")} aria-sort={sortBy === "updated_at" ? sortDir : "none"}>
                  updated_at
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="adm-empty">No records</div>
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => (
                  <tr key={r.accessID}>
                    <td data-label="module_key" className="mono">
                      {r.module_key}
                    </td>
                    <td data-label="module_desc">{r.module_desc}</td>
                    <td data-label="user">
                      <label className="acx-switch">
                        <input type="checkbox" checked={!!r.user_access} onChange={() => setSwitch(r.accessID, "user_access")} />
                        <span className="track">
                          <span className="knob" />
                        </span>
                      </label>
                    </td>
                    <td data-label="admin">
                      <label className="acx-switch">
                        <input
                          type="checkbox"
                          checked={!!r.admin_access}
                          onChange={() => setSwitch(r.accessID, "admin_access")}
                        />
                        <span className="track">
                          <span className="knob" />
                        </span>
                      </label>
                    </td>
                    <td data-label="superadmin">
                      <label className="acx-switch">
                        <input
                          type="checkbox"
                          checked={!!r.superadmin_access}
                          onChange={() => setSwitch(r.accessID, "superadmin_access")}
                        />
                        <span className="track">
                          <span className="knob" />
                        </span>
                      </label>
                    </td>
                    <td data-label="critical">
                      <label className="acx-switch sm">
                        <input
                          type="checkbox"
                          checked={!!r.is_critical}
                          onChange={() => setSwitch(r.accessID, "is_critical")}
                        />
                        <span className="track">
                          <span className="knob" />
                        </span>
                      </label>
                    </td>
                    <td data-label="status">
                      <span className={`ad-chip ${r.status}`}>{r.status}</span>
                    </td>
                    <td data-label="updated_at" className="mono">
                      {r.updated_at}
                    </td>
                    <td className="actions">
                      <button className="ad-icon" title="Edit" onClick={() => openEdit(r)}>
                        <Icon name="edit" />
                      </button>
                      <button className="ad-icon danger" title="Delete" onClick={() => delRow(r.accessID)}>
                        <Icon name="trash" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <footer className="ad-pager">
        <button className="ws-btn ghost" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Prev
        </button>
        <div className="ad-pagebar">
          Page {safePage}/{pages}
        </div>
        <button className="ws-btn ghost" disabled={safePage >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>
          Next
        </button>
      </footer>

      <AccessControlModal open={modal.open} initial={modal.data} onClose={closeModal} onSave={saveRow} />
    </div>
  );
}

function AccessControlModal({ open, initial, onClose, onSave }) {
  const [form, setForm] = React.useState(initial || {});
  React.useEffect(
    () =>
      setForm(
        initial || {
          module_key: "",
          module_desc: "",
          user_access: false,
          admin_access: false,
          superadmin_access: true,
          is_critical: false,
          status: "active",
          created_at: new Date().toISOString().slice(0, 16).replace("T", " "),
          updated_at: new Date().toISOString().slice(0, 16).replace("T", " "),
        }
      ),
    [initial, open]
  );

  const u = (k, v) =>
    setForm((s) => ({ ...s, [k]: v, updated_at: new Date().toISOString().slice(0, 16).replace("T", " ") }));

  if (!open) return null;
  return (
    <>
      <div className="ad-backdrop" onClick={onClose} />
      <div className="ad-modal ws-card">
        <div className="ad-modal-head">
          <h3>{form.accessID ? "Edit access rule" : "New access rule"}</h3>
          <button className="ad-icon" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <form
          className="ad-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.module_key) return;
            onSave(form);
          }}
        >
          <label className="row2">
            <span>module_key</span>
            <input value={form.module_key} onChange={(e) => u("module_key", e.target.value)} required />
          </label>
          <label className="row2">
            <span>module_desc</span>
            <input value={form.module_desc} onChange={(e) => u("module_desc", e.target.value)} />
          </label>

          <label>
            <span>user_access</span>
            <label className="acx-switch">
              <input type="checkbox" checked={!!form.user_access} onChange={() => u("user_access", !form.user_access)} />
              <span className="track">
                <span className="knob" />
              </span>
            </label>
          </label>
          <label>
            <span>admin_access</span>
            <label className="acx-switch">
              <input
                type="checkbox"
                checked={!!form.admin_access}
                onChange={() => u("admin_access", !form.admin_access)}
              />
              <span className="track">
                <span className="knob" />
              </span>
            </label>
          </label>
          <label>
            <span>superadmin_access</span>
            <label className="acx-switch">
              <input
                type="checkbox"
                checked={!!form.superadmin_access}
                onChange={() => u("superadmin_access", !form.superadmin_access)}
              />
              <span className="track">
                <span className="knob" />
              </span>
            </label>
          </label>

          <label>
            <span>is_critical</span>
            <label className="acx-switch sm">
              <input type="checkbox" checked={!!form.is_critical} onChange={() => u("is_critical", !form.is_critical)} />
              <span className="track">
                <span className="knob" />
              </span>
            </label>
          </label>

          <label>
            <span>Status</span>
            <select value={form.status} onChange={(e) => u("status", e.target.value)}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </label>

          <div className="ad-actions">
            <button type="button" className="ws-btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="ws-btn primary" type="submit">
              Save
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
