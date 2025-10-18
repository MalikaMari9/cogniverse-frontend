// ===============================
// AccessConfig.jsx
// ===============================
import React from "react";
import { fmtDate } from "./helpers";

export default function AccessConfig({ Icon }) {
  const seed = [
    { configID: 1, config_key: "auth.maxLoginAttempts", config_value: "5", description: "Rate limit for bad credentials", status: "active", created_at: "2025-01-14 09:22", updated_at: "2025-06-02 18:11" },
    { configID: 2, config_key: "ui.theme.default", config_value: "dark", description: "Default theme for new users", status: "active", created_at: "2025-02-08 10:00", updated_at: "2025-06-03 08:00" },
    { configID: 3, config_key: "jobs.queue.concurrency", config_value: "8", description: "Worker pool size", status: "inactive", created_at: "2025-03-01 11:45", updated_at: "2025-03-12 15:40" },
  ];

  const [rows, setRows] = React.useState(seed);
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [modal, setModal] = React.useState({ open: false, data: null });
  const [page, setPage] = React.useState(1);
  const pageSize = 8;

  const filtered = rows.filter(r =>
    (status === "all" || r.status === status) &&
    (q.trim() === "" || Object.values(r).some(v => String(v).toLowerCase().includes(q.toLowerCase())))
  );
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openEdit = (r) => setModal({ open: true, data: r });
  const delRow = (id) => setRows(old => old.filter(r => r.configID !== id));

  return (
    <section className="ad-card ws-card">
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>config_key</th>
              <th>config_value</th>
              <th>Description</th>
              <th>Status</th>
              <th>Created</th>
              <th>Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map(r => (
              <tr key={r.configID}>
                <td className="mono">{r.configID}</td>
                <td className="mono">{r.config_key}</td>
                <td className="mono">{r.config_value}</td>
                <td>{r.description}</td>
                <td><span className={`ad-chip ${r.status}`}>{r.status}</span></td>
                <td className="mono">{r.created_at}</td>
                <td className="mono">{r.updated_at}</td>
                <td className="actions">
                  <button className="ad-icon" title="Edit" onClick={() => openEdit(r)}><Icon name="edit" /></button>
                  <button className="ad-icon danger" title="Delete" onClick={() => delRow(r.configID)}><Icon name="trash" /></button>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && <tr><td colSpan={8} className="ad-empty">No configs match your filters.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="ad-pager">
        <button className="ws-btn ghost" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
        <div className="ad-pagebar">Page {page} / {pages}</div>
        <button className="ws-btn ghost" disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))}>Next</button>
      </div>
    </section>
  );
}
