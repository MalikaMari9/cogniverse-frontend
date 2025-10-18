import React, { useEffect, useState, useRef } from "react";
import {
  getCurrentUserFromToken,
  isAccessTokenExpired,
  refreshAccessToken,
} from "../utils/auth";

export default function SessionMonitor() {
  const [user, setUser] = useState(getCurrentUserFromToken());
  const [remaining, setRemaining] = useState(0);
  const [status, setStatus] = useState("active");
  const refreshLock = useRef(false);

  useEffect(() => {
    const tick = async () => {
      const payload = getCurrentUserFromToken();
      setUser(payload);

      if (!payload?.exp) {
        setRemaining(0);
        setStatus("expired");
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const diff = payload.exp - now;
      setRemaining(diff > 0 ? diff : 0);

      // auto refresh ~30s before expiry
      if (diff > 0 && diff < 30 && !refreshLock.current) {
        refreshLock.current = true;
        setStatus("refreshing");

        const newToken = await refreshAccessToken();
        if (newToken) {
          console.log("🔁 Token refreshed!");
          setStatus("active");
          refreshLock.current = false;
        } else {
          console.warn("⚠️ Refresh failed, logging out.");
          setStatus("expired");
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
      }

      if (diff <= 0) setStatus("expired");
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    if (seconds <= 0) return "Expired";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.reload();
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>🧭 Session Monitor (Auto Refresh)</h2>

      <div style={styles.card}>
        {user ? (
          <>
            <p><b>User ID:</b> {user.user_id}</p>
            <p><b>Role:</b> {user.role}</p>
            <p><b>Expires In:</b> {formatTime(remaining)}</p>
            <p><b>Status:</b> {statusDisplay(status)}</p>
          </>
        ) : (
          <p style={{ color: "gray" }}>No valid access token found.</p>
        )}
      </div>

      <button onClick={handleLogout} style={styles.logout}>
        Clear Tokens
      </button>
    </div>
  );
}

/* Helper UI bits */
function statusDisplay(status) {
  switch (status) {
    case "active": return <span style={{ color: "lime" }}>✅ Active</span>;
    case "refreshing": return <span style={{ color: "orange" }}>🔄 Refreshing…</span>;
    case "expired": return <span style={{ color: "red" }}>❌ Expired</span>;
    default: return <span style={{ color: "gray" }}>Unknown</span>;
  }
}

const styles = {
  container: {
    padding: "2rem",
    fontFamily: "system-ui, sans-serif",
    color: "#eee",
    backgroundColor: "#121212",
    height: "100vh",
  },
  header: { marginBottom: "1rem" },
  card: {
    background: "#1e1e1e",
    border: "1px solid #333",
    borderRadius: "8px",
    padding: "1rem 1.5rem",
    lineHeight: 1.8,
    maxWidth: "400px",
  },
  logout: {
    marginTop: "1.5rem",
    padding: "0.6rem 1.2rem",
    background: "#d33",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};
