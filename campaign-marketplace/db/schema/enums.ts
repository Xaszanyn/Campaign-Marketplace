import { pgEnum } from "drizzle-orm/pg-core";

export const role = pgEnum("role", ["admin", "creator"]);

export const platform = pgEnum("platform", ["instagram", "youtube", "tiktok"]);

export const campaignStatus = pgEnum("campaign_status", [
  "draft",
  "active",
  "paused",
  "completed",
]);

export const submissionStatus = pgEnum("submission_status", [
  "pending",
  "approved",
  "rejected",
  "paid",
]);
