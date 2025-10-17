// components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { isAccessTokenExpired } from "../utils/auth";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");

  if (!token || isAccessTokenExpired()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
