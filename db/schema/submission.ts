import { pgTable, text, uuid, timestamp, unique } from "drizzle-orm/pg-core";
import { platform, submissionStatus } from "$/enums";
import { campaigns } from "$/campaign";
import { users } from "$/user";

export const submissions = pgTable(
  "submission",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaign: uuid("campaign")
      .references(() => campaigns.id)
      .notNull(),
    creator: uuid("creator")
      .references(() => users.id)
      .notNull(),
    postURL: text("post_url").notNull(),
    platform: platform("platform").notNull(),
    status: submissionStatus("status").notNull(),
    rejectionReason: text("rejection_reason"),
    created: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("campaign_post_url_unique").on(table.campaign, table.postURL),
  ],
);
