import { defaultAvatars } from "./avatarLibrary";
import { jojoProject } from "./jojoProject";
import { localMemeAssets } from "./memeLibrary";
import { jojoPhotoAssets, viralPhotoAssets } from "./photoLibrary";
import { publicAsset, resolvePublicAssetPath } from "./publicPath";
import { sampleProject } from "./sampleProject";
import type { DramaProject } from "./schema";

const assetCacheMessageType = "CACHE_STATIC_ASSETS";
const maxParallelWarmups = 5;

const staticUiAssetPaths = [
  "/wechat-ui/statusbar.png",
  "/wechat-ui/topbar.png",
  "/wechat-ui/inputbar.png",
  "/wechat-ui/bottombar.png",
  "/dingtalk-ui/topbar.png",
  "/dingtalk-ui/topbar-494757.png",
  "/dingtalk-ui/topbar-node-3-14.png",
  "/dingtalk-ui/inputbar.png",
  "/dingtalk-ui/inputbar-7b5c5c.png",
  "/site-icon.svg",
  "/favicon-viral.svg",
  "/favicon-jojo.svg"
];

function isLocalPublicPath(path: string | undefined): path is string {
  return Boolean(path && path.startsWith("/"));
}

function projectAssetPaths(project: DramaProject) {
  return [
    ...project.characters.map((character) => character.avatarUrl).filter(isLocalPublicPath),
    ...project.assets.map((asset) => asset.localPath).filter(isLocalPublicPath)
  ];
}

function unique(values: string[]) {
  return [...new Set(values)];
}

export const staticVisualAssetPaths = unique([
  ...staticUiAssetPaths,
  ...defaultAvatars.map((avatar) => avatar.url).filter(isLocalPublicPath),
  ...localMemeAssets.map((asset) => asset.localPath).filter(isLocalPublicPath),
  ...viralPhotoAssets.map((asset) => asset.localPath).filter(isLocalPublicPath),
  ...jojoPhotoAssets.map((asset) => asset.localPath).filter(isLocalPublicPath),
  ...projectAssetPaths(sampleProject),
  ...projectAssetPaths(jojoProject)
]);

function staticVisualAssetUrls() {
  return staticVisualAssetPaths.map((path) => resolvePublicAssetPath(path)).filter((path): path is string => Boolean(path));
}

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
};

let warmupStarted = false;

export function warmStaticVisualAssets() {
  if (warmupStarted || typeof window === "undefined") return;
  warmupStarted = true;

  const startWarmup = () => {
    const urls = staticVisualAssetUrls();
    void registerAssetCacheWorker(urls);
    void warmHttpImageCache(urls);
  };

  const requestIdleCallback = (window as IdleWindow).requestIdleCallback;
  if (requestIdleCallback) {
    requestIdleCallback(startWarmup, { timeout: 2000 });
    return;
  }

  window.setTimeout(startWarmup, 800);
}

async function registerAssetCacheWorker(urls: string[]) {
  if (!("serviceWorker" in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register(publicAsset("/asset-cache-sw.js"), {
      scope: import.meta.env.BASE_URL || "/"
    });
    const readyRegistration = await navigator.serviceWorker.ready;
    const worker = readyRegistration.active || registration.active || navigator.serviceWorker.controller;
    worker?.postMessage({ type: assetCacheMessageType, urls });
  } catch {
    // Static assets are still warmed through the normal HTTP cache below.
  }
}

async function warmHttpImageCache(urls: string[]) {
  let cursor = 0;

  const warmNext = async () => {
    while (cursor < urls.length) {
      const url = urls[cursor];
      cursor += 1;

      try {
        await fetch(url, {
          cache: "force-cache",
          credentials: "same-origin",
          mode: "same-origin"
        });
      } catch {
        // Missing optional assets should not interrupt the app boot.
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(maxParallelWarmups, urls.length) }, warmNext));
}
