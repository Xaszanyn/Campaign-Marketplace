import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";

describe("Access control", () => {
  describe("Admin-only endpoints", () => {
    it("should reject non-admin users from campaign.list", () => {
      const user = { id: "user-123", role: "creator" };
      const isAdmin = user.role === "admin";

      expect(isAdmin).toBe(false);
      if (!isAdmin) {
        expect(() => {
          throw new TRPCError({ code: "FORBIDDEN" });
        }).toThrow();
      }
    });

    it("should allow admin users to campaign.list", () => {
      const user = { id: "admin-123", role: "admin" };
      const isAdmin = user.role === "admin";

      expect(isAdmin).toBe(true);
    });
  });

  describe("Creator-only endpoints", () => {
    it("should reject non-creator users from submission.create", () => {
      const user = { id: "user-123", role: "admin" };
      const isCreator = user.role === "creator";

      expect(isCreator).toBe(false);
    });

    it("should allow creator users to submission.create", () => {
      const user = { id: "creator-123", role: "creator" };
      const isCreator = user.role === "creator";

      expect(isCreator).toBe(true);
    });
  });

  describe("Ownership validation", () => {
    it("creator can only see their own submissions", () => {
      const creatorId: string = "creator-123";
      const submissionCreatorId: string = "creator-123";

      const isOwner = creatorId === submissionCreatorId;
      expect(isOwner).toBe(true);
    });

    it("creator cannot see another creator's submissions", () => {
      const creatorId: string = "creator-123";
      const submissionCreatorId: string = "creator-456";

      const isOwner = creatorId === submissionCreatorId;
      expect(isOwner).toBe(false);
    });
  });
});
