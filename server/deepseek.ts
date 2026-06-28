import { randomUUID } from "node:crypto";
import { z } from "zod";
import { sampleProject } from "../src/shared/sampleProject.js";
import {
  messageTypes,
  chatMessageSchema,
  parseProject,
  projectSchema,
  scriptGenerateRequestSchema,
  sides,
  type ChatMessage,
  type DramaProject,
  type ScriptGenerateRequest
} from "../src/shared/schema.js";
import { generateDeepSeekStorySegmentWithConfig, type DeepSeekSegmentResult } from "../src/shared/deepseekBrowser.js";
import { getDeepSeekConfig } from "./settings.js";

const storyBeats = [
  "陪聊下单",
  "试探",
  "对方异常熟悉",
  "具体证据推动关系变化",
  "情绪拉扯",
  "关键证据/图片",
  "二次反转/留钩子"
];
const maxGeneratedMessages = 72;

const promptCardSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  createdAt: z.string(),
  messageIds: z.array(z.string()),
  summary: z.string()
});

const storyContinueRequestSchema = z.object({
  project: projectSchema.extend({
    messages: z.array(chatMessageSchema).default([])
  }),
  prompt: z.string().min(1),
  promptCards: z.array(promptCardSchema).default([])
});

function customizeFallback(request: ScriptGenerateRequest): DramaProject {
  return {
    ...sampleProject,
    id: randomUUID(),
    title: request.brief.slice(0, 20) || sampleProject.title,
    brief: request.brief,
    messages: sampleProject.messages.map((message) => ({ ...message }))
  };
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const raw = fenced || text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("No JSON object found in model response");
  return JSON.parse(raw.slice(start, end + 1));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function objectValues(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (isRecord(value)) return Object.values(value);
  return [];
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function enumValue<T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] {
  return typeof value === "string" && allowed.includes(value) ? value : fallback;
}

function normalizeMessageType(value: unknown, text: string): ChatMessage["type"] {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (messageTypes.includes(normalized as ChatMessage["type"])) return normalized as ChatMessage["type"];
    if (["转账", "红包", "付款"].includes(normalized)) return "transfer";
    if (["图片", "照片"].includes(normalized)) return "image";
    if (["表情", "表情包", "gif"].includes(normalized)) return "meme";
    if (["系统", "旁白"].includes(normalized)) return "system";
  }

  if (/转账|红包|付款|¥|￥/.test(text)) return "transfer";
  if (/照片|图片|合照|截图/.test(text)) return "image";
  if (/表情包|表情|破防|狗头/.test(text)) return "meme";
  return "text";
}

function normalizeProjectSource(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {};
  for (const key of ["project", "dramaProject", "result", "data"]) {
    if (isRecord(value[key])) return value[key];
  }
  return value;
}

function normalizeAsset(value: unknown, index: number): DramaProject["assets"][number] | undefined {
  if (!isRecord(value)) return undefined;
  const kind = enumValue(value.kind, ["avatar", "image", "meme", "sound"] as const, index === 0 ? "image" : "meme");
  const remoteUrl = stringValue(value.remoteUrl) || stringValue(value.url) || stringValue(value.src);

  return {
    id: stringValue(value.id) || `asset-${index + 1}`,
    kind,
    title: stringValue(value.title) || stringValue(value.name) || `${kind}-${index + 1}`,
    sourceName: stringValue(value.sourceName) || stringValue(value.source) || "DeepSeek",
    sourceUrl: stringValue(value.sourceUrl) || "",
    licenseNote: stringValue(value.licenseNote) || "AI 生成脚本引用素材，请在正式商用前替换为授权素材。",
    localPath: stringValue(value.localPath),
    remoteUrl,
    tags: objectValues(value.tags).map((tag) => String(tag)).filter(Boolean),
    riskLevel: enumValue(value.riskLevel, ["safe", "unknown_or_restricted", "restricted"] as const, "unknown_or_restricted")
  };
}

function normalizeCharacter(value: unknown, index: number, fallback: DramaProject["characters"][number]): DramaProject["characters"][number] {
  const record = isRecord(value) ? value : {};
  const side = enumValue(record.side, ["left", "right"] as const, fallback.side);

  return {
    ...fallback,
    id: stringValue(record.id) || fallback.id || `role-${index + 1}`,
    name: stringValue(record.name) || fallback.name,
    side,
    avatarUrl: stringValue(record.avatarUrl) || fallback.avatarUrl,
    avatarInitial: (stringValue(record.avatarInitial) || stringValue(record.initial) || fallback.avatarInitial).slice(0, 2),
    avatarGradient: stringValue(record.avatarGradient) || fallback.avatarGradient,
    voiceId: stringValue(record.voiceId) || fallback.voiceId,
    voicePreset: enumValue(record.voicePreset, ["young_real_female", "young_male"] as const, fallback.voicePreset || "young_real_female"),
    voiceDescription: stringValue(record.voiceDescription) || fallback.voiceDescription
  };
}

function normalizeMessage(
  value: unknown,
  index: number,
  characters: DramaProject["characters"]
): ChatMessage {
  const record = isRecord(value) ? value : { text: String(value ?? "") };
  const side = enumValue(record.side, sides, index % 2 === 0 ? "right" : "left");
  const roleForSide = characters.find((character) => character.side === side);
  const text =
    stringValue(record.text) ||
    stringValue(record.content) ||
    stringValue(record.message) ||
    stringValue(record.caption) ||
    "继续";
  const type = normalizeMessageType(record.type || record.kind, text);
  const rawSfx = stringValue(record.sendSfx) || stringValue(record.sfx);
  const sendSfx = enumValue(rawSfx, ["none", "send", "image", "transfer", "meme"] as const, type === "image" || type === "transfer" || type === "meme" ? type : "send");

  return {
    id: stringValue(record.id) || `msg-${index + 1}`,
    roleId: stringValue(record.roleId) || stringValue(record.characterId) || (side === "center" ? undefined : roleForSide?.id),
    side,
    type,
    text,
    ttsText: stringValue(record.ttsText) || stringValue(record.voiceText),
    emotion: stringValue(record.emotion) || "平静",
    sendSfx,
    pauseMs: Math.round(numberValue(record.pauseMs, 360)),
    holdMs: Math.round(numberValue(record.holdMs, 1400)),
    assetId: stringValue(record.assetId),
    imageUrl: stringValue(record.imageUrl) || stringValue(record.url),
    amount: type === "transfer" ? numberValue(record.amount, 200) : undefined,
    transferNote: stringValue(record.transferNote)
  };
}

function normalizeSfx(value: unknown): DramaProject["sfx"] {
  if (!isRecord(value)) return {};
  return {
    send: stringValue(value.send),
    image: stringValue(value.image),
    transfer: stringValue(value.transfer),
    meme: stringValue(value.meme),
    ambient: stringValue(value.ambient)
  };
}

function replacementIndexFor(messages: ChatMessage[], preferredIndex: number): number {
  if (!["transfer", "image", "meme"].includes(messages[preferredIndex]?.type)) {
    return preferredIndex;
  }

  const fallbackIndex = messages.findIndex((message) => !["transfer", "image", "meme"].includes(message.type));
  return fallbackIndex === -1 ? preferredIndex : fallbackIndex;
}

function limitMessages(messages: ChatMessage[]): ChatMessage[] {
  const next = messages.slice(0, maxGeneratedMessages);
  for (const requiredType of ["image", "meme"] as const) {
    if (next.some((message) => message.type === requiredType)) continue;
    const candidate = messages.find((message) => message.type === requiredType);
    if (candidate) {
      const replaceIndex = Math.max(0, next.length - 1 - (requiredType === "image" ? 1 : 0));
      next[replaceIndex] = candidate;
    }
  }

  return next.map((message, index) => ({ ...message, id: message.id || `msg-${index + 1}` }));
}

export function normalizeDeepSeekProject(value: unknown, request: ScriptGenerateRequest): DramaProject {
  const source = normalizeProjectSource(value);
  const fallback = customizeFallback(request);
  const rawCharacters = objectValues(source.characters);
  const characters = fallback.characters.map((character, index) => normalizeCharacter(rawCharacters[index], index, character));
  const rawMessages = objectValues(source.messages);

  if (!rawMessages.length) {
    throw new Error("DeepSeek JSON did not include a messages array");
  }

  const messages = limitMessages(rawMessages.map((message, index) => normalizeMessage(message, index, characters)));

  return parseProject({
    ...fallback,
    id: stringValue(source.id) || randomUUID(),
    title: stringValue(source.title) || fallback.title,
    brief: stringValue(source.brief) || request.brief,
    stylePreset: "kuaishou-horizontal-chat",
    fps: Math.round(numberValue(source.fps, fallback.fps)),
    canvas: {
      width: Math.round(numberValue(isRecord(source.canvas) ? source.canvas.width : undefined, fallback.canvas.width)),
      height: Math.round(numberValue(isRecord(source.canvas) ? source.canvas.height : undefined, fallback.canvas.height))
    },
    characters,
    assets: objectValues(source.assets).map(normalizeAsset).filter((asset): asset is DramaProject["assets"][number] => Boolean(asset)),
    messages,
    sfx: normalizeSfx(source.sfx),
    audioMix: isRecord(source.audioMix) ? { ...fallback.audioMix, ...source.audioMix } : fallback.audioMix
  });
}

function systemPrompt() {
  return [
    "你是爆款聊天记录短剧编剧，输出必须是严格 JSON，不要 markdown。",
    "视频风格：横向聊天画布，大字号短消息，连续滚屏，像真实聊天局部放大。",
    `剧情节拍必须包含：${storyBeats.join(" -> ")}。`,
    "消息必须短，单条中文尽量 4-18 字；不要写小说旁白。",
    "总消息数控制在 48-68 条之间，绝对不要超过 72 条。",
    "transfer、image、meme 都是可选类型，只在当前剧情自然需要时出现；不要硬塞固定金额、固定照片或固定表情梗。transfer 要明显降频，本段最多 1 条，只在付款纠纷、补偿、订单、押金、红包是核心冲突时出现。",
    "image 类型只用 text 一个字段描述图片内容，写清这张图里具体有什么；不要拆成 label/title/detail。",
    "网红版多写暧昧、拉扯、吃醋、克制和情绪反复；不要套高中重逢或固定旧照片梗。",
    "每条消息都要带 emotion、sendSfx、pauseMs、holdMs，sendSfx 只能是 none/send/image/transfer/meme。",
    "角色默认是右侧男主、左侧女主；语音描述要利于 TTS 表演。",
    "输出结构必须匹配 DramaProject：id,title,brief,stylePreset,fps,canvas,characters,assets,messages,sfx,audioMix。",
    "assets 必须是数组；messages 必须是数组；sfx 必须是对象，不要输出数组。",
    "characters 必须是两个对象组成的数组：右侧男主、左侧女主。"
  ].join("\n");
}

export async function generateScript(body: unknown): Promise<{ project: DramaProject; usedFallback: boolean; warning?: string }> {
  const request = scriptGenerateRequestSchema.parse(body);
  const { apiKey, baseUrl, model } = await getDeepSeekConfig();

  if (!apiKey) {
    return {
      project: customizeFallback(request),
      usedFallback: true,
      warning: "DEEPSEEK_API_KEY is not set; returned editable fallback script."
    };
  }

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.86,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt() },
          {
            role: "user",
            content: `题材 brief：${request.brief}\n目标时长：${request.durationSeconds} 秒\n补充风格：${request.styleNotes || "暧昧拉扯更强，证据具体，冲突强，反转密。"}`
          }
        ]
      }),
      signal: AbortSignal.timeout(45000)
    });

    if (!response.ok) {
      throw new Error(`DeepSeek request failed: ${response.status}`);
    }

    const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("DeepSeek response did not include content");

    const parsed = normalizeDeepSeekProject(extractJson(content), request);
    return { project: parsed, usedFallback: false };
  } catch (error) {
    return {
      project: customizeFallback(request),
      usedFallback: true,
      warning: error instanceof Error ? error.message : "Unknown DeepSeek failure"
    };
  }
}

export async function continueStoryWithDeepSeek(body: unknown): Promise<DeepSeekSegmentResult> {
  const request = storyContinueRequestSchema.parse(body);
  const { apiKey, baseUrl, model } = await getDeepSeekConfig();
  if (!apiKey) throw new Error("后端 DeepSeek API key 未配置");

  return generateDeepSeekStorySegmentWithConfig({
    project: request.project,
    prompt: request.prompt,
    promptCards: request.promptCards,
    config: { apiKey, baseUrl, model },
    logLabel: "deepseek-server"
  });
}
