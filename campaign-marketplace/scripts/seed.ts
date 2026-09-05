import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

import { db } from "@/db";
import { users, campaigns } from "$";
import { platformList } from "$/enums";

type Platform = (typeof platformList)[number];

async function seed() {
  console.log("Seeding database...");

  // Ensure submission_status enum exists
  try {
    await db.execute(
      `CREATE TYPE IF NOT EXISTS "public"."submission_status" AS ENUM('pending', 'approved', 'rejected', 'paid');`,
    );
  } catch (err: any) {
    if (!err.message.includes("already exists")) {
      console.warn("Warning creating submission_status:", err.message);
    }
  }

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
      start: new Date("2026-09-05"),
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
      start: new Date("2026-09-05"),
      end: new Date("2026-10-05"),
    },
  ];

  try {
    for (const user of seedUsers) {
      await db.insert(users).values(user).onConflictDoNothing();
      console.log(`✓ Created user: ${user.email}`);
    }

    for (const campaign of seedCampaigns) {
      await db.insert(campaigns).values(campaign).onConflictDoNothing();
      console.log(`✓ Created campaign: ${campaign.title}`);
    }

    console.log("Seeding complete!");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed().then(() => process.exit(0));
