import React from "react";
import { fmtDate,StatusPill } from "./helpers";

export default function SystemLogTable() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

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

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);

      /* Replace mock with your backend:
         const resp = await fetch(`/api/admin/logs`);
         const data = await resp.json();
      */
      // --- mock data (remove when wired) ---
      const actions = ["login", "logout", "create", "update", "delete"];
      const statuses = ["success", "failed", "pending"];
      const mock = Array.from({ length: 63 }).map((_, i) => ({
        logID: 1000 + i,
        action_type: actions[Math.floor(Math.random() * actions.length)],
        userID: `user_${(i % 8) + 1}`,
        username: ["Nova", "Orion", "Pixel", "Volt", "Sable", "Aurora", "Quark", "Atlas"][i % 8],
        details: i % 5 === 0 ? "IP throttling triggered" : "OK",
        ip_address: `10.0.0.${(i % 245) + 1}`,
        browser_info: ["Chrome", "Firefox", "Safari", "Edge"][i % 4] + " 121",
        status: statuses[Math.floor(Math.random() * statuses.length)],
        created_at: new Date(Date.now() - i * 3600_000).toISOString(),
      }));
      const data = mock;
      // -------------------------------------

      if (!alive) return;
      setRows(data);
      setLoading(false);
    })();

    return () => { alive = false; };
  }, []);

  // apply filters
  const filtered = rows.filter(r => {
    if (q) {
      const hay = `${r.logID} ${r.action_type} ${r.username} ${r.userID} ${r.details} ${r.ip_address} ${r.browser_info}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    if (action !== "all" && r.action_type !== action) return false;
    if (status !== "all" && r.status !== status) return false;

    if (from) { if (new Date(r.created_at) < new Date(from)) return false; }
    if (to)   { if (new Date(r.created_at) > new Date(to))   return false; }

    return true;
  });

  // sort
  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    const A = a[sortBy]; const B = b[sortBy];
    if (sortBy === "created_at") return (new Date(A) - new Date(B)) * dir;
    if (typeof A === "number" && typeof B === "number") return (A - B) * dir;
    return String(A).localeCompare(String(B)) * dir;
  });

  // paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const setSort = (key) => {
    if (sortBy === key) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(key); setSortDir("asc"); }
  };

  return (
    <div className="adm-card">
      <header className="adm-head">
        <div className="adm-title">System Log</div>
        <div className="adm-tools">
          <input
            className="adm-input"
            placeholder="Search logs…"
            value={q}
            onChange={(e)=>{ setQ(e.target.value); setPage(1); }}
          />
          <select className="adm-select" value={action} onChange={(e)=>{ setAction(e.target.value); setPage(1); }}>
            <option value="all">All actions</option>
            <option value="login">login</option>
            <option value="logout">logout</option>
            <option value="create">create</option>
            <option value="update">update</option>
            <option value="delete">delete</option>
          </select>
          <select className="adm-select" value={status} onChange={(e)=>{ setStatus(e.target.value); setPage(1); }}>
            <option value="all">All status</option>
            <option value="success">success</option>
            <option value="failed">failed</option>
            <option value="pending">pending</option>
          </select>

          <input className="adm-input" type="date" value={from} onChange={(e)=>{ setFrom(e.target.value); setPage(1); }} />
          <span className="adm-date-sep">–</span>
          <input className="adm-input" type="date" value={to} onChange={(e)=>{ setTo(e.target.value); setPage(1); }} />
        </div>
      </header>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th onClick={()=>setSort("logID")}        aria-sort={sortBy==="logID"?sortDir:"none"}>logID</th>
              <th onClick={()=>setSort("action_type")}  aria-sort={sortBy==="action_type"?sortDir:"none"}>action_type</th>
              <th onClick={()=>setSort("username")}     aria-sort={sortBy==="username"?sortDir:"none"}>user</th>
              <th>details</th>
              <th onClick={()=>setSort("ip_address")}   aria-sort={sortBy==="ip_address"?sortDir:"none"}>ip_address</th>
              <th>browser_info</th>
              <th onClick={()=>setSort("status")}       aria-sort={sortBy==="status"?sortDir:"none"}>status</th>
              <th onClick={()=>setSort("created_at")}   aria-sort={sortBy==="created_at"?sortDir:"none"}>created_at</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8}><div className="adm-center"><div className="sc-spinner" /></div></td></tr>
            ) : pageRows.length === 0 ? (
              <tr><td colSpan={8}><div className="adm-empty">No logs found</div></td></tr>
            ) : (
              pageRows.map(r => (
                <tr key={r.logID}>
                  <td data-label="logID">#{r.logID}</td>
                  <td data-label="action">{r.action_type}</td>
                  <td data-label="user">
                    <div className="adm-user">
                      <div className="avatar sm" aria-hidden>🧑</div>
                      <div>
                        <div className="name">{r.username}</div>
                        <div className="muted">{r.userID}</div>
                      </div>
                    </div>
                  </td>
                  <td data-label="details" className="truncate">{r.details}</td>
                  <td data-label="ip">{r.ip_address}</td>
                  <td data-label="browser" className="muted">{r.browser_info}</td>
                  <td data-label="status"><StatusPill value={r.status} /></td>
                  <td data-label="time" className="muted">{fmtDate(r.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="adm-foot">
        <div>Page {safePage}/{totalPages}</div>
        <div className="adm-pager">
          <button className="ws-btn ghost" disabled={safePage<=1}
                  onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
          <button className="ws-btn ghost" disabled={safePage>=totalPages}
                  onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</button>
        </div>
      </footer>
    </div>
  );
}
