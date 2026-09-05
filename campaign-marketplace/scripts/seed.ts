import { config } from "dotenv";
config();

import { db } from "@/db";
import { users } from "$";

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

  try {
    for (const user of seedUsers) {
      await db.insert(users).values(user).onConflictDoNothing();
      console.log(`✓ Created user: ${user.email}`);
    }
    console.log("Seeding complete!");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed().then(() => process.exit(0));
