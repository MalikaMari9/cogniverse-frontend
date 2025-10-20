// ===============================
// MaintenancePage.jsx — All-in-One Self-Tracking Version
// ===============================
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import "../admin.css";

// 🧠 Module-level variable to persist last safe path while app is running
let lastSafePath = "/";

function BackButtonPortal({ onBack }) {
  return createPortal(
    <button
      onClick={onBack}
      style={{
        position: "fixed",
        top: 20,
        left: 20,
        background: "var(--accent)",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "8px 14px",
        fontWeight: 700,
        cursor: "pointer",
        zIndex: 2147483647,
        boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
        transition: "opacity .2s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      ⬅ Back
    </button>,
    document.body
  );
}

export default function MaintenancePage() {
  const [info, setInfo] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Track last safe path here (works app-wide while this file is loaded)
  useEffect(() => {
    if (!location.pathname.includes("/maintenance")) {
      lastSafePath = location.pathname;
    }
  }, [location.pathname]);

  useEffect(() => {
    if (location.state) setInfo(location.state);
    else fetchMaintenanceInfo();
  }, [location.state]);

  const fetchMaintenanceInfo = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/maintenance/global");
      if (!res.ok) throw new Error("Failed to fetch maintenance info");
      const data = await res.json();
      setInfo(data);
    } catch (err) {
      console.error("❌ Failed to load maintenance info:", err);
    }
  };

  const handleBack = () => {
    const target =
      !lastSafePath || lastSafePath.includes("/maintenance")
        ? "/"
        : lastSafePath;
    navigate(target, { replace: true });
  };

  return (
    <div
      className="ad-bg"
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      <BackButtonPortal onBack={handleBack} />

      <div
        className="ws-card"
        style={{
          position: "relative",
          zIndex: 1,
          pointerEvents: "auto",
          maxWidth: 540,
          textAlign: "center",
          padding: "36px 26px",
          borderRadius: 18,
          background: "var(--glass)",
          border: "1px solid var(--glass-bdr)",
          boxShadow: "0 8px 30px rgba(0,0,0,.25)",
        }}
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          stroke="url(#grad)"
          fill="none"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7A5CF4" />
              <stop offset="100%" stopColor="#30D7E9" />
            </linearGradient>
          </defs>
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.06a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.06a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.06a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.38 1.26.97 1.54.2.1.42.16.64.16H21a2 2 0 1 1 0 4h-.06a1.65 1.65 0 0 0-1.51 1Z" />
        </svg>

        <h1
          style={{
            fontSize: "1.8rem",
            fontWeight: 900,
            marginTop: 16,
            color: "var(--ink-1)",
          }}
        >
          {info?.title || "We'll be right back!"}
        </h1>

        <p
          style={{
            color: "var(--ink-3)",
            marginTop: 8,
            lineHeight: 1.6,
          }}
        >
          {info?.message ||
            "Our system is currently undergoing scheduled maintenance. Please check back later."}
        </p>

        {info?.updated_at && (
          <p
            style={{
              fontSize: "0.9rem",
              marginTop: 20,
              opacity: 0.6,
            }}
          >
            Last updated: {new Date(info.updated_at).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
