import { eq, ilike, and, count, desc, inArray, SQL } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "@/db";
import { campaigns, submissions, submissionMetrics } from "$";
import { create, get, list, browse, update, delete_ } from "&/campaign";
import { requireAdmin, requireCreator } from "#/trpc/middleware";

type ListInput = z.infer<typeof list>;
type BrowseInput = z.infer<typeof browse>;
type GetInput = z.infer<typeof get>;
type CreateInput = z.infer<typeof create>;
type UpdateInput = z.infer<typeof update>;
type DeleteInput = z.infer<typeof delete_>;

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
  get: requireAdmin.input(get).query(async ({ input }: { input: GetInput }) => {
    const rows = await db.select().from(campaigns).where(eq(campaigns.id, input.id)).limit(1);

    if (!rows.length) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
    }

    return rows[0];
  }),
  overview: requireAdmin.input(get).query(async ({ input }: { input: GetInput }) => {
    const campaignRows = await db.select().from(campaigns).where(eq(campaigns.id, input.id)).limit(1);

    if (!campaignRows.length) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
    }

    const campaign = campaignRows[0];

    const approvedSubmissions = await db
      .select({ id: submissions.id })
      .from(submissions)
      .where(and(eq(submissions.campaign, input.id), eq(submissions.status, "approved")));

    const approvedIds = approvedSubmissions.map((row) => row.id);

    const latestMetrics = approvedIds.length
      ? await db
          .selectDistinctOn([submissionMetrics.submission], {
            submission: submissionMetrics.submission,
            views: submissionMetrics.views,
          })
          .from(submissionMetrics)
          .where(inArray(submissionMetrics.submission, approvedIds))
          .orderBy(submissionMetrics.submission, desc(submissionMetrics.date))
      : [];

    const totalApprovedViews = latestMetrics.reduce((sum, metric) => sum + metric.views, 0);
    const budgetSpent = Math.floor(totalApprovedViews / 1000) * campaign.payout;
    const budgetLeft = Math.max(0, campaign.budget - budgetSpent);

    const dailyRows = approvedIds.length
      ? await db
          .select({ date: submissionMetrics.date, views: submissionMetrics.views })
          .from(submissionMetrics)
          .where(inArray(submissionMetrics.submission, approvedIds))
      : [];

    const viewsByDate = new Map<string, number>();
    for (const row of dailyRows) {
      viewsByDate.set(row.date, (viewsByDate.get(row.date) ?? 0) + row.views);
    }

    const start = new Date(campaign.start);
    const today = new Date();
    const end = campaign.end && new Date(campaign.end) < today ? new Date(campaign.end) : today;

    const dailyViews: { date: string; views: number }[] = [];
    for (
      const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
      cursor <= end;
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    ) {
      const key = cursor.toISOString().split("T")[0];
      dailyViews.push({ date: key, views: viewsByDate.get(key) ?? 0 });
    }

    return {
      campaign,
      totalApprovedViews,
      budgetSpent,
      budgetLeft,
      dailyViews,
    };
  }),
  browse: requireCreator.input(browse).query(async ({ input }: { input: BrowseInput }) => {
    const conditions: SQL[] = [eq(campaigns.status, "active")];

    if (input.search) {
      conditions.push(ilike(campaigns.title, `%${input.search}%`));
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
  delete: requireAdmin.input(delete_).mutation(async ({ input }: { input: DeleteInput }) => {
    const existingSubmissions = await db
      .select({ id: submissions.id })
      .from(submissions)
      .where(eq(submissions.campaign, input.id))
      .limit(1);

    if (existingSubmissions.length) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Cannot delete a campaign that has submissions",
      });
    }

    const rows = await db.delete(campaigns).where(eq(campaigns.id, input.id)).returning();

    if (!rows.length) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Campaign not found" });
    }

    return rows;
  }),
};
