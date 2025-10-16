import React, { useEffect, useRef } from 'react'
import Nav from '../components/Nav.jsx'

/* =========================
   Theme
========================= */
function useTheme() {
  const [theme, setTheme] = React.useState(() => localStorage.getItem('theme') || 'light')
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])
  const toggle = () => setTheme(t => (t === 'light' ? 'dark' : 'light'))
  return { theme, toggle }
}

/* =========================
   Scroll-reveal helper (REPEAT)
   - Adds .is-visible when in view
   - Removes it when out of view
   - Animates every time you scroll in/out
========================= */
function useReveal({ once = false, threshold = 0.15, rootMargin = '0px 0px -10% 0px' } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Motion safety
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible')
      return
    }

    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            el.classList.add('is-visible')
            if (once) obs.unobserve(el) // one-shot if needed
          } else if (!once) {
            // remove on exit so it can play again next time
            el.classList.remove('is-visible')
          }
        })
      },
      { threshold, rootMargin }
    )

    obs.observe(el)
    return () => obs.disconnect()
  }, [once, threshold, rootMargin])

  return ref
}

/* Generic wrapper so we can animate any tag */
function Reveal({
  as: Tag = 'div',
  className = '',
  variant = 'fade-up',
  delay = 0,
  repeat = true,        // <— default to repeat animations
  children,
  ...rest
}) {
  const ref = useReveal({ once: !repeat })
  return (
    <Tag
      ref={ref}
      className={`reveal ${variant} ${className}`}
      style={{ '--reveal-delay': `${delay}s` }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/* =========================
   Visual bits
========================= */

// If your image is in the public folder as /waifu.png, this works.
// If it's inside src/assets, import it instead:
// import waifu from '../assets/waifu.png';
function Waifu() {
  const ref = useReveal({ threshold: 0.1 })
  return (
    <div ref={ref} className="waifu-wrap reveal zoom-in" style={{ '--reveal-delay': '.05s' }} aria-hidden="true">
      <img src="/waifu.png" /* or src={waifu} */ alt="Tech-suit waifu" className="waifu" />
    </div>
  )
}

function TechRing() {
  return (
    <div className="tech-ring" aria-hidden="true">
      <span className="ring r1" />
      <span className="ring r2" />
      <span className="ring r3" />
      <span className="ring r4" />
    </div>
  )
}

// Reusable pill with desktop hover "glass"
// Features.jsx — replace ONLY this component
function InfoPill({
  title,
  content,
  side = "",            // "left", "right", "mid", "left lower", "right lower"
  variant,              // optional reveal variant
  delay = 0,            // optional reveal delay
  glassSide = "top",    // "top" | "bottom" | "left" | "right" | "free"
  glassW = "300px",
  nudgeX = "0px",
  nudgeY = "0px",
}) {
  const sideClasses = side.trim();
  const style = {
    '--glass-w': glassW,
    '--glass-nudge-x': nudgeX,
    '--glass-nudge-y': nudgeY,
    '--reveal-delay': `${delay}s`,
  };

  // Render ONE absolute-positioned .info-pill and pass data-glass + style to it
  return (
    <Reveal
      as="div"
      variant={variant}
      className={`info-pill ${sideClasses}`}
      data-glass={glassSide}
      style={style}
    >
      <button className="pill" type="button">
        <strong>{title}</strong>
      </button>
      <div className="glass" role="dialog" aria-label={title}>
        <p style={{ margin: 0, lineHeight: 1.55 }}>{content}</p>
      </div>
    </Reveal>
  );
}




/* Pill that reveals on scroll (title only, content in glass on hover) */
// function InfoPill({ title, content, side = 'left', variant = 'fade-up', delay = 0 }) {
//   const ref = useReveal({ threshold: 0.1 })
//   return (
//     <div
//       ref={ref}
//       className={`info-pill reveal ${variant} ${side}`}
//       style={{ '--reveal-delay': `${delay}s` }}
//     >
//       <button className="pill" aria-expanded="false">
//         <strong>{title}</strong>
//       </button>
//       <div className="glass" role="region" aria-label={title}>
//         <p>{content}</p>
//       </div>
//     </div>
//   )
// }

// Constellation image (uses /public/node.png)
// Features.jsx
function ConstellationImage() {
  return (
    <Reveal as="section" className="constellation-wrap" variant="fade-up">
      <img
        className="constellation-img"
        src="/node.png"                  // public/node.png in Vite
        alt="Connected nodes illustration"
        loading="lazy"
        decoding="async"
      />
    </Reveal>
  );
}





export default function FeaturesPage() {
  const { theme, toggle } = useTheme()
  const links = [
    { label: 'Home', href: '/' },
    { label: 'Features', href: '/features' },
    { label: 'Contact', href: '/contact' },
    { label: 'About us', href: '/about' },
  ]

  return (
    <div className="app features-page">
      <Nav onToggle={toggle} theme={theme} links={links} />

      <main className="features-wrap">
        <Reveal as="h1" className="title" variant="zoom-in">Features</Reveal>

        <div className="center">
          <TechRing />
          <Waifu />
          <div className="pill-row">
          <InfoPill
            title="Personality (MBTI)"
            side="mid"
            variant="fade-right"
            delay={0.05}
            glassSide="bottom"           // open below the top-center pill
            glassW="360px"
            nudgeY="-250px"
            nudgeX="300px"
            content="Based on the Myers-Briggs framework, describes an individual's worldview and decision-making style. Personality types define each person’s style of collaboration, conflict response, and stress behavior."
          />

          <InfoPill
            title="Quirks"
            side="right"
            variant="fade-left"
            delay={0.10}
            glassSide="left"             // open to the left (away from screen edge)
            glassW="320px"
            nudgeX="280px"
            nudgeY="-130px"
            content="Distinct habits or traits that add unpredictability, reflecting human imperfections like overconfidence, impatience, or humor under pressure."
          />

          <InfoPill
            title="Biography"
            side="left lower"
            variant="fade-right"
            delay={0.15}
            glassSide="top"              // open above (bottom pill)
            glassW="340px"
            nudgeY="-80px"
            nudgeX=""
            content="Represents a person’s personal and professional background — past experiences, career path, and education — which influence their judgment and emotional resilience."
          />

          <InfoPill
            title="Motivation"
            side="right lower"
            variant="fade-left"
            delay={0.20}
            glassSide="top"              // open above (bottom pill)
            glassW="340px"
            nudgeY="-80px"
            nudgeX=""
            content="The internal drive — achievement, power, or affiliation — guiding how agents pursue goals and respond to incentives."
          />

          {/* Middle-left pill */}
          <InfoPill
            title="Constraints"
            side="left"
            variant="fade-right"
            delay={0.12}
            glassSide="right"            // open to the right (toward the center)
            glassW="320px"
            nudgeX="-280px"
            nudgeY="-130px"
            content="Real-world boundaries such as physical conditions, cultural norms, laws, or beliefs that limit choices and create authentic behavioral tension."
          />
        </div>
      </div>
        
       

        {/* Relationship Graph */}
        <section className="rel-graph">
          <Reveal as="h2" className="rel-title" variant="zoom-in">Relationship Graph Values</Reveal>

          <Reveal className="table-wrap" variant="fade-up" delay={.05} role="region" aria-label="Relationship graph values">
            <table className="rg-table">
              <thead>
                <tr>
                  <th scope="col">Level</th>
                  <th scope="col">Label</th>
                  <th scope="col">Description</th>
                  <th scope="col">Typical Graph Weight</th>
                </tr>
              </thead>
              <tbody>
                <Reveal as="tr" variant="fade-up" delay={.10}>
                  <td>+2</td>
                  <td>💗 <strong>Strong Like / Close Bond</strong></td>
                  <td>Deep trust, emotional connection, mutual support.</td>
                  <td><span className="chip positive">+2</span></td>
                </Reveal>
                <Reveal as="tr" variant="fade-up" delay={.16}>
                  <td>+1</td>
                  <td>😊 <strong>Like / Friendly</strong></td>
                  <td>Positive regard, cooperation, general goodwill.</td>
                  <td><span className="chip positive">+1</span></td>
                </Reveal>
                <Reveal as="tr" variant="fade-up" delay={.22}>
                  <td>0</td>
                  <td>😐 <strong>Neutral / Indifferent</strong></td>
                  <td>No strong feelings; limited or professional interaction.</td>
                  <td><span className="chip neutral">0</span></td>
                </Reveal>
                <Reveal as="tr" variant="fade-up" delay={.28}>
                  <td>-1</td>
                  <td>😒 <strong>Dislike / Tension</strong></td>
                  <td>Mild conflict, discomfort, or lack of trust.</td>
                  <td><span className="chip negative">-1</span></td>
                </Reveal>
                <Reveal as="tr" variant="fade-up" delay={.34}>
                  <td>-2</td>
                  <td>⚠️ <strong>Strong Dislike / Hostile</strong></td>
                  <td>Active conflict, animosity, or opposition.</td>
                  <td><span className="chip negative">-2</span></td>
                </Reveal>
              </tbody>
            </table>
          </Reveal>
           <ConstellationImage />
          <Reveal as="h3" className="rel-subtitle" variant="fade-left" delay={.05}>
            Simulate & Analyze
          </Reveal>
          <Reveal as="p" variant="fade-up" delay={.10}>
            Design complex real-world scenarios — from product launches to organizational shifts — and let CogniVerse
            reveal how your teams truly operate under pressure.
          </Reveal>
          <Reveal as="p" variant="fade-up" delay={.16}>
            Powered by directed weighted and relationship intelligence graphs, our engine models how influence, trust,
            and emotion evolve in real time as each AI agent adapts through its unique personality, motivation, and
            constraints.
          </Reveal>
          <Reveal as="p" variant="fade-up" delay={.22}>
            The result: a predictive map revealing collaboration patterns, risks, and resilience — uncovering conflicts,
            inefficiencies, and decision bottlenecks before they escalate.
          </Reveal>
        </section>

        
      </main>

      <footer className="footer">
        <p>© CogniVerse</p>
      </footer>
    </div>
  )
}
