import { getUser } from "#/auth/session";

export const context = async () => ({
  user: await getUser(),
});

export type Context = Awaited<ReturnType<typeof context>>;
