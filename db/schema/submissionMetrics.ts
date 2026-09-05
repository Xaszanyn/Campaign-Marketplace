import { date, integer, pgTable, unique, uuid } from "drizzle-orm/pg-core";
import { submissions } from "$/submission";

export const submissionMetrics = pgTable(
  "submission_metric",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submission: uuid("submission")
      .references(() => submissions.id)
      .notNull(),
    views: integer("views").notNull(),
    likes: integer("likes").notNull(),
    comments: integer("comments").notNull(),
    date: date("captured_at").notNull(),
  },
  (table) => [
    unique("submission_date_unique").on(table.submission, table.date),
  ],
);
