import React from 'react'
import Nav from '../components/Nav.jsx'

/* ========== Theme (unchanged) ========== */
function useTheme() {
  const [theme, setTheme] = React.useState(() => localStorage.getItem('theme') || 'light')
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])
  const toggle = () => setTheme(t => (t === 'light' ? 'dark' : 'light'))
  return { theme, toggle }
}

/* ========== Repeatable scroll-reveal that re-triggers on up/down ========== */
function useReveal({ once = false, threshold = 0.18, rootMargin = '0px 0px -12% 0px' } = {}) {
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

function Reveal({ as: Tag = 'div', className = '', variant = 'fade-up', delay = 0, repeat = true, ...rest }) {
  const ref = useReveal({ once: !repeat })
  return (
    <Tag ref={ref} className={`reveal ${variant} ${className}`} style={{ '--reveal-delay': `${delay}s` }} {...rest} />
  )
}

/* ========== Countdown (unchanged) ========== */
function useCountdown(minutes = 90) {
  const [left, setLeft] = React.useState(minutes * 60)
  React.useEffect(() => {
    const id = setInterval(() => setLeft(v => Math.max(v - 1, 0)), 1000)
    return () => clearInterval(id)
  }, [])
  const hh = String(Math.floor(left / 3600)).padStart(2, '0')
  const mm = String(Math.floor((left % 3600) / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

/* ========== Tiny inline icons (SVG) ========== */
const IconPercent = (p) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}><path fill="currentColor" d="M7 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5 20L20 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
)
const IconTicket = (p) => (
  <svg viewBox="0 0 64 44" aria-hidden="true" {...p}>
    <rect x="2" y="2" rx="16" ry="16" width="60" height="40" fill="url(#g)"/>
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop stopColor="#7A5CF4"/><stop offset="1" stopColor="#4C7BFF"/>
      </linearGradient>
    </defs>
  </svg>
)
const IconLock = (p) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}><path fill="currentColor" d="M7 10V7a5 5 0 0 1 10 0v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1zm2 0h6V7a3 3 0 0 0-6 0v3z"/></svg>
)
const IconVisa = (p) => (
  <svg viewBox="0 0 64 24" aria-hidden="true" {...p}>
    <rect width="64" height="24" rx="6" fill="rgba(255,255,255,.15)"/>
    <path d="M9 18l3-12h5l-3 12H9zm17-9c-1 0-2 .5-2.5 1.3l.4-1.1h-4l-2 8h4l.9-3.6c.2-.8.9-1.3 1.7-1.3.9 0 1.5.5 1.3 1.5L25 17h4l.6-2.6c.5-2.3-1-3.3-3.6-3.3zM39 6h-4l-3 12h4l3-12zm1.3 4.1c.8-.3 2-.5 3.5-.5 2 0 3.3.4 4.2 1.4.8.9.9 2 .5 3.6L47 18h-4l1.4-5.2c.2-.8 0-1.3-.6-1.7-.6-.4-1.6-.5-2.8-.2l-.7 3L38 18h-4l2.3-9.1c1-.3 2-.6 4-.8z" fill="currentColor"/>
  </svg>
)
const IconMaster = (p) => (
  <svg viewBox="0 0 64 24" aria-hidden="true" {...p}>
    <rect width="64" height="24" rx="6" fill="rgba(255,255,255,.15)"/>
    <circle cx="28" cy="12" r="7" fill="currentColor" opacity=".85"/>
    <circle cx="36" cy="12" r="7" fill="currentColor"/>
  </svg>
)
const IconTag = (p) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}><path fill="currentColor" d="M2 12l10 10 10-10-8-8H6z"/><circle cx="8" cy="8" r="2" fill="#fff"/></svg>
)

const IconShield = (p) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path d="M12 2l8 3v6c0 5-3.5 9.2-8 11-4.5-1.8-8-6-8-11V5l8-3z" fill="currentColor"/>
  </svg>
)
const IconCheck = (p) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path d="M9.5 16.2l-3.7-3.7 1.4-1.4 2.3 2.3 7-7 1.4 1.4-8.4 8.4z" fill="currentColor"/>
  </svg>
)
const IconX = (p) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)
/* simple wordmark chips render sharper than complex logos on small sizes */
const LogoChip = ({label, className}) => (
  <span className={`logo-chip ${className||''}`} aria-hidden>{label}</span>
)

/* ========== Discount badge ========== */
const DiscountBadge = () => (
  <div className="disc-badge ticket">
    <IconTicket className="ticket-bg" />
    <div className="ticket-content">
      <IconPercent className="ticket-percent" />
      <span className="cut">-40%</span>
    </div>
  </div>
)



/* ========== Reusable plan card ========== */
function Plan({ name, priceLine, subline, cta = 'Select', highlight = false, perks = [], onClick }) {
  return (
    <Reveal variant="fade-up" as="section">
      <div className={`plan ${highlight ? 'highlight' : ''}`} tabIndex={0}>
        <div className="plan-head">
          <h4>{name}</h4>
          {highlight && <span className="chip">Best Value</span>}
        </div>

        <div className="plan-price" style={{ marginTop: 4 }}>
          <div className="now" style={{ fontSize: 24 }}>{priceLine}</div>
        </div>
        {subline && <div className="bsub" style={{ marginBottom: 8 }}>{subline}</div>}

        <button className={`btn ${highlight ? 'primary' : ''}`} type="button" onClick={onClick}>
          {cta}
        </button>

        <ul className="perks" style={{ marginTop: 8 }}>
          {perks.map((p, i) => <li key={i}>{p}</li>)}
        </ul>
      </div>
    </Reveal>
  )
}

/* ========== Credits bullets ========== */
function CreditsBullets() {
  const items = [
    { icon: '①', title: '1 Credit — Basic interaction simulation' },
    { icon: '③', title: '3 Credits — Team synergy analysis' },
    { icon: '⑤', title: '5 Credits — Full leadership or motivation forecast' },
  ]
  return (
    <Reveal as="section" className="card" style={{ marginTop: 16 }} variant="fade-up">
      <h3 style={{ margin: '0 0 10px' }}>How Credits Work</h3>
      <div className="bullets">
        {items.map((it, i) => (
          <div className="bullet" key={i}>
            <div className="ic" aria-hidden>{it.icon}</div>
            <div className="btitle">{it.title}</div>
          </div>
        ))}
      </div>
      <p className="muted" style={{ marginTop: 8 }}>
        You control what you simulate — no hidden limits, no locked features.
      </p>
    </Reveal>
  )
}

export default function OfferPage() {
  const { theme, toggle } = useTheme()
  const countdown = useCountdown(90)
  const plansRef = React.useRef(null)
  const detailsRef = React.useRef(null)

  const [code, setCode] = React.useState('')
  const [codeMsg, setCodeMsg] = React.useState('')

  const handleApply = () => {
    const ok = /^(COGNI40|WELCOME40|SAVE40)$/i.test(code.trim())
    setCodeMsg(ok ? 'Code applied! 40% off unlocked.' : 'Invalid code. Try COGNI40.')
  }

  const scrollTo = (ref) => ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const links = [
    { label: 'Home', href: '/' },
    { label: 'Features', href: '/features' },
    { label: 'Contact', href: '/contact' },
    { label: 'About us', href: '/about' },
  ]

  return (
    <div className="app offer-page">
      <Nav onToggle={toggle} theme={theme} links={links} />

      <main className="offer-wrap">
        {/* HERO */}
        <div className="grid">
          {/* Left: headline + narrative + CTA */}
          <Reveal as="section" className="hero-copy card" variant="fade-right">
            <div className="eyebrow">What we offer</div>
            <h1>Let’s Build Smarter Organizations — Your Way</h1>

            <p className="muted" style={{ marginTop: 8 }}>
              Every company has data on employees.<br />Few have understanding.
            </p>
            <p className="muted" style={{ marginTop: 6 }}>
              CogniVerse bridges that gap — turning human psychology into actionable business intelligence.
            </p>
            <p className="muted" style={{ marginTop: 6 }}>
              Start free, and upgrade when you’re ready to go deeper.
            </p>

            <div className="cta-row">
              <button className="btn primary" type="button" onClick={() => scrollTo(plansRef)}>Start Free</button>
              <button className="btn ghost" type="button" onClick={() => scrollTo(detailsRef)}>See Details</button>
            </div>
          </Reveal>

          {/* Right: discount + coupon */}
          <Reveal as="section" className="hero-right card" variant="fade-left">
            <DiscountBadge />

            {/* Coupon field */}
            <div className="coupon field">
              <span className="left-ic" aria-hidden><IconTag /></span>
              <input
                placeholder="Enter code (e.g., COGNI40)"
                aria-label="Coupon code"
                value={code}
                onChange={e => { setCode(e.target.value); setCodeMsg(''); }}
                className={/invalid/i.test(codeMsg) ? 'shake' : ''}
              />
              <button className="btn ghost apply" type="button" onClick={handleApply}>Apply</button>
            </div>

            {/* <input
              placeholder="Enter code (e.g., COGNI40)"
              aria-label="Coupon code"
              value={code}
              onChange={e => { setCode(e.target.value); setCodeMsg(''); }}
              onKeyDown={e => { if (e.key === 'Enter') handleApply(); }}
              className={/invalid/i.test(codeMsg) ? 'shake' : ''}
            />

            {codeMsg && (
              <div className={`code-msg ${/applied/i.test(codeMsg) ? 'ok' : 'err'}`} aria-live="polite">
                {/applied/i.test(codeMsg) ? <IconCheck className="msg-ic"/> : <IconX className="msg-ic"/>}
                <span>{codeMsg}</span>
              </div>
            )} */}

            {/* Apply feedback */}
            {codeMsg && (
              <div className={`code-msg ${/applied/i.test(codeMsg) ? 'ok' : 'err'}`}>
                {/applied/i.test(codeMsg) ? <IconCheck className="msg-ic"/> : <IconX className="msg-ic"/>}
                <span>{codeMsg}</span>
              </div>
            )}

            {/* Brands row */}
            <div className="brands">
              <LogoChip label="VISA" className="visa" />
              <LogoChip label="Mastercard" className="mc" />
              <LogoChip label="AMEX" className="amex" />
              <LogoChip label="PayPal" className="pp" />
            </div>

            {/* Security line */}
            <div className="secureline">
              <IconShield className="shield" />
              <span>Secure checkout</span>
              <span className="sep">•</span>
              <IconLock className="lock" />
              <span>256-bit SSL</span>
            </div>
          </Reveal>
        </div>

        {/* PLANS */}
        <div ref={plansRef} className="plans" style={{ marginTop: 18 }}>
          <Plan
            name="Free Plan — Start Exploring"
            priceLine="$0"
            subline="Free forever — credits renew monthly."
            cta="Start Free"
            onClick={() => alert('Free plan selected')}
            perks={[
              'Discover how AI sees human behavior.',
              '10 free credits to simulate agents and scenarios',
              'Build and analyze up to 3 agents (MBTI, motivation, goals)',
              'Access basic compatibility and motivation insights',
              'View sample leadership and conflict predictions',
              'Community dashboard and basic analytics',
            ]}
          />

          <Plan
            name="Pro Plan — Unlock the Full Simulation Engine"
            priceLine="From $39/month"
            subline="Includes bonus 50 credits on signup."
            cta="Upgrade to Pro"
            highlight
            onClick={() => alert('Pro upgrade flow')}
            perks={[
              'For professionals who want predictive precision.',
              'Up to 500 credits/month for in-depth simulations',
              'Simulate up to 20 agents per scenario',
              'Access advanced behavioral forecasting (stress, bias, decision patterns)',
              'Generate team synergy, leadership, and motivation reports',
              'Download simulation summaries and AI insights',
              'Priority customer support',
            ]}
          />
        </div>

        {/* DETAILS / CREDITS */}
        <div ref={detailsRef}>
          <CreditsBullets />
        </div>
      </main>

      {/* Sticky countdown CTA */}
      <div className="sticky-cta">
        <span className="muted">Offer ends in&nbsp;</span>
        <strong>{countdown}</strong>
        <button className="btn primary" type="button" onClick={() => scrollTo(plansRef)}>Claim Offer</button>
      </div>
    </div>
  )
}














// import React from 'react'
// import Nav from '../components/Nav.jsx'

// function useTheme() {
//   const [theme, setTheme] = React.useState(() => localStorage.getItem('theme') || 'light')
//   React.useEffect(() => {
//     document.documentElement.setAttribute('data-theme', theme)
//     localStorage.setItem('theme', theme)
//   }, [theme])
//   const toggle = () => setTheme(t => (t === 'light' ? 'dark' : 'light'))
//   return { theme, toggle }
// }

// function useCountdown(minutes = 90) {
//   const [left, setLeft] = React.useState(minutes * 60)
//   React.useEffect(() => {
//     const id = setInterval(() => setLeft(v => Math.max(v - 1, 0)), 1000)
//     return () => clearInterval(id)
//   }, [])
//   const hh = String(Math.floor(left / 3600)).padStart(2, '0')
//   const mm = String(Math.floor((left % 3600) / 60)).padStart(2, '0')
//   const ss = String(left % 60).padStart(2, '0')
//   return `${hh}:${mm}:${ss}`
// }

// const DiscountBadge = () => (
//   <div className="disc-badge"><span className="cut">-40%</span></div>
// )

// /* Reusable plan card */
// function Plan({
//   name,
//   priceLine,
//   subline,
//   cta = 'Select',
//   highlight = false,
//   perks = [],
// }) {
//   return (
//     <div className={`plan ${highlight ? 'highlight' : ''}`}>
//       <div className="plan-head">
//         <h4>{name}</h4>
//         {highlight && <span className="chip">Best Value</span>}
//       </div>

//       <div className="plan-price" style={{marginTop: 4}}>
//         <div className="now" style={{fontSize: 24}}>{priceLine}</div>
//       </div>
//       {subline && <div className="bsub" style={{marginBottom: 8}}>{subline}</div>}

//       <button className={`btn ${highlight ? 'primary' : ''}`}>{cta}</button>

//       <ul className="perks" style={{marginTop: 8}}>
//         {perks.map((p, i) => <li key={i}>{p}</li>)}
//       </ul>
//     </div>
//   )
// }

// /* Credits bullets */
// function CreditsBullets() {
//   const items = [
//     { icon: '①', title: '1 Credit — Basic interaction simulation' },
//     { icon: '③', title: '3 Credits — Team synergy analysis' },
//     { icon: '⑤', title: '5 Credits — Full leadership or motivation forecast' },
//   ]
//   return (
//     <section className="card" style={{marginTop: 16}}>
//       <h3 style={{margin: '0 0 10px'}}>How Credits Work</h3>
//       <div className="bullets">
//         {items.map((it, i) => (
//           <div className="bullet" key={i}>
//             <div className="ic" aria-hidden>{it.icon}</div>
//             <div className="btitle">{it.title}</div>
//           </div>
//         ))}
//       </div>
//       <p className="muted" style={{marginTop: 8}}>
//         You control what you simulate — no hidden limits, no locked features.
//       </p>
//     </section>
//   )
// }

// export default function OfferPage() {
//   const { theme, toggle } = useTheme()
//   const countdown = useCountdown(90)

//   const links = [
//     { label: 'Home', href: '/' },
//     { label: 'Features', href: '/features' },
//     { label: 'Contact', href: '#contact' },
//     { label: 'About us', href: '#about' },
//   ]

//   return (
//     <div className="app offer-page">
//       <Nav onToggle={toggle} theme={theme} links={links} />

//       <main className="offer-wrap">
//         {/* HERO */}
//         <div className="grid">
//           {/* Left: headline + narrative + CTA */}
//           <section className="hero-copy card">
//             <div className="eyebrow">Offers Page</div>
//             <h1>Let’s Build Smarter Organizations — Your Way</h1>

//             <p className="muted" style={{marginTop: 8}}>
//               Every company has data on employees.<br/>
//               Few have understanding.
//             </p>
//             <p className="muted" style={{marginTop: 6}}>
//               CogniVerse bridges that gap — turning human psychology into actionable business intelligence.
//             </p>
//             <p className="muted" style={{marginTop: 6}}>
//               Start free, and upgrade when you’re ready to go deeper.
//             </p>

//             <div className="cta-row">
//               <a className="btn primary">Start Free</a>
//               <a className="btn ghost">See Details</a>
//             </div>
//           </section>

//           {/* Right: discount + coupon (kept) */}
//           <section className="hero-right card">
//             <DiscountBadge />
//             <div className="coupon">
//               <input placeholder="Enter code" aria-label="Coupon code"/>
//               <button className="btn ghost">Apply</button>
//             </div>
//             <div className="secure">
//               <span className="muted">VISA</span>
//               <span className="dot"></span><span className="dot"></span>
//               <span className="muted">SSL</span>
//             </div>
//           </section>
//         </div>

//         {/* PLANS */}
//         <div className="plans" style={{marginTop: 18}}>
//           <Plan
//             name="Free Plan — Start Exploring"
//             priceLine="$0"
//             subline="Free forever — credits renew monthly."
//             cta="Start Free"
//             perks={[
//               'Discover how AI sees human behavior.',
//               '10 free credits to simulate agents and scenarios',
//               'Build and analyze up to 3 agents (MBTI, motivation, goals)',
//               'Access basic compatibility and motivation insights',
//               'View sample leadership and conflict predictions',
//               'Community dashboard and basic analytics',
//             ]}
//           />

//           <Plan
//             name="Pro Plan — Unlock the Full Simulation Engine"
//             priceLine="From $39/month"
//             subline="Includes bonus 50 credits on signup."
//             cta="Upgrade to Pro"
//             highlight
//             perks={[
//               'For professionals who want predictive precision.',
//               'Up to 500 credits/month for in-depth simulations',
//               'Simulate up to 20 agents per scenario',
//               'Access advanced behavioral forecasting (stress, bias, decision patterns)',
//               'Generate team synergy, leadership, and motivation reports',
//               'Download simulation summaries and AI insights',
//               'Priority customer support',
//             ]}
//           />
//         </div>

//         {/* CREDITS SECTION */}
//         <CreditsBullets />
//       </main>

//       {/* Sticky countdown CTA (kept) */}
//       <div className="sticky-cta">
//         <span className="muted">Offer ends in&nbsp;</span>
//         <strong>{countdown}</strong>
//         <a className="btn primary">Claim Offer</a>
//       </div>
//     </div>
//   )
// }





// import React from 'react'
// import Nav from '../components/Nav.jsx'

// function useTheme() {
//   const [theme, setTheme] = React.useState(() => localStorage.getItem('theme') || 'light')
//   React.useEffect(() => {
//     document.documentElement.setAttribute('data-theme', theme)
//     localStorage.setItem('theme', theme)
//   }, [theme])
//   const toggle = () => setTheme(t => (t === 'light' ? 'dark' : 'light'))
//   return { theme, toggle }
// }

// function useCountdown(minutes = 90) {
//   const [left, setLeft] = React.useState(minutes * 60)
//   React.useEffect(() => {
//     const id = setInterval(() => setLeft(v => Math.max(v - 1, 0)), 1000)
//     return () => clearInterval(id)
//   }, [])
//   const hh = String(Math.floor(left / 3600)).padStart(2, '0')
//   const mm = String(Math.floor((left % 3600) / 60)).padStart(2, '0')
//   const ss = String(left % 60).padStart(2, '0')
//   return `${hh}:${mm}:${ss}`
// }

// const DiscountBadge = () => (
//   <div className="disc-badge"><span className="cut">-40%</span></div>
// )

// function Plan({name, price, old, perks=[], highlight=false}){
//   return (
//     <div className={`plan ${highlight ? 'highlight' : ''}`}>
//       <div className="plan-head">
//         <h4>{name}</h4>
//         {highlight && <span className="chip">Best Value</span>}
//       </div>
//       <div className="plan-price">
//         <div className="now">${price}</div>
//         {old && <div className="old">${old}</div>}
//       </div>
//       <button className={`btn ${highlight ? 'primary' : ''}`}>Claim</button>
//       <ul className="perks">
//         {perks.map((p,i)=>(<li key={i}>{p}</li>))}
//       </ul>
//     </div>
//   )
// }

// function Bullets(){
//   const items = [
//     {icon:'📦', title:'Free-shipping', sub:'Learn more'},
//     {icon:'🕑', title:'24/7 customer support', sub:'35-day money back'},
//     {icon:'✅', title:'20-day money', sub:'back guarantee'}
//   ]
//   return (
//     <div className="bullets">
//       {items.map((it,i)=>(
//         <div className="bullet" key={i}>
//           <div className="ic">{it.icon}</div>
//           <div>
//             <div className="btitle">{it.title}</div>
//             <div className="bsub">{it.sub}</div>
//           </div>
//         </div>
//       ))}
//     </div>
//   )
// }

// function WhatsIncluded(){
//   return (
//     <section className="included">
//       <h3>What's included</h3>
//       <div className="table">
//         <div className="row head">
//           <div>Feature</div><div>Basic</div><div>Pro</div><div>Ultimate</div>
//         </div>
//         {Array.from({length:4}).map((_,i)=>(
//           <div className="row" key={i}>
//             <div>Feature {i+1}</div>
//             <div>✓</div>
//             <div>✓</div>
//             <div>✓</div>
//           </div>
//         ))}
//       </div>
//     </section>
//   )
// }

// function FAQ(){
//   const qs = [
//     {q:'Frequentic questions', a:'Short answer goes here.'},
//     {q:'Questions questions', a:'Another compact answer.'},
//   ]
//   return (
//     <section className="faq">
//       <h3>FAQ</h3>
//       <ul>
//         {qs.map((x,i)=>(
//           <li key={i}>
//             <details>
//               <summary>{x.q}</summary>
//               <p>{x.a}</p>
//             </details>
//           </li>
//         ))}
//       </ul>
//     </section>
//   )
// }

// export default function OfferPage(){
//   const { theme, toggle } = useTheme()
//   const countdown = useCountdown(90)

//   const links = [
//     {label:'Home', href:'/'}, 
//     {label:'Features', href:'/features'},
//     {label:'Contact', href:'#contact'},
//     {label:'About us', href:'#about'}
//   ]

//   return (
//     <div className="app offer-page">
//       <Nav onToggle={toggle} theme={theme} links={links} />
//       <main className="offer-wrap">
//         <div className="grid">
//           <section className="hero-copy card">
//             <div className="eyebrow">Get Offer</div>
//             <h1>Limited-Time<br/>Offer</h1>
//             <p className="muted">Save on our best plans for a short time only</p>
//             <div className="cta-row">
//               <a className="btn primary">Claim Offer</a>
//               <a className="btn ghost">See Details</a>
//             </div>
//           </section>

//           <section className="hero-right card">
//             <DiscountBadge/>
//             <div className="coupon">
//               <input placeholder="Enter code"/>
//               <button className="btn ghost">Apply</button>
//             </div>
//             <div className="secure">
//               <span className="muted">VISA</span>
//               <span className="dot"></span><span className="dot"></span>
//               <span className="muted">SSL</span>
//             </div>
//           </section>
//         </div>

//         <div className="plans">
//           <Plan name="Basic" price="18,00" perks={['Free shipping','24/7 support']} />
//           <Plan name="Pro" price="4,000" old="4,500" highlight perks={['2 capacity','3 more projects']} />
//           <Plan name="Ultimate" price="32,00" perks={['Account','Add more']} />
//         </div>

//         <Bullets/>
//         <WhatsIncluded/>
//         <FAQ/>
//       </main>

//       <div className="sticky-cta">
//         <span className="muted">Offer ends in&nbsp;</span>
//         <strong>{countdown}</strong>
//         <a className="btn primary">Claim Offer</a>
//       </div>
//     </div>
//   )
// }
