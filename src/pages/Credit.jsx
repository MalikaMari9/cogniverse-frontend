// credit.jsx
import React, { createContext, useContext, useRef } from 'react';
import Nav from "../components/Nav.jsx";
import "../credit.css";

const ScrollContext = createContext();

export function ScrollProvider({ children }) {
  const proceedToPaymentRef = useRef(null);

  const scrollToProceed = () => {
    if (proceedToPaymentRef.current) {
      proceedToPaymentRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  return (
    <ScrollContext.Provider value={{ proceedToPaymentRef, scrollToProceed }}>
      {children}
    </ScrollContext.Provider>
  );
}

export function useScroll() {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error('useScroll must be used within a ScrollProvider');
  }
  return context;
}

/* Local theme hook */
function useTheme() {
  const [theme, setTheme] = React.useState(
    () => localStorage.getItem("theme") || "light"
  );
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  const toggle = () => setTheme(t => (t === "light" ? "dark" : "light"));
  return { theme, toggle };
}

/* Tiny reveal-on-scroll helper */
function Reveal({ as: Tag = "div", variant = "up", delay = 0, children, className = "", ...rest }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => e.isIntersecting && el.classList.add("reveal-in")),
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

/* Inline icons */
const IconSpark = (p) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path fill="currentColor" d="M12 2l1.9 5.7L20 10l-6.1 2.3L12 18l-1.9-5.7L4 10l6.1-2.3L12 2z"/>
  </svg>
);
const IconBolt = (p) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path fill="currentColor" d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>
  </svg>
);
const IconGem = (p) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path fill="currentColor" d="M12 2l7 6-7 14L5 8l7-6zm0 4.3L8 8h8l-4-1.7z"/>
  </svg>
);
const IconStars = (p) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path fill="currentColor" d="M6 9l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3zm12-6l1.6 4.8L24 9l-4.4 1.2L18 15l-1.6-4.8L12 9l4.4-1.2L18 3z"/>
  </svg>
);

function PackCard({ tone = "violet", icon, name, price, badge, bullets = [], isSelected, onSelect }) {
  return (
    <Reveal as="article" className={`pack is-${tone} ${isSelected ? 'selected' : ''}`} variant="up">
      <div className="pack-top">
        <div className="pack-icon">{icon}</div>
        {badge && <span className="chip">{badge}</span>}
      </div>
      <h3 className="pack-name">{name}</h3>
      <div className="pack-price">
        <span className="currency">$</span>
        <span className="amount">{price}</span>
        <span className="per">/ pack</span>
      </div>
      <ul className="pack-points">
        {bullets.map((b, i) => <li key={i}>{b}</li>)}
      </ul>
      <button 
        type="button" 
        className={`btn ${isSelected ? 'secondary' : 'primary'}`}
        aria-label={isSelected ? `Selected: ${name}` : `Select ${name}`}
        onClick={onSelect}
      >
        {isSelected ? 'Selected ✓' : 'Select'}
      </button>
    </Reveal>
  );
}

// Pack configurations
export const PACKS_CONFIG = {
  starter: {
    id: 'starter',
    tone: "cyan",
    icon: <IconSpark className="ico" />,
    name: "Starter",
    price: 5,
    credits: 50,
    badge: "New",
    bullets: ["Great for trying the engine", "Light simulations & previews", "Email support"]
  },
  explorer: {
    id: 'explorer',
    tone: "violet",
    icon: <IconBolt className="ico" />,
    name: "Explorer",
    price: 10,
    credits: 120,
    badge: "Popular",
    bullets: ["More runs & variations", "Save scenarios", "Priority in queue"]
  },
  pro: {
    id: 'pro',
    tone: "pink",
    icon: <IconStars className="ico" />,
    name: "Pro",
    price: 20,
    credits: 300,
    badge: "",
    bullets: ["Batch experiments", "Download summaries", "Team sharing (basic)"]
  },
  studio: {
    id: 'studio',
    tone: "teal",
    icon: <IconGem className="ico" />,
    name: "Studio",
    price: 40,
    credits: 800,
    badge: "Best value",
    bullets: ["Heavy exploration", "Advanced exports", "Priority support"]
  },
};

export default function CreditPage() {
  const { theme, toggle } = useTheme();
  const [selectedPack, setSelectedPack] = React.useState(null);
  const summaryRef = React.useRef(null);

  const packs = Object.values(PACKS_CONFIG);

  const handleSelectPack = (pack) => {
    const wasAlreadySelected = selectedPack?.id === pack.id;
    
    if (wasAlreadySelected) {
      setSelectedPack(null);
    } else {
      setSelectedPack(pack);
      
      // Scroll to summary after a small delay to allow state update and rendering
      setTimeout(() => {
        if (summaryRef.current) {
          summaryRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'center'
          });
          
          // Add a slight visual highlight
          summaryRef.current.classList.add('highlight');
          setTimeout(() => {
            summaryRef.current?.classList.remove('highlight');
          }, 1500);
        }
      }, 100);
    }
  };

  const handleProceedToPayment = () => {
    if (selectedPack) {
      window.location.href = `/payment?pack=${selectedPack.id}`;
    }
  };

  return (
    <div className="credit-page">
      <Nav theme={theme} onToggle={toggle} />

      <header className="credit-hero">
        <Reveal as="h1" variant="down" className="credit-title">
          Buy Credits
        </Reveal>
        <Reveal as="p" variant="up" className="credit-sub">
          Choose a pack that fits your workflow. No commitment—add credits when you need them.
        </Reveal>
      </header>

      <main className="credit-wrap">
        <section className="grid-credits">
          {packs.map((p, i) => (
            <PackCard 
              key={i} 
              {...p} 
              isSelected={selectedPack?.id === p.id}
              onSelect={() => handleSelectPack(p)}
            />
          ))}
        </section>

        {/* Selected Pack Summary */}
        {selectedPack && (
          <Reveal 
            as="div" 
            className="selected-summary card" 
            variant="fade" 
            delay={60}
            ref={summaryRef}
          >
            <div className="summary-header">
              <h3>Selected Plan: {selectedPack.name}</h3>
              <button 
                type="button" 
                className="btn primary"
                onClick={handleProceedToPayment}
              >
                Proceed to Payment - ${selectedPack.price}
              </button>
            </div>
            <div className="summary-content">
              <div className="pack-info">
                <div className="credits-badge">{selectedPack.credits} credits</div>
                <ul className="selected-features">
                  {selectedPack.bullets.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="scroll-indicator">
              <span>↑</span>
            </div>
          </Reveal>
        )}

        <Reveal as="div" className="credit-faq card" variant="fade" delay={60}>
          <h3>How credits work</h3>
          <p>
            Credits power simulations, analysis passes, and exports. Pricing is pack-based so you
            can scale as you explore.
          </p>
        </Reveal>
      </main>

      <footer className="credit-footer">
        <p>© CogniVerse</p>
      </footer>
    </div>
  );
}