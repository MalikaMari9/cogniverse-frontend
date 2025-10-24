// ===============================
// payment.jsx — Dynamic Payment Page (API Integrated)
// ===============================

import React from "react";
import { useSearchParams } from "react-router-dom";
import Nav from "../components/Nav.jsx";
import "../credit.css";
import { getActiveCreditPacks } from "../api/api"; // ✅ pull packs from backend

export default function PaymentPage() {
  const [params] = useSearchParams();
  const packKey = params.get("pack"); // e.g. ?pack=pro
  const [pack, setPack] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [coupon, setCoupon] = React.useState("");
  const [discount, setDiscount] = React.useState(0);
  const [theme, setTheme] = React.useState(
    () => localStorage.getItem("theme") || "light"
  );

  // ===============================
  // Theme toggle
  // ===============================
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  // ===============================
  // Fetch selected pack
  // ===============================
  React.useEffect(() => {
    async function fetchPack() {
      try {
        const res = await getActiveCreditPacks();
        const found = res.find(
          (p) => p.config_key.toLowerCase() === packKey?.toLowerCase()
        );
        if (!found) {
          setError("Credit pack not found.");
          return;
        }

        const v = found.config_value || {};
        setPack({
          id: found.creditid,
          key: found.config_key,
          name: v.name || found.config_key,
          credits: v.credits,
          price: v.base_price_usd,
          discount_percent: v.discount_percent || 0,
          badge: v.badge,
          stripe_id: v.stripe_price_id,
          tone: v.tone || "violet",
        });
      } catch (err) {
        console.error("❌ Failed to fetch pack:", err);
        setError("Failed to load pack details.");
      } finally {
        setLoading(false);
      }
    }
    fetchPack();
  }, [packKey]);

  // ===============================
  // Apply coupon (mock logic)
  // ===============================
  const handleApplyCoupon = () => {
    if (coupon.trim().toLowerCase() === "cogni10") {
      setDiscount(10);
    } else {
      alert("Invalid coupon code.");
    }
  };

  // ===============================
  // Stripe redirect simulation
  // ===============================
  const handleCheckout = () => {
    if (!pack) return;
    // Normally this triggers Stripe session creation
    window.location.href = `/checkout?pack=${pack.key}`;
  };

  // ===============================
  // Render
  // ===============================
  return (
    <div className="credit-page">
      <Nav theme={theme} onToggle={toggleTheme} />

      <header className="credit-hero">
        <h1 className="credit-title">Confirm Your Purchase</h1>
        <p className="credit-sub">
          Review your credit pack before proceeding to payment.
        </p>
      </header>

      <main className="credit-wrap">
        {loading ? (
          <div className="loading">Loading pack details...</div>
        ) : error ? (
          <div className="ad-error">{error}</div>
        ) : !pack ? (
          <div className="ad-empty">No pack selected.</div>
        ) : (
          <section className="payment-summary card">
            <h2>{pack.name}</h2>
            {pack.badge && <span className="chip">{pack.badge}</span>}

            <div className="summary-section">
              <p>
                <strong>Credits:</strong> {pack.credits}
              </p>
              <p>
                <strong>Base Price:</strong> ${pack.price.toFixed(2)}
              </p>
              {pack.discount_percent > 0 && (
                <p>
                  <strong>Pack Discount:</strong> {pack.discount_percent}% off
                </p>
              )}
            </div>

            {/* Coupon Section */}
            <div className="coupon-box">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
              />
              <button className="btn secondary" onClick={handleApplyCoupon}>
                Apply
              </button>
            </div>

            {/* Price Calculation */}
            <div className="summary-pricing">
              <p>
                <strong>Subtotal:</strong> ${pack.price.toFixed(2)}
              </p>
              {discount > 0 && (
                <p>
                  <strong>Coupon Discount:</strong> -{discount}%
                </p>
              )}
              <p className="total-line">
                <strong>Total:</strong>{" "}
                $
                {(
                  pack.price *
                  (1 - (pack.discount_percent + discount) / 100)
                ).toFixed(2)}
              </p>
            </div>

            {/* Checkout */}
            <div className="summary-actions">
              <button className="btn primary" onClick={handleCheckout}>
                Proceed to Stripe Checkout
              </button>
              <button className="btn secondary" onClick={() => history.back()}>
                Back
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="credit-footer">
        <p>© CogniVerse</p>
      </footer>
    </div>
  );
}
