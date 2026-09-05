import { eq, ilike, and, count, SQL } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { campaigns } from "$";
import { create, get, list, update } from "&/campaign";
import { requireAdmin } from "#/trpc/middleware";

type ListInput = z.infer<typeof list>;
type GetInput = z.infer<typeof get>;
type CreateInput = z.infer<typeof create>;
type UpdateInput = z.infer<typeof update>;

export const campaignRouter = {
  list: requireAdmin.input(list).query(async ({ input }: { input: ListInput }) => {
    const conditions: SQL[] = [];

    if (input.search) {
      conditions.push(ilike(campaigns.title, `%${input.search}%`));
    }

    if (input.status) {
      conditions.push(eq(campaigns.status, input.status));
    }

    const data = await db
      .select()
      .from(campaigns)
      .where(and(...conditions))
      .limit(input.limit)
      .offset((input.page - 1) * input.limit);

    const [{ total }] = await db
      .select({ total: count() })
      .from(campaigns)
      .where(and(...conditions));

    return {
      data,
      total,
      page: input.page,
      limit: input.limit,
    };
  }),
  get: requireAdmin
    .input(get)
    .query(async ({ input }: { input: GetInput }) =>
      db.select().from(campaigns).where(eq(campaigns.id, input.id)).limit(1),
    ),
  create: requireAdmin
    .input(create)
    .mutation(async ({ input }: { input: CreateInput }) =>
      db.insert(campaigns).values(input).returning(),
    ),
  update: requireAdmin.input(update).mutation(async ({ input }: { input: UpdateInput }) => {
    const { id, ...data } = input;

    return db
      .update(campaigns)
      .set(data)
      .where(eq(campaigns.id, id))
      .returning();
  }),
};
