// Payment.jsx
import React from 'react'
import Nav from '../components/Nav.jsx'
import { PACKS_CONFIG } from './Credit.jsx' // Import the shared config
import "../payment.css"

/* ---- Theme hook ---- */
function useTheme() {
  const [theme, setTheme] = React.useState(() => localStorage.getItem('theme') || 'light')
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])
  const toggle = () => setTheme(t => (t === 'light' ? 'dark' : 'light'))
  return { theme, toggle }
}

/* ---- small reveal util ---- */
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

/* ---- Payment brand logo paths ---- */
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

  // Read pack ID from URL and get full pack details from shared config
  const qs = new URLSearchParams(window.location.search)
  const packId = qs.get('pack') || 'starter'
  const selectedPack = PACKS_CONFIG[packId] || PACKS_CONFIG.starter

  const cycle = (qs.get('cycle') || 'monthly').toLowerCase()
  const code  = (qs.get('code')  || '').trim().toUpperCase()

  // Stripe prices
  const PRICES = {
    starter: { monthly: 'price_starter_monthly_ID', yearly: 'price_starter_yearly_ID' },
    explorer: { monthly: 'price_explorer_monthly_ID', yearly: 'price_explorer_yearly_ID' },
    pro: { monthly: 'price_pro_monthly_ID', yearly: 'price_pro_yearly_ID' },
    studio: { monthly: 'price_studio_monthly_ID', yearly: 'price_studio_yearly_ID' }
  }

  const [selectedCycle, setSelectedCycle] = React.useState(cycle)
  const [coupon, setCoupon] = React.useState(code)
  const [busy, setBusy] = React.useState(false)
  const [msg, setMsg]   = React.useState('')
  const [note, setNote] = React.useState('')
  const [method, setMethod] = React.useState('card')

  const preview = selectedCycle === 'yearly'
    ? { 
        base: Math.round(selectedPack.price * 12 * 0.83), 
        note: `($${selectedPack.price} × 12 months with 17% discount)`,
        savings: selectedPack.price * 12 - Math.round(selectedPack.price * 12 * 0.83)
      }
    : { 
        base: selectedPack.price,  
        note: 'Billed monthly, cancel anytime',
        savings: 0
      }

  const methods = [
    { id: 'card',       name: 'Visa',         logo: LOGOS.visa,       caption: 'All major cards at checkout' },
    { id: 'mastercard', name: 'Mastercard',   logo: LOGOS.mastercard, caption: 'Pay with your Mastercard' },
    { id: 'amex',       name: 'AMEX',         logo: LOGOS.amex,       caption: 'American Express supported' },
    { id: 'apple',      name: 'Apple Pay',    logo: LOGOS.apple,      caption: 'Safari / iOS / macOS devices' },
    { id: 'google',     name: 'Google Pay',   logo: LOGOS.google,     caption: 'Chrome / Android devices' },
    { id: 'link',       name: 'Link',         logo: LOGOS.link,       caption: 'Fast checkout by Stripe' },
  ]

  const applyCoupon = () => {
    setNote(coupon ? `Code "${coupon}" will be validated at checkout.` : 'No code entered.')
    setTimeout(() => setNote(''), 2500)
  }

  const createCheckout = async () => {
    setBusy(true); setMsg('')
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: PRICES[packId]?.[selectedCycle] || PRICES.starter[selectedCycle],
          coupon: coupon || undefined,
          mode: 'subscription',
          metadata: { 
            plan: packId, 
            packName: selectedPack.name,
            credits: selectedPack.credits,
            cycle: selectedCycle, 
            preferred_method: method 
          }
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unable to start checkout')
      window.location.href = data.url
    } catch (err) {
      setMsg(err.message)
    } finally {
      setBusy(false)
    }
  }

  const links = [
    { label: 'Home', href: '/' },
    { label: 'Features', href: '/features' },
    { label: 'Credits', href: '/credits' },
    { label: 'Contact', href: '/contact' },
    { label: 'About us', href: '/about' },
  ]

  return (
    <div className="app pay-page">
      <Nav onToggle={toggle} theme={theme} links={links} />

      <main className="pay-wrap">
        <Reveal as="header" className="pay-head fade-right">
          <h1>Checkout — {selectedPack.name}</h1>
          <p className="muted">Secure payment powered by Stripe. Cards, wallets, and Link are supported.</p>
        </Reveal>

        <div className="pay-grid">
          {/* LEFT — Order summary */}
          <Reveal className="card fade-up" role="region" aria-label="Order summary">
            <div className={`pack-badge-large is-${selectedPack.tone}`}>
              <span className="pack-name">{selectedPack.name}</span>
              <span className="credits">{selectedPack.credits} credits</span>
            </div>

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
              >
                Yearly 
                {preview.savings > 0 && (
                  <span className="save">Save ${preview.savings}</span>
                )}
              </button>
            </div>

            <ul className="perks">
              {selectedPack.bullets.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
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
              {busy ? 'Starting secure checkout…' : `Pay ${formatMoney(preview.base)} with Stripe`}
            </button>

            <div className="safe" aria-live="polite">
              <svg className="lock-ic" aria-hidden viewBox="0 0 24 24"><path d="M7 10V8a5 5 0 0 1 10 0v2h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1zm2 0h6V8a3 3 0 0 0-6 0v2z" fill="currentColor"/></svg>
              <span>256-bit SSL • PCI-DSS compliant</span>
            </div>
          </Reveal>

          {/* RIGHT — Payment methods */}
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
              You'll see wallet options automatically on the Stripe page if supported.
            </p>

            <div className="hr" />

            <details>
              <summary>Change plan?</summary>
              <p className="muted">
                Selected: <strong>{selectedPack.name}</strong> - {selectedPack.credits} credits (${selectedPack.price})
                <br />
                <a href="/credits" className="link">← Choose a different plan</a>
              </p>
            </details>
          </Reveal>
        </div>
      </main>
    </div>
  )
}