// ===============================
// helpers.jsx
// ===============================
import React from "react";

export const fmtDate = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export const StatusPill = ({ value }) => (
  <span className={`adm-pill ${value}`}>{value}</span>
);
