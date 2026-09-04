import { pgEnum } from "drizzle-orm/pg-core";

export const platformList = ["instagram", "youtube", "tiktok"] as const;

export const campaignStatusList = [
  "draft",
  "active",
  "paused",
  "completed",
] as const;

export const role = pgEnum("role", ["admin", "creator"]);

export const platform = pgEnum("platform", platformList);

export const campaignStatus = pgEnum("campaign_status", campaignStatusList);

export const submissionStatus = pgEnum("submission_status", [
  "pending",
  "approved",
  "rejected",
  "paid",
]);
