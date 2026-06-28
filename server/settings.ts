import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { DATA_DIR, SETTINGS_PATH } from "./paths";

const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";

const storedDeepSeekSchema = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  model: z.string().optional()
});

const storedSettingsSchema = z.object({
  deepseek: storedDeepSeekSchema.default({})
});

const updateDeepSeekSchema = z.object({
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  model: z.string().optional()
});

type StoredSettings = z.infer<typeof storedSettingsSchema>;

export type DeepSeekSource = "saved" | "env" | "none";

export type DeepSeekRuntimeConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  source: DeepSeekSource;
};

export type DeepSeekSettingsView = {
  hasApiKey: boolean;
  apiKeyPreview: string;
  baseUrl: string;
  model: string;
  source: DeepSeekSource;
};

function emptySettings(): StoredSettings {
  return { deepseek: {} };
}

async function readSettings(): Promise<StoredSettings> {
  try {
    const raw = await readFile(SETTINGS_PATH, "utf8");
    return storedSettingsSchema.parse(JSON.parse(raw));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return emptySettings();
    }
    throw error;
  }
}

async function writeSettings(settings: StoredSettings) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(SETTINGS_PATH, `${JSON.stringify(settings, null, 2)}\n`, { mode: 0o600 });
}

function cleanOptional(value: string | undefined): string | undefined {
  const next = value?.trim();
  return next ? next : undefined;
}

function normalizeBaseUrl(value: string | undefined): string | undefined {
  const next = cleanOptional(value);
  if (!next) return undefined;

  const parsed = new URL(next);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("DeepSeek Base URL must start with http:// or https://");
  }
  return next.replace(/\/+$/, "");
}

function maskApiKey(apiKey: string): string {
  if (!apiKey) return "";
  if (apiKey.length <= 10) return "已配置";
  return `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}`;
}

export async function getDeepSeekConfig(): Promise<DeepSeekRuntimeConfig> {
  const settings = await readSettings();
  const useSavedSettings = process.env.USE_SAVED_DEEPSEEK_SETTINGS === "1";
  const savedKey = useSavedSettings ? cleanOptional(settings.deepseek.apiKey) : undefined;
  const envKey = cleanOptional(process.env.DEEPSEEK_API_KEY);
  const apiKey = envKey || savedKey || "";
  const baseUrl = normalizeBaseUrl(process.env.DEEPSEEK_BASE_URL) || DEFAULT_DEEPSEEK_BASE_URL;
  const model = cleanOptional(process.env.DEEPSEEK_MODEL) || DEFAULT_DEEPSEEK_MODEL;

  return {
    apiKey,
    baseUrl,
    model,
    source: envKey ? "env" : savedKey ? "saved" : "none"
  };
}

export async function getDeepSeekSettingsView(): Promise<DeepSeekSettingsView> {
  const config = await getDeepSeekConfig();
  return {
    hasApiKey: Boolean(config.apiKey),
    apiKeyPreview: maskApiKey(config.apiKey),
    baseUrl: config.baseUrl,
    model: config.model,
    source: config.source
  };
}

export async function updateDeepSeekSettings(body: unknown): Promise<DeepSeekSettingsView> {
  const update = updateDeepSeekSchema.parse(body);
  const settings = await readSettings();
  const next = { ...settings.deepseek };

  if ("apiKey" in update) {
    const apiKey = cleanOptional(update.apiKey);
    if (apiKey) {
      next.apiKey = apiKey;
    } else {
      delete next.apiKey;
    }
  }

  if ("baseUrl" in update) {
    const baseUrl = normalizeBaseUrl(update.baseUrl);
    if (baseUrl) {
      next.baseUrl = baseUrl;
    } else {
      delete next.baseUrl;
    }
  }

  if ("model" in update) {
    const model = cleanOptional(update.model);
    if (model) {
      next.model = model;
    } else {
      delete next.model;
    }
  }

  await writeSettings({ ...settings, deepseek: next });
  return getDeepSeekSettingsView();
}

export async function clearDeepSeekApiKey(): Promise<DeepSeekSettingsView> {
  const settings = await readSettings();
  const next = { ...settings.deepseek };
  delete next.apiKey;
  await writeSettings({ ...settings, deepseek: next });
  return getDeepSeekSettingsView();
}
