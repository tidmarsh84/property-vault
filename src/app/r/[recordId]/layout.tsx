export default function RecordLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Fonts for the record page (self-contained; no other third-party assets) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Inter:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
      />
      {children}
    </>
  );
}
