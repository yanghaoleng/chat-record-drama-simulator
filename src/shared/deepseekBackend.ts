import { parseProject, type ChatMessage, type DramaProject } from "./schema";
import type { DeepSeekSegmentResult } from "./deepseekBrowser";
import type { PromptCard } from "./linearStory";

function parsePromptCard(value: unknown): PromptCard {
  if (!value || typeof value !== "object") throw new Error("后端返回的 Prompt 卡片无效");
  const card = value as Partial<PromptCard>;
  if (!card.id || !card.prompt || !card.createdAt || !Array.isArray(card.messageIds) || !card.summary) {
    throw new Error("后端返回的 Prompt 卡片字段缺失");
  }
  return {
    id: card.id,
    prompt: card.prompt,
    createdAt: card.createdAt,
    messageIds: card.messageIds,
    summary: card.summary,
    ...(typeof card.suggestedPrompt === "string" && card.suggestedPrompt.trim() ? { suggestedPrompt: card.suggestedPrompt.trim() } : {})
  };
}

function parseMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) throw new Error("后端返回的消息列表无效");
  return value as ChatMessage[];
}

function parseSuggestedPrompt(value: Partial<DeepSeekSegmentResult> & Record<string, unknown>) {
  for (const key of ["suggestedPrompt", "nextPrompt", "followUpPrompt", "continuePrompt"]) {
    const next = value[key];
    if (typeof next === "string" && next.trim()) return next.trim();
  }
  return undefined;
}

async function readError(response: Response) {
  const text = await response.text().catch(() => "");
  if (!text) return `后端 DeepSeek 请求失败：${response.status}`;
  try {
    const json = JSON.parse(text) as { error?: string };
    return json.error || `后端 DeepSeek 请求失败：${response.status}`;
  } catch {
    return `后端 DeepSeek 请求失败：${response.status} ${text.slice(0, 120)}`;
  }
}

export async function generateBackendStorySegment({
  project,
  prompt,
  promptCards,
  signal
}: {
  project: DramaProject;
  prompt: string;
  promptCards: PromptCard[];
  signal?: AbortSignal;
}): Promise<DeepSeekSegmentResult> {
  const response = await fetch("/api/story/continue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project, prompt, promptCards }),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(50000)]) : AbortSignal.timeout(50000)
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const json = await response.json() as Partial<DeepSeekSegmentResult>;
  const suggestedPrompt = parseSuggestedPrompt(json);
  return {
    card: parsePromptCard(json.card),
    messages: parseMessages(json.messages),
    project: parseProject(json.project),
    ...(suggestedPrompt ? { suggestedPrompt } : {})
  };
}
