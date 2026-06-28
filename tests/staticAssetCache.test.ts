import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { staticVisualAssetPaths } from "../src/shared/staticAssetCache";

describe("static visual asset cache manifest", () => {
  it("only contains local public assets that exist in the repo", () => {
    expect(staticVisualAssetPaths).toContain("/avatars/boy-soft-selfie.png");
    expect(staticVisualAssetPaths).toContain("/avatars/jojo/jiaojiao.png");
    expect(staticVisualAssetPaths).toContain("/memes/qface/20.png");
    expect(staticVisualAssetPaths).toContain("/viral-assets/photos/phone-chat-blur.png");
    expect(staticVisualAssetPaths).toContain("/jojo-assets/memes/jiaojiao-deadline.png");

    for (const assetPath of staticVisualAssetPaths) {
      expect(assetPath.startsWith("/")).toBe(true);
      expect(assetPath.includes("github.com")).toBe(false);
      expect(existsSync(path.join(process.cwd(), "public", assetPath.slice(1)))).toBe(true);
    }
  });
});
