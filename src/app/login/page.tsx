import { redirect } from "next/navigation";
import { currentUser, login } from "@/lib/session";
import { PvMark } from "@/components/record/icons";

async function doLogin(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const user = await login(email, password);
  if (!user) redirect("/login?error=1");
  redirect("/admin");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await currentUser()) redirect("/admin");
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy px-4">
      <form
        action={doLogin}
        className="w-full max-w-sm bg-panel border border-line rounded-xl p-8 flex flex-col gap-4"
      >
        <div className="flex items-center gap-3 mb-2">
          <PvMark className="w-8 h-9" />
          <div className="font-sans text-xs uppercase tracking-[0.2em] text-ink-soft">
            Property<b className="block text-sm tracking-[0.26em] text-white">Vault</b>
          </div>
        </div>
        <h1 className="font-serif text-xl text-ink">Professional sign in</h1>
        {error && (
          <p className="text-amber text-sm font-sans">Email or password not recognised.</p>
        )}
        <label className="font-sans text-xs uppercase tracking-wider text-muted">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            className="mt-1 w-full bg-navy-2 border border-line-soft rounded-lg px-3 py-2 text-sm text-ink normal-case tracking-normal focus:outline-none focus:border-gold"
          />
        </label>
        <label className="font-sans text-xs uppercase tracking-wider text-muted">
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full bg-navy-2 border border-line-soft rounded-lg px-3 py-2 text-sm text-ink normal-case tracking-normal focus:outline-none focus:border-gold"
          />
        </label>
        <button
          type="submit"
          className="mt-2 bg-gold text-[#171203] font-sans font-semibold text-sm rounded-lg py-2.5 hover:bg-gold-bright"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
