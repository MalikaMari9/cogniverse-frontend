// ===============================
// WorkstationHub.jsx
// ===============================
import React, { useEffect, useState } from "react";
import "../ws_css.css";
import { WorkstationHubSidebar } from "../components/Sidebar";
import { SvgIcon } from "./Workstation";
import { getProjects, createProject, updateProject } from "../api/api";
import { useNavigate } from "react-router-dom";
import { usePermission } from "../hooks/usePermission";

/* ---------- Create Project Modal ---------- */
function CreateProjectModal({ open, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const defaultTheme = localStorage.getItem("theme") || "light";
  const [theme, setTheme] = useState(defaultTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "");
  }, [open]);

  if (!open) return null;

  return (
    <div className="ws-modal-layer fade-in">
      <div className="ws-backdrop-content" onClick={onClose} />
      <div
        className="ws-card ws-modal ws-center-over-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(480px, 92vw)",
          zIndex: 600,
          padding: "24px 28px",
          borderRadius: "20px",
          boxShadow: "0 12px 48px rgba(0,0,0,0.25)",
          animation: "popIn 0.3s ease",
        }}
      >
        <h3
          style={{
            fontSize: "1.4rem",
            marginBottom: "16px",
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          ✨ Create New Project
        </h3>

        <label style={{ display: "block", marginBottom: "16px" }}>
          <span style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
            Project Title
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter project title"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "10px",
              border: "1px solid var(--border-color, #ccc)",
              background: "var(--bg-alt, #fafafa)",
              outline: "none",
            }}
          />
        </label>

        <label style={{ display: "block", marginBottom: "24px" }}>
          <span style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
            Description
          </span>
          <textarea
            rows={3}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Short description..."
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "10px",
              border: "1px solid var(--border-color, #ccc)",
              background: "var(--bg-alt, #fafafa)",
              outline: "none",
              resize: "none",
            }}
          />
        </label>

        <div
          className="ws-modal-actions"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            marginTop: "12px",
          }}
        >
          <button className="ws-btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="ws-btn primary"
            onClick={() => {
              onSubmit({ title, desc });
              onClose();
            }}
            disabled={!title.trim()}
          >
            Create
          </button>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .fade-in { animation: fadeIn 0.2s ease; }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
/* ---------- Edit Project Modal ---------- */
function EditProjectModal({ open, onClose, project, onSubmit }) {
  const [title, setTitle] = useState(project?.projectname || "");
  const [desc, setDesc] = useState(project?.project_desc || "");

  useEffect(() => {
    if (project) {
      setTitle(project.projectname);
      setDesc(project.project_desc || "");
    }
  }, [project]);

  if (!open) return null;

  return (
    <div className="ws-modal-layer fade-in">
      <div className="ws-backdrop-content" onClick={onClose} />
      <div
        className="ws-card ws-modal ws-center-over-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(480px, 92vw)",
          zIndex: 600,
          padding: "24px 28px",
          borderRadius: "20px",
          boxShadow: "0 12px 48px rgba(0,0,0,0.25)",
          animation: "popIn 0.3s ease",
        }}
      >
        <h3
          style={{
            fontSize: "1.4rem",
            marginBottom: "16px",
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          ✏️ Edit Project
        </h3>

        <label style={{ display: "block", marginBottom: "16px" }}>
          <span style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
            Project Title
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter project title"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "10px",
              border: "1px solid var(--border-color, #ccc)",
              background: "var(--bg-alt, #fafafa)",
            }}
          />
        </label>

        <label style={{ display: "block", marginBottom: "24px" }}>
          <span style={{ display: "block", marginBottom: "6px", fontWeight: 500 }}>
            Description
          </span>
          <textarea
            rows={3}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Short description..."
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "10px",
              border: "1px solid var(--border-color, #ccc)",
              background: "var(--bg-alt, #fafafa)",
              resize: "none",
            }}
          />
        </label>

        <div
          className="ws-modal-actions"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            marginTop: "12px",
          }}
        >
          <button className="ws-btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="ws-btn primary"
            onClick={() => {
              onSubmit({ projectid: project.projectid, title, desc });
              onClose();
            }}
            disabled={!title.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Hub Page ---------- */
export default function WorkstationHub() {
    const navigate = useNavigate();
      // 🧭 Pagination setup
  const [currentPage, setCurrentPage] = useState(1);
  const PROJECTS_PER_PAGE = 6; // TOBECHANGED (config-driven later)


  const [theme, setTheme] = useState(
    document.documentElement.getAttribute("data-theme") || "dark"
  );
  const [expanded, setExpanded] = useState(true);
  const [projects, setProjects] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
const [noAccessModal, setNoAccessModal] = useState({ open: false, message: "" });
const { level: permission, canRead, canWrite, loading: permLoading } =
  usePermission("PROJECTS");
const [openEdit, setOpenEdit] = useState({ open: false, project: null });


  const requireWrite = (action = "create projects") => {
  if (!canWrite) {
    setNoAccessModal({
      open: true,
      message: `You don't have permission to ${action}.`,
    });
    return false;
  }
  return true;
};

    // 🔁 Reload projects list
  const reloadProjects = async () => {
    setLoading(true);
    try {
      const res = await getProjects();
      // sort by latest update
      const sorted = [...res].sort(
        (a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0)
      );
      setProjects(sorted);
    } catch (err) {
      console.error("Failed to reload projects:", err);
      setError("Could not refresh projects.");
    } finally {
      setLoading(false);
    }
  };


  /* ---------- Theme ---------- */
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    setTheme(next);
  };

  /* ---------- Fetch projects on load ---------- */
useEffect(() => {
  if (!permLoading && canRead) {
    (async () => {
      try {
        const res = await getProjects();
        setProjects(res);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
        setError("Failed to load projects. Please try again later.");
      } finally {
        setLoading(false);
      }
    })();
  }
}, [permLoading, canRead]);


  /* ---------- Create project ---------- */
  const handleCreateProject = async (data) => {
    try {
      const payload = {
        projectname: data.title,
        project_desc: data.desc,
      };
      const newProj = await createProject(payload);
      setProjects((prev) => [...prev, newProj]);

      // Navigate to the new project after creation
      await reloadProjects();
setTimeout(() => {
  navigate(`/workstation/${newProj.projectid}`);
}, 400);

    } catch (err) {
      console.error("Failed to create project:", err);
      alert("Error creating project: " + err.message);
    }
  };

  const handleEditProject = async (data) => {
  try {
    const payload = {
      projectname: data.title,
      project_desc: data.desc,
    };
    await updateProject(data.projectid, payload); // ensure you import updateProject
    await reloadProjects();
  } catch (err) {
    console.error("Failed to update project:", err);
    alert("Error updating project: " + err.message);
  }
};


  /* ---------- Open existing project ---------- */
const handleOpenExisting = (project) => {
  navigate(`/workstation/${project.projectid}`);
};

if (permLoading) return <p className="hub-loading">Checking permissions...</p>;

if (permission === "none") {
  // 🚫 Redirect if no permission
  navigate("/unauthorized");
  return null;
}

  return (
    <div className="hub-page ws-page">
      {/* Sidebar */}
      <WorkstationHubSidebar
        expanded={expanded}
        onToggleExpand={() => setExpanded((e) => !e)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="hub-main">
        <header className="hub-header ws-card">
          <div className="hub-left">
            <div className="ws-brand">
              <span className="logo">
                <img src="logo.png" alt="" />
              </span>
              <span className="brand-text">Workstation Hub</span>
            </div>
          </div>
        </header>

        <section className="hub-intro">
          <h1>Welcome to the AI Agent Workstation</h1>
          <p>Choose a project to continue or start a new one.</p>
        </section>

        <section className="hub-projects">
          {loading ? (
            <p style={{ padding: "20px", opacity: 0.7 }}>Loading projects...</p>
          ) : error ? (
            <p style={{ color: "red", padding: "20px" }}>{error}</p>
          ) : projects.length === 0 ? (
           <div className="hub-empty">
  <p>🗂️ No projects yet. Ready to create your first one?</p>
 <button
  className="ws-btn primary"
  onClick={() => {
    if (!requireWrite("create new projects")) return;
    setOpenCreate(true);
  }}
  disabled={!canWrite}
  title={!canWrite ? "Read-only access" : ""}
>
  + {permission === "read" ? "View Projects" : "Create Project"}
</button>

</div>

          ) : (
            <div className="hub-list">
             {projects
  .slice((currentPage - 1) * PROJECTS_PER_PAGE, currentPage * PROJECTS_PER_PAGE)
  .map((p) => (

                <div key={p.projectid} className="hub-card ws-card">
                  <div className="hub-card-head">
  <div className="hub-title-row">
    <h3>{p.projectname}</h3>
    <span className={`hub-chip ${p.status || "active"}`}>
      {p.status || "active"}
    </span>
  </div>
  <div className="hub-meta">
    <span>
      Last updated:{" "}
      {p.updated_at
        ? new Date(p.updated_at).toLocaleString()
        : "—"}
    </span>
  </div>
</div>

                  <p className="hub-desc">
                    {p.project_desc || "No description provided."}
                  </p>
                  <div className="hub-actions">
                    <button
                      className="ws-btn ghost"
                      onClick={() => handleOpenExisting(p)}
                    >
                      Continue
                    </button>
                    <button
    className="ws-btn ghost"
    onClick={() => {
      if (!requireWrite("edit projects")) return;
      setOpenEdit({ open: true, project: p });
    }}
    disabled={!canWrite}
    title={!canWrite ? "Read-only access" : ""}
  >
    Edit
  </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {projects.length > PROJECTS_PER_PAGE && (
  <div className="hub-pagination">
    <button
      className="ws-btn ghost"
      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
      disabled={currentPage === 1}
    >
      ← Prev
    </button>

    <span className="hub-page-info">
      Page {currentPage} of {Math.ceil(projects.length / PROJECTS_PER_PAGE)}
    </span>

    <button
      className="ws-btn ghost"
      onClick={() =>
        setCurrentPage((p) =>
          Math.min(Math.ceil(projects.length / PROJECTS_PER_PAGE), p + 1)
        )
      }
      disabled={currentPage === Math.ceil(projects.length / PROJECTS_PER_PAGE)}
    >
      Next →
    </button>
  </div>
)}

        </section>

        <section className="hub-new">
<button
  className="ws-btn primary"
  onClick={() => {
    if (!requireWrite("create new projects")) return;
    setOpenCreate(true);
  }}
  disabled={!canWrite}
  title={!canWrite ? "Read-only access" : ""}
>
  + {permission === "read" ? "View Projects" : "Create Project"}
</button>

        </section>
      </main>

      <CreateProjectModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onSubmit={handleCreateProject}
      />
      <EditProjectModal
  open={openEdit.open}
  project={openEdit.project}
  onClose={() => setOpenEdit({ open: false, project: null })}
  onSubmit={handleEditProject}
/>
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

    </div>
  );
}
