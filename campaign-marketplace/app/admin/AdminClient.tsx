"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { campaignStatusList, platformList } from "$/enums";
import { create as createCampaignSchema } from "&/campaign";
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

const PAGE_SIZE = 10;

export function AdminClient() {
  const router = useRouter();
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [dialog, setDialog] = useState<"create" | "edit" | "delete" | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const logoutMutation = trpc.user.logout.useMutation({
    onSuccess: () => router.push("/"),
  });

  const { data: response, refetch } = trpc.campaign.list.useQuery({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    status: statusFilter === "all" ? undefined : (statusFilter as (typeof campaignStatusList)[number]),
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

  const createMutation = trpc.campaign.create.useMutation({
    onSuccess: () => {
      setDialog(null);
      createForm.reset();
      refetch();
    },
  });

  const { register, handleSubmit, reset, watch, setValue } = useForm({
    resolver: zodResolver(campaignEditSchema),
  });

  const createForm = useForm({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      title: "",
      platforms: [] as (typeof platformList)[number][],
      payout: undefined as unknown as number,
      budget: undefined as unknown as number,
      status: "draft" as const,
      start: undefined as unknown as Date,
      end: null,
    },
  });

  const campaigns = response?.data || [];
  const total = response?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

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

  const handleOpenCreate = () => {
    createForm.reset({
      title: "",
      platforms: [],
      payout: undefined as unknown as number,
      budget: undefined as unknown as number,
      status: "draft",
      start: undefined as unknown as Date,
      end: null,
    });
    setDialog("create");
  };

  const togglePlatform = (platform: (typeof platformList)[number]) => {
    const current = createForm.watch("platforms") || [];
    createForm.setValue(
      "platforms",
      current.includes(platform) ? current.filter((p) => p !== platform) : [...current, platform],
      { shouldValidate: true },
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Admin Panel</h1>
          <div className="flex gap-2">
            <Button onClick={handleOpenCreate}>Create Campaign</Button>
            <Button
              variant="ghost"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? "Logging out..." : "Log out"}
            </Button>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <Input
            placeholder="Search by title..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="max-w-xs"
          />
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {campaignStatusList.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              {campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                    No campaigns match your filters.
                  </TableCell>
                </TableRow>
              ) : (
              campaigns.map((campaign: any) => (
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
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/admin/campaigns/${campaign.id}`}>Review</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
              )}
            </TableBody>
          </Table>

          <div className="flex justify-between items-center px-4 py-3 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              {total === 0 ? "0 results" : `Page ${page} of ${totalPages} · ${total} total`}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={dialog === "create"} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input {...createForm.register("title")} placeholder="Campaign title" />
              {createForm.formState.errors.title && (
                <p className="text-xs text-red-600 mt-1">{createForm.formState.errors.title.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Platforms</label>
              <div className="flex gap-2 mt-1">
                {platformList.map((platform) => {
                  const selected = (createForm.watch("platforms") || []).includes(platform);
                  return (
                    <Button
                      key={platform}
                      type="button"
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      onClick={() => togglePlatform(platform)}
                    >
                      {platform}
                    </Button>
                  );
                })}
              </div>
              {createForm.formState.errors.platforms && (
                <p className="text-xs text-red-600 mt-1">{createForm.formState.errors.platforms.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Payout (cents)</label>
                <Input
                  type="number"
                  {...createForm.register("payout", { valueAsNumber: true })}
                  placeholder="5000"
                />
                {createForm.formState.errors.payout && (
                  <p className="text-xs text-red-600 mt-1">{createForm.formState.errors.payout.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Budget (cents)</label>
                <Input
                  type="number"
                  {...createForm.register("budget", { valueAsNumber: true })}
                  placeholder="1000000"
                />
                {createForm.formState.errors.budget && (
                  <p className="text-xs text-red-600 mt-1">{createForm.formState.errors.budget.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start date</label>
                <Input
                  type="date"
                  {...createForm.register("start", {
                    setValueAs: (value) => (value ? new Date(value) : undefined),
                  })}
                />
                {createForm.formState.errors.start && (
                  <p className="text-xs text-red-600 mt-1">{createForm.formState.errors.start.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">End date (optional)</label>
                <Input
                  type="date"
                  {...createForm.register("end", {
                    setValueAs: (value) => (value ? new Date(value) : null),
                  })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={createForm.watch("status")}
                onValueChange={(value) => createForm.setValue("status", value as any)}
              >
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
            {createMutation.isError && (
              <p className="text-sm text-red-600">{createMutation.error.message}</p>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialog(null)} disabled={createMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
