// utils/auth.js

/** Decode and return current user payload from JWT (if valid). */
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

/** Check whether the current access token is expired. */
export function isAccessTokenExpired() {
  try {
    const user = getCurrentUserFromToken();
    if (!user || !user.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return user.exp < now;
  } catch {
    return true;
  }
}

/** Force logout and redirect to login page. */
export function logoutAndRedirect() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  window.location.href = "/login";
}
