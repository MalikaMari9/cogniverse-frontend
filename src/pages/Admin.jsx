// ===============================
// Admin.jsx — Modularized Version
// ===============================

import React from "react";
import "../admin.css";
import { AdminNav } from "../components/AdminNav.jsx";

// 🧩 Import tab modules
import AccessConfig from "../components/admin/AccessConfig.jsx";
import SystemLogTable from "../components/admin/SystemLogTable.jsx";
import AccessControlTable from "../components/admin/AccessControlTable.jsx";
import AnnouncementTable from "../components/admin/AnnouncementTable.jsx";
import NotificationTable from "../components/admin/NotificationTable.jsx";
import MaintenanceTable from "../components/admin/MaintenanceTable.jsx";
import UserManagementTable from "../components/admin/UserManagementTable.jsx"; // 🆕 ADD THIS
import CreditConfig from "../components/admin/CreditConfig.jsx"; // ✅ ADD THIS
import CreditTransactionTable from "../components/admin/CreditTransactionTable.jsx";
// 🧩 Shared helpers (optional, if needed here)
import { fmtDate, StatusPill } from "../components/admin//helpers.jsx";

/* ----------------------- tiny SVG icons (inline) ----------------------- */
const Icon = ({ name, size = 18 }) => {
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
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
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
    case "doc":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="14" height="18" rx="2" />
          <path d="M7 8h6M7 12h6M7 16h4" />
          <path d="M17 8h4v12a2 2 0 0 1-2 2h-2" />
        </svg>
      );
    case "users": // 🆕 ADD USER MANAGEMENT ICON
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "plus":
      return (
        <svg {...props}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "edit":
      return (
        <svg {...props}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
        </svg>
      );
    case "trash":
      return (
        <svg {...props}>
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
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
      return (
        <svg {...props}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.64 9.79Z" />
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
    default:
      return null;
  }
};

/* ------------------------------ main page ------------------------------ */
export default function Admin() {
  const [theme, setTheme] = React.useState(
    () => document.documentElement.getAttribute("data-theme") || "dark"
  );

  // ✅ Load last active tab from localStorage or fallback to "config"
  const [tab, setTab] = React.useState(() => localStorage.getItem("admin_tab") || "config");

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // ✅ Whenever tab changes, store it
  React.useEffect(() => {
    localStorage.setItem("admin_tab", tab);
  }, [tab]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("admin_tab"); // optional: clear saved tab on logout
    sessionStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="ad-shell">
      <div className="ad-bg" aria-hidden />

      <AdminNav
        theme={theme}
        tab={tab}
        setTab={setTab}
        setTheme={setTheme}
        handleLogout={handleLogout}
      />

      <main className="ad-main">
        <header className="ad-head ws-card">
        <div className="title">
          {tab === "config" && "System Config"}
          {tab === "maintenance" && "System Maintenance"}
          {tab === "syslog" && "System Log"}
          {tab === "access" && "Access Control"}
          {tab === "creditpacks" && "Credit Packs"}
          {tab === "announcements" && "Announcements"}
          {tab === "notify" && "Notification"}
          {tab === "users" && "User Management"} {/* 🆕 ADD THIS */}
          {tab === "credittransactions" && "Credit Transactions"}
        </div>
      </header>

        {/* ✅ Move table components here in main section */}
        {tab === "config" && <AccessConfig Icon={Icon} />}
        {tab === "maintenance" && <MaintenanceTable Icon={Icon} />}
        {tab === "syslog" && <SystemLogTable />}
        {tab === "access" && <AccessControlTable Icon={Icon} />}
        {tab === "creditpacks" && <CreditConfig Icon={Icon} />}  
        {tab === "announcements" && <AnnouncementTable Icon={Icon} />}
        {tab === "notify" && <NotificationTable />}
        {tab === "users" && <UserManagementTable />} {/* 🆕 ADD THIS */}
        {tab === "credittransactions" && <CreditTransactionTable Icon={Icon} />}

        {!["config", "syslog", "access", "announcements", "notify", "users", "creditpacks", "credittransactions", "maintenance"].includes(tab) && (
          <section className="ad-card ws-card ad-empty">
            Coming soon: {tab}
          </section>
        )}
      </main>
    </div>
  );
}