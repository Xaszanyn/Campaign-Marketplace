import { getUser } from "#/auth/session";
import { db } from "@/db";
import { users } from "$";
import { eq } from "drizzle-orm";

export const context = async () => {
  const userId = await getUser();
  let user = null;

  if (userId) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    user = result[0] || null;
  }

  return { user };
};

export type Context = Awaited<ReturnType<typeof context>>;
