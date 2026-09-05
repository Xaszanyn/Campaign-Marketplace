import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { role } from "$/enums";

export const users = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  role: role("role").notNull(),
});
