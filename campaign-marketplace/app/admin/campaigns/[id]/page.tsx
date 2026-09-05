import { redirect } from "next/navigation";
import { context } from "#/trpc/context";
import { CampaignDetailClient } from "./CampaignDetailClient";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user } = await context();

  if (!user) redirect("/");
  if (user.role !== "admin") redirect("/creator");

  const { id } = await params;

  return <CampaignDetailClient campaignId={id} />;
}
