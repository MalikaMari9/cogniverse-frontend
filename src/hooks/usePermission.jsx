// ===============================
// usePermission.js — Shared Hook for Access Control
// ===============================
import { useEffect, useState } from "react";
import { getPermission } from "../api/api";

/**
 * usePermission(moduleKey)
 * 🔹 Fetches current user's access level for the given module
 * 🔹 Returns { level, loading, canRead, canWrite }
 *
 * Example:
 *   const { level, canRead, canWrite } = usePermission("MAINTENANCE");
 */
export function usePermission(moduleKey) {
  const [level, setLevel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!moduleKey) return;
    let mounted = true;
    setLoading(true);

    getPermission(moduleKey)
      .then((res) => {
        if (mounted) setLevel(res.access_level);
      })
      .catch(() => {
        if (mounted) setLevel("none");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [moduleKey]);

  const canRead = level === "read" || level === "write";
  const canWrite = level === "write";

  return { level, loading, canRead, canWrite };
}
