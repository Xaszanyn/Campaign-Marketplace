import { eq, sum, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { submissions, submissionMetrics, campaigns } from "$";

export async function calculateEarnings(submissionId: string): Promise<number> {
  const latest = await db
    .select({ views: submissionMetrics.views })
    .from(submissionMetrics)
    .where(eq(submissionMetrics.submission, submissionId))
    .orderBy(desc(submissionMetrics.date))
    .limit(1);

  if (!latest.length) return 0;

  const submission = await db
    .select({ campaign: submissions.campaign })
    .from(submissions)
    .where(eq(submissions.id, submissionId))
    .limit(1);

  if (!submission.length) return 0;

  const campaign = await db
    .select({ payout: campaigns.payout })
    .from(campaigns)
    .where(eq(campaigns.id, submission[0].campaign))
    .limit(1);

  if (!campaign.length) return 0;

  const views = latest[0].views;
  const payoutPer1k = campaign[0].payout;

  return Math.floor(views / 1000) * payoutPer1k;
}

export async function checkBudgetAvailable(
  campaignId: string,
  requiredAmount: number,
): Promise<boolean> {
  const campaign = await db
    .select({ budget: campaigns.budget, payout: campaigns.payout })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!campaign.length) return false;

  const results = await db
    .select({ totalViews: sum(submissionMetrics.views) })
    .from(submissions)
    .innerJoin(submissionMetrics, eq(submissions.id, submissionMetrics.submission))
    .where(
      and(
        eq(submissions.campaign, campaignId),
        eq(submissions.status, "approved"),
      ),
    );

  const spent = results[0]?.totalViews || 0;
  const totalSpent = typeof spent === "string" ? parseInt(spent) : spent;
  const budgetSpent = Math.floor(totalSpent / 1000) * campaign[0].payout;

  return budgetSpent + requiredAmount <= campaign[0].budget;
}

export async function maybeCampaignComplete(
  campaignId: string,
): Promise<void> {
  const campaign = await db
    .select({ budget: campaigns.budget, payout: campaigns.payout })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!campaign.length) return;

  const results = await db
    .select({ totalViews: sum(submissionMetrics.views) })
    .from(submissions)
    .innerJoin(submissionMetrics, eq(submissions.id, submissionMetrics.submission))
    .where(
      and(
        eq(submissions.campaign, campaignId),
        eq(submissions.status, "approved"),
      ),
    );

  const spent = results[0]?.totalViews || 0;
  const totalSpent = typeof spent === "string" ? parseInt(spent) : spent;
  const budgetSpent = Math.floor(totalSpent / 1000) * campaign[0].payout;

  if (budgetSpent >= campaign[0].budget) {
    await db
      .update(campaigns)
      .set({ status: "completed" })
      .where(eq(campaigns.id, campaignId));
  }
}

export async function approveSubmissionSafe(
  submissionId: string,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const submission = await tx
      .select()
      .from(submissions)
      .where(eq(submissions.id, submissionId))
      .limit(1);

    if (!submission.length) {
      throw new Error("Submission not found");
    }

    const campaign = await tx
      .select({ budget: campaigns.budget, payout: campaigns.payout })
      .from(campaigns)
      .where(eq(campaigns.id, submission[0].campaign))
      .limit(1);

    if (!campaign.length) {
      throw new Error("Campaign not found");
    }

    const results = await tx
      .select({ totalViews: sum(submissionMetrics.views) })
      .from(submissions)
      .innerJoin(submissionMetrics, eq(submissions.id, submissionMetrics.submission))
      .where(
        and(
          eq(submissions.campaign, submission[0].campaign),
          eq(submissions.status, "approved"),
        ),
      );

    const spent = results[0]?.totalViews || 0;
    const totalSpent = typeof spent === "string" ? parseInt(spent) : spent;
    const budgetSpent = Math.floor(totalSpent / 1000) * campaign[0].payout;

    const latestMetric = await tx
      .select({ views: submissionMetrics.views })
      .from(submissionMetrics)
      .where(eq(submissionMetrics.submission, submissionId))
      .orderBy(desc(submissionMetrics.date))
      .limit(1);

    const views = latestMetric[0]?.views || 0;
    const earnings = Math.floor(views / 1000) * campaign[0].payout;

    if (budgetSpent + earnings > campaign[0].budget) {
      return false;
    }

    await tx
      .update(submissions)
      .set({
        status: "approved",
        updated: new Date(),
      })
      .where(eq(submissions.id, submissionId));

    const finalResults = await tx
      .select({ totalViews: sum(submissionMetrics.views) })
      .from(submissions)
      .innerJoin(submissionMetrics, eq(submissions.id, submissionMetrics.submission))
      .where(
        and(
          eq(submissions.campaign, submission[0].campaign),
          eq(submissions.status, "approved"),
        ),
      );

    const finalSpent = finalResults[0]?.totalViews || 0;
    const finalTotalSpent = typeof finalSpent === "string" ? parseInt(finalSpent) : finalSpent;
    const finalBudgetSpent = Math.floor(finalTotalSpent / 1000) * campaign[0].payout;

    if (finalBudgetSpent >= campaign[0].budget) {
      await tx
        .update(campaigns)
        .set({ status: "completed" })
        .where(eq(campaigns.id, submission[0].campaign));
    }

    return true;
  });
}
