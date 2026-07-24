import { prisma } from "./db";
import { computeVerification, type VerificationResult } from "./verification";

/** Recompute an event's Verification Level from the rules config and cache it. */
export async function recomputeEventLevel(eventId: string): Promise<VerificationResult> {
  const event = await prisma.event.findUniqueOrThrow({
    where: { id: eventId },
    include: { professionals: true, stages: { include: { documents: true } } },
  });
  const result = computeVerification({
    origin: event.origin,
    historical: event.historical,
    professionals: event.professionals,
    stages: event.stages.map((s) => ({
      typeKey: s.typeKey,
      documents: s.documents.map((doc) => ({
        issuerClass: doc.issuerClass,
        docType: doc.docType,
        requirementKey: doc.requirementKey,
      })),
    })),
  });
  await prisma.event.update({
    where: { id: eventId },
    data: { verificationLevel: result.level },
  });
  return result;
}
