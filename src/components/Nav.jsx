import React from 'react'

/**
 * Reusable Nav component (no router required)
 * Props:
 * - theme: 'light' | 'dark'
 * - onToggle: () => void
 * - links: Array<{ label: string, href: string }>
 * - brand: { logo?: string, text?: string, href?: string }
 */
export default function Nav({ theme = 'light', onToggle = () => {}, links, brand }) {
  const effectiveBrand = {
    logo: brand?.logo ?? '/logo.png',
    text: brand?.text ?? 'CogniVerse',
    href: brand?.href ?? '/'
  }

  const items = links && links.length ? links : [
    { label: 'Home', href: '/' },
    { label: 'Features', href: '/features' },
    { label: 'Contact', href: '/contact' },
    { label: 'About us', href: '/about' },
  ]

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/'

  const isActive = (href) => {
    try {
      const url = new URL(href, window.location.origin)
      return url.pathname === pathname
    } catch {
      return href === pathname || href === '#'
    }
  }

  return (
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
      </div>
      <div className="actions">
        
        <a className="offer" href="/auth">Login</a>
      </div>
    </nav>
  )
}
