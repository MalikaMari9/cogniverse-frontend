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

/* ============== Forgot Password Page ============== */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // success | error | info
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await requestPasswordReset(email);
      showMessage(res.message || "✅ Reset link sent successfully!", "success");
    } catch (err) {
      showMessage("❌ " + (err.message || "Failed to send reset link"), "error");
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
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>

                  {message && (
                    <div
                      className={`toast fade-item ${messageType}`}
                      style={{ animationDelay: "160ms" }}
                      role="status"
                    >
                      {message}
                    </div>
                  )}

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
