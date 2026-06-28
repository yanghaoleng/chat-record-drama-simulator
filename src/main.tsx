import React from "react";
import ReactDOM from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import App from "./App";
import type { StoryPackage } from "./shared/linearStory";
import { warmStaticVisualAssets } from "./shared/staticAssetCache";
import "./styles/app.css";

declare const __APP_STORY_PACKAGE__: StoryPackage;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App storyPackage={__APP_STORY_PACKAGE__} />
    <Analytics />
  </React.StrictMode>
);

warmStaticVisualAssets();
