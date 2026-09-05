import { eq, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { submissions, submissionMetrics } from "$";

async function ingest() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDate = yesterday.toISOString().split("T")[0];

  console.log(`Ingesting metrics for ${yesterdayDate}...`);

  const approvedSubmissions = await db
    .select()
    .from(submissions)
    .where(eq(submissions.status, "approved"));

  console.log(`Found ${approvedSubmissions.length} approved submissions`);

  const errors: string[] = [];

  for (const submission of approvedSubmissions) {
    try {
      const existing = await db
        .select()
        .from(submissionMetrics)
        .where(
          sql`${submissionMetrics.submission} = ${submission.id} AND DATE(${submissionMetrics.date}) = ${yesterdayDate}`,
        )
        .limit(1);

      if (existing.length > 0) {
        console.log(`  Skipped ${submission.id} (already has metric for ${yesterdayDate})`);
        continue;
      }

      const previousMetric = await db
        .select()
        .from(submissionMetrics)
        .where(eq(submissionMetrics.submission, submission.id))
        .orderBy(desc(submissionMetrics.date))
        .limit(1);

      const previousViews = previousMetric[0]?.views || 0;
      const newViews = previousViews + Math.floor(Math.random() * 100) + 1;

      await db.insert(submissionMetrics).values({
        submission: submission.id,
        date: yesterdayDate,
        views: newViews,
        likes: Math.floor(Math.random() * 20),
        comments: Math.floor(Math.random() * 5),
      });

      console.log(
        `  Added metric for ${submission.id}: ${newViews} views (from ${previousViews})`,
      );
    } catch (error) {
      const errorMsg = `Error processing ${submission.id}: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.error(`  ${errorMsg}`);
    }
  }

  console.log(`\nIngestion complete. ${errors.length} error(s).`);
  if (errors.length > 0) {
    console.log("Errors:");
    errors.forEach((err) => console.log(`  - ${err}`));
    process.exit(1);
  }
}

ingest()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
