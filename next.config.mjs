/** @type {import('next').NextConfig} */

// Marketing site wiring: the designed homepage (and placeholder pages) live
// as static files in public/site/. `/` serves the homepage; every
// `something.html` link on it resolves to public/site/something.html, so
// finished designs drop in by filename with no code changes.
// record.html — the homepage's "view a live record" link — goes to the real
// seeded demo record. login.html goes to the professional admin.
const DEMO_RECORD_PATH =
  "/r/PV-GB-LDS-004512?k=demo-acacia-owner-6kQ0v9pXbT2wRzJd";

const nextConfig = {
  experimental: {
    // Native/CJS packages the server bundler must not rewrite.
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/site/index.html" },
        { source: "/index.html", destination: "/site/index.html" },
        { source: "/:page.html", destination: "/site/:page.html" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    return [
      {
        source: "/record.html",
        destination: DEMO_RECORD_PATH,
        permanent: false,
      },
      { source: "/login.html", destination: "/admin", permanent: false },
    ];
  },
};

export default nextConfig;
