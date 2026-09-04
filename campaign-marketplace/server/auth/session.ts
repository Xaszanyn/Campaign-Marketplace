import { cookies } from "next/headers";

const user = "userId";

export const getUser = async () => (await cookies()).get(user)?.value ?? null;

export const setUser = async (id: string) =>
  (await cookies()).set(user, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

export const clearUser = async () => (await cookies()).delete(user);
