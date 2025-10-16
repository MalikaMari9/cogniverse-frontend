// ===============================
// WorkstationHub.jsx
// ===============================
import React, { useEffect, useState } from "react";
import "../ws_css.css";
import { WorkstationHubSidebar } from "../components/Sidebar";
import { SvgIcon } from "./Workstation";
import { getProjects, createProject } from "../api/api";

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

/* ---------- Hub Page ---------- */
export default function WorkstationHub() {
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute("data-theme") || "dark"
  );
  const [expanded, setExpanded] = useState(true);
  const [projects, setProjects] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ---------- Theme ---------- */
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    setTheme(next);
  };

  /* ---------- Fetch projects on load ---------- */
  useEffect(() => {
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
  }, []);

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
      setTimeout(() => {
        window.location.href = `/workstation/${newProj.projectid}`;
      }, 400);
    } catch (err) {
      console.error("Failed to create project:", err);
      alert("Error creating project: " + err.message);
    }
  };

  /* ---------- Open existing project ---------- */
  const handleOpenExisting = (project) => {
    window.location.href = `/workstation/${project.projectid}`;
  };

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
            <p style={{ padding: "20px", opacity: 0.7 }}>
              No projects yet. Create your first one!
            </p>
          ) : (
            <div className="hub-list">
              {projects.map((p) => (
                <div key={p.projectid} className="hub-card ws-card">
                  <div className="hub-card-head">
                    <h3>{p.projectname}</h3>
                    <div className="hub-meta">
                      <span className="hub-status">
                        {p.status?.toUpperCase() || "ACTIVE"}
                      </span>{" "}
                      •{" "}
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="hub-new">
          <button className="ws-btn primary" onClick={() => setOpenCreate(true)}>
            + Start New Project
          </button>
        </section>
      </main>

      <CreateProjectModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}
