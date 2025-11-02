// ===============================
// api.js
// ===============================
// Centralized API helper for the frontend.
// Handles all authenticated Axios calls using a single instance.
// ===============================

import axios from "axios";

/* ------------------------------ Base URLs ------------------------------ */
const BACKEND_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const SIMULATION_BASE_URL =
  import.meta.env.VITE_SIM_API_URL || BACKEND_BASE_URL;

/* ------------------------------ Instance Helper ------------------------------ */
// --- Debug bus -------------------------------------------------
const DEBUG_MAX = 300;
const DebugBus = {
  events: [],
  push(evt) {
    this.events.push({ ts: Date.now(), ...evt });
    if (this.events.length > DEBUG_MAX) this.events.shift();
    // also expose globally for quick inspection
    window.__apiDebug = this.events;
    // fire a DOM event so React can listen
    document.dispatchEvent(new CustomEvent("api-debug", { detail: evt }));
  },
};
// ---------------------------------------------------------------

const attachInterceptors = (instance, label = "api") => {
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }

      const reqInfo = {
        kind: "request",
        label,
        method: (config.method || "GET").toUpperCase(),
        url: (config.baseURL || "") + (config.url || ""),
        params: config.params || null,
        data: config.data || null,
      };

      // Console
      console.groupCollapsed(
        `%c[${label}] → ${reqInfo.method} ${reqInfo.url}`,
        "color:#888"
      );
      if (reqInfo.params) console.log("params:", reqInfo.params);
      if (reqInfo.data) console.log("data:", reqInfo.data);
      console.groupEnd();

      // Bus
      DebugBus.push(reqInfo);

      // stamp a request id to correlate
      config.headers["X-Client-Req-Id"] = `${label}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

      return config;
    },
    (error) => {
      DebugBus.push({ kind: "request_error", label, error: error?.message || String(error) });
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response) => {
      const resInfo = {
        kind: "response",
        label,
        status: response.status,
        url: response.config?.baseURL + response.config?.url,
        data: response.data,
        headers: response.headers,
      };

      console.groupCollapsed(
        `%c[${label}] ← ${resInfo.status} ${resInfo.url}`,
        resInfo.status >= 400 ? "color:#e00" : "color:#0a0"
      );
      console.log("headers:", response.headers);
      console.log("data:", response.data);
      console.groupEnd();

      DebugBus.push(resInfo);
      return response;
    },
    (error) => {
      const res = error.response;
      const errInfo = {
        kind: "response_error",
        label,
        status: res?.status || 0,
        url: res?.config ? res.config.baseURL + res.config.url : undefined,
        data: res?.data,
        message: error.message,
      };

      console.groupCollapsed(
        `%c[${label}] ← ERROR ${errInfo.status} ${errInfo.url || ""}`,
        "color:#e00"
      );
      console.log("message:", error.message);
      if (res?.headers) console.log("headers:", res.headers);
      if (res?.data) console.log("data:", res.data);
      console.groupEnd();

      DebugBus.push(errInfo);
      return Promise.reject(error);
    }
  );
};


/* ------------------------------ Axios Instances ------------------------------ */
const api = axios.create({
  // ?? Reads from Vite .env (example: VITE_API_URL=http://localhost:8000)
  baseURL: BACKEND_BASE_URL,
  withCredentials: true,
});

const simApi = axios.create({
  // Forward through backend by default; drop credentials when hitting external host directly
  baseURL: SIMULATION_BASE_URL,
  withCredentials: SIMULATION_BASE_URL === BACKEND_BASE_URL,
});

attachInterceptors(api);
attachInterceptors(simApi);


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
export const getProjects = async (page = 1, limit = null) => {
  const params = {};
  if (page) params.page = page;
  if (limit) params.limit = limit;
  const res = await api.get("/projects/", { params });
  return res.data;
};

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

export async function getAgentsByUser(userId, page = 1, q = "") {
  const res = await api.get(`/agents/user/${userId}`, {
    params: { page, q },
  });
  return res.data;
}


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
   dY"1 SIMULATION ROUTES
=============================== */
export const createSimulation = async (payload) =>
  (await simApi.post("/simulations", payload)).data;

export const getSimulationById = async (simulationId) =>
  (await simApi.get(`/simulations/${simulationId}`)).data;

export const advanceSimulation = async (simulationId, steps = 1) => {
  const sanitized = Math.min(50, Math.max(1, Number(steps) || 1));
  return (
    await simApi.post(`/simulations/${simulationId}/advance`, {
      steps: sanitized,
    })
  ).data;
};

export const triggerSimulationFate = async (simulationId, prompt) => {
  const body = prompt ? { prompt } : {};
  return (await simApi.post(`/simulations/${simulationId}/fate`, body)).data;
};

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

// ===============================
// Results — Get by Scenario
// ===============================
export async function getResultsByScenario(scenarioid) {
  const res = await fetch(`/api/results/by-scenario/${scenarioid}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch results by scenario");
  return await res.json();
}


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
export const getAnnouncements = async (params = {}) =>
  (await api.get("/announcements/", { params })).data;

export const createAnnouncement = async (payload) => (await api.post("/announcements/", payload)).data;
export const updateAnnouncement = async (announcementId, payload) => (await api.put(`/announcements/${announcementId}`, payload)).data;
export const deleteAnnouncement = async (announcementId) => (await api.delete(`/announcements/${announcementId}`)).data;

/* ===============================
   📋 SYSTEM LOG ROUTES
   */
// ✅ returns { items, page, total_pages, ... }
export const getSystemLogs = async (params = {}) =>
  (await api.get("/system-logs/", { params })).data;

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
// ===============================
// 🛠️ Permission  API
// ===============================


export async function getPermission(moduleKey) {
  const res = await api.get(`/permissions/${moduleKey}`);
  return res.data;
}

/* ===============================
   👥 USER MANAGEMENT ROUTES
=============================== */
export const getAllUsers = async (params = {}) => 
  (await api.get("/admin/users/", { params })).data;

export const getUserById = async (userId) => 
  (await api.get(`/admin/users/${userId}`)).data;

export const createUser = async (userData) => 
  (await api.post("/admin/users/", userData)).data;

export const updateUser = async (userId, userData) => 
  (await api.put(`/admin/users/${userId}`, userData)).data;

export const changeUserStatus = async (userId, status) => 
  (await api.patch(`/admin/users/${userId}/status`, { status })).data;

export const deleteUser = async (userId) => 
  (await api.delete(`/admin/users/${userId}`)).data;

export const hardDeleteUser = async (userId) => 
  (await api.delete(`/admin/users/${userId}/hard`)).data;

export const bulkChangeUserStatus = async (userIds, status) => 
  (await api.post("/admin/users/bulk/status", { 
    user_ids: userIds, 
    status: status 
  })).data;

export const bulkDeleteUsers = async (userIds) => 
  (await api.post("/admin/users/bulk/delete", { 
    user_ids: userIds 
  })).data;

// ===============================
// 🧾 CREDIT CONFIG API CALLS
// ===============================

// 🧩 Fetch all Credit Packs
export const getAllCreditConfigs = async () => {
  const res = await api.get("/credit-configs/");
  return res.data;
};

// 🧩 Get Credit Pack by ID
export const getCreditConfigById = async (id) => {
  const res = await api.get(`/credit-configs/${id}`);
  return res.data;
};

// 🧩 Create Credit Pack
export const createCreditConfig = async (data) => {
  const res = await api.post("/credit-configs/", data);
  return res.data;
};

// 🧩 Update Credit Pack
export const updateCreditConfig = async (id, data) => {
  const res = await api.put(`/credit-configs/${id}`, data);
  return res.data;
};

// 🧩 Delete Credit Pack
export const deleteCreditConfig = async (id) => {
  const res = await api.delete(`/credit-configs/${id}`);
  return res.data;
};

// 🧩 Get public active credit packs
export const getActiveCreditPacks = async () => {
  const res = await api.get("/credit-configs/credit-list");
  return res.data;
};


// ===============================
// 💳 BILLING & TRANSACTIONS API
// ===============================

// 🧾 Get current user's billing (auto-refresh on backend)
export const getMyBilling = async () => (await api.get("/billing/me")).data;

// 📋 Get billing for a specific user (Admin)
export const getBillingByUserId = async (userId) =>
  (await api.get(`/billing/${userId}`)).data;

// 🧩 Get all billing records (Admin)
export const getAllBillings = async () => (await api.get("/billing/")).data;

// ➕ Create billing (Admin)
export const createBilling = async (payload) =>
  (await api.post("/billing/", payload)).data;

// ✏️ Update billing (Admin)
export const updateBilling = async (billingId, payload) =>
  (await api.put(`/billing/${billingId}`, payload)).data;

// 🗑 Soft delete billing (Admin)
export const deleteBilling = async (billingId) =>
  (await api.delete(`/billing/${billingId}`)).data;


// ===============================
// 💰 CREDIT TRANSACTION API
// ===============================

// 🔹 Get all credit transactions
export const getAllTransactions = async () =>
  (await api.get("/credit-transactions/")).data;

export const getCreditTransactions = async (params = {}) =>
  (await api.get("/credit-transactions/", { params })).data;


// 🔹 Get transactions by user ID
export const getTransactionsByUserId = async (userId) =>
  (await api.get(`/credit-transactions/user/${userId}`)).data;

// ➕ Create a new credit transaction
export const createTransaction = async (payload) =>
  (await api.post("/credit-transactions/", payload)).data;

// ✏️ Update a credit transaction
export const updateTransaction = async (transactionId, payload) =>
  (await api.put(`/credit-transactions/${transactionId}`, payload)).data;

// 🗑 Soft delete transaction
export const deleteTransaction = async (transactionId) =>
  (await api.delete(`/credit-transactions/${transactionId}`)).data;

// ⚙️ Apply a transaction to billing balance
export const applyTransaction = async (transactionId) =>
  (await api.post(`/credit-transactions/${transactionId}/apply`)).data;

// 🔄 Reverse (rollback) a transaction (Admin)
export const reverseTransaction = async (transactionId) =>
  (await api.post(`/credit-transactions/${transactionId}/reverse`)).data;

// ✅ Create Stripe Checkout Session
export const createPaymentSession = async (packKey) => {
  const res = await api.post("/payments/create-session", { pack_key: packKey });
  return res.data;
};

// ✅ (Optional) Verify success or get details
export const verifyPaymentSession = async (sessionId) => {
  const res = await api.get(`/payments/verify-session/${sessionId}`);
  return res.data;
};

/* ===============================
   Default Export
=============================== */
export default api;


export async function requestPasswordReset(email) {
  const res = await fetch("http://127.0.0.1:8000/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function resetPassword(token, new_password) {
  const res = await fetch("http://127.0.0.1:8000/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ===============================
// 💾 SAVE SIMULATION RESULTS
// ===============================
export const saveSimulationResults = async (payload) =>
  (await api.post("/results/save_simulation", payload)).data;

// Quick-create scenario (used on Stop)
export const createScenarioQuick = async (payload) =>
  (await api.post("/scenarios/quick", payload)).data;

// ============================================================
// 🔹 Get Replay Data
// ============================================================
export async function getReplayData(scenarioid) {
  const res = await api.get(`/results/replay/${scenarioid}`);
  return res.data;
}
