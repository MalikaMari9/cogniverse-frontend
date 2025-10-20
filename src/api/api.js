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


/* ---------- Handle 401 (Token Expiry) ---------- */
api.interceptors.response.use(
  (response) => response, // pass through if OK
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401s and avoid infinite loops
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refresh = localStorage.getItem("refresh_token");

      if (refresh) {
        try {
          // Try to refresh the access token
          const res = await axios.post(
            `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/auth/refresh`,
            {},
            { headers: { Authorization: `Bearer ${refresh}` } }
          );

          // Save new access token
          localStorage.setItem("access_token", res.data.access_token);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
          return api(originalRequest);
        } catch (err) {
          console.warn("🔴 Refresh token expired or invalid, logging out...");
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
      } else {
        console.warn("⚠️ No refresh token found, redirecting to login.");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }
    }

    // If not a 401 or still fails, reject
    return Promise.reject(error);
  }
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

export const uploadProfilePicture = async (profile_image) => {
  const formData = new FormData();
  formData.append("profile_image", profile_image);

  const res = await api.put("/users/profile/picture", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

/**
 * Change user password
 * @param {Object} payload - { current_password, new_password }
 */
export const changePassword = async (payload) => {
  const res = await api.put("/users/profile/password", payload);
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

export const getAgentsByUser = async (userId) =>
  (await api.get(`/agents/user/${userId}`)).data;


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
/* ===============================
   🧩 SCENARIO ROUTES
=============================== */

// Get all scenarios
export const getScenarios = async () => (await api.get("/scenarios/")).data;

// Get a single scenario by ID
export const getScenarioById = async (id) =>
  (await api.get(`/scenarios/${id}`)).data;

// Create a new scenario
export const createScenario = async (data) =>
  (await api.post("/scenarios/", data)).data;

// Update an existing scenario
export const updateScenario = async (id, data) =>
  (await api.put(`/scenarios/${id}`, data)).data;

// Delete a scenario
export const deleteScenario = async (id) =>
  (await api.delete(`/scenarios/${id}`)).data;

/* ===============================
   🧠 RESULT ROUTES
=============================== */

// Fetch all results
export const getResults = async () => (await api.get("/results/")).data;

// Fetch a single result by ID
export const getResultById = async (result_id) =>
  (await api.get(`/results/${result_id}`)).data;

// Create a new result
export const createResult = async (data) =>
  (await api.post("/results/", data)).data;

// Update an existing result
export const updateResult = async (result_id, data) =>
  (await api.put(`/results/${result_id}`, data)).data;

// Delete a result
export const deleteResult = async (result_id) =>
  (await api.delete(`/results/${result_id}`)).data;

/* ===============================
   💭 RESULT (Thought) Fetch
=============================== */
export const getResultsByAgentScenarioType = async (projectAgentId, scenarioId, resultType) =>
  (await api.get(`/results/agent/${projectAgentId}/scenario/${scenarioId}/type/${resultType}`)).data;



/* ===============================
   🧬 MEMORY ROUTES
=============================== */

// Create a new memory
export const createMemory = async (data) =>
  (await api.post("/memory/", data)).data;

// Get a memory by ID
export const getMemoryById = async (memory_id) =>
  (await api.get(`/memory/${memory_id}`)).data;

// List memories by project
export const listMemoriesByProject = async (project_id) =>
  (await api.get(`/memory/project/${project_id}`)).data;

// List memories by agent
export const listMemoriesByAgent = async (agent_id) =>
  (await api.get(`/memory/agent/${agent_id}`)).data;

// Update memory
export const updateMemory = async (memory_id, data) =>
  (await api.put(`/memory/${memory_id}`, data)).data;

// Soft delete memory
export const deleteMemory = async (memory_id) =>
  (await api.delete(`/memory/${memory_id}`)).data;

/* ===============================
   🕸️ WEAVER ROUTES
=============================== */

// Create a new weaver entry
export const createWeaver = async (data) =>
  (await api.post("/weaver/", data)).data;

// Get a weaver by ID
export const getWeaverById = async (weaver_id) =>
  (await api.get(`/weaver/${weaver_id}`)).data;

// List weavers by project
export const listWeaversByProject = async (project_id) =>
  (await api.get(`/weaver/project/${project_id}`)).data;

// List weavers by agent
export const listWeaversByAgent = async (agent_id) =>
  (await api.get(`/weaver/agent/${agent_id}`)).data;

// Update an existing weaver
export const updateWeaver = async (weaver_id, data) =>
  (await api.put(`/weaver/${weaver_id}`, data)).data;

// Soft delete a weaver
export const deleteWeaver = async (weaver_id) =>
  (await api.delete(`/weaver/${weaver_id}`)).data;

/* ===============================
   🔐 ADMIN ROUTES
   ⚙️ CONFIG ROUTES
   */

/**
 * Get all configurations
 */
export const getAllConfigs = async () => (await api.get("/configs/")).data;

/**
 * Get a single configuration by ID
 * @param {number} config_id
 */
export const getConfigById = async (config_id) =>
  (await api.get(`/configs/${config_id}`)).data;

/**
 * Create a new configuration
 * @param {Object} data - { config_key, config_value, description, status }
 */
export const createConfig = async (data) =>
  (await api.post("/configs/", data)).data;

/**
 * Update an existing configuration
 * @param {number} config_id
 * @param {Object} data - partial update (config_value, description, status)
 */
export const updateConfig = async (config_id, data) =>
  (await api.put(`/configs/${config_id}`, data)).data;

/**
 * Delete a configuration by ID
 * @param {number} config_id
 */
export const deleteConfig = async (config_id) =>
  (await api.delete(`/configs/${config_id}`)).data;


/* ===============================
   📢 ANNOUNCEMENT ROUTES
=============================== */
export const getAnnouncements = async () => (await api.get("/announcements/")).data;
export const createAnnouncement = async (payload) => (await api.post("/announcements/", payload)).data;
export const updateAnnouncement = async (announcementId, payload) => (await api.put(`/announcements/${announcementId}`, payload)).data;
export const deleteAnnouncement = async (announcementId) => (await api.delete(`/announcements/${announcementId}`)).data;

/* ===============================
   📋 SYSTEM LOG ROUTES
   */
export const getSystemLogs = async (params = {}) => (await api.get("/system-logs/", { params })).data;
export const createSystemLog = async (payload) => (await api.post("/system-logs/", payload)).data;
export const deleteSystemLog = async (logId) => (await api.delete(`/system-logs/${logId}`)).data;
export const deleteSystemLogs = async (logIds) => (await api.delete("/system-logs/bulk", { data: { log_ids: logIds } })).data;
// ===============================
// accessControlApi.js
// ===============================

// 🧩 Fetch all Access Controls
export const getAllAccessControls = async () => {
  const res = await api.get("/access-controls/");
  return res.data;
};

// 🧩 Get Access Control by ID
export const getAccessControlById = async (id) => {
  const res = await api.get(`/access-controls/${id}`);
  return res.data;
};

// 🧩 Create Access Control
export const createAccessControl = async (data) => {
  const res = await api.post("/access-controls/", data);
  return res.data;
};

// 🧩 Update Access Control
export const updateAccessControl = async (id, data) => {
  const res = await api.put(`/access-controls/${id}`, data);
  return res.data;
};

// 🧩 Delete Access Control
export const deleteAccessControl = async (id) => {
  const res = await api.delete(`/access-controls/${id}`);
  return res.data;
};


// ===============================
// Maintenance API
// ===============================

export async function getAllMaintenance() {
  const res = await api.get("/maintenance/");
  return res.data;
}

export async function updateMaintenance(moduleKey, payload) {
  const res = await api.put(`/maintenance/${moduleKey}`, payload);
  return res.data;
}

// ===============================
// 🛠️ GLOBAL MAINTENANCE API
// ===============================

/**
 * Get the current global maintenance status
 * @returns {Promise<{ module_key: string, under_maintenance: boolean, message: string, updated_at: string }>}
 */
export async function getGlobalMaintenance() {
  const res = await api.get("/maintenance/global");
  return res.data;
}

/* ===============================
   Default Export
=============================== */
export default api;
