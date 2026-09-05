import { pgTable, text, uuid, integer, timestamp } from "drizzle-orm/pg-core";
import { platform, campaignStatus } from "$/enums";

export const campaigns = pgTable("campaign", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  platforms: platform("platforms").array().notNull(),
  payout: integer("payout_per_1k_views").notNull(),
  budget: integer("total_budget").notNull(),
  status: campaignStatus("status").notNull(),
  start: timestamp("starts_at", { withTimezone: true }).notNull(),
  end: timestamp("ends_at", { withTimezone: true }),
});
