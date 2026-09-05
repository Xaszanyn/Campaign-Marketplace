import { redirect } from "next/navigation";
import { context } from "#/trpc/context";
import { CreatorClient } from "./CreatorClient";

export default async function CreatorPage() {
  const { user } = await context();

  if (!user) redirect("/");
  if (user.role !== "creator") redirect("/admin");

  return <CreatorClient />;
}
