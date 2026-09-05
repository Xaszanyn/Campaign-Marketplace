import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Context } from "#/trpc/context";
import { db } from "@/db";
import { submissions, campaigns } from "$";
import { create, list, approve, reject } from "&/submission";
import { requireAdmin, requireCreator } from "#/trpc/middleware";
import { validatePostUrl } from "#/services/validation";
import { checkDuplicateSubmission } from "#/services/submission";
import {
  calculateEarnings,
  checkBudgetAvailable,
  maybeCampaignComplete,
} from "#/services/approval";

type CreateInput = z.infer<typeof create>;
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
  approve: requireAdmin
    .input(approve)
    .mutation(async ({ input }: { input: ApproveInput }) => {
      const submission = await db
        .select()
        .from(submissions)
        .where(eq(submissions.id, input.id))
        .limit(1);

      if (!submission.length) {
        throw new Error("Submission not found");
      }

      const earnings = await calculateEarnings(input.id);

      if (!(await checkBudgetAvailable(submission[0].campaign, earnings))) {
        throw new Error("Insufficient budget");
      }

      await db
        .update(submissions)
        .set({
          status: "approved",
          updated: new Date(),
        })
        .where(eq(submissions.id, input.id));

      await maybeCampaignComplete(submission[0].campaign);

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
