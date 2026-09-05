import { eq, and, desc, inArray } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Context } from "#/trpc/context";
import { db } from "@/db";
import { submissions, campaigns, submissionMetrics } from "$";
import { create, list, listByCampaign, approve, reject } from "&/submission";
import { requireAdmin, requireCreator } from "#/trpc/middleware";
import { validatePostUrl } from "#/services/validation";
import { checkDuplicateSubmission } from "#/services/submission";
import {
  approveSubmissionSafe,
} from "#/services/approval";

type CreateInput = z.infer<typeof create>;
type ListInput = z.infer<typeof list>;
type ListByCampaignInput = z.infer<typeof listByCampaign>;
type ApproveInput = z.infer<typeof approve>;
type RejectInput = z.infer<typeof reject>;

export const submissionRouter = {
  create: requireCreator
    .input(create)
    .mutation(async ({ input, ctx }: { input: CreateInput; ctx: Context }) => {
      const campaign = await db
        .select({ platforms: campaigns.platforms, status: campaigns.status })
        .from(campaigns)
        .where(eq(campaigns.id, input.campaign))
        .limit(1);

      if (!campaign.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
      }

      if (campaign[0].status !== "active") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Campaign is not accepting submissions",
        });
      }

      if (!validatePostUrl(input.postUrl, campaign[0].platforms)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid post URL for campaign platforms",
        });
      }

      if (await checkDuplicateSubmission(input.campaign, input.postUrl)) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "URL already submitted to this campaign",
        });
      }

      return db
        .insert(submissions)
        .values({
          ...input,
          postURL: input.postUrl,
          creator: ctx.user?.id || "",
          status: "pending",
        })
        .returning();
    }),
  list: requireCreator.input(list).query(async ({ input, ctx }: { input: ListInput; ctx: Context }) => {
    const conditions = [eq(submissions.creator, ctx.user?.id || "")];

    if (input.status) {
      conditions.push(eq(submissions.status, input.status));
    }

    const rows = await db
      .select({
        id: submissions.id,
        campaign: submissions.campaign,
        campaignTitle: campaigns.title,
        postURL: submissions.postURL,
        platform: submissions.platform,
        status: submissions.status,
        rejectionReason: submissions.rejectionReason,
        created: submissions.created,
        payout: campaigns.payout,
      })
      .from(submissions)
      .innerJoin(campaigns, eq(submissions.campaign, campaigns.id))
      .where(and(...conditions));

    const ids = rows.map((row) => row.id);

    const latestMetrics = ids.length
      ? await db
          .selectDistinctOn([submissionMetrics.submission], {
            submission: submissionMetrics.submission,
            views: submissionMetrics.views,
          })
          .from(submissionMetrics)
          .where(inArray(submissionMetrics.submission, ids))
          .orderBy(submissionMetrics.submission, desc(submissionMetrics.date))
      : [];

    const viewsBySubmission = new Map(latestMetrics.map((metric) => [metric.submission, metric.views]));

    return rows.map(({ payout, ...row }) => {
      const views = viewsBySubmission.get(row.id) ?? 0;
      const earnings =
        row.status === "approved" || row.status === "paid"
          ? Math.floor(views / 1000) * payout
          : 0;

      return { ...row, views, earnings };
    });
  }),
  listByCampaign: requireAdmin.input(listByCampaign).query(async ({ input }: { input: ListByCampaignInput }) => {
    const conditions = [eq(submissions.campaign, input.campaign)];

    if (input.status) {
      conditions.push(eq(submissions.status, input.status));
    }

    return db
      .select()
      .from(submissions)
      .where(and(...conditions));
  }),
  approve: requireAdmin
    .input(approve)
    .mutation(async ({ input }: { input: ApproveInput }) => {
      const approved = await approveSubmissionSafe(input.id);

      if (!approved) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Approving this submission would exceed the campaign budget",
        });
      }

      return db
        .select()
        .from(submissions)
        .where(eq(submissions.id, input.id));
    }),
  reject: requireAdmin
    .input(reject)
    .mutation(async ({ input }: { input: RejectInput }) =>
      db
        .update(submissions)
        .set({
          status: "rejected",
          rejectionReason: input.rejectionReason,
          updated: new Date(),
        })
        .where(eq(submissions.id, input.id))
        .returning(),
    ),
};
