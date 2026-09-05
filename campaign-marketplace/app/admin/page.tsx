"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { campaignStatusList } from "$/enums";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

const campaignEditSchema = z.object({
  title: z.string().min(1, "Title is required"),
  payout: z.number().int().positive("Payout must be positive"),
  budget: z.number().int().positive("Budget must be positive"),
  status: z.enum(campaignStatusList),
});

export default function AdminPage() {
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [dialog, setDialog] = useState<"edit" | "delete" | "review" | null>(null);

  const { data: response, refetch } = trpc.campaign.list.useQuery({
    page: 1,
    limit: 100,
    search: "",
  });

  const deleteMutation = trpc.campaign.delete.useMutation({
    onSuccess: () => {
      setDialog(null);
      refetch();
    },
  });

  const updateMutation = trpc.campaign.update.useMutation({
    onSuccess: () => {
      setDialog(null);
      reset();
      refetch();
    },
  });

  const { data: submissions, refetch: refetchSubmissions } =
    trpc.submission.listByCampaign.useQuery(
      { campaign: selectedCampaign?.id || "", status: "pending" },
      { enabled: dialog === "review" && !!selectedCampaign?.id },
    );

  const reviewed = () => {
    refetchSubmissions();
    refetch();
  };

  const approveMutation = trpc.submission.approve.useMutation({ onSuccess: reviewed });

  const rejectMutation = trpc.submission.reject.useMutation({ onSuccess: reviewed });

  const { register, handleSubmit, reset, watch, setValue } = useForm({
    resolver: zodResolver(campaignEditSchema),
  });

  const campaigns = response?.data || [];

  const handleEdit = (campaign: any) => {
    setSelectedCampaign(campaign);
    reset({
      title: campaign.title,
      payout: campaign.payout,
      budget: campaign.budget,
      status: campaign.status,
    });
    setDialog("edit");
  };

  const handleDelete = (campaign: any) => {
    setSelectedCampaign(campaign);
    setDialog("delete");
  };

  const handleReview = (campaign: any) => {
    setSelectedCampaign(campaign);
    setDialog("review");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Admin Panel</h1>
          <Button>Create Campaign</Button>
        </div>

        <div className="bg-white rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign: any) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{campaign.status}</Badge>
                  </TableCell>
                  <TableCell>${campaign.budget / 100}</TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(campaign)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDelete(campaign)}>
                      Delete
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleReview(campaign)}>
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialog === "edit"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Campaign: {selectedCampaign?.title}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((data) =>
              updateMutation.mutate({
                id: selectedCampaign.id,
                platforms: selectedCampaign.platforms,
                start: selectedCampaign.start,
                end: selectedCampaign.end,
                ...data,
              }),
            )}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input {...register("title")} placeholder="Campaign title" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Payout (cents)</label>
                <Input type="number" {...register("payout", { valueAsNumber: true })} placeholder="5000" />
              </div>
              <div>
                <label className="text-sm font-medium">Budget (cents)</label>
                <Input type="number" {...register("budget", { valueAsNumber: true })} placeholder="1000000" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={watch("status")} onValueChange={(value) => setValue("status", value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {campaignStatusList.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialog(null)} disabled={updateMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={dialog === "delete"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to delete <strong>{selectedCampaign?.title}</strong>? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(null)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate({ id: selectedCampaign.id })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={dialog === "review"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Submissions: {selectedCampaign?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {submissions && submissions.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {submissions.map((submission: any) => (
                  <div key={submission.id} className="p-3 border rounded-lg space-y-2">
                    <div className="text-sm">
                      <p className="font-medium">URL: <a href={submission.postURL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{submission.postURL}</a></p>
                      <p className="text-slate-600">Platform: {submission.platform}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => approveMutation.mutate({ id: submission.id })}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={() => rejectMutation.mutate({ id: submission.id, rejectionReason: "Rejected by admin" })}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600">No pending submissions for this campaign.</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setDialog(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
