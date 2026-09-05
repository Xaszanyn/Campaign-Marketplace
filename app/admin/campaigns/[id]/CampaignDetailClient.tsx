"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DailyViewsChart } from "@/components/DailyViewsChart";

export function CampaignDetailClient({ campaignId }: { campaignId: string }) {
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  const {
    data: overview,
    isLoading: overviewLoading,
    error: overviewError,
    refetch: refetchOverview,
  } = trpc.campaign.overview.useQuery({ id: campaignId });

  const {
    data: pending = [],
    isLoading: pendingLoading,
    refetch: refetchPending,
  } = trpc.submission.listByCampaign.useQuery({
    campaign: campaignId,
    status: "pending",
  });

  const refreshAll = () => {
    refetchOverview();
    refetchPending();
  };

  const approveMutation = trpc.submission.approve.useMutation({ onSuccess: refreshAll });
  const rejectMutation = trpc.submission.reject.useMutation({
    onSuccess: (_, variables) => {
      setRejectReasons((prev) => {
        const next = { ...prev };
        delete next[variables.id];
        return next;
      });
      refreshAll();
    },
  });

  if (overviewLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <p className="text-slate-500">Loading campaign...</p>
      </div>
    );
  }

  if (overviewError || !overview) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center gap-3">
        <p className="text-slate-600">
          {overviewError?.data?.code === "NOT_FOUND"
            ? "Campaign not found."
            : "Something went wrong loading this campaign."}
        </p>
        <Link href="/admin" className="text-sm text-blue-600 hover:underline">
          ← Back to campaigns
        </Link>
      </div>
    );
  }

  const { campaign, totalApprovedViews, budgetSpent, budgetLeft, dailyViews } = overview;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <Link href="/admin" className="text-sm text-blue-600 hover:underline">
          ← Back to campaigns
        </Link>

        <div className="flex items-center justify-between mt-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">{campaign.title}</h1>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">{campaign.status}</Badge>
              {campaign.platforms.map((platform) => (
                <Badge key={platform} variant="secondary">
                  {platform}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Total Approved Views</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{totalApprovedViews.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Budget Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">${(budgetSpent / 100).toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-1">of ${(campaign.budget / 100).toFixed(2)} total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Budget Left</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">${(budgetLeft / 100).toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Daily Views</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyViewsChart data={dailyViews} />
          </CardContent>
        </Card>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold">Review Queue</h2>
            <p className="text-sm text-slate-500">Pending submissions for this campaign</p>
          </div>

          {pendingLoading ? (
            <p className="text-sm text-slate-500 text-center py-8">Loading submissions...</p>
          ) : pending.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No pending submissions.</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {pending.map((submission) => (
                <div key={submission.id} className="p-4 space-y-3">
                  <div className="text-sm">
                    <p className="font-medium">
                      <a
                        href={submission.postURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {submission.postURL}
                      </a>
                    </p>
                    <p className="text-slate-500">Platform: {submission.platform}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => approveMutation.mutate({ id: submission.id })}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      Approve
                    </Button>
                    <Input
                      placeholder="Rejection reason"
                      value={rejectReasons[submission.id] || ""}
                      onChange={(e) =>
                        setRejectReasons((prev) => ({ ...prev, [submission.id]: e.target.value }))
                      }
                      className="max-w-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() =>
                        rejectMutation.mutate({
                          id: submission.id,
                          rejectionReason: rejectReasons[submission.id]?.trim() || "",
                        })
                      }
                      disabled={
                        !rejectReasons[submission.id]?.trim() ||
                        approveMutation.isPending ||
                        rejectMutation.isPending
                      }
                    >
                      Reject
                    </Button>
                  </div>
                  {approveMutation.isError && approveMutation.variables?.id === submission.id && (
                    <p className="text-sm text-red-600">{approveMutation.error.message}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
