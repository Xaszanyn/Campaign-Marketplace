import { eq } from "drizzle-orm";
import { procedure } from "#/trpc/init";
import { db } from "@/db";
import { submissions } from "$";
import { create, list, approve, reject } from "&/submission";

export const submissionRouter = {
  create: procedure.input(create).mutation(async ({ input }) =>
    db
      .insert(submissions)
      .values({
        ...input,
        status: "pending",
      })
      .returning(),
  ),
  list: procedure
    .input(list)
    .query(async ({ input }) =>
      db
        .select()
        .from(submissions)
        .where(eq(submissions.creator, input.creator)),
    ),
  approve: procedure.input(approve).mutation(async ({ input }) =>
    db
      .update(submissions)
      .set({
        status: "approved",
        updated: new Date(),
      })
      .where(eq(submissions.id, input.id))
      .returning(),
  ),
  reject: procedure.input(reject).mutation(async ({ input }) =>
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
