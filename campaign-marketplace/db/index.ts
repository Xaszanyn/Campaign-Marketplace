import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const user = process.env.POSTGRES_USER || "wayv_service";
const password = process.env.POSTGRES_PASSWORD || "Yvd@BKWZ=WR+Eh0H";
const host = process.env.POSTGRES_HOST || "localhost";
const port = process.env.POSTGRES_PORT || "5432";
const db_name = process.env.POSTGRES_DB || "campaign_marketplace";

export const db = drizzle(
  postgres(
    `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${db_name}`,
  ),
);
