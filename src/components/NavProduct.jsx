import React, { useState, useEffect } from "react";
import "../profile-nav.css";
import { getUserProfile, logoutUser, getMyBilling } from "../api/api";
import { FaBars } from "react-icons/fa"; // Hamburger icon for mobile

const Bell = ({ size = 22 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
    className="notif-icon"
  >
    <path d="M14.25 18.25h5.25l-1.5-1.5a2.121 2.121 0 01-.625-1.5V11A6 6 0 006 11v4.25a2.121 2.121 0 01-.625 1.5L3.75 18.25h5.25M9 18.25v.25a3 3 0 006 0v-.25" />
  </svg>
);

export default function NavProduct({
  theme = "dark",
  onToggleTheme = () => {},
  active = "workstation",
  onGoWorkstation = () => {},
  onGoGraph = () => {},
  onGoHistory = () => {},
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false); // Notification dropdown
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(3); // Example unread count
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);  // Mobile menu state

  useEffect(() => {
    async function fetchUser() {
      try {
        const [profile, billing] = await Promise.all([getUserProfile(), getMyBilling()]);
        setUser({
          ...profile,
          free_credits: billing.free_credits,
          paid_credits: billing.paid_credits,
        });
      } catch (err) {
        console.warn("⚠️ Failed to load user profile or billing", err);
      }
    }
    fetchUser();
  }, []);

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

  const avatarUrl =
    user?.profile_image_url
      ? user.profile_image_url.startsWith("http")
        ? user.profile_image_url
        : `http://localhost:8000${user.profile_image_url}`
      : null;

  const displayInitial = user?.username?.[0]?.toUpperCase() || "U";

  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest(".pf-user") && !e.target.closest(".pf-notif")) {
        setDropdownOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <header className="pf-nav pf-nav-pretty ws-card">
      {/* ==== LEFT: Brand + Hamburger Button ==== */}
      <div className="pf-brand">
        <div className="ws-brand">
          <span className="logo">
            <img src="/logo.png" alt="CogniVerse logo" />
          </span>
        </div>

        {/* Hamburger Button for Mobile */}
        <button
          className="hamburger-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <FaBars />
        </button>

        <div className="pf-divider" />

        {/* Dropdown for Tabs on Mobile */}
        {isMobileMenuOpen && (
          <div className="mobile-dropdown">
            <button
              className="pf-tab"
              onClick={() => onGoWorkstation()}
              aria-label="Go to Workstation"
            >
              Workstation
            </button>
            <button
              className="pf-tab"
              onClick={() => onGoGraph()}
              aria-label="Go to Graph"
            >
              Graph
            </button>
            <button
              className="pf-tab"
              onClick={() => onGoHistory()}
              aria-label="Go to History"
            >
              History
            </button>
          </div>
        )}

        {/* Tabs Visibility for larger screens */}
        {!isMobileMenuOpen && (
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
        )}
      </div>

      {/* ==== RIGHT: Theme + Notifications + User ==== */}
      <div className="pf-right">
        <button
          type="button"
          className={`ws-theme-switch ${theme}`}
          onClick={onToggleTheme}
          aria-label="Toggle theme"
        />

        {/* 🔔 Notification Icon */}
        <div
          className={`pf-notif ${notifOpen ? "open" : ""}`}
          role="button"
          tabIndex={0}
          aria-label="Notifications"
          onClick={() => setNotifOpen((v) => !v)}
          style={{ position: "relative", marginRight: "1rem" }}
        >
          <Bell size={22} />
          {unreadCount > 0 && (
            <span className="notif-badge">
              {unreadCount}
            </span>
          )}

          {notifOpen && (
            <div
              className="pf-dropdown notif-dropdown"
              role="menu"
              style={{ width: "240px" }}
            >
              <div className="notif-header">Notifications</div>
              {unreadCount === 0 ? (
                <div className="notif-empty">No new messages</div>
              ) : (
                <ul className="notif-list">
                  <li>New message from Alice</li>
                  <li>Project update available</li>
                  <li>Server maintenance at 10 PM</li>
                </ul>
              )}
              <div className="notif-footer">
                <button
                  className="mark-read"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUnreadCount(0);
                  }}
                >
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 👤 User Profile */}
        <div
          className={`pf-user ${dropdownOpen ? "open" : ""}`}
          role="button"
          tabIndex={0}
          aria-label="User menu"
          onClick={() => setDropdownOpen((v) => !v)}
        >
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

          <div className="meta">
            <div className="name">{user?.username || "Loading..."}</div>
            <div className="role">{user?.role || "User"}</div>
          </div>

          {dropdownOpen && (
            <div className="pf-dropdown" role="menu">
              <div className="pf-wallet-summary">
                <div className="pf-wallet-header">Wallet</div>
                <div className="pf-wallet-balance">
                  <div className="pf-wallet-item">
                    <span className="label">Free</span>
                    <span className="value">{user?.free_credits ?? 0}</span>
                  </div>
                  <div className="pf-wallet-item">
                    <span className="label">Paid</span>
                    <span className="value">{user?.paid_credits ?? 0}</span>
                  </div>
                  <div className="pf-wallet-divider" />
                  <div className="pf-wallet-item total">
                    <span className="label">Total</span>
                    <span className="value">
                      {(user?.free_credits ?? 0) + (user?.paid_credits ?? 0)}
                    </span>
                  </div>
                </div>
              </div>

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
