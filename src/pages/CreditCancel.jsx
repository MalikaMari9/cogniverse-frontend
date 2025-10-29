import React from "react";
import NavProduct from "../components/NavProduct";
import "../profile-nav.css";
import "../credit.css";

function useTheme() {
  const [theme, setTheme] = React.useState(
    () => localStorage.getItem("theme") || "light"
  );
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  return { theme, toggle };
}

export default function CreditCancel() {
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <div className="credit-page">
      <NavProduct
        theme={theme}
        onToggleTheme={toggleTheme}
        active="credit"
        onGoWorkstation={() => (window.location.href = "/workstation")}
        onGoGraph={() => (window.location.href = "/graph")}
        onGoHistory={() => (window.location.href = "/history")}
      />

      <main className="credit-wrap center-card">
        <div className="cancel-card reveal reveal-up">
          <h2 className="credit-title">❌ Payment Canceled</h2>
          <p className="credit-sub">
            Your payment was canceled. No charges were made.
          </p>
          <button
            className="btn secondary"
            onClick={() => (window.location.href = "/credit")}
          >
            Back to Credit Page
          </button>
        </div>
      </main>

      <footer className="credit-footer">
        <p>© CogniVerse</p>
      </footer>
    </div>
  );
}
