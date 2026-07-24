import "./admin.css";

export const metadata = {
  title: "Property Vault — Professional admin",
  robots: { index: false, follow: false },
};

// Auth is enforced per-page via requireUser() (the login page shares this
// layout). This layout provides fonts + the shell class only.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
      />
      <div className="pv-admin">{children}</div>
    </>
  );
}
