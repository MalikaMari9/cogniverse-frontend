// ===============================
// AdminNav.jsx — Final Organized Version
// ===============================
import React from "react";
import "../admin.css";

export const Icon = ({ name, size = 18 }) => {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  switch (name) {
    case "gear":
      return (
        <svg {...props}>
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.06a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.06a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.06a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.38 1.26.97 1.54.2.1.42.16.64.16H21a2 2 0 1 1 0 4h-.06a1.65 1.65 0 0 0-1.51 1Z" />
        </svg>
      );
    case "shield":
      return <svg {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>;
    case "doc":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="14" height="18" rx="2" />
          <path d="M7 8h6M7 12h6M7 16h4" />
          <path d="M17 8h4v12a2 2 0 0 1-2 2h-2" />
        </svg>
      );
    case "users":
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "megaphone":
      return (
        <svg {...props}>
          <path d="M3 11v2a4 4 0 0 0 4 4h1" />
          <path d="M17 8v8" />
          <path d="M22 8v8" />
          <path d="M22 8a5 5 0 0 1-5 5H11l-7 4V4l7 4h6a5 5 0 0 1 5 0Z" />
        </svg>
      );
    case "bell":
      return (
        <svg {...props}>
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.7 1.7 0 0 0 3.4 0" />
        </svg>
      );
    case "logout":
      return (
        <svg {...props}>
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <path d="M10 17l5-5-5-5" />
          <path d="M15 12H3" />
        </svg>
      );
    case "sun":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      );
    case "moon":
      return <svg {...props}><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.64 9.79Z" /></svg>;
    default:
      return null;
  }
};

export function AdminNav({ theme, tab, setTab, setTheme, handleLogout }) {
  return (
    <aside className="ad-sb">
      <div className="ad-logo">
        <div className="badge">AI</div>
        <div className="brand">Admin</div>
      </div>

      <nav className="ad-nav">
        {/* ⚙️ System Section */}
        <div className="nav-section">
          <button className={`ad-nav-item ${tab === "config" ? "active" : ""}`} onClick={() => setTab("config")}>
            <Icon name="gear" /><span>System Config</span>
          </button>
          <button className={`ad-nav-item ${tab === "maintenance" ? "active" : ""}`} onClick={() => setTab("maintenance")}>
            <Icon name="shield" /><span>Maintenance</span>
          </button>
          <button className={`ad-nav-item ${tab === "access" ? "active" : ""}`} onClick={() => setTab("access")}>
            <Icon name="shield" /><span>Access Control</span>
          </button>
          <button className={`ad-nav-item ${tab === "syslog" ? "active" : ""}`} onClick={() => setTab("syslog")}>
            <Icon name="doc" /><span>System Log</span>
          </button>
        </div>

        {/* 👥 Management */}
        <div className="nav-section">
          <button className={`ad-nav-item ${tab === "users" ? "active" : ""}`} onClick={() => setTab("users")}>
            <Icon name="users" /><span>User Management</span>
          </button>
        </div>

        {/* 💬 Communication */}
        <div className="nav-section">
          <button className={`ad-nav-item ${tab === "announcements" ? "active" : ""}`} onClick={() => setTab("announcements")}>
            <Icon name="megaphone" /><span>Announcements</span>
          </button>
          <button className={`ad-nav-item ${tab === "notify" ? "active" : ""}`} onClick={() => setTab("notify")}>
            <Icon name="bell" /><span>Notifications</span>
          </button>
        </div>

        {/* 💰 Billing */}
        <div className="nav-section">
          <button className={`ad-nav-item ${tab === "creditpacks" ? "active" : ""}`} onClick={() => setTab("creditpacks")}>
            <Icon name="gear" /><span>Credit Packs</span>
          </button>
          <button className={`ad-nav-item ${tab === "credittransactions" ? "active" : ""}`} onClick={() => setTab("credittransactions")}>
            <Icon name="doc" /><span>Credit Transactions</span>
          </button>
        </div>
      </nav>

      {/* 👤 Footer */}
      <div className="ad-sb-foot" style={{ flexDirection: "column", gap: "10px" }}>
        <button className="ad-nav-item" onClick={() => (window.location.href = "/profile")} style={{ justifyContent: "center" }}>
          <Icon name="users" /><span>Profile</span>
        </button>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <button className={`ad-theme ${theme}`} onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
            <span className="knob" />
            <span className="sun"><Icon name="sun" size={14} /></span>
            <span className="moon"><Icon name="moon" size={14} /></span>
          </button>
        </div>

        <button className="ad-nav-item logout-btn" onClick={handleLogout} style={{ justifyContent: "center" }}>
          <Icon name="logout" /><span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
