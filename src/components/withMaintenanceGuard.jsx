import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Wraps a page component to auto-redirect if the module is under maintenance.
 * 
 * @param {React.ComponentType} Component — Your page
 * @param {string} moduleKey — e.g., "project", "workstation", "billing"
 */
export function withMaintenanceGuard(Component, moduleKey) {
  return function GuardedComponent(props) {
    const navigate = useNavigate();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
      const checkMaintenance = async () => {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/maintenance/${moduleKey}`
          );
          if (!res.ok) return setChecking(false);
          const data = await res.json();

          // 🔹 If module under maintenance → redirect with state
          if (data?.under_maintenance) {
            navigate("/maintenance", { state: data });
          } else {
            setChecking(false);
          }
        } catch (err) {
          console.error("❌ Maintenance check failed:", err);
          setChecking(false);
        }
      };

      checkMaintenance();
    }, [navigate]);

    if (checking)
      return (
        <div
          style={{
            display: "grid",
            placeItems: "center",
            minHeight: "100vh",
            color: "var(--ink-1)",
          }}
        >
          <p>Checking system status...</p>
        </div>
      );

    return <Component {...props} />;
  };
}
