import { describe, it, expect } from "vitest";
import { validatePostUrl } from "../validation";

describe("URL validation", () => {
  describe("TikTok URLs", () => {
    it("accepts valid TikTok URL", () => {
      const url = "https://www.tiktok.com/@creator123/video/7123456789";
      expect(validatePostUrl(url, ["tiktok"])).toBe(true);
    });

    it("accepts TikTok URL without www", () => {
      const url = "https://tiktok.com/@creator123/video/7123456789";
      expect(validatePostUrl(url, ["tiktok"])).toBe(true);
    });

    it("rejects invalid TikTok URL", () => {
      const url = "https://tiktok.com/invalid";
      expect(validatePostUrl(url, ["tiktok"])).toBe(false);
    });
  });

  describe("Instagram URLs", () => {
    it("accepts valid Instagram URL", () => {
      const url = "https://www.instagram.com/p/ABC123def/";
      expect(validatePostUrl(url, ["instagram"])).toBe(true);
    });

    it("accepts Instagram URL without trailing slash", () => {
      const url = "https://instagram.com/p/ABC123def";
      expect(validatePostUrl(url, ["instagram"])).toBe(true);
    });
  });

  describe("YouTube URLs", () => {
    it("accepts valid YouTube URL", () => {
      const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      expect(validatePostUrl(url, ["youtube"])).toBe(true);
    });
  });

  describe("Multiple platforms", () => {
    it("validates against multiple allowed platforms", () => {
      const url = "https://tiktok.com/@creator/video/123";
      expect(validatePostUrl(url, ["instagram", "tiktok"])).toBe(true);
    });

    it("rejects URL not in allowed platforms", () => {
      const url = "https://tiktok.com/@creator/video/123";
      expect(validatePostUrl(url, ["instagram"])).toBe(false);
    });
  });

  describe("Invalid inputs", () => {
    it("rejects invalid URL format", () => {
      expect(validatePostUrl("not a url", ["tiktok"])).toBe(false);
    });

    it("rejects empty platforms array", () => {
      const url = "https://tiktok.com/@creator/video/123";
      expect(validatePostUrl(url, [])).toBe(false);
    });
  });
});
