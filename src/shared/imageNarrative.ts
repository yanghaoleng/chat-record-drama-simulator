import type { ChatMessage, DramaProject } from "./schema";
import { isJojoCssMemeAssetId } from "./jojoMemeCards";
import { localMemeAssets } from "./memeLibrary";

const genericImagePattern = /^(关键|重要)?\s*(证据|照片|图片|截图|图|旧照|旧照片|聊天图片|照片线索|图片线索|关键线索|证据照片)\s*[。.!！?？]*$/;
const lowInfoImagePattern = /^(你自己看|你看|看图|发你了|自己看|图在这里|这张|这张照片|这张图)\s*[。.!！?？]*$/;

function compact(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, length: number) {
  const chars = [...value];
  return chars.length > length ? `${chars.slice(0, length).join("")}...` : value;
}

function contextSnippet(text: string) {
  return truncate(text.replace(/[。！？!?].*$/, "").replace(/男主|女主|女生|男生|对方|发现|突然|一张|一个/g, ""), 14) || "当前剧情";
}

export function isGenericImageCopy(value?: string) {
  const text = compact(value || "");
  if (!text) return true;
  if (/占位|placeholder/i.test(text)) return true;
  return genericImagePattern.test(text) || lowInfoImagePattern.test(text);
}

export function imageHintFromContext(context: string) {
  const text = compact(context);
  const positiveText = text.replace(/不(?:要|用)?转账|无转账|别转账|不要付款|不用付款|无付款/g, "");
  if (!text) return "当前剧情里的关键画面";
  if (/聊天记录|对话截图|微信截图|截图/.test(positiveText)) return `${contextSnippet(positiveText)}的聊天截图`;
  if (/转账|定金|钱|红包|金额|备注/.test(positiveText)) return `${contextSnippet(positiveText)}的转账截图`;
  if (/定位|地址|酒店|门口|车站|机场/.test(positiveText)) return `${contextSnippet(positiveText)}的定位截图`;
  if (/照片|图片|合照|现场|门口|房间|车里|餐厅|医院|公司|泳池|偷拍/.test(positiveText)) return `${contextSnippet(positiveText)}的现场照片`;
  return `${truncate(text, 14)}的图片线索`;
}

export function imageSourceForMessage(project: DramaProject, message: ChatMessage): string | undefined {
  if (isJojoCssMemeAssetId(message.assetId)) return undefined;
  const asset = message.assetId ? project.assets.find((item) => item.id === message.assetId) : undefined;
  const localMeme = message.assetId ? localMemeAssets.find((item) => item.id === message.assetId) : undefined;
  return message.imageUrl || asset?.remoteUrl || asset?.localPath || localMeme?.localPath;
}

function nearbyImageClues(project: DramaProject, message: ChatMessage) {
  const index = project.messages.findIndex((item) => item.id === message.id);
  if (index === -1) return [];
  return [1, -1, 2, -2]
    .map((offset) => project.messages[index + offset])
    .filter(Boolean)
    .map((item) => item.text || item.ttsText || "")
    .filter((text) => /照片|图片|截图|背面|备注|写着|合照|转账|记录|定位|旧照|线索/.test(text));
}

function pickConcrete(candidates: Array<string | undefined>) {
  return candidates.map((item) => compact(item || "")).find((item) => item && !isGenericImageCopy(item));
}

export function imageNarrativeCopy(project: DramaProject, message: ChatMessage) {
  const asset = message.assetId ? project.assets.find((item) => item.id === message.assetId) : undefined;
  const nearby = nearbyImageClues(project, message);
  const contextHint = imageHintFromContext([project.brief, ...nearby].join(" "));
  const descriptionSource = pickConcrete([message.text, message.ttsText, asset?.title, ...nearby, contextHint]) || contextHint;
  const description = truncate(descriptionSource.replace(/^(图片|照片|截图|线索|证据)[：:\s]*/, ""), 52);

  return {
    description,
    alt: descriptionSource
  };
}
