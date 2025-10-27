// ===============================
// CreditConfig.jsx — Admin Control for Credit Packs (Enhanced)
// ===============================

import React from "react";
import { fmtDate } from "./helpers";
import {
  getAllCreditConfigs,
  createCreditConfig,
  updateCreditConfig,
  deleteCreditConfig,
} from "../../api/api";
import { usePermission } from "../../hooks/usePermission";

export default function CreditConfig({ Icon }) {
  const [rows, setRows] = React.useState([]);
  const [q, setQ] = React.useState("");
  const [modal, setModal] = React.useState({ open: false, data: null });
  const [addModal, setAddModal] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [showArchived, setShowArchived] = React.useState(false);

  const [noAccessModal, setNoAccessModal] = React.useState({
    open: false,
    message: "",
  });

  const pageSize = 8;
  const { level: permission, canRead, canWrite, loading: permLoading } =
    usePermission("CREDIT_PACK");

  // 🔹 Fetch credit packs
  React.useEffect(() => {
    if (!permLoading && canRead) fetchCreditConfigs();
  }, [permLoading, canRead]);

  const fetchCreditConfigs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAllCreditConfigs();
      const data = res.map((p) => ({
        id: p.creditid,
        config_key: p.config_key,
        credits: p.config_value?.credits,
        price: p.config_value?.base_price_usd,
        discount: p.config_value?.discount_percent,
        badge: p.config_value?.badge,
        stripe_id: p.config_value?.stripe_price_id,
        description: p.description,
        status: p.status,
        created_at: fmtDate(p.created_at),
        updated_at: p.updated_at ? fmtDate(p.updated_at) : "-",
      }));
      setRows(data);
    } catch (err) {
      console.error("❌ Failed to fetch credit configs:", err);
      setError("Failed to load credit packs.");
    } finally {
      setLoading(false);
    }
  };

  const requireWrite = (action = "modify") => {
    if (!canWrite) {
      setNoAccessModal({
        open: true,
        message: `You don't have permission to ${action} credit packs.`,
      });
      return false;
    }
    return true;
  };

  // 🔹 Add new pack
  const handleAdd = async (newData) => {
    if (!requireWrite("add")) return;
    try {
      await createCreditConfig({
        ...newData,
        config_value: {
          name: newData.name,
          credits: parseInt(newData.credits, 10),
          base_price_usd: parseFloat(newData.price),
          discount_percent: parseFloat(newData.discount || 0),
          badge: newData.badge || "",
          stripe_price_id: newData.stripe_id || "",
          tone: "teal",
        },
        description: newData.description,
      });
      await fetchCreditConfigs();
      setAddModal(false);
    } catch (err) {
      console.error("❌ Failed to add credit config:", err);
      alert("Failed to add credit pack.");
    }
  };

  // 🔹 Update pack
  const handleUpdate = async (pack) => {
    if (!requireWrite("update")) return;
    try {
      await updateCreditConfig(pack.id, {
        config_value: {
          name: pack.name || pack.config_key,
          credits: parseInt(pack.credits, 10),
          base_price_usd: parseFloat(pack.price),
          discount_percent: parseFloat(pack.discount),
          badge: pack.badge,
          stripe_price_id: pack.stripe_id,
          tone: "teal",
        },
        description: pack.description,
      });
      await fetchCreditConfigs();
    } catch (err) {
      console.error("❌ Failed to update credit pack:", err);
      alert("Failed to update credit pack.");
    }
  };

  // 🔹 Delete
  const delRow = async (id) => {
    if (!requireWrite("delete")) return;
    if (!window.confirm("Delete this credit pack?")) return;
    try {
      await deleteCreditConfig(id);
      await fetchCreditConfigs();
    } catch (err) {
      console.error("❌ Failed to delete credit pack:", err);
      alert("Failed to delete credit pack.");
    }
  };
  // 🔹 Handle dropdown status change
const handleStatusChange = async (r, newStatus) => {
  if (!requireWrite("update")) return;
  try {
    await updateCreditConfig(r.id, {
      status: newStatus,
      config_value: {
        name: r.name || r.config_key,
        credits: parseInt(r.credits, 10),
        base_price_usd: parseFloat(r.price),
        discount_percent: parseFloat(r.discount),
        badge: r.badge,
        stripe_price_id: r.stripe_id,
        tone: "teal",
      },
      description: r.description,
    });
    await fetchCreditConfigs();
  } catch (err) {
    console.error("❌ Failed to update status:", err);
    alert("Failed to update status.");
  }
};




  // 🔹 Search + pagination
 const filtered = rows.filter((r) => {
  const matchesSearch =
    q.trim() === "" ||
    [r.config_key, r.description, r.status, r.stripe_id]
      .join(" ")
      .toLowerCase()
      .includes(q.toLowerCase());

  // ✅ Hide archived packs unless toggle is on
  const visible = showArchived || r.status !== "archived";

  return matchesSearch && visible;
});

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  // 🔹 Modal handlers
  const openEdit = (r) => setModal({ open: true, data: r });
  const closeModal = () => setModal({ open: false, data: null });
  const saveModal = () => {
    if (modal.data) handleUpdate(modal.data);
    closeModal();
  };

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
          You don’t have permission to view Credit Packs.
        </p>
      </section>
    );

  return (
    <section className="ad-card ws-card">
      {/* 🔹 Topbar */}
      <div
        className="ad-topbar"
        style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}
      >
        <div className="ad-toggle" style={{ display: "flex", alignItems: "center", marginLeft: 16 }}>
  <input
    type="checkbox"
    id="showArchived"
    checked={showArchived}
    onChange={(e) => setShowArchived(e.target.checked)}
    style={{ marginRight: 6, cursor: "pointer" }}
  />
  <label htmlFor="showArchived" style={{ fontSize: "0.9rem", color: "var(--ink-2)", cursor: "pointer" }}>
    Show Archived
  </label>
</div>

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
            placeholder="Search credit packs..."
          />
          {q && (
            <button
              className="ws-search-clear"
              onClick={() => setQ("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <button
          className="ws-btn primary"
          onClick={() =>
            canWrite
              ? setAddModal(true)
              : setNoAccessModal({
                  open: true,
                  message: "You don't have permission to add credit packs.",
                })
          }
          style={{ marginLeft: "auto" }}
          disabled={!canWrite}
        >
          + Add Pack
        </button>
      </div>

      {/* 🔹 Table */}
      {loading && <div className="ad-loading">Loading credit packs...</div>}
      {error && <div className="ad-error">{error}</div>}

      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Key</th>
              <th>Credits</th>
              <th>Price ($)</th>
              <th>Discount (%)</th>
              <th>Badge</th>
              <th>Description</th>
              <th>Stripe ID</th> 
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.id}>
                <td className="mono" data-label="ID">{r.id}</td>
                <td className="mono" data-label="Key">{r.config_key}</td>
                <td className="mono" data-label="Credits">{r.credits}</td>
                <td className="mono" data-label="Price">{r.price}</td>
                <td className="mono" data-label="Discount">{r.discount}</td>
                <td className="mono" data-label="Badge">{r.badge}</td>
                <td className="mono" data-label="Description">{r.description?.slice(0, 25) || "-"}</td>
 
                <td className="mono"  data-label="Stripe ID">{r.stripe_id}</td>
                <td className="mono"  data-label="Status">
  <select
    className="ad-select"
    value={r.status}
    onChange={(e) =>
      handleStatusChange(r, e.target.value)
    }
    disabled={!canWrite}
    style={{
      background: "var(--chip-bg)",
      borderRadius: "8px",
      padding: "4px 8px",
      border: "1px solid var(--glass-bdr)",
      color: "var(--ink-1)",
      cursor: canWrite ? "pointer" : "not-allowed",
    }}
  >
    <option value="active">Active</option>
    <option value="inactive">Inactive</option>
    <option value="archived">Archived</option>
  </select>
</td >


                <td className="actions" data-label="Actions"> 
                  <button className="ad-icon" onClick={() => openEdit(r)}>
                    <Icon name="edit" />
                  </button>
                  <button className="ad-icon danger" onClick={() => delRow(r.id)}>
                    <Icon name="trash" />
                  </button>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && !loading && (
              <tr>
                <td colSpan={10} className="ad-empty">
                  No credit packs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 Pagination */}
      <div className="ad-pager">
        <button className="ws-btn ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Prev
        </button>
        <div className="ad-pagebar">
          Page {page} / {totalPages}
        </div>
        <button
          className="ws-btn ghost"
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>

      {/* 🔹 Edit Modal */}
      {modal.open && (
        <div className="ad-modal">
          <div className="ad-modal-content ws-card">
            <h3>Edit Credit Pack</h3>
            <label>
              Credits:
              <input
                type="number"
                value={modal.data.credits}
                onChange={(e) =>
                  setModal((m) => ({ ...m, data: { ...m.data, credits: e.target.value } }))
                }
              />
            </label>
            <label>
              Price ($):
              <input
                type="number"
                value={modal.data.price}
                onChange={(e) =>
                  setModal((m) => ({ ...m, data: { ...m.data, price: e.target.value } }))
                }
              />
            </label>
            <label>
              Discount (%):
              <input
                type="number"
                value={modal.data.discount}
                onChange={(e) =>
                  setModal((m) => ({ ...m, data: { ...m.data, discount: e.target.value } }))
                }
              />
            </label>
            <label>
              Badge:
              <input
                type="text"
                value={modal.data.badge}
                onChange={(e) =>
                  setModal((m) => ({ ...m, data: { ...m.data, badge: e.target.value } }))
                }
              />
            </label>
            <label>
              Stripe Price ID:
              <input
                type="text"
                value={modal.data.stripe_id}
                onChange={(e) =>
                  setModal((m) => ({ ...m, data: { ...m.data, stripe_id: e.target.value } }))
                }
              />
            </label>
            <label>
              Description:
              <textarea
                value={modal.data.description}
                onChange={(e) =>
                  setModal((m) => ({ ...m, data: { ...m.data, description: e.target.value } }))
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

      {/* 🔹 Add Modal */}
      {addModal && (
        <div className="ad-modal">
          <div className="ad-modal-content ws-card">
            <h3>Add Credit Pack</h3>
            <AddCreditPackForm onCancel={() => setAddModal(false)} onSubmit={handleAdd} />
          </div>
        </div>
      )}

      {/* 🔹 Access Modal */}
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

// ---------------- Add Modal Form ----------------
function AddCreditPackForm({ onSubmit, onCancel }) {
  const [form, setForm] = React.useState({
    config_key: "",
    name: "",
    credits: "",
    price: "",
    discount: "",
    badge: "",
    stripe_id: "",
    description: "",
  });

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.config_key.trim()) {
      alert("Pack key is required.");
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={submit}>
      <label>
        Key:
        <input name="config_key" value={form.config_key} onChange={handle} required />
      </label>
      <label>
        Name:
        <input name="name" value={form.name} onChange={handle} required />
      </label>
      <label>
        Credits:
        <input name="credits" type="number" value={form.credits} onChange={handle} required />
      </label>
      <label>
        Price ($):
        <input name="price" type="number" value={form.price} onChange={handle} required />
      </label>
      <label>
        Discount (%):
        <input name="discount" type="number" value={form.discount} onChange={handle} />
      </label>
      <label>
        Badge:
        <input name="badge" value={form.badge} onChange={handle} />
      </label>
      <label>
        Stripe Price ID:
        <input name="stripe_id" value={form.stripe_id} onChange={handle} />
      </label>
      <label>
        Description:
        <textarea name="description" value={form.description} onChange={handle} />
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
