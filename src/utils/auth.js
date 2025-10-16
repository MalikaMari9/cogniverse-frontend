// utils/auth.js
export function getCurrentUserFromToken() {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) return null;
    const payloadBase64 = token.split(".")[1];
    const decoded = JSON.parse(atob(payloadBase64));
    return decoded; // contains { user_id, role, exp, iat, ... }
  } catch (err) {
    console.error("Failed to decode token", err);
    return null;
  }
}
