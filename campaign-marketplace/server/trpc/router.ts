import { router } from "#/trpc/init";
import { userRouter } from "#/trpc/routes/user";
import { campaignRouter } from "#/trpc/routes/campaign";
import { submissionRouter } from "#/trpc/routes/submission";

export const appRouter = router({
  user: userRouter,
  campaign: campaignRouter,
  submission: submissionRouter,
});

export type AppRouter = typeof appRouter;
