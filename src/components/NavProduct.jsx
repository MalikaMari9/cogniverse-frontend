// ===============================
// components/NavProduct.jsx
// ===============================
import React, { useState, useEffect } from "react";
import "../profile-nav.css";
import { getUserProfile, logoutUser } from "../api/api"; // 🔥 import backend calls

export default function NavProduct({
  theme = "dark",
  onToggleTheme = () => {},
  active = "workstation", // "workstation" | "graph" | "history"
  onGoWorkstation = () => {},
  onGoGraph = () => {},
  onGoHistory = () => {},
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);

  // ✅ Load profile info once
  useEffect(() => {
    async function fetchUser() {
      try {
        const data = await getUserProfile();
        setUser(data);
      } catch (err) {
        console.warn("⚠️ Failed to load user profile", err);
      }
    }
    fetchUser();
  }, []);

  // ✅ Handle logout
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      /* ignore backend errors on logout */
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/auth";
    }
  };

  // ✅ Determine avatar (full URL if backend gives relative path)
  const avatarUrl =
    user?.profile_image_url
      ? user.profile_image_url.startsWith("http")
        ? user.profile_image_url
        : `http://localhost:8000${user.profile_image_url}`
      : null;

  const displayInitial = user?.username?.[0]?.toUpperCase() || "U";

  // ✅ Dropdown close on outside click
  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest(".pf-user")) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <header className="pf-nav pf-nav-pretty ws-card">
      {/* ==== LEFT: Brand + Tabs ==== */}
      <div className="pf-brand">
        <div className="ws-brand">
          <span className="logo">
            <img src="logo.png" alt="CogniVerse logo" />
          </span>
        </div>
        <div className="pf-divider" />

        <nav className="pf-tabs" aria-label="Primary navigation">
          <button
            className={`pf-tab ${active === "workstation" ? "active" : ""}`}
            onClick={onGoWorkstation}
          >
            Workstation
          </button>
          <button
            className={`pf-tab ${active === "graph" ? "active" : ""}`}
            onClick={onGoGraph}
          >
            Graph
          </button>
          <button
            className={`pf-tab ghost ${active === "history" ? "active" : ""}`}
            onClick={onGoHistory}
          >
            History
          </button>
        </nav>
      </div>

      {/* ==== RIGHT: Theme + User ==== */}
      <div className="pf-right">
        <button
          type="button"
          className={`ws-theme-switch ${theme}`}
          onClick={onToggleTheme}
          aria-label="Toggle theme"
        />

        <div
          className={`pf-user ${dropdownOpen ? "open" : ""}`}
          role="button"
          tabIndex={0}
          aria-label="User menu"
          onClick={() => setDropdownOpen((v) => !v)}
        >
          {/* Avatar */}
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user?.username || "User avatar"}
              className="avatar-img"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div className="avatar">{displayInitial}</div>
          )}

          {/* Username + role */}
          <div className="meta">
            <div className="name">{user?.username || "Loading..."}</div>
            <div className="role">{user?.role || "User"}</div>
          </div>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="pf-dropdown" role="menu">
              <a href="/profile" className="pf-dd-item" role="menuitem">
                Profile
              </a>
              <a href="/settings" className="pf-dd-item" role="menuitem">
                Settings
              </a>
              <button
                type="button"
                className="pf-dd-item"
                role="menuitem"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
