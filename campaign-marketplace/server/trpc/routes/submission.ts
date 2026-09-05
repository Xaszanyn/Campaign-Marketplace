import { eq, and } from "drizzle-orm";
import { z } from "zod";
import type { Context } from "#/trpc/context";
import { db } from "@/db";
import { submissions, campaigns } from "$";
import { create, list, listByCampaign, approve, reject } from "&/submission";
import { requireAdmin, requireCreator } from "#/trpc/middleware";
import { validatePostUrl } from "#/services/validation";
import { checkDuplicateSubmission } from "#/services/submission";
import {
  approveSubmissionSafe,
} from "#/services/approval";

type CreateInput = z.infer<typeof create>;
type ListByCampaignInput = z.infer<typeof listByCampaign>;
type ApproveInput = z.infer<typeof approve>;
type RejectInput = z.infer<typeof reject>;

export const submissionRouter = {
  create: requireCreator
    .input(create)
    .mutation(async ({ input, ctx }: { input: CreateInput; ctx: Context }) => {
      const campaign = await db
        .select({ platforms: campaigns.platforms })
        .from(campaigns)
        .where(eq(campaigns.id, input.campaign))
        .limit(1);

      if (!campaign.length) {
        throw new Error("Campaign not found");
      }

      if (!validatePostUrl(input.postUrl, campaign[0].platforms)) {
        throw new Error("Invalid post URL for campaign platforms");
      }

      if (await checkDuplicateSubmission(input.campaign, input.postUrl)) {
        throw new Error("URL already submitted to this campaign");
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
  list: requireCreator.input(list).query(async ({ ctx }: { ctx: Context }) =>
    db
      .select()
      .from(submissions)
      .where(eq(submissions.creator, ctx.user?.id || "")),
  ),
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
        throw new Error("Insufficient budget");
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
