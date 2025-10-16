
## Reusable Nav

You can now use a shared `<Nav />` component on *any* page:

```jsx
import Nav from './components/Nav.jsx'

export default function SomePage(){
  // optionally pass custom links and brand
  const links = [
    { label: 'Home', href: '/' },
    { label: 'Docs', href: '/docs' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Contact', href: '/contact' },
  ]
  const brand = { logo: '/logo.png', text: 'CogniVerse', href: '/' }

  return (
    <>
      <Nav theme="light" onToggle={() => { /* toggle theme */ }} links={links} brand={brand} />
      {/* rest of page */}
    </>
  )
}
```

Active link highlighting is automatic based on `window.location.pathname`.
