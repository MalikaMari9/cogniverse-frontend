// ===============================
// CreditTransactionTable.jsx — Admin Credit Transaction Logs
// ===============================
import React from "react";
import { fmtDate, StatusPill } from "./helpers";
import { getCreditTransactions } from "../../api/api";
import { usePermission } from "../../hooks/usePermission";

export default function CreditTransactionTable({ Icon }) {
  // ────────────────────────────────────────────────
  // 🔹 STATES
  // ────────────────────────────────────────────────
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(null);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("all");

  const { canRead, loading: permLoading } = usePermission("CREDIT_TRANSACTIONS");

  // ────────────────────────────────────────────────
  // 🔹 LOAD TRANSACTIONS
  // ────────────────────────────────────────────────
  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      const params = { page };
      const data = await getCreditTransactions(params);

      setRows(data.items || []);
      setTotal(data.total || 0);
      setLimit(data.limit || null);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error("❌ Failed to load transactions:", err);
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!permLoading && canRead) loadTransactions();
  }, [permLoading, canRead, page]);

  // ────────────────────────────────────────────────
  // 🔹 FILTERS
  // ────────────────────────────────────────────────
  const filtered = rows.filter((r) => {
    if (q) {
      const hay = `${r.username} ${r.packid} ${r.reason} ${r.status} ${r.credit_type}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    if (status !== "all" && r.status !== status) return false;
    return true;
  });

  // ────────────────────────────────────────────────
  // 🔹 CONDITIONAL PERMISSION RENDER
  // ────────────────────────────────────────────────
  if (permLoading)
    return (
      <section className="ad-card ws-card">
        <div className="ad-loading">Checking permissions...</div>
      </section>
    );

  if (!canRead)
    return (
      <section className="ad-card ws-card ad-empty">
        <h2 style={{ color: "var(--ink-1)" }}>Access Denied</h2>
        <p style={{ color: "var(--ink-3)", marginTop: 6 }}>
          You don’t have permission to view Credit Transactions.
        </p>
      </section>
    );

  // ────────────────────────────────────────────────
  // 🔹 MAIN RENDER
  // ────────────────────────────────────────────────
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
        <div className="adm-title">Credit Transactions</div>
        <div className="adm-tools">
          <input
            className="adm-input"
            placeholder="Search username / pack / status / reason…"
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
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <button className="ws-btn ghost" onClick={loadTransactions}>
            <Icon name="refresh" /> Refresh
          </button>
        </div>
      </header>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Credit Type</th>
              <th>Pack</th>
              <th>USD Paid</th>
              <th>Amount (Credits)</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Stripe Intent</th>
              <th>Stripe Session</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11}>
                  <div className="adm-center">
                    <div className="sc-spinner" />
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={11}>
                  <div className="adm-empty">No transactions found</div>
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.transactionid}>
                  <td>#{r.transactionid}</td>
                  <td>{r.username || "—"}</td>
                  <td>{r.credit_type}</td>
                  <td>{r.packid || "—"}</td>
                  <td>
  {r.amount_paid_usd
    ? `$${parseFloat(r.amount_paid_usd).toFixed(2)}`
    : "—"}
</td>

                  <td>{r.amount}</td>
                  <td>{r.reason || "—"}</td>
                  <td>
                    <StatusPill value={r.status} />
                  </td>
                  <td className="mono truncate" title={r.stripe_payment_intent_id}>
                    {r.stripe_payment_intent_id || "—"}
                  </td>
                  <td className="mono truncate" title={r.stripe_session_id}>
                    {r.stripe_session_id || "—"}
                  </td>
                  <td className="mono">{fmtDate(r.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="adm-foot">
        <div>
          Page {page}/{totalPages} • showing {limit ?? "?"} per page • {total} total
        </div>
        <div className="adm-pager">
          <button
            className="ws-btn ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <button
            className="ws-btn ghost"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </footer>
    </div>
  );
}
