// ===============================
// api.js
// ===============================
// Centralized API helper for the frontend.
// Handles all authenticated Axios calls using a single instance.
// ===============================

import axios from "axios";

/* ------------------------------ Base Instance ------------------------------ */
const api = axios.create({
  // ✅ Reads from Vite .env (example: VITE_API_URL=http://localhost:8000)
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  withCredentials: true,
});

/* ---------- Attach Authorization header automatically ---------- */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

/* ===============================
   🔐 AUTH ROUTES
=============================== */
export const registerUser = async (payload) => (await api.post("/auth/register", payload)).data;
export const loginUser = async (payload) => (await api.post("/auth/login", payload)).data;
export const verifyToken = async () => (await api.get("/auth/verify")).data;
export const logoutUser = async () => (await api.post("/auth/logout")).data;

/* ===============================
   👤 USER PROFILE
=============================== */
export const getUserProfile = async () => (await api.get("/users/profile")).data;

export const updateUserProfile = async (payload) => {
  const formData = new FormData();
  formData.append("username", payload.username);
  formData.append("email", payload.email);
  if (payload.profile_image) formData.append("profile_image", payload.profile_image);

  const res = await api.put("/users/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

/* ===============================
   📁 PROJECT ROUTES
=============================== */
export const getProjects = async () => (await api.get("/projects/")).data;
export const createProject = async (payload) => (await api.post("/projects/", payload)).data;
export const updateProject = async (project_id, payload) => (await api.put(`/projects/${project_id}`, payload)).data;
export const deleteProject = async (project_id) => (await api.delete(`/projects/${project_id}`)).data;

/* ===============================
   🤖 AGENT ROUTES
=============================== */
export const getAgents = async () => (await api.get("/agents/")).data;
export const getAgent = async (agent_id) => (await api.get(`/agents/${agent_id}`)).data;

export const createAgent = async (data) => {
  const payload = {
    agentname: data.agentname,
    agentpersonality: data.agentpersonality,
    agentskill: Array.isArray(data.agentskill)
      ? data.agentskill
      : data.agentskill
      ? data.agentskill.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
    agentbiography: data.agentbiography || "",
    agentconstraints: Array.isArray(data.agentconstraints)
      ? data.agentconstraints
      : data.agentconstraints
      ? data.agentconstraints.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
    agentquirk: Array.isArray(data.agentquirk)
      ? data.agentquirk
      : data.agentquirk
      ? data.agentquirk.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
    agentmotivation: data.agentmotivation || "",
  };

  return (await api.post("/agents/", payload)).data;
};

export const updateAgent = async (agent_id, payload) =>
  (await api.put(`/agents/${agent_id}`, payload)).data;

export const deleteAgent = async (agent_id) =>
  (await api.delete(`/agents/${agent_id}`)).data;

/* ===============================
   🔗 PROJECT–AGENT LINKS
=============================== */
export const createProjectAgent = async (data) =>
  (await api.post("/project-agents/", data)).data;

export const getProjectAgents = async () =>
  (await api.get("/project-agents/")).data;

export const updateProjectAgent = async (id, data) =>
  (await api.put(`/project-agents/${id}`, data)).data;

export const deleteProjectAgent = async (id) =>
  (await api.delete(`/project-agents/${id}`)).data;

/** ------------------- AGENT RELATION ROUTES ------------------- **/

export async function getAgentRelations() {
  const res = await api.get("/agent-relations/");
  return res.data;
}

export async function createAgentRelation(data) {
  const res = await api.post("/agent-relations/", data);
  return res.data;
}

export async function updateAgentRelation(id, data) {
  const res = await api.put(`/agent-relations/${id}`, data);
  return res.data;
}

export async function deleteAgentRelation(id) {
  const res = await api.delete(`/agent-relations/${id}`);
  return res.data;
}

// ===============================
// Scenario API
// ===============================
export async function getScenarios() {
  const res = await fetch(`${API_BASE}/scenarios/`);
  if (!res.ok) throw new Error("Failed to fetch scenarios");
  return await res.json();
}

export async function getScenarioById(id) {
  const res = await fetch(`${API_BASE}/scenarios/${id}`);
  if (!res.ok) throw new Error("Failed to fetch scenario");
  return await res.json();
}

export async function createScenario(data) {
  const res = await fetch(`${API_BASE}/scenarios/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create scenario");
  return await res.json();
}

export async function updateScenario(id, data) {
  const res = await fetch(`${API_BASE}/scenarios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update scenario");
  return await res.json();
}

export async function deleteScenario(id) {
  const res = await fetch(`${API_BASE}/scenarios/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete scenario");
  return await res.json();
}


/* ===============================
   Default Export
=============================== */
export default api;
