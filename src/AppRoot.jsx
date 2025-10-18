export default function AppRoot({ children }) {
  useSessionWatcher({
    thresholdSeconds: 30,
    intervalMs: 1000,
    autoRefresh: true,
    showToasts: false,               // set true if you wire toast globally
    onLogout: () => {
      // optional: centralized logout handling
      // e.g., route push if you use a router hook
      window.location.href = "/login";
    },
  });

  return children;
}