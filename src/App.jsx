import React from 'react'
import Nav from './components/Nav.jsx'

/* =========================
   Theme (unchanged)
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
   Scroll-reveal (repeats)
========================= */
function useReveal({ once = false, threshold = 0.15, rootMargin = '0px 0px -10% 0px' } = {}) {
  const ref = React.useRef(null)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible')
      return
    }

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            el.classList.add('is-visible')
            if (once) io.unobserve(el)
          } else if (!once) {
            el.classList.remove('is-visible')
          }
        })
      },
      { threshold, rootMargin }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [once, threshold, rootMargin])

  return ref
}

function Reveal({
  as: Tag = 'div',
  className = '',
  variant = 'fade-up',
  delay = 0,
  repeat = true,
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
   Word-by-word helper
========================= */
function AnimatedWords({ text }) {
  return (
    <span className="words">
      {text.split(' ').map((w, i) => (
        <span key={i} className="word" style={{ '--i': i }}>
          {w}{' '}
        </span>
      ))}
    </span>
  )
}

/* ===== Wheel (DO NOT TOUCH) ===== */
const Wheel = () => {
  const nodes = [
    { angle: 90,  color: '#F06BC5' },   // pink
    { angle: 18,  color: '#7A5CF4' },   // violet
    { angle: -54, color: '#4C7BFF' },   // blue
    { angle: -126,color: '#7A5CF4' },   // violet
    { angle: 162, color: '#53F0E9' },   // cyan
  ]
  return (
    <div className="wheel" style={{ '--wheel-size': 'clamp(220px, 28vw, 340px)' }}>
      <div className="ring" />
      <div className="orbit">
        {nodes.map((n, i) => (
          <span key={i} className="node" style={{ '--angle': `${n.angle}deg`, '--clr': n.color }} />
        ))}
      </div>
      <div className="wheel-title">CogniVerse</div>
    </div>
  )
}

/* Keep one accent bar for cleanliness */
const Bars = () => (
  <div className="bars" style={{ gap: 12 }}>
    <div className="bar long"></div>
  </div>
)

/* ===== Simple inline SVG icons (white, sized in CSS) ===== */
const IconTeam = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <circle cx="8" cy="9" r="3" fill="currentColor" />
    <circle cx="16" cy="9" r="3" fill="currentColor" opacity=".85" />
    <rect x="4.5" y="14" width="15" height="6" rx="3" fill="currentColor" opacity=".65" />
  </svg>
)
const IconCrown = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path d="M3 9l4 3 5-6 5 6 4-3v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" fill="currentColor"/>
  </svg>
)
const IconFlame = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path d="M13 2s1 4-2 6c-3 2-4 3-4 6a5 5 0 0 0 10 0c0-3-2-5-2-7 0-2 1-3 1-3s-2 0-3 2z" fill="currentColor"/>
  </svg>
)

/* ===== Cards: icons + color circles (animated) ===== */
const Cards = () => {
  const items = [
    {
      title: 'Simulate Team Dynamics',
      blurb: 'Predict synergy, conflict points, and performance under pressure.',
      color: 'pink', Icon: IconTeam
    },
    {
      title: 'Enhance Leadership Intelligence',
      blurb: 'See how leadership styles impact morale, collaboration, and outcomes.',
      color: 'violet', Icon: IconCrown
    },
    {
      title: 'Map Motivation',
      blurb: 'Identify what drives engagement and spot burnout risks early.',
      color: 'cyan', Icon: IconFlame
    },
  ]
  return (
    <section className="cards">
      {items.map(({ title, blurb, color, Icon }, i) => (
        <Reveal key={i} variant="fade-up" delay={0.08 * i}>
          <article className="card">
            <div className={`circle is-${color}`}>
              <Icon className="circle-icon" />
            </div>
            <h3 className="card-title">{title}</h3>
            <p className="desc">{blurb}</p>
          </article>
        </Reveal>
      ))}
    </section>
  )
}

/* ===== Intro ===== */
const Intro = () => (
  <section className="section container intro">
    <Reveal as="h2" className="section-title" variant="fade-right">Introduction</Reveal>
    <Reveal as="p" variant="fade-up" delay={.06}>
      At CogniVerse, we believe that traditional simulations cannot replicate human behavior
      because they assume perfect, rational actors. The real world is messy, emotional, and human.
    </Reveal>
    <Reveal as="p" variant="fade-up" delay={.14}>
      Our agents replicate the unpredictability of human behavior—capturing stress, bias,
      memory lapses, and emotional reactions. By blending behavioral science with agent-based AI,
      companies can predict outcomes, identify blind spots, and optimize decision-making
      <strong> before they happen in real life.</strong>
    </Reveal>
  </section>
)

/* ===== Services ===== */
const Services = () => (
  <section className="section container services">
    <Reveal as="h2" className="section-title" variant="fade-left">What We Offer</Reveal>
    <Reveal as="h3" className="section-subtitle" variant="fade-left" delay={.06}>
      Build Smarter Organizations with AI-Driven Human Insight
    </Reveal>
    <ol className="service-list grid">
      <Reveal as="li" variant="fade-up" delay={.06}>
        <strong>Simulate Team Dynamics</strong> — Predict synergy, conflict points, and performance under pressure.
      </Reveal>
      <Reveal as="li" variant="fade-up" delay={.12}>
        <strong>Enhance Leadership Intelligence</strong> — Understand how different leadership styles impact morale and collaboration.
      </Reveal>
      <Reveal as="li" variant="fade-up" delay={.18}>
        <strong>Map Motivation</strong> — Identify what drives engagement and spot burnout risks early.
      </Reveal>
      <Reveal as="li" variant="fade-up" delay={.24}>
        <strong>Forecast Compatibility</strong> — Prevent conflicts by modeling personality interactions.
      </Reveal>
      <Reveal as="li" variant="fade-up" delay={.30}>
        <strong>Refine Recruitment</strong> — Predict how candidates fit within existing teams to hire for chemistry, not just capability.
      </Reveal>
    </ol>
  </section>
)

export default function App() {
  const { theme, toggle } = useTheme()
  return (
    <div className="app">
      <Nav onToggle={toggle} theme={theme} />

      {/* HERO */}
      <header className="hero">
        <Reveal variant="zoom-in"><Wheel /></Reveal>

        <Reveal as="h1" className="hero-headline anim-gradient" variant="fade-up" delay={.05}>
          Where <span>Behavioral Science</span> Meets <span>AI</span>
        </Reveal>

        <Reveal as="p" className="hero-subhead" variant="fade-up" delay={.12}>
          <AnimatedWords text="Agent-based simulations that behave like people—so you can predict outcomes with human realism." />
        </Reveal>

        <Reveal variant="fade-up" delay={.18}><Bars /></Reveal>
      </header>

      {/* Content */}
      <Cards />
      <Intro />
      <Services />

      <footer className="footer">
        <p>© CogniVerse</p>
      </footer>
    </div>
  )
}














// import React from 'react'
// import Nav from './components/Nav.jsx'

// /* Theme (unchanged) */
// function useTheme() {
//   const [theme, setTheme] = React.useState(() => localStorage.getItem('theme') || 'light')
//   React.useEffect(() => {
//     document.documentElement.setAttribute('data-theme', theme)
//     localStorage.setItem('theme', theme)
//   }, [theme])
//   const toggle = () => setTheme(t => (t === 'light' ? 'dark' : 'light'))
//   return { theme, toggle }
// }

// /* ===== Wheel (unchanged visually; just title text) ===== */
// const Wheel = () => {
//   const nodes = [
//     { angle: 90,  color: '#F06BC5' }, // top
//     { angle: 18,  color: '#9C6CF1' },
//     { angle: -54, color: '#6B7AF7' },
//     { angle: -126,color: '#5E56E4' },
//     { angle: 162, color: '#4EE7E1' },
//   ]
//   return (
//     <div className="wheel">
//       <div className="ring" />
//       <div className="orbit">
//         {nodes.map((n, i) => (
//           <span key={i} className="node" style={{ '--angle': `${n.angle}deg`, '--clr': n.color }} />
//         ))}
//       </div>
//       <div className="wheel-title">CogniVerse</div>
//     </div>
//   )
// }

// /* Keep your gradient bars */
// const Bars = () => (
//   <div className="bars">
//     <div className="bar short"></div>
//     <div className="bar long"></div>
//   </div>
// )

// /* ===== Cards: 3 key offers in your “second image” layout ===== */
// const Cards = () => {
//   const items = [
//     {
//       title: 'Simulate Team Dynamics',
//       blurb: 'Predict synergy, conflict points, and performance under pressure.',
//     },
//     {
//       title: 'Enhance Leadership Intelligence',
//       blurb: 'See how leadership styles impact morale, collaboration, and outcomes.',
//     },
//     {
//       title: 'Map Motivation',
//       blurb: 'Identify what drives engagement and spot burnout risks early.',
//     },
//   ]
//   return (
//     <section className="cards">
//       {items.map((it, i) => (
//         <article className="card" key={i}>
//           <div className="circle" />
//           <h3 className="card-title">{it.title}</h3>
//           <p className="desc">{it.blurb}</p>
//         </article>
//       ))}
//     </section>
//   )
// }

// /* ===== Intro + full services list from your doc ===== */
// const Intro = () => (
//   <section className="section container intro">
//     <h2 className="section-title">Motto</h2>
//     <p className="tagline"><em>Where Behavioral Science Meets AI</em></p>

//     <h2 className="section-title">Introduction</h2>
//     <p>
//       At CogniVerse, we believe that traditional simulations cannot replicate human behavior
//       because they assume perfect, rational actors. The real world is messy, emotional, and human.
//     </p>
//     <p>
//       Our agents replicate the unpredictability of human behavior—capturing stress, bias,
//       memory lapses, and emotional reactions. By blending behavioral science with agent-based AI,
//       companies can predict outcomes, identify blind spots, and optimize decision-making —
//       <strong> before they happen in real life.</strong>
//     </p>
//   </section>
// )

// const Services = () => (
//   <section className="section container services">
//     <h2 className="section-title">What We Offer (Our Services)</h2>
//     <h3 className="section-subtitle">Build Smarter Organizations with AI-Driven Human Insight</h3>
//     <ol className="service-list">
//       <li><strong>Simulate Team Dynamics</strong> — Predict synergy, conflict points, and performance under pressure.</li>
//       <li><strong>Enhance Leadership Intelligence</strong> — Understand how different leadership styles impact morale and collaboration.</li>
//       <li><strong>Map Motivation</strong> — Identify what drives engagement and spot burnout risks early.</li>
//       <li><strong>Forecast Compatibility</strong> — Prevent conflicts by modeling personality interactions.</li>
//       <li><strong>Refine Recruitment</strong> — Predict how candidates fit within existing teams to hire for chemistry, not just capability.</li>
//     </ol>
//   </section>
// )

// export default function App() {
//   const { theme, toggle } = useTheme()
//   return (
//     <div className="app">
//       <Nav onToggle={toggle} theme={theme} />

//       {/* HERO area keeps your original design */}
//       <header className="hero">
//         <Wheel />
//         <Bars />
//         {/* Tagline directly under the bars for quick context */}
//         <p className="tagline under-bars"><em>Where Behavioral Science Meets AI</em></p>
//       </header>

//       {/* Intro copy and the 3-key-offer cards */}
//       <Intro />
//       <Cards />

//       {/* Full services list for the details */}
//       <Services />

//       <footer className="footer">
//         <p>© CogniVerse</p>
//       </footer>
//     </div>
//   )
// }



