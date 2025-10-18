// src/hooks/useSessionWatcher.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Optional: reuse your helper
import { getCurrentUserFromToken } from "../utils/auth";

// tiny util — epoch seconds (JWT "exp") -> ms
const secToMs = (s) => (typeof s === "number" ? s * 1000 : null);

// generate a stable tab id (per tab)
const getTabId = () => {
  const k = "__auth_tab_id__";
  let id = sessionStorage.getItem(k);
  if (!id) {
    id = Math.random().toString(36).slice(2);
    sessionStorage.setItem(k, id);
  }
  return id;
};

const REFRESH_LOCK_KEY = "auth_refresh_lock"; // localStorage key
const LOCK_TTL_MS = 15_000;                    // safety TTL for lock

export function useSessionWatcher({
  thresholdSeconds = 30,
  intervalMs = 1000,
  autoRefresh = true,
  onRefreshed,
  onLogout,
  showToasts = false,
} = {}) {
  const tabId = useMemo(getTabId, []);
  const [expiresAt, setExpiresAt] = useState(null); // ms
  const [timeLeftSec, setTimeLeftSec] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastError, setLastError] = useState(null);

  const bcRef = useRef(null);
  const tickingRef = useRef(null);
  const unmountedRef = useRef(false);

  // read & compute from current access token
  const recomputeFromToken = useCallback(() => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setExpiresAt(null);
        setTimeLeftSec(null);
        return;
      }
      // You already have this helper
      const decoded = getCurrentUserFromToken(); // { exp, user_id, role, ... }
      const expMs = secToMs(decoded?.exp);
      setExpiresAt(expMs || null);

      if (expMs) {
        const now = Date.now();
        setTimeLeftSec(Math.max(0, Math.floor((expMs - now) / 1000)));
      } else {
        setTimeLeftSec(null);
      }
    } catch (e) {
      // token malformed
      setExpiresAt(null);
      setTimeLeftSec(null);
    }
  }, []);

  // localStorage-based lock (single-tab refresh)
  const tryAcquireLock = () => {
    const now = Date.now();
    const lockRaw = localStorage.getItem(REFRESH_LOCK_KEY);
    if (lockRaw) {
      try {
        const lock = JSON.parse(lockRaw);
        // if lock is fresh, don't refresh
        if (now - lock.ts < LOCK_TTL_MS) return false;
      } catch {}
    }
    localStorage.setItem(
      REFRESH_LOCK_KEY,
      JSON.stringify({ owner: tabId, ts: now })
    );
    return true;
  };
  const releaseLock = () => {
    const lockRaw = localStorage.getItem(REFRESH_LOCK_KEY);
    try {
      const lock = lockRaw ? JSON.parse(lockRaw) : null;
      if (lock?.owner === tabId) {
        localStorage.removeItem(REFRESH_LOCK_KEY);
      }
    } catch {
      localStorage.removeItem(REFRESH_LOCK_KEY);
    }
  };

  const broadcast = (msg) => {
    try {
      bcRef.current?.postMessage(msg);
    } catch {}
  };

  const doRefresh = useCallback(async () => {
    if (refreshing) return; // de-dupe inside a tab
    setLastError(null);

    // ensure only one tab does this
    if (!tryAcquireLock()) return;

    setRefreshing(true);
    broadcast({ type: "refresh:start", by: tabId });

    try {
      const refresh = localStorage.getItem("refresh_token");
      if (!refresh) throw new Error("No refresh token");

      const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const res = await fetch(`${base}/auth/refresh`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${refresh}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(`Refresh failed (${res.status})`);
      }

      const data = await res.json();
      const newAccess = data?.access_token;
      if (!newAccess) throw new Error("No access_token in response");

      localStorage.setItem("access_token", newAccess);
      recomputeFromToken();
      broadcast({ type: "refresh:done", ok: true, token: newAccess });

      if (typeof onRefreshed === "function") onRefreshed(newAccess);
      if (showToasts && window?.toast) window.toast.success("Session refreshed");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Refresh error";
      setLastError(msg);
      broadcast({ type: "refresh:done", ok: false, error: msg });

      // hard logout
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setExpiresAt(null);
      setTimeLeftSec(null);

      if (typeof onLogout === "function") {
        onLogout();
      } else {
        // default navigation
        try {
          window.location.href = "/login";
        } catch {}
      }
    } finally {
      setRefreshing(false);
      releaseLock();
    }
  }, [onRefreshed, onLogout, recomputeFromToken, refreshing, showToasts, tabId]);

  // ticking loop
  useEffect(() => {
    unmountedRef.current = false;
    recomputeFromToken();

    const tick = () => {
      if (unmountedRef.current) return;

      const token = localStorage.getItem("access_token");
      if (!token) {
        setTimeLeftSec(null);
        setExpiresAt(null);
        return;
      }
      const now = Date.now();
      if (expiresAt) {
        const left = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setTimeLeftSec(left);

        // pre-emptive refresh
        if (
          autoRefresh &&
          !refreshing &&
          left <= thresholdSeconds &&
          left > 0 &&
          !document.hidden // optional: avoid spamming while hidden
        ) {
          doRefresh();
        }
      } else {
        recomputeFromToken();
      }
    };

    tickingRef.current = setInterval(tick, intervalMs);

    return () => {
      unmountedRef.current = true;
      if (tickingRef.current) clearInterval(tickingRef.current);
    };
  }, [
    autoRefresh,
    doRefresh,
    expiresAt,
    intervalMs,
    thresholdSeconds,
    recomputeFromToken,
    refreshing,
  ]);

  // listen to cross-tab changes (BroadcastChannel + storage)
  useEffect(() => {
    // BroadcastChannel
    try {
      bcRef.current = new BroadcastChannel("auth");
      bcRef.current.onmessage = (e) => {
        const msg = e?.data;
        if (!msg || typeof msg !== "object") return;
        if (msg.type === "refresh:done" && msg.ok) {
          // another tab refreshed; recompute from updated token
          recomputeFromToken();
        }
        if (msg.type === "refresh:done" && !msg.ok) {
          // another tab failed; reflect logout
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          setExpiresAt(null);
          setTimeLeftSec(null);
        }
      };
    } catch {
      // ignore if not supported
    }

    // storage (other tabs writing tokens)
    const onStorage = (ev) => {
      if (ev.key === "access_token") {
        recomputeFromToken();
      }
      if (ev.key === "refresh_token" && ev.newValue == null) {
        // logged out elsewhere
        setExpiresAt(null);
        setTimeLeftSec(null);
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      try {
        bcRef.current?.close();
      } catch {}
      window.removeEventListener("storage", onStorage);
    };
  }, [recomputeFromToken]);

  const forceRefresh = useCallback(async () => {
    await doRefresh();
  }, [doRefresh]);

  return { timeLeftSec, expiresAt, refreshing, lastError, forceRefresh };
}

export default useSessionWatcher;
