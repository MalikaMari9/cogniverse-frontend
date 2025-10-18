// ===============================
// AccessConfig.jsx
// ===============================
import React from "react";
import { fmtDate } from "./helpers";
import {
  getAllConfigs,
  createConfig,
  updateConfig,
  deleteConfig,
} from "../../api/api";

export default function AccessConfig({ Icon }) {
  // ===============================
  // 🔹 STATES
  // ===============================
  const [rows, setRows] = React.useState([]);
  const [q, setQ] = React.useState("");
  const [modal, setModal] = React.useState({ open: false, data: null });
  const [addModal, setAddModal] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const pageSize = 8;

  // ===============================
  // 🔹 FETCH CONFIGS
  // ===============================
  React.useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAllConfigs();
      const data = res.map((item) => ({
        configID: item.configid,
        config_key: item.config_key,
        config_value: item.config_value,
        description: item.description,
        created_at: fmtDate(item.created_at),
        updated_at: item.updated_at ? fmtDate(item.updated_at) : "-",
      }));
      setRows(data);
    } catch (err) {
      console.error("❌ Failed to fetch configs:", err);
      setError("Failed to load configurations. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // 🔹 ADD CONFIG
  // ===============================
  const handleAdd = async (newData) => {
    try {
      await createConfig(newData);
      await fetchConfigs();
      setAddModal(false);
    } catch (err) {
      console.error("❌ Failed to add config:", err);
      alert("Failed to add configuration.");
    }
  };

  // ===============================
  // 🔹 UPDATE CONFIG
  // ===============================
  const handleUpdate = async (config) => {
    try {
      await updateConfig(config.configID, {
        config_value: config.config_value,
        description: config.description,
      });
      await fetchConfigs();
    } catch (err) {
      console.error("❌ Failed to update config:", err);
      alert("Failed to update configuration.");
    }
  };

  // ===============================
  // 🔹 DELETE CONFIG
  // ===============================
  const delRow = async (id) => {
    if (!window.confirm("Are you sure you want to delete this config?")) return;
    try {
      await deleteConfig(id);
      await fetchConfigs();
    } catch (err) {
      console.error("❌ Failed to delete config:", err);
      alert("Failed to delete configuration.");
    }
  };

  // ===============================
  // 🔹 FILTER + PAGINATION
  // ===============================
  const filtered = rows.filter(
    (r) =>
      q.trim() === "" ||
      [r.config_key, r.config_value, r.description]
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  // ===============================
  // 🔹 MODAL HANDLERS
  // ===============================
  const openEdit = (r) => setModal({ open: true, data: r });
  const closeModal = () => setModal({ open: false, data: null });
  const saveModal = () => {
    if (modal.data) handleUpdate(modal.data);
    closeModal();
  };

  // ===============================
  // 🔹 RENDER
  // ===============================
  return (
    <section className="ad-card ws-card">
      {/* Header controls */}
      <div
        className="ad-topbar"
        style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}
      >
        <div className="ws-search" style={{ flex: 1, maxWidth: 280 }}>
          <span className="ico">
            <Icon name="search" />
          </span>
          <input
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search configs..."
            aria-label="Search configs"
          />
          {q && (
            <button
              className="ws-search-clear"
              onClick={() => {
                setQ("");
                setPage(1);
              }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <button
          className="ws-btn primary"
          onClick={() => setAddModal(true)}
          style={{ marginLeft: "auto" }}
        >
          + Add Config
        </button>
      </div>

      {/* Loading/error */}
      {loading && <div className="ad-loading">Loading configurations...</div>}
      {error && <div className="ad-error">{error}</div>}

      {/* Table */}
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>config_key</th>
              <th>config_value</th>
              <th>Description</th>
              <th>Created</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.configID}>
                <td className="mono">{r.configID}</td>
                <td className="mono">{r.config_key}</td>
                <td className="mono">{r.config_value}</td>
                <td>{r.description}</td>
                <td className="mono">{r.created_at}</td>
                <td className="mono">{r.updated_at}</td>
                <td className="actions">
                  <button
                    className="ad-icon"
                    title="Edit"
                    onClick={() => openEdit(r)}
                  >
                    <Icon name="edit" />
                  </button>
                  <button
                    className="ad-icon danger"
                    title="Delete"
                    onClick={() => delRow(r.configID)}
                  >
                    <Icon name="trash" />
                  </button>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="ad-empty">
                  No configs match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="ad-pager">
        <button
          className="ws-btn ghost"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>
        <div className="ad-pagebar">
          Page {page} / {totalPages}
        </div>
        <button
          className="ws-btn ghost"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </button>
      </div>

      {/* ===============================
          🔹 EDIT MODAL
         =============================== */}
      {modal.open && (
        <div className="ad-modal">
          <div className="ad-modal-content ws-card">
            <h3>Edit Configuration</h3>
            <label>
              Value:
              <input
                type="text"
                value={modal.data.config_value}
                onChange={(e) =>
                  setModal((m) => ({
                    ...m,
                    data: { ...m.data, config_value: e.target.value },
                  }))
                }
              />
            </label>
            <label>
              Description:
              <textarea
                value={modal.data.description}
                onChange={(e) =>
                  setModal((m) => ({
                    ...m,
                    data: { ...m.data, description: e.target.value },
                  }))
                }
              />
            </label>

            <div className="modal-actions">
              <button className="ws-btn" onClick={saveModal}>
                Save
              </button>
              <button className="ws-btn ghost" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===============================
          🔹 ADD MODAL
         =============================== */}
      {addModal && (
        <div className="ad-modal">
          <div className="ad-modal-content ws-card">
            <h3>Add Configuration</h3>
            <AddConfigForm
              onCancel={() => setAddModal(false)}
              onSubmit={handleAdd}
            />
          </div>
        </div>
      )}
    </section>
  );
}

// ===============================
// 🔸 Add Config Form Component
// ===============================
function AddConfigForm({ onSubmit, onCancel }) {
  const [form, setForm] = React.useState({
    config_key: "",
    config_value: "",
    description: "",
  });

  const handle = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.config_key.trim()) {
      alert("Config key is required.");
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={submit}>
      <label>
        Key:
        <input
          name="config_key"
          value={form.config_key}
          onChange={handle}
          required
        />
      </label>
      <label>
        Value:
        <input
          name="config_value"
          value={form.config_value}
          onChange={handle}
        />
      </label>
      <label>
        Description:
        <textarea
          name="description"
          value={form.description}
          onChange={handle}
        />
      </label>

      <div className="modal-actions">
        <button className="ws-btn primary" type="submit">
          Add
        </button>
        <button className="ws-btn ghost" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
