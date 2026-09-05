"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/lib/trpc";
import { create } from "&/submission";
import { submissionStatusList } from "$/enums";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const submitSchema = create.omit({ campaign: true });

const statusVariant: Record<(typeof submissionStatusList)[number], "outline" | "default" | "destructive" | "secondary"> = {
  pending: "outline",
  approved: "default",
  rejected: "destructive",
  paid: "secondary",
};

export function CreatorClient() {
  const router = useRouter();
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const logoutMutation = trpc.user.logout.useMutation({
    onSuccess: () => router.push("/"),
  });

  const { data: response } = trpc.campaign.browse.useQuery({
    page: 1,
    limit: 100,
  });

  const { data: submissions = [], refetch: refetchSubmissions } = trpc.submission.list.useQuery({});

  const submitMutation = trpc.submission.create.useMutation({
    onSuccess: () => {
      setDialogOpen(false);
      reset();
      refetchSubmissions();
    },
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(submitSchema),
  });

  const campaigns = response?.data || [];

  const handleSubmitClip = (campaign: any) => {
    setSelectedCampaign(campaign);
    reset({ postUrl: "", platform: campaign.platforms[0] });
    submitMutation.reset();
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold">Creator Panel</h1>
            <p className="text-slate-500 mt-2">Browse active campaigns and track your submissions</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? "Logging out..." : "Log out"}
          </Button>
        </div>

        <Tabs defaultValue="campaigns">
          <TabsList>
            <TabsTrigger value="campaigns">Active Campaigns</TabsTrigger>
            <TabsTrigger value="submissions">My Submissions</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns">
            <div className="bg-white rounded-lg shadow mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Platforms</TableHead>
                    <TableHead>Payout / 1k views</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                        No active campaigns right now.
                      </TableCell>
                    </TableRow>
                  ) : (
                    campaigns.map((campaign: any) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.title}</TableCell>
                        <TableCell className="space-x-1">
                          {campaign.platforms.map((platform: string) => (
                            <Badge key={platform} variant="outline">
                              {platform}
                            </Badge>
                          ))}
                        </TableCell>
                        <TableCell>${(campaign.payout / 100).toFixed(2)}</TableCell>
                        <TableCell>${(campaign.budget / 100).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => handleSubmitClip(campaign)}>
                            Submit Clip
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="submissions">
            <div className="bg-white rounded-lg shadow mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Post URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Est. Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                        You haven&apos;t submitted any clips yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    submissions.map((submission: any) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">{submission.campaignTitle}</TableCell>
                        <TableCell>
                          <a
                            href={submission.postURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate block max-w-xs"
                          >
                            {submission.postURL}
                          </a>
                          {submission.status === "rejected" && submission.rejectionReason && (
                            <p className="text-xs text-red-600 mt-1">{submission.rejectionReason}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[submission.status as (typeof submissionStatusList)[number]]}>
                            {submission.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{submission.views.toLocaleString()}</TableCell>
                        <TableCell>${(submission.earnings / 100).toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Clip: {selectedCampaign?.title}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((data) =>
              submitMutation.mutate({ campaign: selectedCampaign.id, ...data }),
            )}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium">Post URL</label>
              <Input {...register("postUrl")} placeholder="https://www.tiktok.com/@you/video/123" />
              {errors.postUrl && (
                <p className="text-xs text-red-600 mt-1">{errors.postUrl.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Platform</label>
              <Select value={watch("platform")} onValueChange={(value) => setValue("platform", value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedCampaign?.platforms.map((platform: string) => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {submitMutation.isError && (
              <p className="text-sm text-red-600">{submitMutation.error.message}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} disabled={submitMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
