import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { submissions } from "$";

export async function checkDuplicateSubmission(
  campaignId: string,
  postUrl: string,
): Promise<boolean> {
  const existing = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(
      and(eq(submissions.campaign, campaignId), eq(submissions.postURL, postUrl)),
    )
    .limit(1);

  return existing.length > 0;
}
