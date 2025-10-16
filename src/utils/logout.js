// utils/logout.js
import { logoutUser } from "../api/api";

export async function handleLogout() {
  try {
    // tell backend to revoke token
    await logoutUser();
  } catch (err) {
    console.warn("Logout request failed or already expired:", err);
  }

  // clear local storage and redirect to login
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");

  window.location.href = "/auth";
}
