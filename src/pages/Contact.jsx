import React from 'react'
import Nav from '../components/Nav.jsx'

/* =========================
   Local theme hook (same behavior as Home/Offer)
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
   Minimal reveal helper (matches site)
========================= */
function useReveal({ once = true, threshold = 0.12 } = {}) {
  const ref = React.useRef(null)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible'); return
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          el.classList.add('is-visible')
          if (once) io.unobserve(el)
        } else if (!once) el.classList.remove('is-visible')
      }),
      { threshold }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [once, threshold])
  return ref
}

function Reveal({ as:Tag='div', className='', variant='fade-up', delay=0, children, ...rest }) {
  const ref = useReveal({ once: true })
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
   Contact Page
========================= */
export default function ContactPage() {
  const { theme, toggle } = useTheme()

  // simple mailto handler
  const onSubmit = (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const name = form.get('name') || ''
    const email = form.get('email') || ''
    const subject = form.get('subject') || 'Hello CogniVerse'
    const message = form.get('message') || ''
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)
    window.location.href = `mailto:cogniverse123@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`
  }

  return (
    <div className="app contact-page">
      <Nav onToggle={toggle} theme={theme} />

      <section className="contact-wrap">
        <Reveal as="p" className="eyebrow" variant="fade-right">Get in touch /</Reveal>

        <div className="contact-grid">
          {/* Left copy column */}
          <Reveal as="div" className="left" variant="fade-right">
            <h1 className="contact-title">
              We’re ready to help you and answer your questions
            </h1>

            <p className="lead">
              Want to bring behavioral intelligence to your organization?
              Let’s build better teams together.
            </p>

            <div className="info-cards">
              {/* Call */}
                <div className="mini">
                <div className="mini-head">
                    <span className="icon-chip" aria-hidden="true">
                    {/* phone */}
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path d="M22 16.5v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 4.5 6.2 19.8 19.8 0 0 1 2.5 4.2 2 2 0 0 1 4.5 2h3a2 2 0 0 1 2 1.7c.1.8.3 1.6.6 2.4a2 2 0 0 1-.5 2.1L8.6 10a15.6 15.6 0 0 0 6 6l1.3-1c.6-.5 1.4-.6 2.1-.5.8.3 1.6.5 2.4.6A2 2 0 0 1 22 16.5Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    </span>
                    <h3>Call Center</h3>
                </div>
                <p>+95 9 7632 85340</p>
                </div>

                {/* Email */}
                <div className="mini">
                <div className="mini-head">
                    <span className="icon-chip" aria-hidden="true">
                    {/* mail */}
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
                        <path d="M3 7l9 6 9-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    </span>
                    <h3>Email</h3>
                </div>
                <p><a href="mailto:cogniverse123@gmail.com">cogniverse123@gmail.com</a></p>
                </div>

                {/* Social */}
                <div className="mini">
                <div className="mini-head">
                    <span className="icon-chip" aria-hidden="true">
                    {/* share/link */}
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path d="M10 13a5 5 0 0 0 7.1 0l2.1-2.1a5 5 0 0 0-7.1-7.1L11 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 11a5 5 0 0 0-7.1 0L4.8 13.1a5 5 0 0 0 7.1 7.1L13 19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    </span>
                    <h3>Social</h3>
                </div>

                <p className="social">
                    <a href="#" className="social-link" aria-label="X">
                    <span className="brand-chip x" aria-hidden="true">X</span>
                    <span>X</span>
                    </a>
                    <span className="dot" />
                    <a href="#" className="social-link" aria-label="LinkedIn" target="_blank" rel="noopener">
                    <span className="brand-chip in" aria-hidden="true">in</span>
                    <span>LinkedIn</span>
                    </a>
                    <span className="dot" />
                    <a href="#" className="social-link" aria-label="GitHub" target="_blank" rel="noopener">
                    <span className="brand-chip gh" aria-hidden="true">GH</span>
                    <span>GitHub</span>
                    </a>
                </p>
                </div>

            </div>
          </Reveal>

          {/* Right form column */}
          <Reveal as="div" className="contact-card card" variant="fade-left" delay={.06}>
            <h2>Get in Touch</h2>
            <p className="muted">
              Define your goals and the areas where AI can add value to your business.
            </p>

            <form className="contact-form" onSubmit={onSubmit}>
              <label>
                <span>Full name</span>
                <input name="name" type="text" autoComplete="name" required />
              </label>

              <label>
                <span>Email</span>
                <input name="email" type="email" autoComplete="email" required />
              </label>

              <label>
                <span>Subject</span>
                <input name="subject" type="text" placeholder="e.g., Leadership forecast" />
              </label>

              <label className="wide">
                <span>Message</span>
                <textarea name="message" rows="5" placeholder="Tell us briefly what you need…" />
              </label>

              <button className="btn primary" type="submit">Send a message</button>
            </form>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
