import React from "react";
import NavProduct from "../components/NavProduct";
import "../profile-nav.css";
import "../credit.css";

export default function CreditSuccess() {
  return (
    <div className="credit-page">
      <NavProduct active="workstation" />
      <main className="credit-wrap">
        <div className="success-card">
          <h1>🎉 Payment Successful!</h1>
          <p>Your credits have been added to your account (or will be processed soon).</p>
          <button className="btn primary" onClick={() => (window.location.href = "/credit")}>
            Back to Credit Page
          </button>
        </div>
      </main>
    </div>
  );
}
