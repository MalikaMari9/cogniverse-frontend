import React from 'react'

export default function Nav({ theme = 'light', onToggle = () => {}, links, brand }) {
  const effectiveBrand = {
    logo: brand?.logo ?? '/logo.png',
    text: brand?.text ?? 'CogniVerse',
    href: brand?.href ?? '/'
  }

  const items = links && links.length ? links : [
    { key: 'home',     label: 'Home',     href: '/' },
    { key: 'features', label: 'Features', href: '/features' },
    { key: 'contact',  label: 'Contact',  href: '/contact' },
    { key: 'about',    label: 'About',    href: '/about' },
  ]

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/'

  const isActive = (href) => {
    try {
      const url = new URL(href, typeof window !== 'undefined' ? window.location.origin : 'https://example.com')
      return url.pathname === pathname
    } catch {
      return href === pathname || href === '#'
    }
  }

  const Icon = ({ name, active }) => {
    const stroke = 'currentColor'
    const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none' }
    switch (name) {
      case 'home':
        return (
          <svg {...common} aria-hidden="true">
            <path d="M3 10.5 12 3l9 7.5v8a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2v-8Z" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      case 'features':
        return (
          <svg {...common} aria-hidden="true">
            <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" stroke={stroke} strokeWidth="1.7" strokeLinejoin="round"/>
          </svg>
        )
      case 'contact':
        return (
          <svg {...common} aria-hidden="true">
            <path d="M4 6l8 6 8-6M5 19h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )
      case 'about':
        return (
          <svg {...common} aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.7"/>
            <path d="M12 10v6M12 7.5v.01" stroke={stroke} strokeWidth="1.7" strokeLinecap="round"/>
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <>
      {/* ======= Desktop top nav (unchanged) ======= */}
      <nav className="nav">
        <div className="brand">
          <a className="brand-link" href={effectiveBrand.href} aria-label={effectiveBrand.text}>
            <img className="logo" src={effectiveBrand.logo} alt="CogniVerse logo" />
            <span className="brand-text">{effectiveBrand.text}</span>
          </a>
        </div>

        <ul className="links">
          {items.map((it) => (
            <li key={it.href}>
              <a
                href={it.href}
                className={isActive(it.href) ? 'active' : undefined}
                aria-current={isActive(it.href) ? 'page' : undefined}
              >
                {it.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="actions">
          <button className={`toggle ${theme}`} onClick={onToggle} aria-label="Toggle theme">
            <span className="icon sun">☀️</span>
            <span className="icon moon">🌙</span>
          </button>
          <a className="offer" href="/offer">Offer</a>
          <a className="login login-mobile" href="/auth" aria-label="Login">
            Login
          </a>

        </div>

      </nav>

      {/* MOBILE-ONLY utilities row (toggle + Offer in one line) */}
<div className="mobile-utilities">
  <button
    className={`toggle ${theme}`}
    onClick={onToggle}
    aria-label="Toggle theme"
  >
    <span className="icon sun">☀️</span>
    <span className="icon moon">🌙</span>
  </button>

  <a className="offer offer-mobile" href="/offer" aria-label="See current offer">
    Offer
  </a>
  <a className="login login-mobile" href="/auth" aria-label="Login">
            Login
          </a>
</div>

<div className="bottom-nav-spacer" aria-hidden="true" />


      {/* ======= Mobile bottom tab bar (<=720px) ======= */}
      <nav className="bottom-nav" role="tablist" aria-label="Primary">
        <div className="bottom-shell">
          {items.map((it) => {
            const active = isActive(it.href)
            return (
              <a
                key={it.key}
                href={it.href}
                role="tab"
                aria-selected={active ? 'true' : 'false'}
                className={`bottom-item${active ? ' active' : ''}`}
                aria-label={it.label}
              >
                <span className="icon-wrap">
                  <Icon name={it.key} active={active} />
                </span>
                <span className="label">{it.label}</span>
                {active && <span className="ink" aria-hidden="true" />}
              </a>
            )
          })}
        </div>

        {/* small iOS-style indicator bar */}
        <div className="grabber" aria-hidden="true" />
      </nav>
    </>
  )
}
