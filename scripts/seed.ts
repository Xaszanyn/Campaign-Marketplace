import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { users, campaigns, submissions, submissionMetrics } from "$";
import { platformList } from "$/enums";

type Platform = (typeof platformList)[number];

async function seed() {
  console.log("Seeding database...");

  const seedUsers = [
    {
      name: "Ekin Aslan",
      email: "ekinaslan.js@gmail.com",
      role: "admin" as const,
    },
    {
      name: "John Doe",
      email: "johndoe@gmail.com",
      role: "creator" as const,
    },
    {
      name: "Jane Doe",
      email: "janedoe@gmail.com",
      role: "creator" as const,
    },
  ];

  const seedCampaigns = [
    {
      title: "Summer Fashion Sale",
      platforms: ["instagram", "tiktok"] as Platform[],
      payout: 5000,
      budget: 1000000,
      status: "active" as const,
      start: new Date("2026-08-16"),
      end: new Date("2026-09-30"),
    },
    {
      title: "Tech Launch 2026",
      platforms: ["youtube"] as Platform[],
      payout: 7500,
      budget: 1500000,
      status: "active" as const,
      start: new Date("2026-09-05"),
      end: new Date("2026-10-15"),
    },
    {
      title: "Food & Lifestyle",
      platforms: ["instagram", "tiktok"] as Platform[],
      payout: 4000,
      budget: 800000,
      status: "active" as const,
      start: new Date("2026-09-05"),
      end: new Date("2026-09-25"),
    },
    {
      title: "Sports Challenge",
      platforms: ["tiktok", "youtube"] as Platform[],
      payout: 6000,
      budget: 1200000,
      status: "active" as const,
      start: new Date("2026-08-10"),
      end: new Date("2026-10-05"),
    },
    {
      title: "Holiday Gift Guide",
      platforms: ["instagram", "youtube"] as Platform[],
      payout: 5500,
      budget: 900000,
      status: "draft" as const,
      start: new Date("2026-10-01"),
      end: new Date("2026-11-15"),
    },
    {
      title: "Gaming Gear Unboxing",
      platforms: ["youtube", "tiktok"] as Platform[],
      payout: 8000,
      budget: 2000000,
      status: "active" as const,
      start: new Date("2026-09-05"),
      end: new Date("2026-10-20"),
    },
    {
      title: "Beauty Routine Series",
      platforms: ["instagram", "tiktok"] as Platform[],
      payout: 4500,
      budget: 700000,
      status: "paused" as const,
      start: new Date("2026-08-15"),
      end: new Date("2026-09-30"),
    },
    {
      title: "Home Workout Challenge",
      platforms: ["tiktok"] as Platform[],
      payout: 5000,
      budget: 600000,
      status: "active" as const,
      start: new Date("2026-09-05"),
      end: new Date("2026-10-10"),
    },
    {
      title: "Pet Product Spotlight",
      platforms: ["instagram", "youtube"] as Platform[],
      payout: 4000,
      budget: 500000,
      status: "completed" as const,
      start: new Date("2026-07-01"),
      end: new Date("2026-08-15"),
    },
    {
      title: "Travel Vlog Partnership",
      platforms: ["youtube"] as Platform[],
      payout: 9000,
      budget: 2500000,
      status: "active" as const,
      start: new Date("2026-09-05"),
      end: new Date("2026-11-01"),
    },
    {
      title: "Streetwear Drop",
      platforms: ["tiktok", "instagram"] as Platform[],
      payout: 6500,
      budget: 1100000,
      status: "draft" as const,
      start: new Date("2026-10-15"),
      end: new Date("2026-11-30"),
    },
    {
      title: "Coffee Brand Ambassador",
      platforms: ["instagram", "tiktok", "youtube"] as Platform[],
      payout: 5000,
      budget: 800000,
      status: "active" as const,
      start: new Date("2026-09-05"),
      end: new Date("2026-10-01"),
    },
  ];

  const seedSubmissionHistories = [
    {
      campaignTitle: "Summer Fashion Sale",
      creatorEmail: "johndoe@gmail.com",
      postUrl: "https://www.tiktok.com/@johndoe/video/7123456789012",
      platform: "tiktok" as Platform,
      startDate: "2026-08-16",
      endDate: "2026-09-05",
      base: 20,
      step: 7,
      mod: 40,
    },
    {
      campaignTitle: "Sports Challenge",
      creatorEmail: "johndoe@gmail.com",
      postUrl: "https://www.tiktok.com/@johndoe/video/5551234567",
      platform: "tiktok" as Platform,
      startDate: "2026-08-10",
      endDate: "2026-09-05",
      base: 15,
      step: 11,
      mod: 55,
    },
  ];

  function generateDailyMetrics(
    startDate: string,
    endDate: string,
    base: number,
    step: number,
    mod: number,
  ) {
    const days: { date: string; views: number; likes: number; comments: number }[] = [];
    const cursor = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T00:00:00.000Z`);
    let cumulativeViews = 0;

    while (cursor <= end) {
      const increment = base + ((cursor.getUTCDate() * step) % mod);
      cumulativeViews += increment;

      days.push({
        date: cursor.toISOString().split("T")[0],
        views: cumulativeViews,
        likes: Math.max(1, Math.floor(cumulativeViews / 8)),
        comments: Math.max(0, Math.floor(cumulativeViews / 40)),
      });

      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return days;
  }

  try {
    const userIdByEmail = new Map<string, string>();

    for (const user of seedUsers) {
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, user.email))
        .limit(1);

      if (existing.length) {
        userIdByEmail.set(user.email, existing[0].id);
        console.log(`↷ User already exists: ${user.email}`);
        continue;
      }

      const [inserted] = await db.insert(users).values(user).returning({ id: users.id });
      userIdByEmail.set(user.email, inserted.id);
      console.log(`✓ Created user: ${user.email}`);
    }

    const campaignIdByTitle = new Map<string, string>();

    for (const campaign of seedCampaigns) {
      const existing = await db
        .select({ id: campaigns.id })
        .from(campaigns)
        .where(eq(campaigns.title, campaign.title))
        .limit(1);

      if (existing.length) {
        campaignIdByTitle.set(campaign.title, existing[0].id);
        console.log(`↷ Campaign already exists: ${campaign.title}`);
        continue;
      }

      const [inserted] = await db.insert(campaigns).values(campaign).returning({ id: campaigns.id });
      campaignIdByTitle.set(campaign.title, inserted.id);
      console.log(`✓ Created campaign: ${campaign.title}`);
    }

    for (const history of seedSubmissionHistories) {
      const campaignId = campaignIdByTitle.get(history.campaignTitle);
      const creatorId = userIdByEmail.get(history.creatorEmail);

      if (!campaignId || !creatorId) continue;

      const existingSubmission = await db
        .select({ id: submissions.id })
        .from(submissions)
        .where(
          and(eq(submissions.campaign, campaignId), eq(submissions.postURL, history.postUrl)),
        )
        .limit(1);

      let submissionId: string;

      if (existingSubmission.length) {
        submissionId = existingSubmission[0].id;
        console.log(`↷ Submission already exists for: ${history.campaignTitle}`);
      } else {
        const [insertedSubmission] = await db
          .insert(submissions)
          .values({
            campaign: campaignId,
            creator: creatorId,
            postURL: history.postUrl,
            platform: history.platform,
            status: "approved",
          })
          .returning({ id: submissions.id });

        submissionId = insertedSubmission.id;
        console.log(`✓ Created approved submission for: ${history.campaignTitle}`);
      }

      const dailyMetrics = generateDailyMetrics(
        history.startDate,
        history.endDate,
        history.base,
        history.step,
        history.mod,
      );

      for (const day of dailyMetrics) {
        await db
          .insert(submissionMetrics)
          .values({
            submission: submissionId,
            date: day.date,
            views: day.views,
            likes: day.likes,
            comments: day.comments,
          })
          .onConflictDoNothing();
      }

      console.log(`✓ Backfilled ${dailyMetrics.length} days of metrics for: ${history.campaignTitle}`);
    }

    console.log("Seeding complete!");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed().then(() => process.exit(0));
