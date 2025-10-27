import React from "react";
import { fmtDate, StatusPill } from "./helpers";
import {
  getAllUsers,
  createUser,
  updateUser,
  changeUserStatus,
  deleteUser,
  hardDeleteUser,
  bulkChangeUserStatus,
  bulkDeleteUsers,
} from "../../api/api";
import { usePermission } from "../../hooks/usePermission";

export default function UserManagementTable() {
  // ===============================
  // 🔹 STATES
  // ===============================
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [selectedUsers, setSelectedUsers] = React.useState(new Set());
  const [noAccessModal, setNoAccessModal] = React.useState({
    open: false,
    message: "",
  });
  const [createModal, setCreateModal] = React.useState(false);
  const [editModal, setEditModal] = React.useState({ open: false, user: null });
const [alertModal, setAlertModal] = React.useState({ open: false, message: "" });


  // Form states
  const [formData, setFormData] = React.useState({
    username: "",
    email: "",

    role: "user",
  });
  const [editFormData, setEditFormData] = React.useState({});

  // filters
  const [q, setQ] = React.useState("");
  const [role, setRole] = React.useState("all");
  const [status, setStatus] = React.useState("all");

  // sorting
  const [sortBy, setSortBy] = React.useState("created_at");
  const [sortDir, setSortDir] = React.useState("desc");

// paging
const [page, setPage] = React.useState(1);
const [limit, setLimit] = React.useState(null);   // backend-defined page size
const [totalUsers, setTotalUsers] = React.useState(0);
const [totalPages, setTotalPages] = React.useState(1);
const [openId, setOpenId] = React.useState(null);


  // permissions
  const { level: permission, canRead, canWrite, loading: permLoading } =
    usePermission("USER_MANAGEMENT");

  // ===============================
  // 🔹 LOAD USERS
  // ===============================
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
const params = {
  page,
  ...(role !== "all" && { role }),
  ...(status !== "all" && { status }),
  // ⚠️ intentionally not sending page_size — backend will use config value
};

const data = await getAllUsers(params);

// new response structure from backend
setUsers(data.items || []);
setTotalUsers(data.total || 0);
setLimit(data.limit || null);
setTotalPages(data.total_pages || 1);

    } catch (err) {
  console.error("❌ Failed to create user:", err);
  const msg = err.response?.data?.detail || "Failed to create user";
  setAlertModal({ open: true, message: msg });
}
finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
  const handleClickOutside = (e) => {
    if (!e.target.closest(".dropdown")) setOpenId(null);
  };
  document.addEventListener("click", handleClickOutside);
  return () => document.removeEventListener("click", handleClickOutside);
}, []);


  React.useEffect(() => {
    if (!permLoading && canRead) loadUsers();
  }, [permLoading, canRead, page, role, status]);

  // ===============================
  // 🔹 PERMISSION CHECK
  // ===============================
  const requireWrite = (actionName = "modify") => {
    if (!canWrite) {
      setNoAccessModal({
        open: true,
        message: `You don't have permission to ${actionName} users.`,
      });
      return false;
    }
    return true;
  };

  // ===============================
  // 🔹 USER OPERATIONS
  // ===============================
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!requireWrite("create")) return;

    try {
      await createUser({
  username: formData.username,
  email: formData.email,
  password: null, // ✅ explicitly null so backend uses defaultPassword
  role: formData.role,
});

      setCreateModal(false);
      setFormData({ username: "", email: "",  role: "user" });
      loadUsers();
    } catch (err) {
  console.error("❌ Failed to create user:", err);
  const msg = err.response?.data?.detail || "Failed to create user";
  setAlertModal({ open: true, message: msg });
}

  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!requireWrite("edit")) return;

    try {
      await updateUser(editModal.user.userid, editFormData);
      setEditModal({ open: false, user: null });
      setEditFormData({});
      loadUsers();
    } catch (err) {
  console.error("❌ Failed to update user:", err);
  const msg = err.response?.data?.detail || "Failed to update user";
  setAlertModal({ open: true, message: msg });
}

  };

  const handleStatusChange = async (userId, newStatus) => {
    if (!requireWrite("change status")) return;

    try {
      await changeUserStatus(userId, newStatus);
      loadUsers();
    } catch (err) {
      console.error("❌ Failed to change user status:", err);
      setError(err.response?.data?.detail || "Failed to change user status");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!requireWrite("delete")) return;
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteUser(userId);
      loadUsers();
    } catch (err) {
  console.error("❌ Failed to delete user:", err);
  const msg = err.response?.data?.detail || "Failed to delete user";
  setAlertModal({ open: true, message: msg });
}

  };

  const handleHardDelete = async (userId) => {
    if (!requireWrite("hard delete")) return;
    if (
      !window.confirm(
        "⚠️ DANGER: Are you sure you want to PERMANENTLY delete this user? This action cannot be undone and will remove all user data from the database!"
      )
    )
      return;

    try {
      await hardDeleteUser(userId);
      loadUsers();
      setError("User permanently deleted successfully");
    } catch (err) {
      console.error("❌ Failed to hard delete user:", err);
      setError(err.response?.data?.detail || "Failed to permanently delete user");
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (!requireWrite("change status")) return;
    if (selectedUsers.size === 0) return;

    if (!window.confirm(`Change status to ${newStatus} for ${selectedUsers.size} users?`))
      return;

    try {
      await bulkChangeUserStatus(Array.from(selectedUsers), newStatus);
      setSelectedUsers(new Set());
      loadUsers();
    } catch (err) {
      console.error("❌ Failed to bulk change status:", err);
      setError(err.response?.data?.detail || "Failed to change user status");
    }
  };

  const handleBulkDelete = async () => {
    if (!requireWrite("delete")) return;
    if (selectedUsers.size === 0) return;

    if (!window.confirm(`Delete ${selectedUsers.size} users?`)) return;

    try {
      await bulkDeleteUsers(Array.from(selectedUsers));
      setSelectedUsers(new Set());
      loadUsers();
    } catch (err) {
      console.error("❌ Failed to bulk delete users:", err);
      setError(err.response?.data?.detail || "Failed to delete users");
    }
  };

  // ===============================
  // 🔹 FILTERS / SORT / PAGINATION
  // ===============================
  const filtered = users.filter((user) => {
    if (q) {
      const hay = `${user.username} ${user.email} ${user.role}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    const A = a[sortBy],
      B = b[sortBy];
    if (sortBy === "created_at") return (new Date(A) - new Date(B)) * dir;
    return String(A).localeCompare(String(B)) * dir;
  });

  
  const safePage = Math.min(page, totalPages);

  const toggleSelectAll = () => {
    if (selectedUsers.size === sorted.length) setSelectedUsers(new Set());
    else setSelectedUsers(new Set(sorted.map((u) => u.userid)));
  };

  const toggleUserSelection = (userId) => {
    const newSet = new Set(selectedUsers);
    newSet.has(userId) ? newSet.delete(userId) : newSet.add(userId);
    setSelectedUsers(newSet);
  };

  const setSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  // ===============================
  // 🔹 CONDITIONAL RENDERS
  // ===============================
  if (permLoading)
    return (
      <section className="ad-card ws-card">
        <div className="ad-loading">Checking permissions...</div>
      </section>
    );

  if (permission === "none")
    return (
      <section className="ad-card ws-card ad-empty">
        <h2 style={{ color: "var(--ink-1)" }}>Access Denied</h2>
        <p style={{ color: "var(--ink-3)", marginTop: 6 }}>
          You don't have permission to view User Management.
        </p>
      </section>
    );

  // ===============================
  // 🔹 RENDER MAIN
  // ===============================
  return (
     <section className="ad-card ws-card">
     

      <header className="adm-head">
        <div className="adm-title">User Management</div>
        <div className="adm-tools">
          <input
            className="adm-input"
            placeholder="Search users…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="adm-select"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
          </select>
          <select
            className="adm-select"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deleted">Deleted</option>
          </select>

          {selectedUsers.size > 0 && canWrite && (
            <div className="adm-bulk-actions">
              <select
                className="adm-select"
                onChange={(e) => handleBulkStatusChange(e.target.value)}
                value=""
              >
                <option value="">Bulk Actions</option>
                <option value="active">Activate</option>
                <option value="suspended">Suspend</option>
                <option value="deleted">Delete</option>
              </select>
              <button className="ws-btn danger" onClick={handleBulkDelete}>
                Delete ({selectedUsers.size})
              </button>
            </div>
          )}

          {canWrite && (
            <button className="ws-btn primary" onClick={() => setCreateModal(true)}>
              Add User
            </button>
          )}
        </div>
      </header>

      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={sorted.length > 0 && selectedUsers.size === sorted.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th onClick={() => setSort("userid")}>ID</th>
              <th onClick={() => setSort("username")}>Username</th>
              <th onClick={() => setSort("email")}>Email</th>
              <th onClick={() => setSort("role")}>Role</th>
              <th onClick={() => setSort("status")}>Status</th>
              <th onClick={() => setSort("created_at")}>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>
                  <div className="adm-center">
                    <div className="sc-spinner" />
                  </div>
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="adm-empty">No users found</div>
                </td>
              </tr>
            ) : (
              sorted.map((user) => (
                <tr key={user.userid}>
                  <td >
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.userid)}
                      onChange={() => toggleUserSelection(user.userid)}
                    />
                  </td>
                  <td className="mono" data-label="UserID">#{user.userid}</td>
                  <td className="mono" data-label="Username">
  <span className="truncate">{user.username}</span>
</td>
<td className="mono" data-label="Email">
  <span className="truncate">{user.email}</span>
</td>

                  <td className="mono" data-label="Role">
                    <span className={`role-badge role-${user.role}`}>{user.role}</span>
                  </td>
                  <td className="mono" data-label="UserStatus">
                    <StatusPill value={user.status} />
                  </td>
                  <td className="mono" data-label="Username">{fmtDate(user.created_at)}</td>
<td className="mono" data-label="Actions" >
  <div className="dropdown" style={{ position: "relative" }}>
    <button
      className="action-menu"
      onClick={(e) => {
        e.stopPropagation();
        setOpenId(openId === user.userid ? null : user.userid);
      }}
    >
      ⋮
    </button>

{openId === user.userid && (
  <div
    className="dropdown-content"
    style={{
      position: "absolute",
      right: -10,
      top: "120%",
      background: "var(--glass)",
      border: "1px solid var(--glass-bdr)",
      borderRadius: "10px",
      boxShadow: "0 6px 20px rgba(0,0,0,.25)",
      minWidth: "160px",
      zIndex: 99,
      padding: "4px 0",
    }}
    onClick={(e) => e.stopPropagation()}
  >
    {/* 🚫 Disable all actions for superadmin */}
    {user.role === "superadmin" ? (
      <button className="ad-item" disabled style={{ opacity: 0.6, cursor: "not-allowed" }}>
        Super Admin — locked
      </button>
    ) : (
      <>
        <button
          className="ad-item"
          onClick={() => {
            if (!requireWrite("edit")) return;
            setEditModal({ open: true, user });
            setEditFormData({
              username: user.username,
              email: user.email,
              role: user.role,
              status: user.status,
            });
            setOpenId(null);
          }}
        >
          Edit
        </button>

        {user.status === "active" && (
          <button
            className="ad-item"
            onClick={() => {
              if (!requireWrite("suspend")) return;
              handleStatusChange(user.userid, "suspended");
              setOpenId(null);
            }}
          >
            Suspend
          </button>
        )}

        {user.status === "suspended" && (
          <button
            className="ad-item"
            onClick={() => {
              if (!requireWrite("activate")) return;
              handleStatusChange(user.userid, "active");
              setOpenId(null);
            }}
          >
            Activate
          </button>
        )}

        {user.status === "deleted" ? (
          <>
            <button
              className="ad-item"
              onClick={() => {
                if (!requireWrite("activate")) return;
                handleStatusChange(user.userid, "active");
                setOpenId(null);
              }}
            >
              Restore
            </button>
            <button
              className="ad-item danger"
              onClick={() => {
                if (!requireWrite("hard delete")) return;
                handleHardDelete(user.userid);
                setOpenId(null);
              }}
            >
              Hard Delete
            </button>
          </>
        ) : (
          <button
            className="ad-item danger"
            onClick={() => {
              if (!requireWrite("delete")) return;
              handleDeleteUser(user.userid);
              setOpenId(null);
            }}
          >
            Delete
          </button>
        )}
      </>
    )}
  </div>
)}

  </div>
</td>


                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
<footer className="adm-foot">
  <div>
    Page {safePage}/{totalPages} • showing {limit ?? "?"} per page • {totalUsers} total users
  </div>

        <div className="adm-pager">
          <button
            className="ws-btn ghost"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <button
            className="ws-btn ghost"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </footer>

      {/* Create Modal */}
      {createModal && (
        <div className="ad-modal">
          <div className="ad-modal-content ws-card">
            <h3>Create New User</h3>
            <form onSubmit={handleCreateUser}>
              <label>Username</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />

              <label>Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />



              <label>Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>

              <div className="modal-actions">
                <button
                  type="button"
                  className="ws-btn ghost"
                  onClick={() => setCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="ws-btn primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && (
        <div className="ad-modal">
          <div className="ad-modal-content ws-card">
            <h3>Edit User</h3>
            <form onSubmit={handleEditUser}>
              <label>Username</label>
              <input
                type="text"
                required
                value={editFormData.username || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, username: e.target.value })
                }
              />

              <label>Email</label>
              <input
                type="email"
                required
                value={editFormData.email || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
                }
              />

              <label>Role</label>
              <select
                value={editFormData.role || "user"}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, role: e.target.value })
                }
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>

              <label>Status</label>
              <select
                value={editFormData.status || "active"}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, status: e.target.value })
                }
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="deleted">Deleted</option>
              </select>

              <div className="modal-actions">
                <button
                  type="button"
                  className="ws-btn ghost"
                  onClick={() => setEditModal({ open: false, user: null })}
                >
                  Cancel
                </button>
                <button type="submit" className="ws-btn primary">
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* No Access Modal */}
      {noAccessModal.open && (
        <div className="ad-modal">
          <div className="ad-modal-content ws-card">
            <h3>Access Denied</h3>
            <p>{noAccessModal.message}</p>
            <div className="modal-actions">
              <button
                className="ws-btn primary"
                onClick={() => setNoAccessModal({ open: false, message: "" })}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Error Popup */}
{alertModal.open && (
  <div className="ad-modal">
    <div className="ad-modal-content ws-card">
      <h3>Error</h3>
      <p>{alertModal.message}</p>
      <div className="modal-actions">
        <button
          className="ws-btn primary"
          onClick={() => setAlertModal({ open: false, message: "" })}
        >
          OK
        </button>
      </div>
    </div>
  </div>
)}

    </section>
    
  );
}
