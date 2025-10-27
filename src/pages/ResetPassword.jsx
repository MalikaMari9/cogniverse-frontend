import React, { useState } from "react";
import "../profile-nav.css";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../api/api";
import { Reveal } from "./Auth";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    if (password !== confirm) {
      showMessage("❌ Passwords do not match", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(token, password);
      showMessage(res.message, "success");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      showMessage("❌ " + (err.message || "Reset failed"), "error");
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
                <p className="eyebrow">Set New Password</p>
                <h1>Update your password</h1>
                <p className="muted">
                  Enter a strong new password below. Your new password will take effect immediately.
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
                  <label htmlFor="password" className="fade-item" style={{ animationDelay: "40ms" }}>
                    New Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="fade-item"
                    style={{ animationDelay: "80ms" }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />

                  <label htmlFor="confirm" className="fade-item" style={{ animationDelay: "120ms" }}>
                    Confirm Password
                  </label>
                  <input
                    id="confirm"
                    name="confirm"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="fade-item"
                    style={{ animationDelay: "160ms" }}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    disabled={loading}
                  />

                  <button
                    className={`btn primary fade-item ${loading ? "loading" : ""}`}
                    type="submit"
                    style={{ animationDelay: "200ms" }}
                    disabled={loading}
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>

                  {message && (
                    <div
                      className={`toast fade-item ${messageType}`}
                      style={{ animationDelay: "240ms" }}
                      role="status"
                    >
                      {message}
                    </div>
                  )}

                  <p className="swap fade-item" style={{ animationDelay: "280ms" }}>
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
      <footer className="footer">
        <p>© CogniVerse</p>
      </footer>
    </div>
  );
}
