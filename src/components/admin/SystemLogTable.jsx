// ===============================
// SystemLogTable.jsx — With Permission Popup (CSS Preserved)
// ===============================
import React from "react";
import { fmtDate, StatusPill } from "./helpers";
import {
  getSystemLogs,
  deleteSystemLog,
  deleteSystemLogs,
} from "../../api/api";
import { usePermission } from "../../hooks/usePermission";

export default function SystemLogTable() {
  // ===============================
  // 🔹 STATES
  // ===============================
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [selectedLogs, setSelectedLogs] = React.useState(new Set());
  const [noAccessModal, setNoAccessModal] = React.useState({
    open: false,
    message: "",
  });

  // filters
  const [q, setQ] = React.useState("");
  const [action, setAction] = React.useState("all");
  const [status, setStatus] = React.useState("all");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");

  // sorting
  const [sortBy, setSortBy] = React.useState("created_at");
  const [sortDir, setSortDir] = React.useState("desc");

  // paging
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  // permissions
  const { level: permission, canRead, canWrite, loading: permLoading } =
    usePermission("SYSTEM_LOGS");

  // ===============================
  // 🔹 LOAD LOGS
  // ===============================
  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSystemLogs();
      setRows(data);
    } catch (err) {
      console.error("❌ Failed to load system logs:", err);
      setError("Failed to load system logs");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!permLoading && canRead) loadLogs();
  }, [permLoading, canRead]);

  // ===============================
  // 🔹 PERMISSION CHECK
  // ===============================
  const requireWrite = (actionName = "modify") => {
    if (!canWrite) {
      setNoAccessModal({
        open: true,
        message: `You don't have permission to ${actionName} system logs.`,
      });
      return false;
    }
    return true;
  };

  // ===============================
  // 🔹 DELETE SINGLE / MULTIPLE
  // ===============================
  const deleteLog = async (logId) => {
    if (!requireWrite("delete")) return;
    if (!window.confirm("Are you sure you want to delete this log?")) return;

    try {
      await deleteSystemLog(logId);
      setRows((old) => old.filter((r) => r.logid !== logId));
    } catch (err) {
      console.error("❌ Failed to delete log:", err);
      setError("Failed to delete log");
    }
  };

  const deleteSelectedLogs = async () => {
    if (!requireWrite("delete")) return;
    if (selectedLogs.size === 0) return;

    if (
      !window.confirm(`Are you sure you want to delete ${selectedLogs.size} logs?`)
    )
      return;

    try {
      await deleteSystemLogs(Array.from(selectedLogs));
      setRows((old) => old.filter((r) => !selectedLogs.has(r.logid)));
      setSelectedLogs(new Set());
    } catch (err) {
      console.error("❌ Failed to delete logs:", err);
      setError("Failed to delete logs");
    }
  };

  // ===============================
  // 🔹 FILTERS / SORT / PAGINATION
  // ===============================
  const filtered = rows.filter((r) => {
    if (q) {
      const hay = `${r.logid} ${r.action_type} ${r.username} ${r.userid} ${r.details} ${r.ip_address} ${r.browser_info}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    if (action !== "all" && r.action_type !== action) return false;
    if (status !== "all" && r.status !== status) return false;
    if (from && new Date(r.created_at) < new Date(from)) return false;
    if (to && new Date(r.created_at) > new Date(to)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    const A = a[sortBy],
      B = b[sortBy];
    if (sortBy === "created_at") return (new Date(A) - new Date(B)) * dir;
    return String(A).localeCompare(String(B)) * dir;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSelectAll = () => {
    if (selectedLogs.size === pageRows.length) setSelectedLogs(new Set());
    else setSelectedLogs(new Set(pageRows.map((r) => r.logid)));
  };

  const toggleLogSelection = (logId) => {
    const newSet = new Set(selectedLogs);
    newSet.has(logId) ? newSet.delete(logId) : newSet.add(logId);
    setSelectedLogs(newSet);
  };

  const setSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const downloadCSV = () => {
    const header = [
      "logid",
      "action_type",
      "username",
      "userid",
      "details",
      "ip_address",
      "browser_info",
      "status",
      "created_at",
    ];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const body = sorted.map((r) => header.map((h) => esc(r[h])).join(",")).join("\n");
    const csv = header.join(",") + "\n" + body;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "system_logs.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ===============================
  // 🔹 CONDITIONAL RENDERS
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
          You don’t have permission to view System Logs.
        </p>
      </section>
    );

  // ===============================
  // 🔹 RENDER MAIN
  // ===============================
  return (
    <div className="adm-card">
      {error && (
        <div className="ad-alert error" style={{ marginBottom: "1rem" }}>
          {error}
          <button
            onClick={() => setError(null)}
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
        <div className="adm-title">System Log</div>
        <div className="adm-tools">
          <input
            className="adm-input"
            placeholder="Search logs…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="adm-select"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All actions</option>
            <option value="login">login</option>
            <option value="logout">logout</option>
            <option value="create">create</option>
            <option value="update">update</option>
            <option value="delete">delete</option>
          </select>
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

          <input
            className="adm-input"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
          <span className="adm-date-sep">–</span>
          <input
            className="adm-input"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />

          {selectedLogs.size > 0 && canWrite && (
            <button className="ws-btn danger" onClick={deleteSelectedLogs}>
              Delete ({selectedLogs.size})
            </button>
          )}
          <button className="ws-btn ghost" onClick={downloadCSV}>
            Export CSV
          </button>
        </div>
      </header>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={pageRows.length > 0 && selectedLogs.size === pageRows.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th onClick={() => setSort("logid")}>logID</th>
              <th onClick={() => setSort("action_type")}>action_type</th>
              <th onClick={() => setSort("username")}>user</th>
              <th>details</th>
              <th onClick={() => setSort("ip_address")}>ip_address</th>
              <th>browser_info</th>
              <th onClick={() => setSort("status")}>status</th>
              <th onClick={() => setSort("created_at")}>created_at</th>
              <th>actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10}>
                  <div className="adm-center">
                    <div className="sc-spinner" />
                  </div>
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  <div className="adm-empty">No logs found</div>
                </td>
              </tr>
            ) : (
              pageRows.map((r) => (
                <tr key={r.logid}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedLogs.has(r.logid)}
                      onChange={() => toggleLogSelection(r.logid)}
                    />
                  </td>
                  <td data-label="logID">#{r.logid}</td>
                  <td>{r.action_type}</td>
                  <td>
                    <div className="adm-user">
                      <div className="avatar sm" aria-hidden>
                        🧑
                      </div>
                      <div>
                        <div className="name">{r.username || "System"}</div>
                        <div className="muted">
                          {r.userid ? `ID: ${r.userid}` : "System"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="truncate">{r.details}</td>
                  <td>{r.ip_address}</td>
                  <td className="muted">{r.browser_info}</td>
                  <td>
                    <StatusPill value={r.status} />
                  </td>
                  <td className="muted">{fmtDate(r.created_at)}</td>
                  <td className="actions">
                    <button
                      className="ws-btn danger sm"
                      title={canWrite ? "Delete" : "Read-only"}
                      disabled={!canWrite}
                      onClick={() =>
                        canWrite
                          ? deleteLog(r.logid)
                          : setNoAccessModal({
                              open: true,
                              message:
                                "You don't have permission to delete system logs.",
                            })
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="adm-foot">
        <div>
          Page {safePage}/{totalPages} • {sorted.length} total logs
        </div>
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
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </footer>

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
