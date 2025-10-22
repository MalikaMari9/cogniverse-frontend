import React from 'react'
import Nav from '../components/Nav.jsx'
import "../payment.css"

/* ---- Theme hook (unchanged) ---- */
function useTheme() {
  const [theme, setTheme] = React.useState(() => localStorage.getItem('theme') || 'light')
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])
  const toggle = () => setTheme(t => (t === 'light' ? 'dark' : 'light'))
  return { theme, toggle }
}

/* ---- small reveal util (unchanged) ---- */
function useReveal({ once = false, threshold = 0.18, rootMargin = '0px 0px -12% 0px' } = {}) {
  const ref = React.useRef(null)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible'); return
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) el.classList.add('is-visible')
        else if (!once) el.classList.remove('is-visible')
      },
      { threshold, rootMargin }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [once, threshold, rootMargin])
  return ref
}
function Reveal({ as: Tag = 'section', className = '', variant = 'fade-up', delay = 0, repeat = true, ...rest }) {
  const ref = useReveal({ once: !repeat })
  return (
    <Tag
      ref={ref}
      className={`reveal ${variant} ${className}`}
      style={{ '--reveal-delay': `${delay}s` }}
      {...rest}
    />
  )
}

/* ---- Payment brand logo paths (swap to your own files/URLs) ---- */
const LOGOS = {
  visa:       '/assets/payments/visa.svg',
  mastercard: '/assets/payments/mastercard.svg',
  amex:       '/assets/payments/amex.svg',
  apple:      '/assets/payments/apple-pay.svg',
  google:     '/assets/payments/google-pay.svg',
  link:       '/assets/payments/link.svg',
}

/* ---- helpers ---- */
const formatMoney = n => `$${n.toLocaleString()}`

export default function PaymentPage() {
  const { theme, toggle } = useTheme()

  // read query (?cycle=monthly&code=COGNI40)
  const qs = new URLSearchParams(window.location.search)
  const cycle = (qs.get('cycle') || 'monthly').toLowerCase()
  const code  = (qs.get('code')  || '').trim().toUpperCase()

  // Stripe (replace these IDs with your real ones from backend)
  const PRICES = {
    pro: { monthly: 'price_pro_monthly_ID', yearly: 'price_pro_yearly_ID' }
  }

  const [selectedCycle, setSelectedCycle] = React.useState(cycle)
  const [coupon, setCoupon] = React.useState(code)
  const [busy, setBusy] = React.useState(false)
  const [msg, setMsg]   = React.useState('')
  const [note, setNote] = React.useState('')
  const [method, setMethod] = React.useState('card') // card | mastercard | amex | apple | google | link

  const preview = selectedCycle === 'yearly'
    ? { base: 468, note: '($39 × 12 months)' }
    : { base: 39,  note: 'Billed monthly, cancel anytime' }

  const methods = [
    { id: 'card',       name: 'Visa',         logo: LOGOS.visa,       caption: 'All major cards at checkout' },
    { id: 'mastercard', name: 'Mastercard',   logo: LOGOS.mastercard, caption: 'Pay with your Mastercard' },
    { id: 'amex',       name: 'AMEX',         logo: LOGOS.amex,       caption: 'American Express supported' },
    { id: 'apple',      name: 'Apple Pay',    logo: LOGOS.apple,      caption: 'Safari / iOS / macOS devices' },
    { id: 'google',     name: 'Google Pay',   logo: LOGOS.google,     caption: 'Chrome / Android devices' },
    { id: 'link',       name: 'Link',         logo: LOGOS.link,       caption: 'Fast checkout by Stripe' },
  ]

  const applyCoupon = () => {
    // preview-only UX; real validation should happen server-side
    setNote(coupon ? `Code “${coupon}” will be validated at checkout.` : 'No code entered.')
    setTimeout(() => setNote(''), 2500)
  }

  const createCheckout = async () => {
    setBusy(true); setMsg('')
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: PRICES.pro[selectedCycle],
          coupon: coupon || undefined,
          mode: 'subscription',
          metadata: { plan: 'pro', cycle: selectedCycle, preferred_method: method }
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unable to start checkout')
      window.location.href = data.url  // Stripe Checkout URL
    } catch (err) {
      setMsg(err.message)
    } finally {
      setBusy(false)
    }
  }

  const links = [
    { label: 'Home', href: '/' },
    { label: 'Features', href: '/features' },
    { label: 'Contact', href: '/contact' },
    { label: 'About us', href: '/about' },
  ]

  return (
    <div className="app pay-page">
      <Nav onToggle={toggle} theme={theme} links={links} />

      <main className="pay-wrap">
        <Reveal as="header" className="pay-head fade-right">
          <h1>Checkout — Pro Plan</h1>
          <p className="muted">Secure payment powered by Stripe. Cards, wallets, and Link are supported.</p>
        </Reveal>

        <div className="pay-grid">
          {/* LEFT — Order summary */}
          <Reveal className="card fade-up" role="region" aria-label="Order summary">
            <h3 className="eyebrow">Order Summary</h3>

            <div className="cycle-switch" role="tablist" aria-label="Billing cycle">
              <button
                type="button"
                role="tab"
                aria-selected={selectedCycle === 'monthly'}
                className={selectedCycle === 'monthly' ? 'on' : ''}
                onClick={() => setSelectedCycle('monthly')}
              >Monthly</button>
              <button
                type="button"
                role="tab"
                aria-selected={selectedCycle === 'yearly'}
                className={selectedCycle === 'yearly' ? 'on' : ''}
                onClick={() => setSelectedCycle('yearly')}
              >Yearly <span className="save">Save ~17%</span></button>
            </div>

            <ul className="perks">
              <li>Up to 500 credits/month</li>
              <li>Advanced behavioral forecasts</li>
              <li>Exportable reports</li>
              <li>Priority support</li>
            </ul>

            <div className="total">
              <div className="amt">{formatMoney(preview.base)}</div>
              <div className="note">{preview.note}</div>
            </div>

            <div className="coupon-line" role="group" aria-label="Coupon">
              <span>Have a code?</span>
              <div className="coupon-field">
                <input
                  id="coupon"
                  value={coupon}
                  onChange={e => setCoupon(e.target.value.toUpperCase())}
                  placeholder="COGNI40"
                  inputMode="text"
                  autoComplete="off"
                />
                <button type="button" className="btn ghost sm" onClick={applyCoupon}>Apply</button>
              </div>
            </div>
            {note && <div className="note-line">{note}</div>}
            {msg &&  <div className="err-line" role="alert">{msg}</div>}

            <button
              className="btn primary wide"
              type="button"
              disabled={busy}
              onClick={createCheckout}
            >
              {busy ? 'Starting secure checkout…' : 'Pay with Card / Wallet (Stripe)'}
            </button>

            <div className="safe" aria-live="polite">
              <svg className="lock-ic" aria-hidden viewBox="0 0 24 24"><path d="M7 10V8a5 5 0 0 1 10 0v2h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1zm2 0h6V8a3 3 0 0 0-6 0v2z" fill="currentColor"/></svg>
              <span>256-bit SSL • PCI-DSS compliant</span>
            </div>
          </Reveal>

          {/* RIGHT — Payment methods + micro FAQ */}
          <Reveal className="card fade-left" role="region" aria-label="Payment methods and policies">
            <h3 className="eyebrow">Payment methods</h3>

            <fieldset className="pm-list" aria-label="Choose your preferred method (optional)">
              {methods.map(m => (
                <div className="pm-item" key={m.id}>
                  <input
                    id={`pm-${m.id}`}
                    type="radio"
                    name="pm"
                    value={m.id}
                    checked={method === m.id}
                    onChange={() => setMethod(m.id)}
                  />
                  <label className="pm-chip" htmlFor={`pm-${m.id}`}>
                    <img src={m.logo} alt="" className="pm-logo" />
                    <span className="pm-name">{m.name}</span>
                  </label>
                </div>
              ))}
            </fieldset>

            <p className="muted small">
              You’ll see wallet options (Apple Pay / Google Pay / Link) automatically on the Stripe page if your
              browser and device support them.
            </p>

            <div className="hr" />

            <details>
              <summary>Need invoice or bank transfer?</summary>
              <p className="muted">Contact us and we’ll issue a manual invoice or provide bank transfer details.</p>
            </details>
            <details>
              <summary>Refunds</summary>
              <p className="muted">30-day money-back guarantee on the first subscription payment.</p>
            </details>
          </Reveal>
        </div>
      </main>
    </div>
  )
}
