import React from "react";
import Nav from "../components/Nav.jsx";

/* ================= Theme ================= */
function useTheme() {
  const [theme, setTheme] = React.useState(
    () => localStorage.getItem("theme") || "light"
  );
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));
  return { theme, toggle };
}

/* ============== Reveal (IO + counters) ============== */
function Reveal({
  as: Tag = "div",
  variant = "fade-up",
  delay = 0,
  className = "",
  repeat = false,
  children,
  ...rest
}) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const startCounter = (node) => {
      if (node.__counting) return;
      node.__counting = true;
      const target = parseInt(node.getAttribute("data-count"), 10);
      const dur = Number(node.getAttribute("data-count-dur") || 1300);
      const fmt = node.getAttribute("data-count-fmt") || "int";
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 0.5 - 0.5 * Math.cos(Math.PI * p); // easeInOut
        const val = Math.round(target * eased);
        node.textContent = fmt === "plus" ? `${val}+` : `${val}`;
        if (p < 1) requestAnimationFrame(tick);
        else node.closest(".stat")?.classList.add("bump");
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          el.querySelectorAll("[data-count]").forEach(startCounter);
          if (!repeat) io.unobserve(el);
          // Kick timeline progress if present
          if (el.classList.contains("timeline")) el.classList.add("is-visible");
        } else if (repeat) {
          el.classList.remove("is-visible");
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -10% 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [repeat]);

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

/* ============== Tiny inline icons & avatar ============== */
const IconTarget = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...props}>
    <circle cx="12" cy="12" r="9" fill="currentColor" opacity=".15" />
    <circle cx="12" cy="12" r="5" fill="currentColor" opacity=".35" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);
const IconShield = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...props}>
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" fill="currentColor" />
  </svg>
);
const IconHandshake = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...props}>
    <path d="M8 12l3 3 5-5 4 4-6 6-7-7 3-3z" fill="currentColor" opacity=".9" />
    <path d="M2 12l5-5 3 3-5 5-3-3z" fill="currentColor" opacity=".45" />
  </svg>
);
const IconSpark = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...props}>
    <path d="M12 2l2.2 5.9L20 10l-5.8 2.1L12 18l-2.2-5.9L4 10l5.8-2.1L12 2z" fill="currentColor" />
  </svg>
);

function Avatar({ label = "CV", tone = "violet" }) {
  return <div className={`avatar tone-${tone}`} aria-hidden="true">{label}</div>;
}

export default function AboutPage() {
  const { theme, toggle } = useTheme();

  // Scroll-direction flag (optional, handy if you want header reacts to scroll)
  React.useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const dir = window.scrollY > lastY ? "down" : "up";
      document.documentElement.dataset.scrollDir = dir;
      lastY = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="app about-page">
      <Nav onToggle={toggle} theme={theme} />

      <main>
        {/* ========= Hero ========= */}
        <section className="about-hero container">
          <Reveal className="eyebrow" variant="fade-right">About us</Reveal>
          <Reveal as="h1" className="about-title anim-gradient" variant="fade-up">
            Human-realistic simulations for smarter teams
          </Reveal>
          <Reveal as="p" className="about-lead" variant="fade-up" delay={100}>
            We blend behavioral science with agent-based AI so organizations can forecast outcomes,
            reduce conflict, and make better decisions with human realism.
          </Reveal>
        </section>

        {/* ========= Story + Image ========= */}
        <section className="container grid-2 about-row">
          <Reveal className="card" variant="fade-right">
            <h2 className="section-title">Our Story</h2>
            <p>
              We started CogniVerse with a simple idea: most simulations assume rational actors,
              but real people have stress, habits, and emotions. We build agents that behave like
              people, so leaders can test strategies before they affect real teams.
            </p>
            <p>
              Today, companies use our simulations to preview collaboration styles, pressure points,
              and leadership outcomes—then roll out changes with confidence.
            </p>
          </Reveal>

          <Reveal className="card media" variant="fade-left">
            <div className="media-illus" aria-hidden="true">
              <div className="spark s1"></div>
              <div className="spark s2"></div>
              <div className="spark s3"></div>
            </div>
            <p className="media-caption">Where behavioral science meets AI.</p>
          </Reveal>
        </section>

        {/* ========= Mission & Values ========= */}
        <section className="container">
          <Reveal as="h2" className="section-title" variant="fade-up">Our Mission & Values</Reveal>
          <div className="grid-4">
            <Reveal className="card value" variant="fade-up">
              <div className="value-ic cyan"><IconTarget /></div>
              <h3>Clarity</h3>
              <p>Turn raw employee data into clear, actionable intelligence.</p>
            </Reveal>
            <Reveal className="card value" variant="fade-up" delay={80}>
              <div className="value-ic violet"><IconShield /></div>
              <h3>Integrity</h3>
              <p>Privacy-first design and transparent methods in every model.</p>
            </Reveal>
            <Reveal className="card value" variant="fade-up" delay={160}>
              <div className="value-ic pink"><IconSpark /></div>
              <h3>Impact</h3>
              <p>Insights that improve morale, reduce risk, and lift performance.</p>
            </Reveal>
            <Reveal className="card value" variant="fade-up" delay={240}>
              <div className="value-ic teal"><IconHandshake /></div>
              <h3>Collaboration</h3>
              <p>We co-design with customers so solutions fit real culture.</p>
            </Reveal>
          </div>
        </section>

        {/* ========= History ========= */}
        <section className="container">
          <Reveal className="card timeline" variant="fade-up">
            <h2 className="section-title">Our History</h2>
            <ol className="timeline-track">
              <li><span className="t-year">2017</span><span className="t-note">Prototype agents</span></li>
              <li><span className="t-year">2019</span><span className="t-note">Leadership models</span></li>
              <li><span className="t-year">2025</span><span className="t-note">Full simulation engine</span></li>
            </ol>
          </Reveal>
        </section>

        {/* ========= Leadership ========= */}
        <section className="container">
          <Reveal as="h2" className="section-title" variant="fade-up">Our Leadership</Reveal>
          <div className="grid-3">
            <Reveal className="card person" variant="fade-up">
              <Avatar label="JL" tone="violet" />
              <div>
                <h4>Jane Lee</h4>
                <p className="muted">CEO • Behavioral Scientist</p>
              </div>
            </Reveal>
            <Reveal className="card person" variant="fade-up" delay={80}>
              <Avatar label="RK" tone="cyan" />
              <div>
                <h4>Rahul Kumar</h4>
                <p className="muted">CTO • Simulation Systems</p>
              </div>
            </Reveal>
            <Reveal className="card person" variant="fade-up" delay={160}>
              <Avatar label="MS" tone="pink" />
              <div>
                <h4>Maria Santos</h4>
                <p className="muted">Head of Research</p>
              </div>
            </Reveal>
          </div>
        </section>

    
        {/* ========= Team ========= */}
        <section className="container">
        <Reveal as="h2" className="section-title" variant="fade-up">Meet the Team</Reveal>

        {/* use 4 columns so 8 members land as a tidy 4×2 grid */}
        <div className="grid-4 team">
            {[
            ["AK", "violet"], ["DT", "cyan"], ["SO", "pink"], ["HM", "teal"],
            ["YK", "violet"], ["NP", "cyan"], ["JW", "teal"], ["EL", "pink"],
            ].map(([label, tone], i) => (
            <Reveal key={i} className="card tiny" variant="fade-up" delay={i * 50}>
                <Avatar label={label} tone={tone} />
                <div>
                <strong>Team Member</strong>
                <p className="muted">Research &amp; Engineering</p>
                </div>
            </Reveal>
            ))}
        </div>
        </section>

        {/* ========= Culture ========= */}
        <section className="container grid-2 about-row">
          <Reveal className="card" variant="fade-right">
            <h2 className="section-title">Our Culture</h2>
            <p>
              We’re an interdisciplinary team—psychology, AI, and design—who bias toward useful,
              testable insights. We run small experiments, measure outcomes, and share what we learn.
            </p>
            <div className="stats">
              <div className="stat">
                <strong data-count="10" data-count-fmt="plus">0</strong>
                <span>Years in Research</span>
              </div>
              <div className="stat">
                <strong data-count="120" data-count-fmt="plus">0</strong>
                <span>Clients Served</span>
              </div>
              <div className="stat">
                <strong data-count="4">0</strong>
                <span>Offices Worldwide</span>
              </div>
            </div>
          </Reveal>

          <Reveal className="card media tall" variant="fade-left">
            <div className="culture-photo" aria-hidden="true" />
            <p className="media-caption">Curious, rigorous, kind.</p>
          </Reveal>
        </section>

        {/* ========= Global Presence ========= */}
        <section className="container">
          <Reveal className="card map-card" variant="fade-up">
            <h2 className="section-title">Global Presence</h2>
            <div className="map">
              <div className="dot d1"></div>
              <div className="dot d2"></div>
              <div className="dot d3"></div>
              <div className="dot d4"></div>
            </div>
            <div className="map-legend">
              <span>Yangon</span><span>Bangkok</span><span>Singapore</span><span>London</span>
            </div>
          </Reveal>
        </section>

        
        <section className="container">
        <Reveal className="card cta" variant="fade-up">
            <h3>Join our team</h3>
            <p>Want to help organizations make better, more human decisions?</p>

            <div className="cta-row">
            <a className="btn primary" href="/contact" aria-label="Go to Contact page">
                <span>Contact us</span>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 12h12l-5-5 1.4-1.4L21.8 14l-8.4 8.4L12 21l5-5H5z"/></svg>
            </a>

            <a className="btn ghost" href="/offer" aria-label="See plans">
                <span>See plans</span>
            </a>
            </div>
        </Reveal>
        </section>
      </main>

      <footer className="footer">
        <p>© CogniVerse</p>
      </footer>
    </div>
  );
}














// import React from "react";
// import Nav from "../components/Nav.jsx";

// /* Theme toggle (same pattern as other pages) */
// function useTheme() {
//   const [theme, setTheme] = React.useState(
//     () => localStorage.getItem("theme") || "light"
//   );
//   React.useEffect(() => {
//     document.documentElement.setAttribute("data-theme", theme);
//     localStorage.setItem("theme", theme);
//   }, [theme]);
//   const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));
//   return { theme, toggle };
// }

// /* Tiny in-file Reveal helper (reuses your global .reveal CSS) */
// function Reveal({ as: Tag = "div", variant = "fade-up", delay = 0, className = "", children, ...rest }) {
//   const ref = React.useRef(null);
//   React.useEffect(() => {
//     const el = ref.current;
//     if (!el) return;
//     const io = new IntersectionObserver(([e]) => {
//       if (e.isIntersecting) {
//         el.classList.add("is-visible");
//         io.disconnect();
//       }
//     }, { threshold: 0.18 });
//     io.observe(el);
//     return () => io.disconnect();
//   }, []);
//   return (
//     <Tag
//       ref={ref}
//       className={`reveal ${variant} ${className}`}
//       style={{ "--reveal-delay": `${delay}ms` }}
//       {...rest}
//     >
//       {children}
//     </Tag>
//   );
// }

// /* Simple inline icons */
// const IconTarget = (props) => (
//   <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...props}>
//     <circle cx="12" cy="12" r="9" fill="currentColor" opacity=".15" />
//     <circle cx="12" cy="12" r="5" fill="currentColor" opacity=".35" />
//     <circle cx="12" cy="12" r="2" fill="currentColor" />
//   </svg>
// );
// const IconShield = (props) => (
//   <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...props}>
//     <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" fill="currentColor" />
//   </svg>
// );
// const IconHandshake = (props) => (
//   <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...props}>
//     <path d="M8 12l3 3 5-5 4 4-6 6-7-7 3-3z" fill="currentColor" opacity=".9" />
//     <path d="M2 12l5-5 3 3-5 5-3-3z" fill="currentColor" opacity=".45" />
//   </svg>
// );
// const IconSpark = (props) => (
//   <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...props}>
//     <path d="M12 2l2.2 5.9L20 10l-5.8 2.1L12 18l-2.2-5.9L4 10l5.8-2.1L12 2z" fill="currentColor" />
//   </svg>
// );

// /* Gradient avatar with initials */
// function Avatar({ label = "CV", tone = "violet" }) {
//   return <div className={`avatar tone-${tone}`} aria-hidden="true">{label}</div>;
// }

// export default function AboutPage() {
//   const { theme, toggle } = useTheme();

//   return (
//     <div className="app about-page">
//       {/* Sticky site nav */}
//       <Nav onToggle={toggle} theme={theme} />

//       <main>
//         {/* ========= Hero ========= */}
//         <section className="about-hero container">
//           <Reveal className="eyebrow" variant="fade-right">About us</Reveal>
//           <Reveal as="h1" className="about-title anim-gradient" variant="fade-up">
//             Human-realistic simulations for smarter teams
//           </Reveal>
//           <Reveal as="p" className="about-lead" variant="fade-up" delay={100}>
//             We blend behavioral science with agent-based AI so organizations can forecast outcomes,
//             reduce conflict, and make better decisions with human realism.
//           </Reveal>
//         </section>

//         {/* ========= Story + Image ========= */}
//         <section className="container grid-2 about-row">
//           <Reveal className="card" variant="fade-right">
//             <h2 className="section-title">Our Story</h2>
//             <p>
//               We started CogniVerse with a simple idea: most simulations assume rational actors,
//               but real people have stress, habits, and emotions. We build agents that behave like
//               people, so leaders can test strategies before they affect real teams.
//             </p>
//             <p>
//               Today, companies use our simulations to preview collaboration styles, pressure points,
//               and leadership outcomes—then roll out changes with confidence.
//             </p>
//           </Reveal>

//           {/* Media card (keeps galaxy behind) */}
//           <Reveal className="card media" variant="fade-left">
//             <div className="media-illus" aria-hidden="true">
//               <div className="spark s1"></div>
//               <div className="spark s2"></div>
//               <div className="spark s3"></div>
//             </div>
//             <p className="media-caption">Where behavioral science meets AI.</p>
//           </Reveal>
//         </section>

//         {/* ========= Mission & Values ========= */}
//         <section className="container">
//           <Reveal as="h2" className="section-title" variant="fade-up">Our Mission & Values</Reveal>
//           <div className="grid-4">
//             <Reveal className="card value" variant="fade-up">
//               <div className="value-ic cyan"><IconTarget /></div>
//               <h3>Clarity</h3>
//               <p>Turn raw employee data into clear, actionable intelligence.</p>
//             </Reveal>
//             <Reveal className="card value" variant="fade-up" delay={80}>
//               <div className="value-ic violet"><IconShield /></div>
//               <h3>Integrity</h3>
//               <p>Privacy-first design and transparent methods in every model.</p>
//             </Reveal>
//             <Reveal className="card value" variant="fade-up" delay={160}>
//               <div className="value-ic pink"><IconSpark /></div>
//               <h3>Impact</h3>
//               <p>Insights that improve morale, reduce risk, and lift performance.</p>
//             </Reveal>
//             <Reveal className="card value" variant="fade-up" delay={240}>
//               <div className="value-ic teal"><IconHandshake /></div>
//               <h3>Collaboration</h3>
//               <p>We co-design with customers so solutions fit real culture.</p>
//             </Reveal>
//           </div>
//         </section>

//         {/* ========= History ========= */}
//         <section className="container">
//           <Reveal className="card timeline" variant="fade-up">
//             <h2 className="section-title">Our History</h2>
//             <ol className="timeline-track">
//               <li><span className="t-year">2017</span><span className="t-note">Prototype agents</span></li>
//               <li><span className="t-year">2019</span><span className="t-note">Leadership models</span></li>
//               <li><span className="t-year">2025</span><span className="t-note">Full simulation engine</span></li>
//             </ol>
//           </Reveal>
//         </section>

//         {/* ========= Leadership ========= */}
//         <section className="container">
//           <Reveal as="h2" className="section-title" variant="fade-up">Our Leadership</Reveal>
//           <div className="grid-3">
//             <Reveal className="card person" variant="fade-up">
//               <Avatar label="JL" tone="violet" />
//               <div>
//                 <h4>Jane Lee</h4>
//                 <p className="muted">CEO • Behavioral Scientist</p>
//               </div>
//             </Reveal>
//             <Reveal className="card person" variant="fade-up" delay={80}>
//               <Avatar label="RK" tone="cyan" />
//               <div>
//                 <h4>Rahul Kumar</h4>
//                 <p className="muted">CTO • Simulation Systems</p>
//               </div>
//             </Reveal>
//             <Reveal className="card person" variant="fade-up" delay={160}>
//               <Avatar label="MS" tone="pink" />
//               <div>
//                 <h4>Maria Santos</h4>
//                 <p className="muted">Head of Research</p>
//               </div>
//             </Reveal>
//           </div>
//         </section>

//         {/* ========= Team ========= */}
//         <section className="container">
//           <Reveal as="h2" className="section-title" variant="fade-up">Meet the Team</Reveal>
//           <div className="grid-6 team">
//             {[
//               ["AK", "violet"], ["DT", "cyan"], ["SO", "pink"],
//               ["HM", "teal"], ["YK", "violet"], ["NP", "cyan"],
//             ].map(([label, tone], i) => (
//               <Reveal key={i} className="card tiny" variant="fade-up" delay={i * 50}>
//                 <Avatar label={label} tone={tone} />
//                 <div>
//                   <strong>Team Member</strong>
//                   <p className="muted">Research &amp; Engineering</p>
//                 </div>
//               </Reveal>
//             ))}
//           </div>
//         </section>

//         {/* ========= Culture ========= */}
//         <section className="container grid-2 about-row">
//           <Reveal className="card" variant="fade-right">
//             <h2 className="section-title">Our Culture</h2>
//             <p>
//               We’re an interdisciplinary team—psychology, AI, and design—who bias toward useful,
//               testable insights. We run small experiments, measure outcomes, and share what we learn.
//             </p>
//             <div className="stats">
//               <div className="stat"><strong>10+</strong><span>Years in Research</span></div>
//               <div className="stat"><strong>120+</strong><span>Clients Served</span></div>
//               <div className="stat"><strong>4</strong><span>Offices Worldwide</span></div>
//             </div>
//           </Reveal>
//           <Reveal className="card media tall" variant="fade-left">
//             <div className="culture-photo" aria-hidden="true" />
//             <p className="media-caption">Curious, rigorous, kind.</p>
//           </Reveal>
//         </section>

//         {/* ========= Global Presence ========= */}
//         <section className="container">
//           <Reveal className="card map-card" variant="fade-up">
//             <h2 className="section-title">Global Presence</h2>
//             <div className="map">
//               <div className="dot d1"></div>
//               <div className="dot d2"></div>
//               <div className="dot d3"></div>
//               <div className="dot d4"></div>
//             </div>
//             <div className="map-legend">
//               <span>Yangon</span><span>Bangkok</span><span>Singapore</span><span>London</span>
//             </div>
//           </Reveal>
//         </section>

//         {/* ========= CTA ========= */}
//         <section className="container">
//           <Reveal className="card cta" variant="fade-up">
//             <h3>Join our team</h3>
//             <p>Want to help organizations make better, more human decisions?</p>
//             <div className="cta-row">
//               <a className="btn primary" href="/contact">Contact us</a>
//               <a className="btn ghost" href="/offer">See plans</a>
//             </div>
//           </Reveal>
//         </section>
//       </main>

//       <footer className="footer">
//         <p>© CogniVerse</p>
//       </footer>
//     </div>
//   );
// }
