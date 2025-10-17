// ===============================
// SessionMonitor.jsx
// ===============================
// 🔍 Displays current session info and countdown to token expiry.
// Great for testing JWT refresh & logout behavior.
// ===============================

import React, { useEffect, useState } from "react";
import { getCurrentUserFromToken, isAccessTokenExpired } from "../utils/auth";

export default function SessionMonitor() {
  const [user, setUser] = useState(getCurrentUserFromToken());
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const payload = getCurrentUserFromToken();
      setUser(payload);

      if (payload?.exp) {
        const now = Math.floor(Date.now() / 1000);
        const diff = payload.exp - now;
        setRemaining(diff > 0 ? diff : 0);
      } else {
        setRemaining(0);
      }
    };

    updateTimer(); // immediate
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const expired = isAccessTokenExpired();

  const formatTime = (seconds) => {
    if (seconds <= 0) return "Expired";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>🕒 Session Monitor</h2>
      <div style={styles.card}>
        {user ? (
          <>
            <p><b>User ID:</b> {user.user_id}</p>
            <p><b>Role:</b> {user.role}</p>
            <p><b>Expires In:</b> {formatTime(remaining)}</p>
            {expired ? (
              <p style={{ color: "red" }}>⚠️ Session Expired</p>
            ) : remaining <= 60 ? (
              <p style={{ color: "orange" }}>⏳ Session about to expire soon!</p>
            ) : (
              <p style={{ color: "green" }}>✅ Session Active</p>
            )}
          </>
        ) : (
          <p style={{ color: "gray" }}>No valid access token found.</p>
        )}
      </div>
      <button
        onClick={() => {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.reload();
        }}
        style={styles.logout}
      >
        Clear Tokens
      </button>
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    fontFamily: "system-ui, sans-serif",
    color: "#eee",
    backgroundColor: "#121212",
    height: "100vh",
  },
  header: {
    marginBottom: "1rem",
  },
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
