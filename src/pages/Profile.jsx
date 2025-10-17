import React from "react";
import "../profile-nav.css";        // <— new CSS file shown below


// If you already have these helpers elsewhere, use those instead:
function getStoredTheme() {
  return document.documentElement.getAttribute("data-theme") || "dark";
}
function applyTheme(next) {
  document.documentElement.setAttribute("data-theme", next);
  try { localStorage.setItem("theme", next); } catch {}
}

// Reuse the same pill switch class used in the sidebar (must exist globally in your CSS)
function PfNav({ theme, onToggleTheme, onGoWorkstation, onGoGraph, onGoHistory }) {
  return (
    <header className="pf-nav pf-nav-pretty ws-card">
      <div className="pf-brand">
          <div className="ws-brand">
            <span className="logo"><img src="logo.png" alt="" /></span>
            
          </div>        <div className="pf-divider" />
        <nav className="pf-tabs" aria-label="Primary">
          <button className="pf-tab" onClick={onGoWorkstation}>Workstation</button>
          <button className="pf-tab" onClick={onGoGraph}>Graph</button>
          <button className="pf-tab ghost" onClick={onGoHistory}>History</button>
        </nav>
      </div>

      <div className="pf-right">
        <button
          type="button"
          className={`ws-theme-switch ${theme}`}   // same pill as your sidebar
          onClick={onToggleTheme}
          aria-label="Toggle theme"
        />
        <div className="pf-user" role="button" tabIndex={0} aria-label="User profile">
          <div className="avatar">A</div>
          <div className="meta">
            <div className="name">Alex</div>
            <div className="role">Pro</div>
          </div>
        </div>
      </div>
    </header>
  );
}


function UpdatePassword({ onDone, onCancel }) {
  const [a, setA] = React.useState("");
  const [b, setB] = React.useState("");
  const [err, setErr] = React.useState("");

  const submit = () => {
    if (a.length < 8) return setErr("Use at least 8 characters.");
    if (a !== b) return setErr("Passwords don’t match.");
    setErr("");
    onDone();
  };

  return (
    <>
      <h3>Update password</h3>
      <div className="form">
        <label> New password <input type="password" value={a} onChange={(e)=>setA(e.target.value)} placeholder="••••••••" /></label>
        <label> Confirm new password <input type="password" value={b} onChange={(e)=>setB(e.target.value)} placeholder="••••••••" /></label>
        {err && <div className="error-text">{err}</div>}
      </div>
      <div className="modal-actions">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn primary" onClick={submit}>Update</button>
      </div>
    </>
  );
}


/* ================= Reveal helper ================= */
function Reveal({
  as: Tag = "div",
  variant = "fade-up",
  delay = 0,
  className = "",
  children,
  ...rest
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("is-visible");
          io.disconnect();
        }
      },
      { threshold: 0.16 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref}
      className={`reveal ${variant} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ================= Tiny inline icons ================= */
const IcSearch = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...p}>
    <path d="M15 15l5 5m-2-7a7 7 0 10-14 0 7 7 0 0014 0z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IcEdit = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...p}>
    <path fill="currentColor" d="M3 17.25V21h3.75L17.8 9.95l-3.75-3.75L3 17.25zM20.7 7.05c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
  </svg>
);
const IcSave = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...p}>
    <path fill="currentColor" d="M17 3H5c-1.1 0-2 .9-2 2v14l4-4h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
  </svg>
);
const IcBell = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden {...p}>
    <path d="M18 8a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8" fill="none" stroke="currentColor" strokeWidth="2"/>
    <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
const IcShield = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden {...p}>
    <path d="M12 3l7 4v5c0 5-3.5 9-7 9s-7-4-7-9V7l7-4z" fill="none" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
const IcCard = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
    <path d="M3 10h18" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
const IcTag = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden {...p}>
    <path fill="currentColor" d="M2 12l10-10 10 10-10 10L2 12zm14-3a2 2 0 1 0-2-2 2 2 0 0 0 2 2z"/>
  </svg>
);

/* A tiny inline default avatar (works offline) */
const DEFAULT_AVATAR =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'>
      <defs><linearGradient id='g' x1='0' x2='1'><stop stop-color='#69f'/><stop offset='1' stop-color='#b3f'/></linearGradient></defs>
      <rect width='128' height='128' rx='64' fill='url(#g)'/>
      <circle cx='64' cy='48' r='22' fill='#fff' opacity='.92'/>
      <rect x='26' y='74' width='76' height='38' rx='19' fill='#fff' opacity='.92'/>
    </svg>`
  );





/* ================= Page ================= */

 export default function ProfilePage() {

  const [form, setForm] = React.useState({
    username: "",
    role: "",
    email: "",
  });
  const [avatar, setAvatar] = React.useState("");

  React.useEffect(() => {
  const fetchProfile = async () => {
    try {
      const data = await getUserProfile(); // <- data is already res.data
      console.log("Profile response:", data); // correct

      if (data) {
        setForm({
          username: data.username,
          role: data.role,
          email: data.email,
        });
        setAvatar(data.profile_image_url || "");
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
      // if (err.response?.status === 401) window.location.href = "/login";
    }
  };
  fetchProfile();
}, []);
  const [theme, setTheme] = React.useState(getStoredTheme());
React.useEffect(() => { applyTheme(theme); }, [theme]);

  const toggleTheme = () => setTheme(t => (t === "dark" ? "light" : "dark"));

  // wire these if you want real navigation:
  const goWorkstation = () => { /* route to workstation */ };
  const goGraph       = () => { /* route to relationship graph */ };
  const goHistory     = () => { /* route to history */ };  

  const billingBoxRef = React.useRef(null);
  const fileRef = React.useRef(null);

  /* === FIX: lock ONLY the body while the modal is open (no white page) === */
  React.useEffect(() => {
    if (!isEditing) {
      const y = -parseInt(document.body.style.top || "0", 10) || 0;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (y) window.scrollTo(0, y);
      return;
    }
    const y = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${y}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    return () => {
      const restoreY = -parseInt(document.body.style.top || "0", 10) || 0;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (restoreY) window.scrollTo(0, restoreY);
    };
  }, [isEditing]);
/* ===================================================================== */

  const pickAvatar = () => fileRef.current?.click();
  const onAvatar = (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  const preview = URL.createObjectURL(f);
  setAvatar(preview);
};


  const openEdit  = () => setIsEditing(true);
  const closeEdit = () => setIsEditing(false);
  const saveEdit = async () => {
  try {
    const formData = new FormData();
    formData.append("username", form.username);
    formData.append("email", form.email);

    // If a new avatar is selected
    if (fileRef.current && fileRef.current.files[0]) {
      formData.append("profile_image", fileRef.current.files[0]);
    }

    const res = await api.put("users/profile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast("Profile saved successfully");
    setIsEditing(false);

    // Refresh local state with backend-confirmed data
    if (res.data) {
      setForm({
        username: res.data.username,
        role: res.data.role,
        email: res.data.email,
      });
      setAvatar(res.data.profile_image_url || avatar);
    }
  } catch (err) {
    console.error("Save error:", err);
    toast("Failed to save profile");
  }
};

const setField = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

// jump from top-left chips to Billing section + select tab
const jumpToTab = (tab) => {
  setActiveTab(tab);
  billingBoxRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
};

  /* ---------------- Billing/Security actions ---------------- */
const [dialog, setDialog] = React.useState(null); // null | 'change-plan'|'update-payment'|'manage-devices'|'update-password'|'add-payment-method'
const openDialog = (t) => setDialog(t);
const closeDialog2 = () => setDialog(null);

/* tiny toast (reuses your .save-toast style) */
const toast = (msg) => {
  const t = document.createElement("div");
  t.className = "save-toast";
  t.textContent = msg;
  document.querySelector(".pbar")?.appendChild(t);
  setTimeout(() => t.remove(), 1600);
};

/* Download invoices (client-side placeholder file) */
const handleDownloadInvoices = () => {
  const blob = new Blob(
    [
      "Invoices (Aug–Oct 2025)\n",
      "- INV-2025-08-014  $24.00  PAID\n",
      "- INV-2025-09-018  $24.00  PAID\n",
      "- INV-2025-10-021  $24.00  PAID\n",
    ],
    { type: "text/plain;charset=utf-8" }
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "invoices-Aug–Oct-2025.txt";
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Invoices downloaded");
};


  return (
    <div className="app profile-page">
      <PfNav
        theme={theme}
        onToggleTheme={toggleTheme}
        onGoWorkstation={goWorkstation}
        onGoGraph={goGraph}
        onGoHistory={goHistory}
      />

      <main className="pwrap">
        {/* Top action/search bar */}
        <div className="pbar reveal fade-right">
          <div className="pbar-left">
            <span className="brand-pill">Profile</span>
            <div className="search" role="search">
              <IcSearch />
              <input placeholder="Search profile" aria-label="Search profile" />
            </div>
          </div>

          <div className="pbar-actions">
            {!isEditing ? (
              <button type="button" className="btn" onClick={openEdit} aria-label="Edit profile">
                <IcEdit /> Edit
              </button>
            ) : (
              <button type="button" className="btn primary" onClick={saveEdit} aria-label="Save profile">
                <IcSave /> Save
              </button>
            )}
          </div>
        </div>

        {/* === GRID with named areas === */}
        <div className="pgrid-areas">
          {/* Profile (top-left) */}
          <Reveal as="section" className="card profile-area" variant="fade-up">
            <div className="avatar-block">
              <img
                className="avatar-img"
                src={avatar || DEFAULT_AVATAR}
                alt="Avatar"
                onError={(e) => (e.currentTarget.src = DEFAULT_AVATAR)}
              />
              <div className="id-name">
                <h3>{form.name}</h3>
                <div className="tag">{form.role}</div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onAvatar} />
              <button type="button" className="btn ghost ml-auto" onClick={pickAvatar}>
                Change photo
              </button>
              
          

              {/* In-card Edit button (per request) */}
              <button
                type="button"
                className="btn"
                style={{ marginLeft: 8 }}
                onClick={openEdit}
                aria-label="Edit profile (in-card)"
              >
                <IcEdit /> Edit
              </button>
            </div>

            <dl className="kv">
              <div><dt>Name</dt><dd>{form.name}</dd></div>
              <div><dt>Email</dt><dd>{form.email}</dd></div>
              <div><dt>Phone</dt><dd>{form.phone}</dd></div>
              <div><dt>Address</dt><dd>{form.address}</dd></div>
            </dl>

            <div
            className="mini-cards"
                data-seg={activeTab === "overview" ? "1" : activeTab === "security" ? "2" : "3"}
                role="tablist"
                aria-label="Profile sections"
                >
                <button
                    type="button"
                    className={`mcard ${activeTab === "overview" ? "active" : ""}`}
                    onClick={() => jumpToTab("overview")}
                    role="tab"
                    aria-selected={activeTab === "overview"}
                >
                    <span className="dot" />
                    <span>Account</span>
                </button>

                <button
                    type="button"
                    className={`mcard ${activeTab === "security" ? "active" : ""}`}
                    onClick={() => jumpToTab("security")}
                    role="tab"
                    aria-selected={activeTab === "security"}
                >
                    <span className="dot" />
                    <span>Security</span>
                </button>

                <button
                    type="button"
                    className={`mcard ${activeTab === "billing" ? "active" : ""}`}
                    onClick={() => jumpToTab("billing")}
                    role="tab"
                    aria-selected={activeTab === "billing"}
                >
                    <span className="dot" />
                    <span>Billing</span>
                </button>
                </div>

          </Reveal>

          {/* Billing (bottom-left) */}
          <Reveal as="section" className="card billing-area" variant="fade-up" delay={60}>
            <header className="lead">
              <h2>Billing & subscriptions</h2>
              <p>Manage plans, payment methods, and invoices.</p>
            </header>

            {/* Tabs with correctly centered ink slider */}
            <div className="tabs" data-tab={activeTab} ref={billingBoxRef}>
              <span className="ink" aria-hidden />
              <button
                type="button"
                className={activeTab === "overview" ? "active" : ""}
                onClick={() => setActiveTab("overview")}
              >
                <IcBell /> Overview
              </button>
              <button
                type="button"
                className={activeTab === "security" ? "active" : ""}
                onClick={() => setActiveTab("security")}
              >
                <IcShield /> Security
              </button>
              <button
                type="button"
                className={activeTab === "billing" ? "active" : ""}
                onClick={() => setActiveTab("billing")}
              >
                <IcCard /> Billing
              </button>
            </div>

            {/* Tab content */}
            {activeTab === "overview" && (
              <div className="rows">
                <div className="row">
                  <span className="label"><IcTag /> Plan</span>
                  <span className="value chip">Pro</span>
                </div>
                <div className="row">
                  <span className="label"><IcBell /> Renewal</span>
                  <span className="value">Nov 25, 2025</span>
                </div>
                <div className="row">
                  <span className="label"><IcCard /> Card</span>
                  <span className="value">•••• 4242</span>
                </div>
                <div className="panel actions">
                <button type="button" className="btn" onClick={() => openDialog('change-plan')}>Change plan</button>
                <button type="button" className="btn primary" onClick={() => openDialog('update-payment')}>Update payment</button>
                </div>

              </div>
            )}

            {activeTab === "security" && (
              <div className="rows">
                <div className="row">
                  <span className="label"><IcShield /> 2-Factor Authentication</span>
                  <span className="chip ok">Enabled</span>
                </div>
                <div className="row">
                  <span className="label"><IcShield /> Login alerts</span>
                  <span className="value">Email & App</span>
                </div>
                <div className="panel actions">
                <button type="button" className="btn" onClick={() => openDialog('manage-devices')}>Manage devices</button>
                <button type="button" className="btn primary" onClick={() => openDialog('update-password')}>Update password</button>
                </div>

              </div>
            )}

            {activeTab === "billing" && (
              <div className="rows">
                <div className="row">
                  <span className="label"><IcCard /> Default payment</span>
                  <span className="value">Visa •••• 4242</span>
                </div>
                <div className="row">
                  <span className="label"><IcTag /> Invoices</span>
                  <span className="value">Aug–Oct 2025</span>
                </div>
                <div className="panel actions">
                <button type="button" className="btn" onClick={handleDownloadInvoices}>Download invoices</button>
                <button type="button" className="btn primary" onClick={() => openDialog('add-payment-method')}>Add payment method</button>
                </div>

              </div>
            )}
          </Reveal>

          {/* Activity (right) – equal height to left stack */}
          <Reveal as="aside" className="card activity-area" variant="fade-left" delay={100}>
            <h3 className="side-title">Activity Log</h3>
            <ul className="timeline">
              <li>
                <span className="dot" />
                <div className="time">Today 10:32</div>
                <div className="desc">Signed in from Mandalay, MM</div>
              </li>
              <li>
                <span className="dot" />
                <div className="time">Yesterday</div>
                <div className="desc">Changed password</div>
              </li>
              <li>
                <span className="dot" />
                <div className="time">Sep 22</div>
                <div className="desc">Updated profile photo</div>
              </li>
              <li>
                <span className="dot" />
                <div className="time">Sep 18</div>
                <div className="desc">Enabled two-factor authentication</div>
              </li>
            </ul>

            <div className="sblock">
              <h4 className="side-title">Preferences</h4>
              <div className="pill-row">
                <span className="pill">Dark mode</span>
                <span className="pill">English</span>
              </div>
            </div>
          </Reveal>
        </div>
      </main>

    
    {/* ===== Action Dialogs (reuses modal styles) ===== */}
{dialog && (
  <div className="modal-backdrop" onClick={closeDialog2}>
    <div className="modal card" onClick={(e) => e.stopPropagation()}>
      {/* CHANGE PLAN */}
      {dialog === "change-plan" && (
        <>
          <h3>Change plan</h3>
          <div className="form">
            <label>
              Plan
              <select onChange={(e)=>e} style={{height:42,borderRadius:12,padding:"0 12px",border:"1px solid rgba(0,0,0,.08)",background:"rgba(255,255,255,.86)"}}>
                <option>Free</option>
                <option selected>Pro — $24/mo</option>
                <option>Team — $19/user/mo</option>
              </select>
            </label>
            <div className="chip">Current: Pro</div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={closeDialog2}>Cancel</button>
            <button
              type="button"
              className="btn primary"
              onClick={() => { toast("Plan changed"); closeDialog2(); }}
            >
              Apply
            </button>
          </div>
        </>
      )}

      {/* UPDATE PAYMENT */}
      {dialog === "update-payment" && (
        <>
          <h3>Update payment</h3>
          <div className="form">
            <label> Card number <input placeholder="4242 4242 4242 4242" inputMode="numeric" /></label>
            <label> Expiry (MM/YY) <input placeholder="12/27" inputMode="numeric" /></label>
            <label> CVC <input placeholder="123" inputMode="numeric" /></label>
            <label> Name on card <input placeholder="Denise" /></label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={closeDialog2}>Cancel</button>
            <button
              type="button"
              className="btn primary"
              onClick={() => { toast("Payment method updated"); closeDialog2(); }}
            >
              Save
            </button>
          </div>
        </>
      )}

      {/* MANAGE DEVICES */}
      {dialog === "manage-devices" && (
        <>
          <h3>Manage devices</h3>
          <div className="rows" style={{marginTop:8}}>
            <div className="row"><span className="label">Mac • Safari · Mandalay</span><span className="chip ok">Active</span></div>
            <div className="row"><span className="label">iPhone • App · Mandalay</span><span className="pill">Last seen 2d ago</span></div>
            <div className="row"><span className="label">Windows • Chrome · Office</span><span className="pill">Last seen 1w ago</span></div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={closeDialog2}>Close</button>
            <button
              type="button"
              className="btn primary"
              onClick={() => { toast("Signed out other sessions"); closeDialog2(); }}
            >
              Sign out others
            </button>
          </div>
        </>
      )}

      {/* UPDATE PASSWORD */}
      {dialog === "update-password" && (
        <UpdatePassword onDone={() => { toast("Password updated"); closeDialog2(); }} onCancel={closeDialog2} />
      )}

      {/* ADD PAYMENT METHOD */}
      {dialog === "add-payment-method" && (
        <>
          <h3>Add payment method</h3>
          <div className="form">
            <label> Card number <input placeholder="4000 0039 6000 0000" inputMode="numeric" /></label>
            <label> Expiry (MM/YY) <input placeholder="09/28" inputMode="numeric" /></label>
            <label> CVC <input placeholder="123" inputMode="numeric" /></label>
            <label> Country <input placeholder="Myanmar" /></label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={closeDialog2}>Cancel</button>
            <button
              type="button"
              className="btn primary"
              onClick={() => { toast("Payment method added"); closeDialog2(); }}
            >
              Add
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}


      {/* ===== Edit Panel (modal) ===== */}
      {isEditing && (
        <div className="modal-backdrop" onClick={closeEdit}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <h3>Edit profile</h3>
            <div className="form">
              <label> Name   <input value={form.username}    onChange={setField("username")} />   </label>
              <label> Role   <input value={form.role}    onChange={setField("role")} />   </label>
              {/* <label> Email  <input value={form.email}   onChange={setField("email")} />  </label> */}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={closeEdit}>Cancel</button>
              <button type="button" className="btn primary" onClick={saveEdit}><IcSave /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
