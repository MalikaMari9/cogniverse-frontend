// ===============================
// MaintenanceTable.jsx — With Permission Message
// ===============================

import React from "react";
import { fmtDate } from "./helpers";
import { getAllMaintenance, updateMaintenance } from "../../api/api";
import { usePermission } from "../../hooks/usePermission";
import ModalPortal from "./ModalPortal";
export default function MaintenanceTable({ Icon }) {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [modal, setModal] = React.useState({ open: false, data: null });
  const [confirmModal, setConfirmModal] = React.useState({ open: false, data: null });
  const [noAccessModal, setNoAccessModal] = React.useState({ open: false, message: "" });

  const { level: permission, canRead, canWrite, loading: permLoading } =
    usePermission("MAINTENANCE");

  // ===============================
  // 🔹 HANDLE PERMISSIONS + FETCH
  // ===============================
  React.useEffect(() => {
    if (permLoading) return;
    if (canRead) fetchMaintenance();
  }, [permLoading, canRead]);

  React.useEffect(() => {
  const hasModal =
    modal?.open || confirmModal?.open || noAccessModal?.open;
  document.body.classList.toggle("modal-open", !!hasModal);
}, [modal?.open, confirmModal?.open, noAccessModal?.open]);

  const fetchMaintenance = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAllMaintenance();
      const data = res.map((item) => ({
        maintenanceid: item.maintenanceid,
        module_key: item.module_key,
        under_maintenance: item.under_maintenance,
        message: item.message || "-",
        updated_at: fmtDate(item.updated_at),
      }));
      setRows(data);
    } catch (err) {
      console.error("❌ Failed to fetch maintenance:", err);
      setError("Failed to load maintenance data.");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // 🔹 PERMISSION CHECK HELPERS
  // ===============================
  const requireWrite = (actionName = "modify") => {
    if (!canWrite) {
      setNoAccessModal({
        open: true,
        message: `You don't have permission to ${actionName} maintenance settings.`,
      });
      return false;
    }
    return true;
  };

  // ===============================
  // 🔹 TOGGLE + MESSAGE UPDATE
  // ===============================
  const openConfirm = (r) => {
    if (!requireWrite("toggle")) return;
    setConfirmModal({ open: true, data: r });
  };

  const confirmToggle = async () => {
    const r = confirmModal.data;
    try {
      await updateMaintenance(r.module_key, { under_maintenance: !r.under_maintenance });
      await fetchMaintenance();
      setConfirmModal({ open: false, data: null });
    } catch (err) {
      console.error("❌ Toggle failed:", err);
      alert("Failed to update maintenance status.");
    }
  };

  const saveMessage = async () => {
    if (!requireWrite("edit message")) return;
    try {
      await updateMaintenance(modal.data.module_key, {
        message: modal.data.message,
      });
      await fetchMaintenance();
      setModal({ open: false, data: null });
    } catch (err) {
      console.error("❌ Message update failed:", err);
      alert("Failed to update message.");
    }
  };

  // ===============================
  // 🔹 RENDER
  // ===============================
  if (permLoading) {
    return (
      <section className="ad-card ws-card">
        <div className="ad-loading">Checking permissions...</div>
      </section>
    );
  }

  // 🚫 No permission at all
  if (permission === "none") {
    return (
      <section className="ad-card ws-card ad-empty">
        <h2 style={{ color: "var(--ink-1)" }}>Access Denied</h2>
        <p style={{ color: "var(--ink-3)", marginTop: 6 }}>
          You don’t have permission to view Maintenance Control.  
          Please contact your system administrator if you believe this is an error.
        </p>
      </section>
    );
  }

  // ✅ Authorized (read/write)
  return (
    <section className="ad-card ws-card">
<header className="adm-head">
  <div className="adm-title" style={{ fontWeight: 600, marginRight: 12 }}>
    Maintenance Control
  </div>

  <div className="adm-tools" style={{ display: "flex", alignItems: "center", gap: 12 }}>
    {permission && (
      <div
        className="perm-label"
        style={{
          fontSize: "0.9rem",
          opacity: 0.8,
          color: "var(--ink-2)",
        }}
      >
        Access Level: <b style={{ color: "var(--ink-1)" }}>{permission}</b>
      </div>
    )}
  </div>
</header>


      {loading && <div className="ad-loading">Loading maintenance...</div>}
      {error && <div className="ad-error">{error}</div>}

      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Module</th>
              <th>Status</th>
              <th>Message</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.maintenanceid}>
                <td className="mono" data-label="ID">{r.maintenanceid}</td>
                <td  className="mono"data-label="Key">{r.module_key}</td>
                <td  className="mono" data-label="Status"> 
                  <span
                    className={`status-pill ${r.under_maintenance ? "inactive" : "active"}`}
                  >
                    {r.under_maintenance ? "Under Maintenance" : "Active"}
                  </span>
                </td>
                <td className="mono" data-label="Message">{r.message}</td>
                <td className="mono" data-label="Updated">{r.updated_at}</td>
                <td className="mono" data-label="Actions">
                  <button
                    className={`ws-btn ${r.under_maintenance ? "primary" : "danger"}`}
                    onClick={() => openConfirm(r)}
                    disabled={!canWrite}
                    title={!canWrite ? "Read-only access" : ""}
                  >
                    {r.under_maintenance ? "Disable Maintenance" : "Enable Maintenance"}
                  </button>
                  <button
                    className="ad-icon"
                    title={canWrite ? "Edit message" : "View-only"}
                    onClick={() =>
                      canWrite
                        ? setModal({ open: true, data: r })
                        : setNoAccessModal({
                            open: true,
                            message:
                              "You don't have permission to edit maintenance messages.",
                          })
                    }
                  >
                    <Icon name="edit" />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="ad-empty">
                  No maintenance data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 Edit Message Modal */}
      {modal.open && (
        <ModalPortal>
        <div className="ad-modal">
          <div className="ad-modal-content ws-card">
            <h3>Edit Maintenance Message</h3>
            <label>
              Module: <b>{modal.data.module_key}</b>
            </label>
            <textarea
              value={modal.data.message}
              onChange={(e) =>
                setModal((m) => ({
                  ...m,
                  data: { ...m.data, message: e.target.value },
                }))
              }
            />
            <div className="modal-actions">
              <button className="ws-btn" onClick={saveMessage}>
                Save
              </button>
              <button
                className="ws-btn ghost"
                onClick={() => setModal({ open: false, data: null })}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* 🔹 Confirm Maintenance Modal */}
      {confirmModal.open && (
        <ModalPortal>
        <div className="ad-modal">
          <div className="ad-modal-content ws-card">
            <h3>
              {confirmModal.data.under_maintenance
                ? "Disable Maintenance?"
                : "Enable Maintenance?"}
            </h3>
            <p>
              {confirmModal.data.under_maintenance
                ? `Are you sure you want to disable maintenance for "${confirmModal.data.module_key}"?`
                : `Are you sure you want to enable maintenance for "${confirmModal.data.module_key}"?`}
            </p>
            <div className="modal-actions">
              <button className="ws-btn danger" onClick={confirmToggle}>
                Confirm
              </button>
              <button
                className="ws-btn ghost"
                onClick={() => setConfirmModal({ open: false, data: null })}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
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
              <button
                className="ws-btn primary"
                onClick={() => setNoAccessModal({ open: false, message: "" })}
              >
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
