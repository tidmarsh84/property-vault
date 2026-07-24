import Link from "next/link";
import "./landing.css";

// Platform home page — matched to the approved full-page marketing design.
// Product mockups (dashboard, phone timeline, feature cards) are illustrative
// UI built in HTML/CSS; the demo figures come from the design itself.

const GOLD = "#C79B3D";

function Icon({ d, size = 20, color = GOLD }: { d: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={d} stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const IC = {
  shield: "M12 3l7 2.6v4.9c0 4.5-2.9 8-7 10.5-4.1-2.5-7-6-7-10.5V5.6L12 3z",
  shieldTick: "M12 3l7 2.6v4.9c0 4.5-2.9 8-7 10.5-4.1-2.5-7-6-7-10.5V5.6L12 3zM8.8 12l2.3 2.3 4.1-4.6",
  tick: "M5 12.5l4.5 4.5L19 7.5",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3.2 2",
  doc: "M7 3h7l4 4v14H7V3zM14 3v4h4M10 12h5M10 16h5",
  lock: "M7 11V8a5 5 0 0110 0v3M6 11h12v9H6v-9zM12 15v2",
  layers: "M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5",
  globe: "M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.6 2.5 4 5.6 4 9s-1.4 6.5-4 9c-2.6-2.5-4-5.6-4-9s1.4-6.5 4-9z",
  people: "M9 12a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM3 20c.6-3 3-5 6-5s5.4 2 6 5M16 5.5a3 3 0 010 6M18 15.3c1.7.7 2.7 2 3 4.7",
  upload: "M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 20h16",
  search: "M10.5 17a6.5 6.5 0 100-13 6.5 6.5 0 000 13zM15.5 15.5L21 21",
  folder: "M3 6h6l2 2.5h10V20H3V6z",
  alert: "M12 3l10 17H2L12 3zM12 10v5m0 2.5v.5",
  infinity: "M8.5 15.5C6.6 15.5 5 13.9 5 12s1.6-3.5 3.5-3.5c2.9 0 4.1 7 7 7 1.9 0 3.5-1.6 3.5-3.5S17.4 8.5 15.5 8.5c-2.9 0-4.1 7-7 7z",
  phone: "M8 2.5h8a1.5 1.5 0 011.5 1.5v16A1.5 1.5 0 0116 21.5H8A1.5 1.5 0 016.5 20V4A1.5 1.5 0 018 2.5zM10.5 18.8h3",
  chart: "M4 20V10M10 20V4M16 20v-8M21 20H3",
  export: "M12 15V3m0 0L8 7m4-4l4 4M5 12v8h14v-8",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 100-6 3 3 0 000 6z",
  backup: "M12 3a8 8 0 018 8m0 0l2-2m-2 2l-2-2M12 19a8 8 0 01-8-8m0 0l-2 2m2-2l2 2",
  key: "M14 10a4 4 0 10-3.5 3.97L12 15.5h2v2h2v2h3v-3l-4.03-4.03A4 4 0 0014 10z",
  seal: "M12 14a5 5 0 100-10 5 5 0 000 10zM9 13l-2 8 5-2.6L17 21l-2-8",
  version: "M4 7h12v13H4V7zM8 3h12v13",
};

function PvShield({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.12} viewBox="0 0 34 38" fill="none" aria-hidden="true">
      <path
        d="M17 1.5l14.5 5.4v10.4c0 9.3-6.1 16.4-14.5 19.2C8.6 33.7 2.5 26.6 2.5 17.3V6.9L17 1.5z"
        stroke={GOLD}
        strokeWidth="1.6"
      />
      <text x="17" y="23.5" textAnchor="middle" fontFamily="var(--font-serif)" fontSize="13" fill={GOLD} fontWeight="600">
        PV
      </text>
    </svg>
  );
}

function Wordmark() {
  return (
    <Link href="/" className="wordmark">
      <PvShield size={30} />
      <span>
        <span className="wm-t">Property Vault</span>
        <span className="wm-s">The Permanent Record for Every Property</span>
      </span>
    </Link>
  );
}

/* ── hero dashboard mockup (illustrative UI, figures from the design) ── */
function DashboardMock() {
  return (
    <div className="dash" aria-hidden="true">
      <div className="db-top">
        <div className="db-brand">
          <PvShield size={16} />
          Property Vault
        </div>
        <div className="db-search">Search anything…</div>
        <div className="db-dots">
          <Icon d={IC.alert} size={12} color="#57637a" />
          <div className="db-av" />
        </div>
      </div>
      <div className="db-body">
        <div className="db-side">
          {["Overview", "Properties", "Timeline", "Documents", "Compliance", "Tasks", "Reports", "Insights", "Team", "Settings"].map(
            (s, i) => (
              <div key={s} className={`si${i === 0 ? " on" : ""}`}>
                {s}
              </div>
            ),
          )}
        </div>
        <div className="db-main">
          <div className="db-h">Dashboard</div>
          <div className="db-stats">
            <div className="db-stat">
              <div className="k">Total Properties</div>
              <div className="v">12,846</div>
              <div className="d">+8.5% vs last month</div>
            </div>
            <div className="db-stat" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div>
                <div className="k">Verification Score</div>
                <div className="d" style={{ marginTop: 4 }}>Excellent</div>
              </div>
              <div className="ring" style={{ marginLeft: "auto" }}>
                <b>92</b>
              </div>
            </div>
            <div className="db-stat">
              <div className="k">Active Projects</div>
              <div className="v">236</div>
              <div className="d">+12 vs last month</div>
            </div>
            <div className="db-stat">
              <div className="k">Documents</div>
              <div className="v">34,682</div>
              <div className="d">+146 vs last month</div>
            </div>
          </div>
          <div className="db-cols">
            <div className="db-card">
              <div className="t">Recent Activity</div>
              {[
                ["Planning approval received", "2h ago"],
                ["Structural report uploaded", "4h ago"],
                ["Building Control sign-off", "1d ago"],
                ["Electrical cert. uploaded", "1d ago"],
                ["New document added", "2d ago"],
              ].map(([t, w]) => (
                <div className="db-li" key={t}>
                  <span className="dot" />
                  {t}
                  <span className="when">{w}</span>
                </div>
              ))}
            </div>
            <div className="db-card db-tl">
              <div className="t">Property Timeline</div>
              {[
                ["Design Phase", "In progress", false],
                ["Planning", "Completed", false],
                ["Building Control", "In progress", false],
                ["Construction", "Upcoming", true],
                ["Handover", "Upcoming", true],
              ].map(([t, w, up]) => (
                <div className={`db-li${up ? " up" : ""}`} key={t as string}>
                  <span className="dot" />
                  {t}
                  <span className="when">{w}</span>
                </div>
              ))}
            </div>
            <div className="db-card db-health">
              <div className="t" style={{ alignSelf: "flex-start" }}>
                Property Health
              </div>
              <div className="ring" style={{ width: 54, height: 54 }}>
                <b>92</b>
              </div>
              <div className="db-bars">
                {[
                  ["Compliance", 96],
                  ["Documents", 92],
                  ["Maintenance", 89],
                ].map(([k, p]) => (
                  <div className="db-bar" key={k as string}>
                    <span style={{ width: 58 }}>{k}</span>
                    <span className="tr">
                      <span className="fl" style={{ width: `${p}%`, display: "block" }} />
                    </span>
                    <span>{p}%</span>
                  </div>
                ))}
                <div className="db-bar">
                  <span style={{ width: 58 }}>Risk Score</span>
                  <span className="tr" />
                  <span>Low</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── phone timeline mockup ── */
function PhoneMock() {
  return (
    <div className="phone" aria-hidden="true">
      <div className="db-brand" style={{ fontSize: ".5rem", display: "flex", alignItems: "center", gap: 6, color: "#fff" }}>
        <PvShield size={13} /> PROPERTY VAULT
      </div>
      <div className="ph-addr">123 Oakwood Drive</div>
      {[
        ["12 Apr 2024", "Planning Approved"],
        ["08 Apr 2024", "Building Control Sign-off"],
        ["22 Jan 2024", "Construction Completed"],
        ["14 Sep 2023", "Electrical Certificate"],
        ["10 Aug 2023", "Structural Report"],
      ].map(([d, t]) => (
        <div className="ph-ev" key={t}>
          <span className="nd" />
          <span>
            <span className="ed">{d}</span>
            <br />
            <span className="et">{t}</span>
          </span>
        </div>
      ))}
      <div className="ph-badge">
        <Icon d={IC.tick} size={12} color="#5fce9c" />
        All records verified
      </div>
    </div>
  );
}

const ENGINE = [
  { n: "01", t: "Upload", d: "Any document or data", icon: IC.upload },
  { n: "02", t: "Validate", d: "Check format & authenticity", icon: IC.doc },
  { n: "03", t: "Cross-check", d: "Verify with trusted sources", icon: IC.search },
  { n: "04", t: "Verify", d: "Human + AI verification", icon: IC.shieldTick },
  { n: "05", t: "Seal", d: "Tamper-proof & immutable", icon: IC.lock },
  { n: "06", t: "Permanent", d: "Accessible forever", icon: IC.infinity },
];

const PROBLEMS = [
  { icon: IC.folder, t: "Multiple folders and formats" },
  { icon: IC.version, t: "Version confusion and missing files" },
  { icon: IC.layers, t: "Information silos and delays" },
  { icon: IC.alert, t: "Risk of non-compliance" },
  { icon: IC.search, t: "No single source of truth" },
];

const SOLUTIONS = [
  "Centralised and secure",
  "Always up to date",
  "Verified and auditable",
  "Accessible from anywhere",
  "Built for the entire lifecycle",
];

const SECURITY = [
  { icon: IC.key, bt: "AES-256 Encryption", bd: "Data encrypted at rest and in transit" },
  { icon: IC.people, bt: "Role-Based Access", bd: "Granular permissions. Total control." },
  { icon: IC.backup, bt: "Automated Backups", bd: "Daily backups and disaster recovery" },
  { icon: IC.shieldTick, bt: "GDPR Compliant", bd: "Data protection by design" },
  { icon: IC.lock, bt: "Audit Trail Immutable", bd: "Every action permanently recorded" },
  { icon: IC.seal, bt: "ISO 27001 Certified", bd: "Information security management" },
];

const INTEGRATIONS = [
  { f: "ms365", t: "Microsoft 365" },
  { f: "xero", t: "Xero" },
  { f: "entra-id", t: "Microsoft Entra ID" },
  { f: "teamup", t: "TeamUp" },
  { f: "google-maps", t: "Google Maps" },
  { f: "power-bi", t: "Power BI" },
  { f: "adobe-acrobat", t: "Adobe Acrobat" },
];

export default function Home() {
  const demoMail = "mailto:book@propertyvault.ai?subject=Property%20Vault%20demo";
  const startMail = "mailto:hello@propertyvault.ai?subject=Getting%20started%20with%20Property%20Vault";

  return (
    <div className="lp">
      {/* ── header ── */}
      <header>
        <div className="wrap hrow">
          <Wordmark />
          <nav className="main" aria-label="Primary">
            <a href="#platform">Product</a>
            <a href="#solution">Solutions</a>
            <a href="#verification">Resources</a>
            <a href="#integrations">Integrations</a>
            <a href="#security">Pricing</a>
            <a href="#cta">About</a>
          </nav>
          <div className="hact">
            <Link href="/login" className="loginlink">
              Log in
            </Link>
            <a className="btn btn-gold" href={demoMail}>
              Book a Demo →
            </a>
          </div>
        </div>
      </header>

      {/* ── hero ── */}
      <section className="hero">
        <div className="wrap">
          <div>
            <div className="pill">Built for today. Designed for tomorrow.</div>
            <h1 className="serif">
              Every property has a story.
              <br />
              <span className="gold">Property Vault remembers it.</span>
            </h1>
            <p className="hero-sub">
              The permanent digital record for every property. Secure. Verified. Trusted for life.
            </p>
            <div className="hero-cta">
              <a className="btn btn-gold" href={startMail}>
                Get Started Free →
              </a>
              <a className="btn btn-ghost" href={demoMail}>
                Book a Demo
              </a>
            </div>
            <div className="minichips">
              {[
                { icon: IC.lock, t: "Secure by design" },
                { icon: IC.shieldTick, t: "Verified & trusted" },
                { icon: IC.infinity, t: "Built to last" },
              ].map((c) => (
                <span className="minichip" key={c.t}>
                  <Icon d={c.icon} size={15} />
                  {c.t}
                </span>
              ))}
            </div>
          </div>
          <DashboardMock />
        </div>
      </section>

      {/* ── industry strip ── */}
      <div className="logos">
        <div className="wrap">
          <div className="kicker">Trusted by industry leaders</div>
          <div className="logorow">
            {[
              ["microsoft", "Microsoft"],
              ["hm-land-registry", "HM Land Registry"],
              ["rics", "RICS"],
              ["labc", "LABC"],
              ["niceic", "NICEIC"],
              ["gas-safe", "Gas Safe Register"],
              ["iso-27001", "ISO 27001"],
            ].map(([f, alt]) => (
              <span className="logo" key={f}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/logos/${f}.png`} alt={alt} />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── problem / solution ── */}
      <section id="solution">
        <div className="wrap ps">
          <div>
            <div className="kicker left">The problem</div>
            <h2 className="serif">
              Information is everywhere.
              <br />
              Clarity is nowhere.
            </h2>
            <p className="sub">
              Scattered documents. Disconnected teams. Critical information lost in the chaos.
            </p>
            <div className="pslist">
              {PROBLEMS.map((p) => (
                <div className="psitem" key={p.t}>
                  <Icon d={p.icon} size={17} />
                  {p.t}
                </div>
              ))}
            </div>
          </div>
          <div className="ps-visual">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="stackimg" src="/images/problem-stack.jpg" alt="Scattered folders, drawings and certificates piled on a desk" />
            <div className="arrowbtn">→</div>
            <PhoneMock />
          </div>
          <div>
            <div className="kicker left">The solution</div>
            <h2 className="serif">
              One platform. One truth.
              <br />
              Everything connected.
            </h2>
            <p className="sub">
              Property Vault brings every document, event and insight together in one intelligent,
              permanent record.
            </p>
            <div className="pslist">
              {SOLUTIONS.map((s) => (
                <div className="psitem tick" key={s}>
                  <Icon d={IC.tick} size={17} color="#3FB37F" />
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── verification engine ── */}
      <section id="verification">
        <div className="wrap">
          <div className="engine">
            <div className="kicker left">The verification engine</div>
            <h2 className="serif">Built on trust. Engineered for confidence.</h2>
            <p className="sub">
              Our multi-layer verification process ensures every record is authentic, accurate and
              independently validated.
            </p>
            <div className="esteps">
              {ENGINE.map((s) => (
                <div className="estep" key={s.n}>
                  <div className="en">
                    <Icon d={s.icon} size={20} />
                  </div>
                  <div className="eo">{s.n}</div>
                  <div className="et">{s.t}</div>
                  <div className="ed">{s.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── feature cards ── */}
      <section id="platform">
        <div className="wrap">
          <div className="kicker">Everything you need. All in one place.</div>
          <div className="fgrid">
            <div className="fcard">
              <div className="fh">
                <Icon d={IC.doc} size={18} /> Complete Records
              </div>
              <div className="fmock">
                {["Planning Approval.pdf", "Structural Report.pdf", "Electrical Certificate.pdf", "Building Control.pdf", "Warranty Document.pdf"].map((d) => (
                  <div className="fm-doc" key={d}>
                    <Icon d={IC.doc} size={11} color="#8592A6" />
                    {d}
                  </div>
                ))}
              </div>
              <div className="fd">All documents, drawings, certificates and approvals in one secure hub.</div>
            </div>

            <div className="fcard">
              <div className="fh">
                <Icon d={IC.chart} size={18} /> Smart Insights
              </div>
              <div className="fmock fm-center">
                <div className="ring" style={{ width: 58, height: 58 }}>
                  <b>92</b>
                </div>
                <div className="fm-chart" style={{ width: "100%" }}>
                  {[34, 48, 40, 58, 52, 70, 64, 82, 76, 92].map((h, i) => (
                    <i key={i} style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className="fd">Verification levels and alerts help you stay ahead and make smarter decisions.</div>
            </div>

            <div className="fcard">
              <div className="fh">
                <Icon d={IC.people} size={18} /> Team Collaboration
              </div>
              <div className="fmock">
                {[
                  ["David P.", "Uploaded a document"],
                  ["Sarah M.", "Added a note"],
                  ["James L.", "Updated task"],
                  ["Emma R.", "Reviewed drawing"],
                ].map(([n, a]) => (
                  <div className="fm-act" key={n}>
                    <span className="avt" />
                    <b>{n}</b> {a}
                  </div>
                ))}
              </div>
              <div className="fd">Share, comment and collaborate seamlessly with your entire team.</div>
            </div>

            <div className="fcard">
              <div className="fh">
                <Icon d={IC.phone} size={18} /> Mobile Access
              </div>
              <div className="fmock fm-center">
                <div className="fm-phone">
                  <span className="fp-a">123 Oakwood Drive</span>
                  <div className="ring" style={{ width: 44, height: 44 }}>
                    <b>92</b>
                  </div>
                  <div className="fm-kv">
                    <span>Documents</span>
                    <span>42</span>
                  </div>
                </div>
              </div>
              <div className="fd">Access what you need, anytime, anywhere, from any device.</div>
            </div>

            <div className="fcard">
              <div className="fh">
                <Icon d={IC.export} size={18} /> Reports & Exports
              </div>
              <div className="fmock fm-center">
                <span className="fp-a" style={{ fontSize: ".6rem", color: "var(--text-soft)" }}>
                  Monthly Compliance Report
                </span>
                <div className="fm-chart" style={{ width: "100%" }}>
                  {[44, 56, 50, 66, 60, 76, 72, 88, 84, 100].map((h, i) => (
                    <i key={i} style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className="fd">Powerful reports and exports for clients, teams and stakeholders.</div>
            </div>

            <div className="fcard">
              <div className="fh">
                <Icon d={IC.layers} size={18} /> Future Ready
              </div>
              <div className="fmock fm-center">
                <div className="fm-layers">
                  <i />
                  <i style={{ opacity: 0.8 }} />
                  <i style={{ opacity: 0.6 }} />
                  <i style={{ opacity: 0.4 }} />
                </div>
              </div>
              <div className="fd">Built to evolve with technology, standards and your business.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── integrations ── */}
      <section id="integrations">
        <div className="wrap">
          <div className="kicker">Connect your entire ecosystem</div>
          <div className="introw">
            {INTEGRATIONS.map((i) => (
              <span className="integ" key={i.t}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/integrations/${i.f}.png`} alt="" />
                {i.t}
              </span>
            ))}
            <span className="integ">
              <small>and many more…</small>
            </span>
          </div>
        </div>
      </section>

      {/* ── security band ── */}
      <section id="security">
        <div className="wrap">
          <div className="sec">
            <div className="lockart">
              <Icon d={IC.lock} size={52} />
            </div>
            <div>
              <div className="kicker left">Security. Compliance. Peace of mind.</div>
              <h2 className="serif">
                Your data is protected.
                <br />
                Your trust is earned.
              </h2>
              <div className="badges">
                {SECURITY.map((b) => (
                  <div className="badge" key={b.bt}>
                    <Icon d={b.icon} size={22} />
                    <div className="bt">{b.bt}</div>
                    <div className="bd">{b.bd}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── skyline CTA ── */}
      <section className="cta" id="cta">
        <div className="wrap" style={{ position: "relative" }}>
          <div>
            <h2 className="serif" style={{ fontSize: "clamp(1.8rem,3.4vw,2.6rem)" }}>
              Every building has a history.
              <br />
              <span className="gold">Give it a permanent memory.</span>
            </h2>
            <p className="sub" style={{ color: "var(--text-soft)" }}>
              Join thousands of professionals who trust Property Vault to manage, protect and
              unlock the full potential of their property data.
            </p>
          </div>
          <div className="cta-actions">
            <a className="btn btn-gold" href={startMail}>
              Start Free Trial →
            </a>
            <a className="btn btn-ghost" href={demoMail}>
              Book a Demo
            </a>
          </div>
        </div>
        <div className="cta-assure">
          {["No credit card required", "14-day free trial", "Cancel anytime"].map((t) => (
            <span className="minichip" key={t}>
              <Icon d={IC.tick} size={14} />
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ── footer ── */}
      <footer>
        <div className="wrap frow">
          <div>
            <Wordmark />
          </div>
          <div className="fcol">
            <div className="ft">Product</div>
            <a href="#platform">Overview</a>
            <a href="#platform">Features</a>
            <a href="#integrations">Integrations</a>
            <a href="#cta">Pricing</a>
          </div>
          <div className="fcol">
            <div className="ft">Solutions</div>
            <a href="#solution">For Architects</a>
            <a href="#solution">For Engineers</a>
            <a href="#solution">For Surveyors</a>
            <a href="#solution">For Clients</a>
          </div>
          <div className="fcol">
            <div className="ft">Resources</div>
            <a href="#verification">Help Center</a>
            <a href="#verification">Blog</a>
            <a href="#verification">Case Studies</a>
            <a href="#verification">Guides</a>
          </div>
          <div className="fcol">
            <div className="ft">Company</div>
            <a href="#cta">About Us</a>
            <a href="#security">Security</a>
            <a href="#cta">Careers</a>
            <a href="mailto:hello@propertyvault.ai">Contact</a>
          </div>
          <div className="fdemo">
            <div className="fd-t">Ready to see Property Vault in action?</div>
            Book your personalised demo today.
            <div style={{ marginTop: 10 }}>
              <div className="fline">
                <Icon d={IC.doc} size={13} />
                <a href="mailto:book@propertyvault.ai">book@propertyvault.ai</a>
              </div>
              <div className="fline">
                <Icon d={IC.phone} size={13} />
                +44 20 3995 0950
              </div>
            </div>
            <div className="socials">
              <a href="#" aria-label="LinkedIn">in</a>
              <a href="#" aria-label="X">X</a>
              <a href="#" aria-label="YouTube">▶</a>
              <a href="#" aria-label="Instagram">◎</a>
            </div>
          </div>
        </div>
        <div className="wrap fbottom">
          <span>© 2026 Property Vault. All rights reserved.</span>
          <span>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookies</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
