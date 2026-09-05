# Campaign Marketplace

### Live URL

[https://campaign-marketplace.vercel.app/](https://campaign-marketplace.vercel.app/)

### Setup

Requires Only Docker

```cmd
git clone https://github.com/Xaszanyn/Campaign-Marketplace.git

cd Campaign-Marketplace

docker compose up --build
```

### Concurrency Handling

Approving a submission runs inside a single database transaction that locks the campaign row for the duration of that approval. If two admins approve submissions on the same campaign at nearly the same time, the second approval has to wait until the first one finishes, and only then checks the remaining budget. This means the budget check always sees the up-to-date, committed number, not a value read before the other approval went through. If the budget is already used up by the time the second approval gets its turn, it fails instead of going through, so the total amount approved for a campaign can never exceed its budget, no matter how close together the approvals happen.

### Disregarded Features

The pnpm ingest script only processes a single day (yesterday) each time it runs, it does not backfill or reconcile a full metrics history for a submission, so any day it wasn't run for is simply missing rather than filled in retroactively. There is also no repeating/scheduled job (cron, queue, etc.) wired up to run it automatically; it has to be triggered by hand each day. Both were left out because the spec only asks for a script behind pnpm ingest that simulates one sync, not a scheduler, but in a real deployment this would need a daily trigger (cron, a scheduled worker, etc.) plus a way to backfill gaps if a day gets missed.

### Potential Improvements

One admin approving a submission does not immediately update another admin's already-open review screen. If a second admin is looking at a stale queue where a submission still shows as pending, and acts on it after someone else already approved or rejected it, the screen only reflects the outcome after the next refetch, so the displayed status can appear to flip or get overridden once the page catches up with the server. The
underlying transaction already guarantees only one approval can actually go through against the budget, so this is a stale-UI/cache-invalidation issue rather than a data-integrity one, but it's confusing in practice and rare enough that it hasn't been fixed yet. The fix would be invalidating or refetching the queue after any approve/reject mutation, or subscribing to live updates, so two admins working the same queue don't act on outdated information.

### AI Tooling

Used Claude Code mainly for three things:

- Project Setup
- Dockerising & Debugging The Docker Setup
- Front-End UI Component Usage
