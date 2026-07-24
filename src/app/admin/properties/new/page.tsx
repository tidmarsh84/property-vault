import { requireUser } from "@/lib/auth";
import { AdminShell } from "../../AdminShell";
import { createPropertyAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function NewPropertyPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const user = await requireUser();
  return (
    <AdminShell user={user}>
      <div className="crumbs"><a href="/admin">Properties</a> / New</div>
      <h1 className="serif">New property record</h1>
      <p className="sub">
        The UPRN is the property&apos;s permanent identity — the address is display data.
        If lookup fails (e.g. a very new plot), give the reason instead.
      </p>

      {searchParams.error === "uprn" && (
        <p className="err" style={{ marginBottom: 16 }}>
          Provide a UPRN, or a reason why it&apos;s unavailable.
        </p>
      )}

      <form action={createPropertyAction} className="stack">
        <label className="f">
          <span className="l">Address line 1</span>
          <input type="text" name="addressLine1" required placeholder="14 Acacia Avenue" />
        </label>
        <label className="f">
          <span className="l">Address line 2 (optional)</span>
          <input type="text" name="addressLine2" />
        </label>
        <div className="grid-2">
          <label className="f">
            <span className="l">Town / city</span>
            <input type="text" name="city" required placeholder="Leeds" />
          </label>
          <label className="f">
            <span className="l">Postcode</span>
            <input type="text" name="postcode" required placeholder="LS17 6AB" />
          </label>
        </div>
        <div className="grid-3">
          <label className="f">
            <span className="l">Property type</span>
            <select name="propertyType">
              <option>Residential (semi-detached)</option>
              <option>Residential (detached)</option>
              <option>Residential (terraced)</option>
              <option>Residential (flat)</option>
              <option>Residential (bungalow)</option>
              <option>Other</option>
            </select>
          </label>
          <label className="f">
            <span className="l">Tenure</span>
            <select name="tenure">
              <option value="freehold">Freehold</option>
              <option value="leasehold">Leasehold</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="f">
            <span className="l">Construction year (optional)</span>
            <input type="number" name="constructionYear" min={1500} max={2100} />
          </label>
        </div>
        <div className="grid-2">
          <label className="f">
            <span className="l">UPRN</span>
            <input type="text" name="uprn" placeholder="e.g. 100012345678" />
            <span className="hint">
              Look it up at findmyaddress.co.uk — required unless a reason is given.
            </span>
          </label>
          <label className="f">
            <span className="l">UPRN unavailable — reason</span>
            <input type="text" name="uprnOverrideReason" placeholder="e.g. new plot, not yet registered" />
          </label>
        </div>
        <label className="f" style={{ maxWidth: 220 }}>
          <span className="l">Record ID area code</span>
          <input type="text" name="areaCode" placeholder="LDS" maxLength={3} />
          <span className="hint">Forms PV-GB-XXX-000000. Defaults from the postcode.</span>
        </label>
        <div>
          <button className="btn btn-gold" type="submit">Create record</button>
        </div>
      </form>
    </AdminShell>
  );
}
