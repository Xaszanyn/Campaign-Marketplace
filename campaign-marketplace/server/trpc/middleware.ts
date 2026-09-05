import { TRPCError } from "@trpc/server";
import { procedure } from "#/trpc/init";
import type { Context } from "#/trpc/context";

export const requireAuth = procedure.use(
  async ({ ctx, next }: { ctx: Context; next: any }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return next({ ctx: { ...ctx, user: ctx.user } });
  },
);

export const requireAdmin = procedure.use(
  async ({ ctx, next }: { ctx: Context; next: any }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  },
);

export const requireCreator = procedure.use(
  async ({ ctx, next }: { ctx: Context; next: any }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    if (ctx.user.role !== "creator") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  },
);
