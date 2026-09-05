import { eq } from "drizzle-orm";
import { db } from "@/db";
import { submissions } from "$";
import { create, list, approve, reject } from "&/submission";
import { requireAdmin, requireCreator } from "#/trpc/middleware";

export const submissionRouter = {
  create: requireCreator.input(create).mutation(async ({ input, ctx }: any) =>
    db
      .insert(submissions)
      .values({
        ...input,
        creator: ctx.user.id,
        status: "pending",
      })
      .returning(),
  ),
  list: requireCreator.input(list).query(async ({ ctx }: any) =>
    db
      .select()
      .from(submissions)
      .where(eq(submissions.creator, ctx.user.id)),
  ),
  approve: requireAdmin.input(approve).mutation(async ({ input }: any) =>
    db
      .update(submissions)
      .set({
        status: "approved",
        updated: new Date(),
      })
      .where(eq(submissions.id, input.id))
      .returning(),
  ),
  reject: requireAdmin.input(reject).mutation(async ({ input }: any) =>
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
