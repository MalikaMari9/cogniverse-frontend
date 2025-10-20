// ===============================
// MaintenanceTable.jsx — Confirm Modal Version
// ===============================
import React from "react";
import { fmtDate } from "./helpers";
import { getAllMaintenance, updateMaintenance } from "../../api/api";

export default function MaintenanceTable({ Icon }) {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [modal, setModal] = React.useState({ open: false, data: null });
  const [confirmModal, setConfirmModal] = React.useState({ open: false, data: null });

  // ===============================
  // 🔹 FETCH MAINTENANCE
  // ===============================
  React.useEffect(() => {
    fetchMaintenance();
  }, []);

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
  // 🔹 TOGGLE WITH CONFIRMATION
  // ===============================
  const openConfirm = (r) => {
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

  // ===============================
  // 🔹 UPDATE MESSAGE
  // ===============================
  const saveMessage = async () => {
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
  return (
    <section className="ad-card ws-card">
      <div className="ad-topbar" style={{ marginBottom: 12 }}>
        <h3>Maintenance Control</h3>
      </div>

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
                <td className="mono">{r.maintenanceid}</td>
                <td>{r.module_key}</td>
<td>
  <span
    className={`status-pill ${r.under_maintenance ? "inactive" : "active"}`}
  >
    {r.under_maintenance ? "Under Maintenance" : "Active"}
  </span>
</td>
<td>{r.message}</td>
<td className="mono">{r.updated_at}</td>
<td className="actions">
  <button
    className={`ws-btn ${r.under_maintenance ? "primary" : "danger"}`}
    onClick={() => openConfirm(r)}
  >
    {r.under_maintenance ? "Disable Maintenance" : "Enable Maintenance"}
  </button>
  <button
    className="ad-icon"
    title="Edit message"
    onClick={() => setModal({ open: true, data: r })}
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
      )}

      {/* 🔹 Confirm Maintenance Modal */}
      {confirmModal.open && (
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
      )}
    </section>
  );
}
