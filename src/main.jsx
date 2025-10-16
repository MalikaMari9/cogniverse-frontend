// main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App.jsx'
import FeaturesPage from './pages/Features.jsx'
import OfferPage from './pages/Offer.jsx'
import ContactPage from './pages/Contact.jsx'
import AboutPage from './pages/About.jsx'
import AuthPage from './pages/Auth.jsx'          // ← if Auth.jsx is in /pages
// import AuthPage from './Auth.jsx'             // ← use this line if Auth.jsx is NOT in /pages

import ProfilePage from './pages/Profile.jsx'     // ← if Profile.jsx is in /pages
// import ProfilePage from './Profile.jsx'        // ← use this if Profile.jsx is at project root
import WorkstationPage from './pages/Workstation.jsx';  // NEW

import AgentNode from './pages/AgentNodes.jsx';

import './styles.css'

function Router() {
  // normalize trailing slashes so "/profile/" works
  const rawPath = window.location.pathname
  const pathname = rawPath.replace(/\/+$/, '') || '/'
  const search   = window.location.search

  // Allow /auth?mode=login|signup|reset, and pretty paths /login or /signup
  const searchMode = new URLSearchParams(search).get('mode')
  const pathMode =
    pathname === '/login'  ? 'login'  :
    pathname === '/signup' ? 'signup' :
    undefined
  const defaultMode = searchMode || pathMode || 'login'

  if (pathname === '/features') return <FeaturesPage />
  if (pathname === '/offer')    return <OfferPage />
  if (pathname === '/contact')  return <ContactPage />
  if (pathname === '/about')    return <AboutPage />
  if (pathname === '/profile')  return <ProfilePage />


  // Auth routes (all map to the same page)
  if (pathname === '/auth' || pathname === '/login' || pathname === '/signup') {
    return <AuthPage defaultMode={defaultMode} />
  }

  if (pathname === '/workstation' || pathname.startsWith('/workstation/')) {
    return <WorkstationPage />;
  }

  if (pathname === '/agentnodes' || pathname.startsWith('/agentnodes/')) {
    return <AgentNode/>;
  }

  // Home
  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
)
