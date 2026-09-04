import { router } from "#/trpc/init";
import { userRouter } from "#/trpc/routes/user";

export const appRouter = router({
  user: userRouter,
  campaign: {},
  submission: {},
});

export type AppRouter = typeof appRouter;
