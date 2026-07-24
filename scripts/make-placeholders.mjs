// Generates branded placeholder pages for the marketing site.
// Each states which homepage buttons link to it. Replace a file with the
// real design when it's ready — same filename, no other wiring needed.
import { writeFileSync } from "node:fs";

const pages = {
  "product":      { title: "Product",        from: ["Nav → Product", "Footer → Overview"] },
  "features":     { title: "Features",       from: ["Footer → Features"] },
  "solutions":    { title: "Solutions",      from: ["Nav → Solutions", "Footer → For Architects / Engineers / Surveyors / Clients"], anchors: ["for-architects","for-engineers","for-surveyors","for-clients"] },
  "resources":    { title: "Resources",      from: ["Nav → Resources"] },
  "integrations": { title: "Integrations",   from: ["Nav → Integrations", "Footer → Integrations"] },
  "pricing":      { title: "Pricing",        from: ["Nav → Pricing", "Footer → Pricing"] },
  "about":        { title: "About Us",       from: ["Nav → About", "Footer → About Us"] },
  "login":        { title: "Log in",         from: ["Nav → Log in"], note: "Professional admin login will live at /admin when milestone 3 lands." },
  "book-a-demo":  { title: "Book a Demo",    from: ["Nav → Book a Demo", "Hero → Book a Demo", "Bottom CTA → Book a Demo"] },
  "get-started":  { title: "Get Started",    from: ["Hero → Get Started Free", "Bottom CTA → Start Free Trial"] },
  "help-center":  { title: "Help Center",    from: ["Footer → Help Center"] },
  "blog":         { title: "Blog",           from: ["Footer → Blog"] },
  "case-studies": { title: "Case Studies",   from: ["Footer → Case Studies"] },
  "guides":       { title: "Guides",         from: ["Footer → Guides"] },
  "security":     { title: "Security",       from: ["Footer → Security"] },
  "careers":      { title: "Careers",        from: ["Footer → Careers"] },
  "contact":      { title: "Contact",        from: ["Footer → Contact"] },
  "privacy":      { title: "Privacy Policy", from: ["Footer → Privacy Policy"] },
  "terms":        { title: "Terms of Service", from: ["Footer → Terms of Service"] },
  "cookies":      { title: "Cookies",        from: ["Footer → Cookies"] },
};

const page = (slug, p) => `<!DOCTYPE html>
<html lang="en-GB"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${p.title} — Property Vault</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{--navy:#0A1220;--gold:#C79B3D;--gold-bright:#E0BE72;--text:#EDF0F5;--muted:#8592A6;--line:#1D2A42;--panel:#101C31}
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:var(--navy);color:var(--text);font-family:'Inter',system-ui,sans-serif;min-height:100vh;display:flex;flex-direction:column}
  header{border-bottom:1px solid var(--line);padding:14px 24px;display:flex;align-items:center;gap:11px}
  header svg{width:30px;height:34px}
  header .n{font-size:.68rem;letter-spacing:.18em;text-transform:uppercase;color:#C3CBD7}
  header .n b{display:block;font-weight:700;letter-spacing:.26em;font-size:.85rem;color:#fff}
  main{flex:1;display:flex;align-items:center;justify-content:center;padding:48px 24px}
  .card{max-width:560px;text-align:center}
  .eyebrow{font-size:.68rem;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);margin-bottom:16px}
  h1{font-family:'Playfair Display',serif;font-weight:500;font-size:2.4rem;margin-bottom:14px}
  p{color:var(--muted);font-size:.95rem;line-height:1.6;margin-bottom:10px}
  .links{margin:20px auto 0;display:inline-block;text-align:left;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px 22px}
  .links .t{font-size:.66rem;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin-bottom:8px}
  .links li{color:#C3CBD7;font-size:.85rem;list-style:none;padding:2px 0}
  a.back{display:inline-block;margin-top:26px;color:var(--gold-bright);text-decoration:none;font-weight:600;font-size:.9rem}
  a.back:hover{text-decoration:underline}
</style></head><body>
<header>
  <svg viewBox="0 0 34 38" fill="none"><path d="M17 1.5l14.5 5.4v10.4c0 9.3-6.1 16.4-14.5 19.2C8.6 33.7 2.5 26.6 2.5 17.3V6.9L17 1.5z" stroke="#C79B3D" stroke-width="1.6"/><text x="17" y="23.5" text-anchor="middle" font-family="'Playfair Display',serif" font-size="13" fill="#C79B3D" font-weight="600">PV</text></svg>
  <span class="n">Property<b>Vault</b></span>
</header>
<main><div class="card">
  ${(p.anchors||[]).map(a=>`<span id="${a}"></span>`).join("")}
  <div class="eyebrow">Awaiting design</div>
  <h1>${p.title}</h1>
  <p>This page is being designed. The wiring is already live — drop the finished design in as <code>${slug}.html</code> and it appears here.</p>
  ${p.note?`<p>${p.note}</p>`:""}
  <div class="links"><div class="t">Linked from</div><ul>${p.from.map(f=>`<li>${f}</li>`).join("")}</ul></div>
  <br><a class="back" href="index.html">← Back to home</a>
</div></main>
</body></html>`;

for (const [slug, p] of Object.entries(pages)) {
  writeFileSync(`public/site/${slug}.html`, page(slug, p));
  console.log(`public/site/${slug}.html`);
}
