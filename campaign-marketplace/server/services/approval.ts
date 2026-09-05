import { eq, and, desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { submissions, submissionMetrics, campaigns } from "$";

type Executor = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

async function getApprovedTotalViews(executor: Executor, campaignId: string): Promise<number> {
  const approved = await executor
    .select({ id: submissions.id })
    .from(submissions)
    .where(and(eq(submissions.campaign, campaignId), eq(submissions.status, "approved")));

  const ids = approved.map((row) => row.id);
  if (!ids.length) return 0;

  const latestMetrics = await executor
    .selectDistinctOn([submissionMetrics.submission], { views: submissionMetrics.views })
    .from(submissionMetrics)
    .where(inArray(submissionMetrics.submission, ids))
    .orderBy(submissionMetrics.submission, desc(submissionMetrics.date));

  return latestMetrics.reduce((sum, row) => sum + row.views, 0);
}

async function getApprovedBudgetSpent(
  executor: Executor,
  campaignId: string,
  payoutPer1k: number,
): Promise<number> {
  const totalViews = await getApprovedTotalViews(executor, campaignId);
  return Math.floor(totalViews / 1000) * payoutPer1k;
}

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

  const budgetSpent = await getApprovedBudgetSpent(db, campaignId, campaign[0].payout);

  return budgetSpent + requiredAmount <= campaign[0].budget;
}

export async function maybeCampaignComplete(campaignId: string): Promise<void> {
  const campaign = await db
    .select({ budget: campaigns.budget, payout: campaigns.payout })
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!campaign.length) return;

  const budgetSpent = await getApprovedBudgetSpent(db, campaignId, campaign[0].payout);

  if (budgetSpent >= campaign[0].budget) {
    await db.update(campaigns).set({ status: "completed" }).where(eq(campaigns.id, campaignId));
  }
}

export async function approveSubmissionSafe(submissionId: string): Promise<boolean> {
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
      .for("update")
      .limit(1);

    if (!campaign.length) {
      throw new Error("Campaign not found");
    }

    if (submission[0].status !== "pending") {
      return false;
    }

    const budgetSpent = await getApprovedBudgetSpent(tx, submission[0].campaign, campaign[0].payout);

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

    if (budgetSpent + earnings >= campaign[0].budget) {
      await tx
        .update(campaigns)
        .set({ status: "completed" })
        .where(eq(campaigns.id, submission[0].campaign));
    }

    return true;
  });
}
