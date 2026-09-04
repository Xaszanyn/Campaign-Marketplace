import { eq, ilike, and, count } from "drizzle-orm";
import { procedure } from "#/trpc/init";
import { db } from "@/db";
import { campaigns } from "$";
import { create, get, list, update } from "&/campaign";

export const campaignRouter = {
  list: procedure.input(list).query(async ({ input }) => {
    const conditions = [];

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
  get: procedure
    .input(get)
    .query(async ({ input }) =>
      db.select().from(campaigns).where(eq(campaigns.id, input.id)).limit(1),
    ),
  create: procedure
    .input(create)
    .mutation(async ({ input }) =>
      db.insert(campaigns).values(input).returning(),
    ),
  update: procedure.input(update).mutation(async ({ input }) => {
    const { id, ...data } = input;

    return db
      .update(campaigns)
      .set(data)
      .where(eq(campaigns.id, id))
      .returning();
  }),
};
