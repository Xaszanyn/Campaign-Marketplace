import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_PORT, POSTGRES_DB } =
  process.env;

export const db = drizzle(
  postgres(
    `postgresql://${POSTGRES_USER}:${encodeURIComponent(
      POSTGRES_PASSWORD!,
    )}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}`,
  ),
);
