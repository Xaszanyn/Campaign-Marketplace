const PLATFORM_PATTERNS: Record<string, RegExp> = {
  tiktok: /^https:\/\/(www\.)?tiktok\.com\/@[\w\.-]+\/video\/\d+/,
  instagram: /^https:\/\/(www\.)?instagram\.com\/p\/[\w\-]+\/?/,
  youtube: /^https:\/\/(www\.)?youtube\.com\/watch\?v=[\w\-]+/,
};

export function validatePostUrl(url: string, platforms: string[]): boolean {
  try {
    new URL(url);
  } catch {
    return false;
  }

  return platforms.some((platform) => {
    const pattern = PLATFORM_PATTERNS[platform.toLowerCase()];
    return pattern?.test(url);
  });
}
