import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const cookieName = "userId";
const secret = process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me";

const sign = (value: string) => createHmac("sha256", secret).update(value).digest("hex");

const serialize = (id: string) => `${id}.${sign(id)}`;

const verify = (value: string): string | null => {
  const separator = value.lastIndexOf(".");
  if (separator === -1) return null;

  const id = value.slice(0, separator);
  const signature = Buffer.from(value.slice(separator + 1), "hex");
  const expected = Buffer.from(sign(id), "hex");

  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) {
    return null;
  }

  return id;
};

export const getUser = async () => {
  const raw = (await cookies()).get(cookieName)?.value;
  return raw ? verify(raw) : null;
};

export const setUser = async (id: string) =>
  (await cookies()).set(cookieName, serialize(id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

export const clearUser = async () => (await cookies()).delete(cookieName);
