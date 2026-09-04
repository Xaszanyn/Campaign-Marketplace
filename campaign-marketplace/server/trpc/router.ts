import { router } from "#/trpc/init";
import { userRouter } from "#/trpc/routes/user";
import { campaignRouter } from "#/trpc/routes/campaign";

export const appRouter = router({
  user: userRouter,
  campaign: campaignRouter,
  submission: {},
});

export type AppRouter = typeof appRouter;
