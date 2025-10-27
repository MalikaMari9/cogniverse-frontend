// ===============================
// AccessControlTable.jsx — With Permission Popups (Fixed)
// ===============================
import React from "react";
import {
  getAllAccessControls,
  createAccessControl,
  updateAccessControl,
} from "../../api/api";
import { usePermission } from "../../hooks/usePermission";

export default function AccessControlTable({ Icon }) {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [q, setQ] = React.useState("");
  const [critical, setCritical] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("module_key");
  const [sortDir, setSortDir] = React.useState("asc");
  const [page, setPage] = React.useState(1);
  const [modal, setModal] = React.useState({ open: false, data: null });
  const [noAccessModal, setNoAccessModal] = React.useState({
    open: false,
    message: "",
  });
  const pageSize = 8;

  const ACCESS_LEVELS = ["none", "read", "write"];
  const { level: permission, canRead, canWrite, loading: permLoading } =
    usePermission("ACCESS_CONTROL");

  // ===============================
  // 🔹 FETCH DATA
  // ===============================
  const fetchAccessControls = async () => {
    try {
      setLoading(true);
      const data = await getAllAccessControls();
      setRows(
        data.map((r) => ({
          accessID: r.accessid,
          module_key: r.module_key,
          module_desc: r.module_desc,
          user_access: r.user_access || "none",
          admin_access: r.admin_access || "none",
          superadmin_access: "write",
          is_critical: r.is_critical,
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
    if (!permLoading && canRead) fetchAccessControls();
  }, [permLoading, canRead]);

  // ===============================
  // 🔹 HELPER FUNCTIONS
  // ===============================
  const requireWrite = (action = "modify") => {
    if (!canWrite) {
      setNoAccessModal({
        open: true,
        message: `You don't have permission to ${action} access control entries.`,
      });
      return false;
    }
    return true;
  };

  const toggleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const filtered = rows.filter((r) => {
    const hay = `${r.accessID} ${r.module_key} ${r.module_desc}`.toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (critical === "critical" && !r.is_critical) return false;
    if (critical === "noncritical" && r.is_critical) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    const A = a[sortBy],
      B = b[sortBy];
    if (["created_at", "updated_at"].includes(sortBy))
      return (new Date(A) - new Date(B)) * dir;
    if (typeof A === "number" && typeof B === "number") return (A - B) * dir;
    return String(A).localeCompare(String(B)) * dir;
  });

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  // ===============================
  // 🔹 CRUD HANDLERS
  // ===============================
  const openCreate = () =>
    canWrite
      ? setModal({ open: true, data: null })
      : setNoAccessModal({
          open: true,
          message: "You don't have permission to create access control entries.",
        });

  const openEdit = (r) =>
    canWrite
      ? setModal({ open: true, data: r })
      : setNoAccessModal({
          open: true,
          message: "You don't have permission to edit access control entries.",
        });

  const closeModal = () => setModal({ open: false, data: null });

  const saveRow = async (form) => {
    if (!requireWrite("save")) return;
    try {
      if (form.accessID) {
        await updateAccessControl(form.accessID, {
          module_desc: form.module_desc,
          user_access: form.user_access,
          admin_access: form.admin_access,
          superadmin_access: form.superadmin_access,
          is_critical: form.is_critical,
        });
      } else {
        await createAccessControl({
          module_key: form.module_key,
          module_desc: form.module_desc,
          user_access: form.user_access,
          admin_access: form.admin_access,
          superadmin_access: form.superadmin_access,
          is_critical: form.is_critical,
        });
      }
      await fetchAccessControls();
    } catch (err) {
      console.error("❌ Failed to save row:", err);
    } finally {
      closeModal();
    }
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
          You don’t have permission to view Access Control settings.
        </p>
      </section>
    );

  // ===============================
  // 🔹 RENDER MAIN
  // ===============================
  return (
    <section className="ad-card ws-card">
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

      {loading ? (
        <div className="adm-empty">Loading access controls…</div>
      ) : (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort("module_key")}>module_key</th>
                <th>module_desc</th>
                <th>user_access</th>
                <th>admin_access</th>
                <th>superadmin_access</th>
                <th>critical</th>
                <th onClick={() => toggleSort("updated_at")}>updated_at</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="adm-empty">No records</div>
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => (
                  <tr key={r.accessID}>
                    <td className="mono" data-label="Key">{r.module_key}</td>
                    <td data-label="Description">{r.module_desc}</td>
                    <td data-label="User Access">
                      <span className={`ad-chip ${r.user_access}`}>
                        {r.user_access}
                      </span>
                    </td>
                    <td data-label="Admin Access">
                      <span className={`ad-chip ${r.admin_access}`}>
                        {r.admin_access}
                      </span>
                    </td>
                    <td data-label="Superadmin Access">
                      <span className={`ad-chip ${r.superadmin_access}`}>
                        {r.superadmin_access}
                      </span>
                    </td>
                    <td data-label="Critical">
                      <label className="acx-switch sm">
                        <input
                          type="checkbox"
                          checked={!!r.is_critical}
                          onChange={async () =>
                            canWrite
                              ? await updateAccessControl(r.accessID, {
                                  is_critical: !r.is_critical,
                                }).then(fetchAccessControls)
                              : setNoAccessModal({
                                  open: true,
                                  message:
                                    "You don't have permission to update critical status.",
                                })
                          }
                        />
                        <span className="track">
                          <span className="knob" />
                        </span>
                      </label>
                    </td>
                    <td className="mono" data-label="Updated">{r.updated_at}</td>
                    <td className="actions" data-label="Actions">
                      <button
                        className="ad-icon"
                        title={canWrite ? "Edit" : "View-only"}
                        onClick={() => openEdit(r)}
                      >
                        <Icon name="edit" />
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
        <button
          className="ws-btn ghost"
          disabled={safePage <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>
        <div className="ad-pagebar">
          Page {safePage}/{pages}
        </div>
        <button
          className="ws-btn ghost"
          disabled={safePage >= pages}
          onClick={() => setPage((p) => Math.min(pages, p + 1))}
        >
          Next
        </button>
      </footer>

      {/* ✅ include the modal component here */}
      <AccessControlModal
        open={modal.open}
        initial={modal.data}
        onClose={closeModal}
        onSave={saveRow}
        ACCESS_LEVELS={ACCESS_LEVELS}
      />

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
    </section>
  );
}

// ===============================
// 🔸 AccessControlModal Component
// ===============================
function AccessControlModal({ open, initial, onClose, onSave, ACCESS_LEVELS }) {
  const [form, setForm] = React.useState(initial || {});
  React.useEffect(() => {
    setForm(
      initial || {
        module_key: "",
        module_desc: "",
        user_access: "none",
        admin_access: "none",
        superadmin_access: "write",
        is_critical: false,
      }
    );
  }, [initial, open]);

  const u = (k, v) =>
    setForm((s) => ({
      ...s,
      [k]: v,
    }));

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
          <label>
            <span>module_key</span>
            <input
              value={form.module_key}
              onChange={(e) => u("module_key", e.target.value)}
              required
            />
          </label>

          <label>
            <span>module_desc</span>
            <input
              value={form.module_desc}
              onChange={(e) => u("module_desc", e.target.value)}
            />
          </label>

{["user_access", "admin_access", "superadmin_access"].map((key) => (
  <label key={key}>
    <span>{key}</span>
    <select
      value={form[key]}
      onChange={(e) => u(key, e.target.value)}
      disabled={key === "superadmin_access"} // 🔒 prevent edits
      title={key === "superadmin_access" ? "SuperAdmin always has write access" : ""}
    >
      {ACCESS_LEVELS.map((lvl) => (
        <option key={lvl} value={lvl}>
          {lvl}
        </option>
      ))}
    </select>
  </label>
))}


          <label>
            <span>is_critical</span>
            <label className="acx-switch sm">
              <input
                type="checkbox"
                checked={!!form.is_critical}
                onChange={() => u("is_critical", !form.is_critical)}
              />
              <span className="track">
                <span className="knob" />
              </span>
            </label>
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
