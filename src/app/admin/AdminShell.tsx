import Link from "next/link";
import { logoutAction } from "./actions";

export function AdminShell({
  user,
  children,
}: {
  user: { name: string; role: string; organisation: { name: string } };
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="topbar">
        <div className="tb-in">
          <Link href="/admin" style={{ textDecoration: "none" }}>
            <span className="brand">
              <svg width="26" height="29" viewBox="0 0 34 38" fill="none" aria-hidden="true">
                <path d="M17 1.5l14.5 5.4v10.4c0 9.3-6.1 16.4-14.5 19.2C8.6 33.7 2.5 26.6 2.5 17.3V6.9L17 1.5z" stroke="#C79B3D" strokeWidth="1.6" />
                <text x="17" y="23.5" textAnchor="middle" fontFamily="'Playfair Display',serif" fontSize="13" fill="#C79B3D" fontWeight="600">PV</text>
              </svg>
              <span className="name">Property<b>Vault</b></span>
            </span>
          </Link>
          <span className="tb-tag">{user.organisation.name}</span>
          <nav className="tb-nav">
            <Link href="/admin">Properties</Link>
            <Link href="/admin/analytics">Pilot analytics</Link>
            <span className="tb-user">
              {user.name} · {user.role}
            </span>
            <form action={logoutAction}>
              <button className="btn btn-ghost btn-sm" type="submit">Log out</button>
            </form>
          </nav>
        </div>
      </div>
      <div className="wrap">{children}</div>
    </>
  );
}
