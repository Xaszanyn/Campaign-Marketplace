import { eq } from "drizzle-orm";
import { procedure } from "#/trpc/init";
import { db } from "@/db";
import { users } from "$";
import { user } from "&/user";
import { setUser } from "#/auth/session";

export const userRouter = {
  list: procedure.query(() =>
    db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
      })
      .from(users),
  ),
  select: procedure.input(user).mutation(async ({ input }: any) => {
    const selectedUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);

    if (!selectedUser.length) {
      throw new Error("User Not Found");
    }

    await setUser(input.userId);

    return selectedUser[0];
  }),
};
