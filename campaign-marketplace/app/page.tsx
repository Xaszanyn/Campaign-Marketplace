import { redirect } from "next/navigation";
import { context } from "#/trpc/context";
import { HomeClient } from "./HomeClient";

export default async function Home() {
  const { user } = await context();

  if (user) {
    redirect(user.role === "admin" ? "/admin" : "/creator");
  }

  return <HomeClient />;
}
