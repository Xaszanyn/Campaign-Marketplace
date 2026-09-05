import { defineConfig } from "drizzle-kit";

const path = "./db";

export default defineConfig({
  schema: `${path}/schema/index.ts`,
  out: `${path}/migrations`,
  dialect: "postgresql",
  dbCredentials: {
    url: `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST || "localhost"}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`,
  },
});
