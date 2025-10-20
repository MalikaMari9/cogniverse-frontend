// ===============================
// UnauthorizedPage.jsx — Access Denied Page
// ===============================
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import "../admin.css";

// 🧭 Remember last safe route to navigate back
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

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!location.pathname.includes("/unauthorized")) {
      lastSafePath = location.pathname;
    }
  }, [location.pathname]);

  const handleBack = () => {
    const target =
      !lastSafePath || lastSafePath.includes("/unauthorized")
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
        {/* 🔒 Shield / Lock Icon */}
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
              <stop offset="0%" stopColor="#F45C84" />
              <stop offset="100%" stopColor="#E9307D" />
            </linearGradient>
          </defs>
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          <circle cx="12" cy="16" r="1.5" fill="url(#grad)" />
        </svg>

        <h1
          style={{
            fontSize: "1.8rem",
            fontWeight: 900,
            marginTop: 16,
            color: "var(--ink-1)",
          }}
        >
          Access Denied
        </h1>

        <p
          style={{
            color: "var(--ink-3)",
            marginTop: 8,
            lineHeight: 1.6,
          }}
        >
          You don’t have permission to view or modify this page.
          <br />
          Please contact an administrator if you believe this is a mistake.
        </p>

        <div style={{ marginTop: 28 }}>
          <button
            className="ws-btn primary"
            onClick={handleBack}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            ⬅ Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
