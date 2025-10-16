// ===============================
// main.jsx
// ===============================
// React entry point for the CogniVerse frontend.
// Uses React Router for all client-side routing.
// Each <Route> maps to a page component.
// ===============================

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// 🌍 Pages
import App from "./App.jsx"; // Landing page
import FeaturesPage from "./pages/Features.jsx";
import OfferPage from "./pages/Offer.jsx";
import ContactPage from "./pages/Contact.jsx";
import AboutPage from "./pages/About.jsx";
import AuthPage from "./pages/Auth.jsx";
import ProfilePage from "./pages/Profile.jsx";

// 🧠 Workstation system
import WorkstationHub from "./pages/WorkstationHub.jsx";
import WorkstationPage from "./pages/Workstation.jsx";
import ScenarioPage from "./pages/ScenarioPage.jsx";

// 🧩 Development / experimental
import AgentNode from "./pages/AgentNodes.jsx";

import "./styles.css";

// ===============================
// Main Application Router
// ===============================
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* 
      BrowserRouter enables clean URLs (no hash) 
      and controls navigation entirely in the browser.
    */}
    <BrowserRouter>
      <Routes>
        {/* ===============================
            🌍  PUBLIC PAGES
            =============================== */}
        <Route path="/" element={<App />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/offer" element={<OfferPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* ===============================
            🔐  AUTHENTICATION
            =============================== */}
        {/* Default auth route (decides internally between login/signup) */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Direct routes for login/signup with preset mode */}
        <Route path="/login" element={<AuthPage defaultMode="login" />} />
        <Route path="/signup" element={<AuthPage defaultMode="signup" />} />

        {/* ===============================
            🧠  WORKSTATION SYSTEM
            =============================== */}
        {/* 1️⃣ Hub (list of all projects) */}
        <Route path="/workstation" element={<WorkstationHub />} />

        {/* 2️⃣ Create a new project */}
        <Route path="/workstation/new" element={<WorkstationPage />} />

        {/* 3️⃣ Open a specific project (agents, relationships, etc.) */}
        <Route path="/workstation/:projectid" element={<WorkstationPage />} />

        {/* 4️⃣ Scenario simulation page for that project */}
        <Route
          path="/workstation/:projectid/scenario"
          element={<ScenarioPage />}
        />

        {/* ===============================
            🧩  DEV / DEBUG ROUTES
            =============================== */}
        <Route path="/agentnodes" element={<AgentNode />} />

        {/* ===============================
            🚧  FALLBACK
            If no route matches, go home.
            =============================== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
