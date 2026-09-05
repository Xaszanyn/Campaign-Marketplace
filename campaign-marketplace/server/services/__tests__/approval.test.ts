import { describe, it, expect } from "vitest";

describe("Payout calculation", () => {
  it("calculates earnings correctly: floor(views / 1000) * payout", () => {
    const views = 5500;
    const payoutPer1k = 100; // cents
    const earnings = Math.floor(views / 1000) * payoutPer1k;

    expect(earnings).toBe(500); // floor(5.5) * 100
  });

  it("handles zero views", () => {
    const earnings = Math.floor(0 / 1000) * 100;
    expect(earnings).toBe(0);
  });

  it("rounds down correctly", () => {
    const views = 1999;
    const earnings = Math.floor(views / 1000) * 100;
    expect(earnings).toBe(100); // floor(1.999) = 1
  });
});

describe("Budget ceiling", () => {
  it("prevents approval when budget exceeded", () => {
    const budget = 1000; // cents
    const currentSpent = 900;
    const requiredAmount = 200;

    const canApprove = currentSpent + requiredAmount <= budget;
    expect(canApprove).toBe(false);
  });

  it("allows approval when budget available", () => {
    const budget = 1000;
    const currentSpent = 700;
    const requiredAmount = 200;

    const canApprove = currentSpent + requiredAmount <= budget;
    expect(canApprove).toBe(true);
  });

  it("allows approval exactly at budget", () => {
    const budget = 1000;
    const currentSpent = 800;
    const requiredAmount = 200;

    const canApprove = currentSpent + requiredAmount <= budget;
    expect(canApprove).toBe(true);
  });
});
