// ===============================
// withGlobalMaintenanceGuard.jsx
// ===============================
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getGlobalMaintenance } from "../api/api";
import { getCurrentUserFromToken, isAccessTokenExpired } from "../utils/auth";

/**
 * Global Maintenance Guard (auth-allowed + auto-recover)
 * - Blocks all users when global maintenance is active
 * - Allows Admins/SuperAdmins to bypass
 * - Allows /auth, /login, /signup, and /maintenance during maintenance
 * - Automatically recovers when maintenance ends (no manual refresh)
 */
export function withGlobalMaintenanceGuard(AppComponent) {
  return function WrappedApp(props) {
    const [status, setStatus] = useState("checking"); // checking | ready | maintenance
    const [maintenanceInfo, setMaintenanceInfo] = useState(null);
    const location = useLocation();

    useEffect(() => {
      async function checkGlobal() {
        try {
          const currentPath = location.pathname.toLowerCase();

          // 🧩 Allowlisted paths — never blocked
          const allowList = [
            "/auth",
            "/login",
            "/signup",
            "/maintenance",
          ];

          if (allowList.some((p) => currentPath.startsWith(p))) {
            setStatus("ready");
            return;
          }

          // 🧠 Decode user role
          const user = getCurrentUserFromToken();
          const role = user?.role?.toLowerCase() || "user";
          const tokenExpired = isAccessTokenExpired();

          // ✅ Admin/superadmin bypass
          if (!tokenExpired && (role === "admin" || role === "superadmin")) {
            setStatus("ready");
            return;
          }

          // 🌍 Check global maintenance flag
          const data = await getGlobalMaintenance();

          // 🟢 Maintenance OFF — unlock everything
          if (!data?.under_maintenance) {
            setStatus("ready");
            setMaintenanceInfo(null);
            return;
          }

          // 🔴 Maintenance ON — non-admin gets redirected
          setMaintenanceInfo({
            from: currentPath,
            title: data.module_key || "Global Maintenance",
            message:
              data.message ||
              "The system is undergoing scheduled maintenance. Please check back later.",
            updated_at: data.updated_at,
          });
          setStatus("maintenance");
        } catch (err) {
          console.error("⚠️ Global maintenance check failed:", err);
          setStatus("ready"); // fail open (don’t lock everyone out)
        }
      }

      checkGlobal();
    }, [location.pathname]);

    // 🌀 Loader while checking
    if (status === "checking") {
      return (
        <div
          style={{
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            background: "var(--bg-1, #0e0e0f)",
            color: "var(--ink-2, #ccc)",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              border: "4px solid rgba(255,255,255,0.2)",
              borderTop: "4px solid var(--accent, #30D7E9)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              marginBottom: 14,
            }}
          />
          <p>Checking system status...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      );
    }

    // 🚧 Redirect non-admins to maintenance page
    if (status === "maintenance" && maintenanceInfo) {
      // ✅ allow escape when backend turns it off mid-session
      if (location.pathname.startsWith("/maintenance")) {
        return <AppComponent {...props} />;
      }
      return <Navigate to="/maintenance" replace state={maintenanceInfo} />;
    }

    // 🟢 Normal render
    return <AppComponent {...props} />;
  };
}
