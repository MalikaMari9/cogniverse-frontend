// ===============================
// Credit.jsx — Dynamic Credit Packs (API Integrated)
// ===============================

import React from "react";
import NavProduct from "../components/NavProduct";
import "../profile-nav.css";

import "../credit.css";
import { getActiveCreditPacks } from "../api/api"; // ✅ backend integration

// ===============================
// Theme Hook
// ===============================
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

// ===============================
// Reveal Animation Component
// ===============================
function Reveal({
  as: Tag = "div",
  variant = "up",
  delay = 0,
  children,
  className = "",
  ...rest
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => e.isIntersecting && el.classList.add("reveal-in")),
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref}
      style={{ "--reveal-delay": `${delay}ms` }}
      className={`reveal reveal-${variant} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// ===============================
// Icon Set
// ===============================
const IconSpark = (p) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path fill="currentColor" d="M12 2l1.9 5.7L20 10l-6.1 2.3L12 18l-1.9-5.7L4 10l6.1-2.3L12 2z" />
  </svg>
);
const IconBolt = (p) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path fill="currentColor" d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
  </svg>
);
const IconStars = (p) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path
      fill="currentColor"
      d="M6 9l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3zm12-6l1.6 4.8L24 9l-4.4 1.2L18 15l-1.6-4.8L12 9l4.4-1.2L18 3z"
    />
  </svg>
);
const IconGem = (p) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path fill="currentColor" d="M12 2l7 6-7 14L5 8l7-6zm0 4.3L8 8h8l-4-1.7z" />
  </svg>
);

// ===============================
// Pack Card
// ===============================
function PackCard({ tone = "violet", icon, name, price, credits, badge, bullets = [], onSelect }) {
  return (
    <Reveal as="article" className={`pack is-${tone}`} variant="up">
      <div className="plan-header">
        <div className="plan-icon">{icon}</div>
        <div className="plan-title">
          <h3>{name}</h3>
          {badge && <span className="chip">{badge}</span>}
        </div>
      </div>

      <div className="plan-details">
        <p className="credit-count">{credits} Credits</p>
        <div className="price-block">
          <div className="price-total">${price}</div>
          <div className="price-sub">${(price / credits).toFixed(2)} per credit</div>
        </div>
      </div>

      {bullets.length > 0 && (
        <ul className="plan-features">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}

      <div className="plan-cta">
        <button type="button" className="btn primary" onClick={onSelect}>
          Buy Now
        </button>
      </div>
    </Reveal>
  );
}

// ===============================
// Main Credit Page
// ===============================
export default function CreditPage() {
  const { theme, toggle: toggleTheme } = useTheme();

  const [packs, setPacks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedPack, setSelectedPack] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);

  // ✅ Fetch active packs from backend
  React.useEffect(() => {
    async function fetchPacks() {
      try {
        const res = await getActiveCreditPacks();
        const data = await getActiveCreditPacks();
console.log("✅ Received credit packs:", data);
const packsData = await getActiveCreditPacks();
console.log("✅ Full response from backend:", JSON.stringify(packsData, null, 2));
setPacks(packsData);

        const active = res.filter((p) => p.status === "active");

const mapped = active.map((p) => {
  const v = p.config_value || {};
  let icon;
  switch (v.tone) {
    case "cyan":
      icon = <IconSpark className="ico" />;
      break;
    case "pink":
      icon = <IconStars className="ico" />;
      break;
    case "teal":
    case "gold":
      icon = <IconGem className="ico" />;
      break;
    default:
      icon = <IconBolt className="ico" />;
  }
  return {
    id: p.config_key,
    tone: v.tone || "violet",
    icon,
    name: v.name || p.config_key,
    price: v.base_price_usd,
    credits: v.credits,
    badge: v.badge,
    bullets: [p.description || "Flexible credit pack for all needs"],
    stripe_link: p.stripe_link || v.stripe_price_id,  // ✅ add this line
  };
});
console.log("🧩 Final mapped packs with links:", mapped);

        const sorted = mapped.sort((a, b) => a.price - b.price);
setPacks(sorted);
      } catch (err) {
        console.error("❌ Failed to fetch credit packs:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPacks();
  }, []);

  const handleSelectPack = (pack) => {
    setSelectedPack(pack);
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);
const handleProceedToPayment = () => {
  if (selectedPack) {
    console.log("🛒 Selected pack for payment:", selectedPack);
    const stripeLink = selectedPack.stripe_link;
    console.log("🔗 Stripe link resolved to:", stripeLink);

    if (stripeLink && stripeLink.startsWith("http")) {
      window.open(stripeLink, "_blank", "noopener,noreferrer");
    } else {
      alert("Payment link not available for this pack.");
    }
  }
};


  return (
    <div className="credit-page">
      <NavProduct
  theme={theme}
  onToggleTheme={toggleTheme}
  active="workstation"
  onGoWorkstation={() => (window.location.href = "/workstation")}
  onGoGraph={() => (window.location.href = "/graph")}
  onGoHistory={() => (window.location.href = "/history")}
/>


      <header className="credit-hero">
        <Reveal as="h1" variant="down" className="credit-title">
          Buy Credits
        </Reveal>
        <Reveal as="p" variant="up" className="credit-sub">
          Choose a credit pack that fits your workflow.
        </Reveal>
      </header>

      <main className="credit-wrap">
        <section className="grid-credits">
          {loading ? (
            <div className="loading">Loading credit packs...</div>
          ) : packs.length === 0 ? (
            <div className="ad-empty">No active credit packs available.</div>
          ) : (
            packs.map((p, i) => <PackCard key={i} {...p} onSelect={() => handleSelectPack(p)} />)
          )}
        </section>

        <Reveal as="div" className="credit-faq card" variant="fade" delay={60}>
          <h3>How credits work</h3>
          <p>
            Credits power simulations, analysis, and exports. Each credit equals $1 and can be spent
            anytime — no expiration or subscription required.
          </p>
        </Reveal>
      </main>

      {/* 🔹 Confirmation Modal */}
      {showModal && selectedPack && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="summary-header">
              <h3>Confirm Purchase</h3>
            </div>
            <div className="summary-content">
              <p>
                <strong>{selectedPack.name}</strong> – {selectedPack.credits} credits total
              </p>
              <p>
                Price: <strong>${selectedPack.price}</strong> (
                {(selectedPack.price / selectedPack.credits).toFixed(2)} per credit)
              </p>
              <ul className="selected-features">
                {selectedPack.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
            <div className="summary-actions">
              <button className="btn primary" onClick={handleProceedToPayment}>
                Proceed to Payment
              </button>
              <button className="btn secondary" onClick={handleCloseModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="credit-footer">
        <p>© CogniVerse</p>
      </footer>
    </div>
  );
}
