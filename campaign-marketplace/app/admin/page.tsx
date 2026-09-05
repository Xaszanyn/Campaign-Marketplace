import { redirect } from "next/navigation";
import { context } from "#/trpc/context";
import { AdminClient } from "./AdminClient";

export default async function AdminPage() {
  const { user } = await context();

  if (!user) redirect("/");
  if (user.role !== "admin") redirect("/creator");

  return <AdminClient />;
}
