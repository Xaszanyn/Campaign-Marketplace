import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "#/trpc/router";
import { context } from "#/trpc/context";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: context,
  });

export { handler as GET, handler as POST };
