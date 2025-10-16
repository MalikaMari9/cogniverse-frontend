import axios from "axios";

/* ------------------------------ Base Instance ------------------------------ */

const api = axios.create({
baseURL: "http://localhost:8000",
 // FastAPI local backend
  withCredentials: true,             // allow cookie/token authentication
});

/* ------------------------------- AUTH ROUTES ------------------------------- */

/**
 * Register a new user
 * @param {Object} payload - { username, email, password }
 */
export const registerUser = async (payload) => {
  const res = await api.post("/auth/register", payload);
  return res.data;
};

/**
 * Login user
 * @param {Object} payload - { username, password }
 */
export const loginUser = async (payload) => {
  const res = await api.post("/auth/login", payload);
  return res.data; // expected to include tokens or success message
};

/**
 * Verify token validity (optional)
 */
export const verifyToken = async () => {
  const res = await api.get("/auth/verify");
  return res.data; // { message: "Token is valid ✅ for user ..." }
};

/**
 * Logout current user
 */
export const logoutUser = async () => {
  const res = await api.post("/auth/logout");
  return res.data; // { message: "Logged out successfully" }
};

/* ----------------------------- USER PROFILE ----------------------------- */

/**
 * Get current user's profile
 */
export const getUserProfile = async () => {
  const res = await api.get("/users/profile");
  return res.data; // returns full UserResponse
};

/**
 * Update user profile
 * @param {Object} payload - { username, email, profile_image (File optional) }
 */
export const updateUserProfile = async (payload) => {
  const formData = new FormData();
  formData.append("username", payload.username);
  formData.append("email", payload.email);
  if (payload.profile_image) {
    formData.append("profile_image", payload.profile_image);
  }

  const res = await api.put("/users/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export default api;
