import { useState, useEffect, useRef } from "react";

function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const SERVICES = [
  { icon: "❄️", title: "AC Installation & Replacement", desc: "New system installs, split systems, central air — sized right for your space and budget.", badge: "Most Popular" },
  { icon: "🔧", title: "AC & Heating Repair", desc: "Fast diagnostics, honest pricing. We fix it right the first time — no upselling, no runaround." },
  { icon: "📋", title: "Preventive Maintenance", desc: "Seasonal tune-ups that extend system life, improve efficiency, and prevent costly breakdowns." },
  { icon: "🌡️", title: "Heat Pump Services", desc: "Installation, repair, and optimization of heat pump systems for year-round comfort." },
  { icon: "💨", title: "Air Quality & Duct Work", desc: "Duct cleaning, sealing, and air quality solutions — breathe cleaner, live healthier." },
  { icon: "⚡", title: "Emergency Service", desc: "System down on the hottest day of the year? We respond fast when you need it most.", badge: "24/7" },
];

const STATS = [
  { value: "10+", label: "Years Experience" },
  { value: "500+", label: "Happy Customers" },
  { value: "24/7", label: "Emergency Service" },
  { value: "100%", label: "Licensed & Insured" },
];

const WHY = [
  { icon: "🎯", title: "Upfront Pricing", desc: "No hidden fees. We quote before we start." },
  { icon: "⚡", title: "Same-Day Service", desc: "For most repairs, we're there today." },
  { icon: "🛡️", title: "Licensed & Insured", desc: "Fully licensed Florida HVAC contractors." },
  { icon: "🤝", title: "Family Owned", desc: "Local roots, personal accountability." },
];

export default function LandingPage() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const servicesReveal = useReveal();
  const whyReveal = useReveal();
  const ctaReveal = useReveal();

  useEffect(() => {
    setTimeout(() => setHeroLoaded(true), 80);
    const h = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700;900&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #0a0f1c; }
        .fa-btn-primary {
          display: inline-block; background: #2563eb; color: #fff;
          padding: 1rem 2.4rem; border-radius: 6px; text-decoration: none;
          font-family: 'Oswald', sans-serif; font-weight: 600; font-size: 1.05rem;
          letter-spacing: 0.08em; transition: all 0.2s;
          box-shadow: 0 0 30px rgba(37,99,235,0.35);
        }
        .fa-btn-primary:hover { background: #1d4ed8; transform: translateY(-2px); box-shadow: 0 8px 40px rgba(37,99,235,0.45); }
        .fa-btn-outline {
          display: inline-block; border: 1px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.8);
          padding: 1rem 2rem; border-radius: 6px; text-decoration: none;
          font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: 1rem; transition: all 0.2s;
        }
        .fa-btn-outline:hover { border-color: rgba(37,99,235,0.5); color: #60a5fa; }
        .service-card { background: #0d1117; padding: 2.2rem; position: relative; cursor: default;
          border-left: 3px solid transparent; transition: all 0.25s ease; }
        .service-card:hover { background: #131a2e; border-left-color: #2563eb; }
        .grid-divider { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5px; background: rgba(255,255,255,0.06); }
        .why-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: rgba(255,255,255,0.06); }
        .why-card { background: #0a0f1c; padding: 2rem; }
        @media (max-width: 768px) {
          .why-split { flex-direction: column !important; }
          .why-grid { grid-template-columns: 1fr; }
          .hero-btns { flex-direction: column; align-items: flex-start; }
          .stats-row { gap: 1.5rem !important; flex-wrap: wrap; }
          .nav-links { display: none; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        transition: "all 0.3s ease",
        background: navScrolled ? "rgba(10,15,28,0.95)" : "transparent",
        backdropFilter: navScrolled ? "blur(12px)" : "none",
        borderBottom: navScrolled ? "1px solid rgba(37,99,235,0.15)" : "none",
        padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <img src="/ferdair_professional_logo.png" alt="FerdAir" style={{ height: "36px", width: "auto", objectFit: "contain" }} />
        </div>
        <div className="nav-links" style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          {[["Services", "#services"], ["About", "#about"], ["Contact", "#contact"]].map(([label, href]) => (
            <a key={label} href={href} style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none",
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", letterSpacing: "0.04em", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#60a5fa")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            >{label}</a>
          ))}
          <a href="/book" className="fa-btn-primary" style={{ padding: "0.55rem 1.4rem", fontSize: "0.9rem", boxShadow: "none" }}>
            Book Now
          </a>
        </div>
        {/* Mobile Book Now */}
        <a href="/book" className="fa-btn-primary nav-mobile-btn" style={{ padding: "0.55rem 1.2rem", fontSize: "0.85rem", display: "none" }}>
          Book Now
        </a>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", position: "relative",
        overflow: "hidden", background: "#0a0f1c" }}>
        {/* grid bg */}
        <div style={{ position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px" }} />
        {/* glow */}
        <div style={{ position: "absolute", top: "15%", right: "-5%", width: "600px", height: "600px",
          borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "-5%", width: "500px", height: "500px",
          borderRadius: "50%", background: "radial-gradient(circle, rgba(0,200,255,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
        {/* big bg letters */}
        <div style={{ position: "absolute", right: "3%", top: "50%", transform: "translateY(-50%)",
          fontFamily: "'Oswald', sans-serif", fontSize: "clamp(180px, 26vw, 360px)", fontWeight: 900,
          color: "rgba(37,99,235,0.04)", userSelect: "none", letterSpacing: "-0.05em", lineHeight: 1 }}>
          FA
        </div>

        <div style={{ position: "relative", maxWidth: "1200px", margin: "0 auto", padding: "8rem 2rem 4rem", width: "100%" }}>
          {/* pill */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem",
            background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.3)",
            borderRadius: "100px", padding: "0.35rem 1rem", marginBottom: "2rem",
            opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.6s ease" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", display: "inline-block" }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "#60a5fa",
              letterSpacing: "0.08em", fontWeight: 600 }}>SERVING TAMPA BAY</span>
          </div>

          <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: "clamp(3rem, 7vw, 6.5rem)",
            fontWeight: 700, lineHeight: 1.0, color: "#fff", margin: "0 0 1.5rem",
            letterSpacing: "-0.02em", maxWidth: "700px",
            opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.7s ease 0.1s" }}>
            COMFORT,<br />
            <span style={{ color: "#2563eb" }}>CONTROLLED.</span>
          </h1>

          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(1rem, 1.5vw, 1.2rem)",
            color: "rgba(255,255,255,0.6)", maxWidth: "480px", lineHeight: 1.7, marginBottom: "2.5rem",
            opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.7s ease 0.2s" }}>
            Licensed HVAC experts delivering fast, honest service across Tampa Bay.
            AC installation, repair, maintenance — done right the first time.
          </p>

          <div className="hero-btns" style={{ display: "flex", gap: "1rem", flexWrap: "wrap",
            opacity: heroLoaded ? 1 : 0, transform: heroLoaded ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.7s ease 0.3s" }}>
            <a href="/book" className="fa-btn-primary">BOOK A SERVICE →</a>
            <a href="tel:+18135551234" className="fa-btn-outline">📞 Call Us Now</a>
          </div>

          {/* stats */}
          <div className="stats-row" style={{ display: "flex", gap: "3rem", marginTop: "5rem",
            opacity: heroLoaded ? 1 : 0, transition: "all 0.8s ease 0.5s" }}>
            {STATS.map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: "2rem", fontWeight: 700, color: "#2563eb", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: "0.3rem", letterSpacing: "0.04em" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "100px",
          background: "linear-gradient(transparent, #0d1117)", pointerEvents: "none" }} />
      </section>

      {/* ── SERVICES ── */}
      <section id="services" style={{ background: "#0d1117", padding: "6rem 2rem" }}>
        <div ref={servicesReveal.ref} style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ marginBottom: "4rem", opacity: servicesReveal.visible ? 1 : 0,
            transform: servicesReveal.visible ? "translateY(0)" : "translateY(30px)", transition: "all 0.7s ease" }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "#60a5fa",
              letterSpacing: "0.15em", fontWeight: 600, marginBottom: "0.75rem" }}>WHAT WE DO</p>
            <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: "clamp(2rem, 4vw, 3.5rem)",
              fontWeight: 700, color: "#fff", letterSpacing: "-0.01em", lineHeight: 1.1 }}>
              FULL-SERVICE HVAC,<br />
              <span style={{ color: "rgba(255,255,255,0.25)" }}>START TO FINISH.</span>
            </h2>
          </div>

          <div className="grid-divider">
            {SERVICES.map((s, i) => (
              <div key={s.title} className="service-card" style={{
                opacity: servicesReveal.visible ? 1 : 0,
                transform: servicesReveal.visible ? "translateY(0)" : "translateY(30px)",
                transition: `all 0.6s ease ${0.08 + i * 0.07}s`,
              }}>
                {s.badge && (
                  <span style={{ position: "absolute", top: "1.5rem", right: "1.5rem",
                    background: s.badge === "24/7" ? "rgba(0,200,100,0.15)" : "rgba(37,99,235,0.15)",
                    color: s.badge === "24/7" ? "#00c864" : "#60a5fa",
                    border: `1px solid ${s.badge === "24/7" ? "rgba(0,200,100,0.3)" : "rgba(37,99,235,0.3)"}`,
                    borderRadius: "100px", padding: "0.2rem 0.7rem", fontSize: "0.7rem",
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 700, letterSpacing: "0.06em" }}>
                    {s.badge}
                  </span>
                )}
                <div style={{ fontSize: "2rem", marginBottom: "1.25rem" }}>{s.icon}</div>
                <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: "1.1rem", fontWeight: 600,
                  color: "#fff", margin: "0 0 0.75rem", letterSpacing: "0.02em" }}>{s.title}</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem",
                  color: "rgba(255,255,255,0.5)", lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "3rem",
            opacity: servicesReveal.visible ? 1 : 0, transition: "all 0.7s ease 0.6s" }}>
            <a href="/book" style={{ display: "inline-block", border: "1px solid #2563eb", color: "#60a5fa",
              padding: "0.9rem 2.5rem", borderRadius: "6px", textDecoration: "none",
              fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: "1rem",
              letterSpacing: "0.08em", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#60a5fa"; }}>
              SCHEDULE YOUR SERVICE →
            </a>
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section id="about" style={{ background: "#0a0f1c", padding: "6rem 2rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: "700px", height: "700px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37,99,235,0.05) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div ref={whyReveal.ref} style={{ maxWidth: "1200px", margin: "0 auto", position: "relative" }}>
          <div className="why-split" style={{ display: "flex", gap: "5rem", alignItems: "center" }}>
            {/* left */}
            <div style={{ flex: 1, opacity: whyReveal.visible ? 1 : 0,
              transform: whyReveal.visible ? "translateX(0)" : "translateX(-30px)", transition: "all 0.7s ease" }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "#60a5fa",
                letterSpacing: "0.15em", fontWeight: 600, marginBottom: "0.75rem" }}>WHY FERDAIR</p>
              <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: "clamp(2rem, 3.5vw, 3rem)",
                fontWeight: 700, color: "#fff", margin: "0 0 1.5rem", lineHeight: 1.1 }}>
                THE HVAC COMPANY<br />
                <span style={{ color: "rgba(255,255,255,0.25)" }}>THAT ACTUALLY CALLS BACK.</span>
              </h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", color: "rgba(255,255,255,0.55)",
                lineHeight: 1.8, marginBottom: "2rem" }}>
                We're a family-owned HVAC company based in Tampa Bay. Every job gets a licensed
                technician, honest diagnostics, and a straightforward price — no commission-driven upselling.
              </p>
              <a href="/book" className="fa-btn-primary">GET A FREE QUOTE →</a>
            </div>
            {/* right */}
            <div style={{ flex: 1 }}>
              <div className="why-grid">
                {WHY.map((p, i) => (
                  <div key={p.title} className="why-card" style={{
                    opacity: whyReveal.visible ? 1 : 0,
                    transform: whyReveal.visible ? "translateY(0)" : "translateY(20px)",
                    transition: `all 0.6s ease ${0.15 + i * 0.1}s` }}>
                    <div style={{ fontSize: "1.6rem", marginBottom: "0.75rem" }}>{p.icon}</div>
                    <h4 style={{ fontFamily: "'Oswald', sans-serif", fontSize: "1rem", fontWeight: 600,
                      color: "#fff", margin: "0 0 0.5rem" }}>{p.title}</h4>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem",
                      color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: 0 }}>{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="contact" style={{ background: "#0d1117", padding: "6rem 2rem" }}>
        <div ref={ctaReveal.ref} style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center",
          opacity: ctaReveal.visible ? 1 : 0, transform: ctaReveal.visible ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.7s ease" }}>
          <div style={{ background: "rgba(37,99,235,0.07)", border: "1px solid rgba(37,99,235,0.18)",
            borderRadius: "16px", padding: "4rem 3rem" }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "#60a5fa",
              letterSpacing: "0.15em", fontWeight: 600, marginBottom: "1rem" }}>READY TO GET STARTED?</p>
            <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: "clamp(2.2rem, 5vw, 4rem)",
              fontWeight: 700, color: "#fff", margin: "0 0 1rem", lineHeight: 1.05 }}>
              YOUR COMFORT<br />IS ONE CLICK AWAY.
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", color: "rgba(255,255,255,0.5)",
              lineHeight: 1.7, marginBottom: "2.5rem" }}>
              Book online in under 2 minutes. Pick your service, choose a time, and a licensed
              technician will confirm your appointment.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <a href="/book" className="fa-btn-primary" style={{ fontSize: "1.1rem", padding: "1.1rem 3rem",
                boxShadow: "0 0 50px rgba(37,99,235,0.35)" }}>BOOK NOW →</a>
              <a href="tel:+18135551234" className="fa-btn-outline" style={{ padding: "1.1rem 2.5rem" }}>
                📞 (813) 555-1234
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0a0f1c", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "2rem 2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex",
          alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <img src="/ferdair_professional_logo.png" alt="FerdAir" style={{ height: "28px", width: "auto", objectFit: "contain" }} />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", color: "rgba(255,255,255,0.3)" }}>
            © {new Date().getFullYear()} FerdAir HVAC LLC · Tampa Bay, FL · Licensed & Insured
          </p>
          <a href="/book" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem",
            color: "#60a5fa", textDecoration: "none", fontWeight: 600 }}>Book Service →</a>
        </div>
      </footer>
    </>
  );
}
