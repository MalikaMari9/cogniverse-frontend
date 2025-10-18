import React from "react";
import "../profile-nav.css";
import { loginUser, registerUser } from "../api/api";
import NavProduct from "../components/NavProduct";

/* ================= Theme ================= */

function useTheme() {
  const [theme, setTheme] = React.useState(
    () => document.documentElement.getAttribute("data-theme") || "dark"
  );

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch {}
  }, [theme]);

  const toggle = () => setTheme(t => (t === "dark" ? "light" : "dark"));
  return { theme, toggle };
}

  const toggleTheme = () => {
    const next = t === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setT(next);
  };

/* ================= Navigation Header ================= */



/* ============== Reveal Animation Wrapper ============== */

function Reveal({ as: Tag = "div", variant = "fade-up", delay = 0, className = "", children, ...rest }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add("is-visible"); io.disconnect(); }
    }, { threshold: 0.16 });
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

/* ===== Icons ===== */
const IcGoogle = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
    <path fill="#EA4335" d="M12 10v4h5.7c-.25 1.45-1.72 4.25-5.7 4.25A6.75 6.75 0 1 1 12 5.25c1.93 0 3.23.83 3.98 1.55l2.7-2.6C17.47 2.7 15.03 1.75 12 1.75 5.93 1.75 1 6.68 1 12.75S5.93 23.75 12 23.75c6.07 0 10.5-4.27 10.5-10.3 0-.7-.08-1.23-.18-1.75H12z"/>
  </svg>
);
const IcGithub = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
    <path fill="currentColor" d="M12 2C6.48 2 2 6.6 2 12.26c0 4.51 2.87 8.33 6.84 9.68.5.1.68-.22.68-.49v-1.73c-2.78.62-3.37-1.2-3.37-1.2-.46-1.2-1.14-1.52-1.14-1.52-.94-.66.07-.65.07-.65 1.04.08 1.59 1.08 1.59 1.08.93 1.63 2.45 1.16 3.04.89.09-.69.36-1.16.66-1.43-2.22-.26-4.56-1.15-4.56-5.14 0-1.14.39-2.07 1.03-2.8-.1-.26-.45-1.3.1-2.7 0 0 .85-.28 2.8 1.07a9.3 9.3 0 0 1 5.1 0c1.95-1.35 2.8-1.07 2.8-1.07.55 1.4.2 2.44.1 2.7.64.73 1.03 1.66 1.03 2.8 0 3.99-2.34 4.88-4.57 5.14.37.33.7.96.7 1.94v2.87c0 .27.18.6.69.49A10.28 10.28 0 0 0 22 12.26C22 6.6 17.52 2 12 2z"/>
  </svg>
);
const IcApple = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...p}>
    <path fill="currentColor" d="M16.36 1.64c.03 1-.37 1.98-1.1 2.7-.73.73-1.7 1.12-2.7 1.1-.03-1 .37-1.98 1.1-2.7.73-.73 1.7-1.12 2.7-1.1zM20.5 17.3c-.37.86-.83 1.64-1.38 2.35-.72.94-1.49 1.4-2.26 1.4-.6 0-1.2-.18-1.83-.36-.57-.17-1.16-.35-1.77-.35-.65 0-1.28.18-1.87.35-.6.18-1.18.36-1.77.36-.82 0-1.62-.45-2.36-1.35-.62-.75-1.16-1.6-1.6-2.53-.56-1.18-.84-2.32-.84-3.42 0-1.26.29-2.34.87-3.25.44-.7 1.02-1.27 1.76-1.7.73-.43 1.51-.64 2.33-.64.58 0 1.2.17 1.86.35.55.16 1.15.34 1.8.34.62 0 1.2-.18 1.76-.34.68-.18 1.3-.35 1.88-.35.74 0 1.42.17 2.04.5.62.34 1.12.78 1.5 1.33-.59.36-1.06.82-1.4 1.37-.43.68-.64 1.44-.64 2.27 0 .9.24 1.71.72 2.44.48.73 1.08 1.26 1.8 1.6-.15.38-.31.75-.49 1.12z"/>
  </svg>
);

/* ======================== Page ======================== */

export default function AuthPage() {
  const { theme, toggle } = useTheme();
  const [tab, setTab] = React.useState("login"); // 'login' | 'signup'
  const [message, setMessage] = React.useState("");
  const [messageType, setMessageType] = React.useState(""); // "success" | "error" | "warning"
  const [isLoading, setIsLoading] = React.useState(false);

  const goWorkstation = () => (window.location.href = "/workstation");
  const goGraph = () => (window.location.href = "/graph");
  const goHistory = () => (window.location.href = "/history");

  const hero = tab === "login"
    ? {
        eyebrow: "Welcome back",
        title: "Sign in to continue",
        body: "Pick up your simulations, track teams, and resume where you left off."
      }
    : {
        eyebrow: "Join CogniVerse",
        title: "Create your account",
        body: "Set up your workspace and start simulating real-world team dynamics."
      };
  
  // 🆕 ADD THIS FUNCTION
  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
    // Auto-clear message after 5 seconds
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  const handleSubmit = async (e) => {
    console.log("🔄 Form submitted - preventing default");
  e.preventDefault();
  console.log("✅ Default prevented");
    setIsLoading(true);
    setMessage("");
    setMessageType("");
    
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());

    try {
      if (tab === "login") {
        const res = await loginUser({
          identifier: payload.identifier,
          password: payload.password,
        });

        console.log("✅ Login success:", res);
        showMessage(`Welcome back, ${payload.identifier || "friend"}!`, "success");

        localStorage.setItem("access_token", res.access_token);
        localStorage.setItem("refresh_token", res.refresh_token);

       // decode JWT payload
const tokenParts = res.access_token.split(".");
const decoded = JSON.parse(atob(tokenParts[1]));
const role = decoded.role || "user";

let target = "/workstation";
if (role === "admin" || role === "superadmin") target = "/admin";

// wait for UI feedback, then redirect
setTimeout(() => {
  window.location.href = target;
}, 1500);

      } else {
        // Registration validation
        if (payload.password.length < 6) {
          showMessage("Password must be at least 6 characters", "warning");
          setIsLoading(false);
          return;
        }

        const res = await registerUser({
          username: payload.username,
          email: payload.email,
          password: payload.password,
        });
        
        console.log("✅ Register success:", res);
        showMessage(`Account created for ${payload.username}! You can now log in.`, "success");
        
        // Switch to login tab after successful registration
        setTimeout(() => {
          setTab("login");
          setMessage("");
        }, 3000);
      }
    } catch (err) {
      console.error("❌ Auth failed:", err.response?.data || err);
      
      const errorData = err.response?.data;
      
      // Handle specific error cases
      if (errorData?.detail?.includes("Invalid credentials") || 
          errorData?.detail?.includes("incorrect") || 
          errorData?.detail?.includes("Invalid password")) {
        showMessage("❌ Incorrect password. Please try again.", "error");
      } else if (errorData?.detail?.includes("User not found") || 
                 errorData?.detail?.includes("not exist")) {
        showMessage("❌ User not found. Please check your username/email.", "error");
      } else if (errorData?.detail?.includes("Username already taken") || 
                 errorData?.detail?.includes("Email already taken")) {
        showMessage("❌ " + errorData.detail, "warning");
      } else if (errorData?.detail) {
        showMessage("❌ " + errorData.detail, "error");
      } else {
        showMessage("❌ Authentication failed. Please try again.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="app auth-page">


      <main>
        <section className="auth-wrap container">
          <div className="auth-grid">
            {/* Left Section */}
            <section className="auth-hero ws-card">
              <Reveal className="auth-hero card" variant="fade-right">
                <p key={`eyebrow-${tab}`} className="eyebrow swap-text">{hero.eyebrow}</p>
                <h1 key={`title-${tab}`} className="swap-text">{hero.title}</h1>
                <p key={`body-${tab}`} className="muted swap-text">{hero.body}</p>

                <div className="illus" aria-hidden="true">
                  <div className="orb o1" />
                  <div className="orb o2" />
                  <div className="orb o3" />
                </div>
              </Reveal>
            </section>

            {/* Right Section */}
            <section className="auth-form ws-card">
              <Reveal className="auth-card card" variant="fade-left" delay={60}>
                <div className="tabs" role="tablist" aria-label="Auth tabs" data-tab={tab}>
                  <div className="ink" aria-hidden="true" />
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "login"}
                    className={tab === "login" ? "active" : ""}
                    onClick={() => setTab("login")}
                  >
                    Log in
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "signup"}
                    className={tab === "signup" ? "active" : ""}
                    onClick={() => setTab("signup")}
                  >
                    Sign up
                  </button>
                </div>

                <form key={tab} onSubmit={handleSubmit} className="form" noValidate>
                {/* Login: Show identifier field */}
                  {tab === "login" && (
                    <>
                      <label htmlFor="identifier" className="fade-item" style={{ animationDelay: "40ms" }}>Username or Email</label>
                      <input id="identifier" name="identifier" type="text" placeholder="john.doe or you@company.com" required className="fade-item" style={{ animationDelay: "80ms" }} disabled={isLoading} />
                    </>
                  )}
                {/* Login: Show identifier field */}
                  {tab === "signup" && (
                    <>
                    <label htmlFor="username" className="fade-item" style={{ animationDelay: "40ms" }}>Username</label>
                    <input id="username" name="username" type="text" placeholder="john.doe" required className="fade-item" style={{ animationDelay: "80ms" }} disabled={isLoading} />

                    <label htmlFor="email" className="fade-item" style={{ animationDelay: "120ms" }}>Email</label>
                    <input id="email" name="email" type="email" placeholder="you@company.com" required className="fade-item" style={{ animationDelay: "160ms" }} disabled={isLoading} />
                    </>
                  )}

                  <label htmlFor="password" className="fade-item" style={{ animationDelay: "120ms" }}>Password</label>
                  <input id="password" name="password" type="password" placeholder="••••••••" required className="fade-item" style={{ animationDelay: "160ms" }} disabled={isLoading} />

                  

                  <div className="row between fade-item" style={{ animationDelay: "240ms" }}>
                    <label className="chk">
                      <input type="checkbox" name="remember" disabled={isLoading}/>
                      <span>Remember me</span>
                    </label>
                    <a className="link" href="#forgot">Forgot password?<span className="arr">→</span></a>
                  </div>

                  <button 
                    className={`btn primary fade-item ${isLoading ? 'loading' : ''}`}  // 🆕 ADD loading class
                    type="submit" 
                    style={{ animationDelay: "280ms" }}
                    disabled={isLoading}  // 🆕 ADD THIS
                  >
                    {isLoading ? "Please wait..." : (tab === "login" ? "Log in" : "Create account")}  {/* 🆕 UPDATE text */}
                  </button>

                  {message && (
                    <div 
                      className={`toast fade-item ${messageType}`} 
                      style={{ animationDelay: "300ms" }} 
                      role="status" 
                      aria-live="polite"
                    >
                      {message}
                    </div>
                  )}

                  <div className="or fade-item" style={{ animationDelay: "320ms" }}>
                    <span>or continue with</span>
                  </div>

                  <div className="social fade-item" style={{ animationDelay: "360ms" }}>
                    <button type="button" className="btn ghost" disabled={isLoading}><IcGoogle /><span>Google</span></button>
                    <button type="button" className="btn ghost" disabled={isLoading}><IcGithub /><span>GitHub</span></button>
                    <button type="button" className="btn ghost" disabled={isLoading}><IcApple /><span>Apple</span></button>
                  </div>

                  <p className="swap fade-item" style={{ animationDelay: "400ms" }}>
                    {tab === "login" ? (
                    <>Don&apos;t have an account? <button type="button" onClick={() => setTab("signup")} className="link" disabled={isLoading}>Sign up<span className="arr">→</span></button></>
                    ) : (
                    <>Already have an account? <button type="button" onClick={() => setTab("login")} className="link" disabled={isLoading}>Log in<span className="arr">→</span></button></>
                    )}
                  </p>
                </form>
              </Reveal>
            </section>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>© CogniVerse</p>
      </footer>
    </div>
  );
}
