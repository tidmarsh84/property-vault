import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPilotSummary, summaryToCsv } from "@/lib/pilot-stats";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return new NextResponse("Unauthorised", { status: 401 });
  const summary = await getPilotSummary(user.organisationId);
  return new NextResponse(summaryToCsv(summary), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="property-vault-pilot-summary.csv"`,
    },
  });
}
