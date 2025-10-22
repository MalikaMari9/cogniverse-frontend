// ===============================
// main.jsx
// ===============================
// React entry point for the CogniVerse frontend.
// Handles all routes and integrates authentication context.
// ===============================

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AppRoot from "./AppRoot.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { withGlobalMaintenanceGuard } from "./components/withGlobalMaintenanceGuard.jsx";

import "./styles.css";

/* ===============================
   🌍 PUBLIC PAGES
   =============================== */
import App from "./App.jsx"; // Landing page
import FeaturesPage from "./pages/Features.jsx";
import OfferPage from "./pages/Offer.jsx";
import ContactPage from "./pages/Contact.jsx";
import AboutPage from "./pages/About.jsx";
import AuthPage from "./pages/Auth.jsx";
import MaintenancePage from "./pages/MaintenancePage.jsx";
import UnauthorizedPage from "./pages/UnauthorizedPage.jsx";
/* ===============================
   👤 USER PAGES
   =============================== */
import ProfilePage from "./pages/Profile.jsx";

/* ===============================
   🧠 WORKSTATION SYSTEM
   =============================== */
import WorkstationHub from "./pages/WorkstationHub.jsx";
import WorkstationPage from "./pages/Workstation.jsx";
import ScenarioPage from "./pages/ScenarioPage.jsx";

/* ===============================
   🧩 DEVELOPMENT / EXPERIMENTAL
   =============================== */
import AgentNode from "./pages/AgentNodes.jsx";
import WorkstationPageTest from "./pages/TestAgent.jsx";
import SessionMonitor from "./pages/SessionMonitor.jsx";
//import AdminTest from "./pages/TestAdmin.jsx";

/* ===============================
   🧱 ADMIN SECTION
   =============================== */
import AdminPage from "./pages/Admin.jsx";

/* ===============================
   🌐 WRAP APP ROOT WITH MAINTENANCE GUARD
   =============================== */
const GuardedAppRoot = withGlobalMaintenanceGuard(AppRoot);

/* ===============================
   🌐 ROOT
   =============================== */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* ⛑️ Apply global maintenance check here */}
      <GuardedAppRoot>
        <Routes>
          {/* ===============================
              🌍  PUBLIC
              =============================== */}
          <Route path="/" element={<App />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/offer" element={<OfferPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* ===============================
              🔐  AUTH
              =============================== */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<AuthPage defaultMode="login" />} />
          <Route path="/signup" element={<AuthPage defaultMode="signup" />} />

          {/* ===============================
              👤  USER (PROTECTED)
              =============================== */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* ===============================
              🧠  WORKSTATION SYSTEM (PROTECTED)
              =============================== */}
          <Route
            path="/workstation"
            element={
              <ProtectedRoute>
                <WorkstationHub />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workstation/new"
            element={
              <ProtectedRoute>
                <WorkstationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workstation/:projectid"
            element={
              <ProtectedRoute>
                <WorkstationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workstation/:projectid/scenario"
            element={
              <ProtectedRoute>
                <ScenarioPage />
              </ProtectedRoute>
            }
          />

          {/* ===============================
              🧱  ADMIN SECTION (ROLE-BASED)
              =============================== */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* ===============================
              🧩  DEVELOPMENT / TEST
              =============================== */}
          <Route path="/testws" element={<WorkstationPageTest />} />
          {/* <Route path="/testadm" element={<AdminTest />} /> */}
          <Route path="/agentnodes" element={<AgentNode />} />
          <Route path="/sessionMonitor" element={<SessionMonitor />} />

          {/* ===============================
              🚧  FALLBACK
              =============================== */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </GuardedAppRoot>
    </BrowserRouter>
  </React.StrictMode>
);
