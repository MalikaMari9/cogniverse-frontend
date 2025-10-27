import React, { useState } from "react";
import "../profile-nav.css";
import { requestPasswordReset } from "../api/api";
import { Reveal } from "./Auth";
import { useNavigate } from "react-router-dom";

/* ============== Theme Hook ============== */
function useTheme() {
  const [theme, setTheme] = React.useState(
    () => document.documentElement.getAttribute("data-theme") || "dark"
  );

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return { theme, toggle };
}

/* ============== Toast Component ============== */
function Toast({ message, type = "info", onClose, duration = 4000 }) {
  React.useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => onClose(), duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  return (
    <div className={`toast ${type}`}>
      <div className="toast-content">{message}</div>
      <div className="toast-bar" />
    </div>
  );
}

/* ============== Helper: Parse API Errors ============== */
function parseError(err) {
  if (!err) return "An unknown error occurred.";

  if (err.response?.data) {
    const data = err.response.data;

    // FastAPI validation error format
    if (Array.isArray(data.detail) && data.detail[0]?.msg) {
      return data.detail[0].msg;
    }

    if (typeof data.detail === "string") return data.detail;
    if (data.message) return data.message;
  }

  if (err.message) return err.message;
  return "Something went wrong. Please try again.";
}

/* ============== Forgot Password Page ============== */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await requestPasswordReset(email);
      showToast(res.message || "✅ Reset link sent successfully!", "success");
      setEmail("");
    } catch (err) {
      console.error("❌ Password reset error:", err);
      let msg = parseError(err);

      // Friendly replacement for validation messages
      if (msg.toLowerCase().includes("valid email")) {
        msg = "Please enter a valid email address.";
      }

      showToast("❌ " + msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app auth-page">
      <main>
        <section className="auth-wrap container">
          <div className="auth-grid">
            {/* Left Hero */}
            <section className="auth-hero ws-card">
              <Reveal className="auth-hero card" variant="fade-right">
                <p className="eyebrow">Forgot Password</p>
                <h1>Reset your account</h1>
                <p className="muted">
                  Enter the email linked to your account. We’ll send you a secure
                  link to reset your password.
                </p>

                <div className="illus" aria-hidden="true">
                  <div className="orb o1" />
                  <div className="orb o2" />
                  <div className="orb o3" />
                </div>
              </Reveal>
            </section>

            {/* Right Form */}
            <section className="auth-form ws-card">
              <Reveal className="auth-card card" variant="fade-left" delay={60}>
                <form onSubmit={handleSubmit} className="form" noValidate>
                  <label
                    htmlFor="email"
                    className="fade-item"
                    style={{ animationDelay: "40ms" }}
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="fade-item"
                    style={{ animationDelay: "80ms" }}
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />

                  <button
                    className={`btn primary fade-item ${
                      loading ? "loading" : ""
                    }`}
                    type="submit"
                    style={{ animationDelay: "120ms" }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="sc-spinner tiny" />
                        <span style={{ marginLeft: 6 }}>Sending...</span>
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>

                  <p
                    className="swap fade-item"
                    style={{ animationDelay: "200ms" }}
                  >
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="link"
                      disabled={loading}
                    >
                      ← Back to login
                    </button>
                  </p>
                </form>
              </Reveal>
            </section>
          </div>
        </section>
      </main>

      {/* Toast Notification */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: "" })}
        />
      )}

      {/* Footer */}
      <footer className="footer">
        <p>© CogniVerse</p>
        <button
          onClick={toggle}
          className="theme-toggle"
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </footer>
    </div>
  );
}
