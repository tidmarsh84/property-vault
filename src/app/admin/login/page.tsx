import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { loginAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  if (await getSessionUser()) redirect("/admin");
  return (
    <div className="login-shell">
      <div className="login-card">
        <svg width="34" height="38" viewBox="0 0 34 38" fill="none" aria-hidden="true">
          <path d="M17 1.5l14.5 5.4v10.4c0 9.3-6.1 16.4-14.5 19.2C8.6 33.7 2.5 26.6 2.5 17.3V6.9L17 1.5z" stroke="#C79B3D" strokeWidth="1.6" />
          <text x="17" y="23.5" textAnchor="middle" fontFamily="'Playfair Display',serif" fontSize="13" fill="#C79B3D" fontWeight="600">PV</text>
        </svg>
        <h1 className="serif">Professional admin</h1>
        <p className="sub">Sign in with your organisation account.</p>
        {searchParams.error && (
          <p className="err" style={{ marginBottom: 14 }}>
            That email or password wasn&apos;t recognised.
          </p>
        )}
        <form action={loginAction} className="stack">
          <label className="f">
            <span className="l">Email</span>
            <input type="email" name="email" required autoComplete="username" />
          </label>
          <label className="f">
            <span className="l">Password</span>
            <input type="password" name="password" required autoComplete="current-password" />
          </label>
          <button className="btn btn-gold" type="submit">Sign in</button>
        </form>
      </div>
    </div>
  );
}
