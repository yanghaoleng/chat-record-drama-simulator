import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { staticVisualAssetPaths } from "../src/shared/staticAssetCache";

describe("static visual asset cache manifest", () => {
  it("only contains local public assets that exist in the repo", () => {
    expect(staticVisualAssetPaths).toContain("/avatars/boy-soft-selfie.webp");
    expect(staticVisualAssetPaths).toContain("/avatars/jojo/jiaojiao.webp");
    expect(staticVisualAssetPaths).toContain("/memes/qface/20.webp");
    expect(staticVisualAssetPaths).toContain("/viral-assets/photos/phone-chat-blur.webp");
    expect(staticVisualAssetPaths).toContain("/jojo-assets/photos/company-meeting-blur.webp");
    expect(staticVisualAssetPaths).not.toContain("/jojo-assets/memes/jiaojiao-deadline.webp");

    for (const assetPath of staticVisualAssetPaths) {
      expect(assetPath.startsWith("/")).toBe(true);
      expect(assetPath.includes("github.com")).toBe(false);
      expect(existsSync(path.join(process.cwd(), "public", assetPath.slice(1)))).toBe(true);
    }
  });
});
