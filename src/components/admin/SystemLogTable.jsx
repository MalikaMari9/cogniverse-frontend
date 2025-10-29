// ===============================
// SystemLogTable.jsx — With Permission Popup + Client modal
// ===============================
import React from "react";
import { fmtDate } from "./helpers";
import {
  getSystemLogs,
  deleteSystemLog,
  deleteSystemLogs,
} from "../../api/api";
import { usePermission } from "../../hooks/usePermission";
import ModalPortal from "./ModalPortal";

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
const [debouncedQ, setDebouncedQ] = React.useState("");

  // NEW: Client modal state
  const [clientModal, setClientModal] = React.useState({
    open: false,
    row: null,
  }); // NEW

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
  const [totalPages, setTotalPages] = React.useState(1);
  const pageSize = 10;

  // permissions
  const { level: permission, canRead, canWrite, loading: permLoading } =
    usePermission("SYSTEM_LOGS");

  const [limit, setLimit] = React.useState(10);
  const [total, setTotal] = React.useState(0);

  const loadLogs = async (pageParam = page) => {
    try {
      setLoading(true);
      setError(null);

      const params = { 
  page: pageParam,
    ...(debouncedQ && { q: debouncedQ }),
 };
      const res = await getSystemLogs(params);

      setRows(res.items || []);
      setPage(res.page);
      setTotalPages(res.total_pages);
      setLimit(res.limit);
      setTotal(res.total);
    } catch (err) {
      console.error("❌ Failed to load system logs:", err);
      setError("Failed to load system logs");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
  const handler = setTimeout(() => setDebouncedQ(q), 500);
  return () => clearTimeout(handler);
}, [q]);

  React.useEffect(() => {
    if (!permLoading && canRead) loadLogs(page);
  }, [permLoading, canRead, page]);
React.useEffect(() => {
  if (!permLoading && canRead) {
    setPage(1);
    loadLogs(1);
  }
}, [debouncedQ, action, status, from, to]);


  React.useEffect(() => {
    document.body.classList.toggle("modal-open", !!(noAccessModal.open || clientModal.open));
  }, [noAccessModal.open, clientModal.open]); // NEW: include clientModal

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

    if (!window.confirm(`Are you sure you want to delete ${selectedLogs.size} logs?`))
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
 

  const safePage = Math.min(page, totalPages);
  const pageRows = rows; // backend already paginated

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
    // NOTE: Keep ip_address + browser_info in CSV even though table combines them
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
    const body = rows.map((r) => header.map((h) => esc(r[h])).join(",")).join("\n");
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

  // helpers – open/close client modal
  const openClientModal = (row) => setClientModal({ open: true, row }); // NEW
  const closeClientModal = () => setClientModal({ open: false, row: null }); // NEW

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
    <section className="ad-card ws-card">
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

      <div
        className="ad-table-wrap system-logs"
        style={{ overflowX: "auto", overflowY: "visible", maxWidth: "100%" }} // ensures L↔R scroll
      >
<table
  className="ad-table system-logs"
  style={{ width: "max-content", minWidth: "100%", tableLayout: "auto" }}
>

          <thead>
            <tr>
              <th onClick={() => setSort("logid")}>logID</th>
              <th onClick={() => setSort("action_type")}>action_type</th>
              <th onClick={() => setSort("username")}>user</th>
              <th>details</th>

              {/* CHANGED: combine IP + Browser into "client" */}
              <th /* sortable by ip_address for consistency */ onClick={() => setSort("ip_address")}>
                client
              </th>

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
              pageRows.map((r) => {
                const ip = r.ip_address || "—";
                const br = r.browser_info || "—";
                const clientShort =
                  ip !== "—" && br !== "—"
                    ? `${ip} · ${String(br).slice(0, 22)}${String(br).length > 22 ? "…" : ""}`
                    : ip !== "—"
                    ? ip
                    : br;

                return (
                  <tr key={r.logid}>
                    <td className="mono" data-label="logID">
                      #{r.logid}
                    </td>

                    <td className="mono truncate" data-label="Action" title={r.action_type}>
                      <span className="truncate">{r.action_type}</span>
                    </td>

                    <td className="mono truncate" data-label="User" title={r.username || "System"}>
                      <span className="truncate">{r.username || "System"}</span>
                    </td>

                    <td className="mono truncate" data-label="Details" title={r.details}>
                      <span className="truncate">{r.details || "—"}</span>
                    </td>

                    {/* NEW: single Client cell opens modal */}
                    <td
                      className="mono truncate"
                      data-label="Client"
                      title={`${ip} • ${br}`}
                    >
                      <button
                        type="button"
                        onClick={() => openClientModal(r)}
                        className="ws-btn ghost"
                        style={{
                          padding: "6px 8px",
                          borderRadius: 8,
                          whiteSpace: "nowrap",
                        }}
                        title="View client details"
                      >
                        {clientShort}
                      </button>
                    </td>

                    <td
                      className="mono truncate"
                      data-label="Date"
                      title={fmtDate(r.created_at)}
                    >
                      <span className="truncate">{fmtDate(r.created_at)}</span>
                    </td>

                    <td className="actions" data-label="Actions">
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <footer className="adm-foot">
        <div>
          Page {safePage}/{totalPages} • {total} total logs
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

      {/* 🔹 Client Details Modal (IP + Browser) */}
      {clientModal.open && clientModal.row && (
        <ModalPortal>
          <div className="ad-modal">
            <div className="ad-modal-content ws-card">
              <h3 style={{ marginBottom: 8 }}>Client details</h3>
              <div style={{ display: "grid", gap: 8 }}>
                <label>
                  <span style={{ fontWeight: 700, opacity: 0.8 }}>IP address</span>
                  <input
                    readOnly
                    value={clientModal.row.ip_address || "—"}
                    style={{ width: "100%" }}
                  />
                </label>
                <label>
                  <span style={{ fontWeight: 700, opacity: 0.8 }}>Browser / User agent</span>
                  <textarea
                    readOnly
                    rows={4}
                    value={clientModal.row.browser_info || "—"}
                    style={{ width: "100%", resize: "vertical" }}
                  />
                </label>
              </div>
              <div className="modal-actions">
                <button className="ws-btn ghost" onClick={closeClientModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </section>
  );
}
