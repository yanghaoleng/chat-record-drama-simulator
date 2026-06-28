import { normalizeDeepSeekProject, extractJson } from "./deepseekProject";
import { isGenericImageCopy } from "./imageNarrative";
import { isJojoProject } from "./jojoProject";
import {
  describePhotoAssetCatalog,
  findJojoPhotoChoice,
  jojoPhotoCatalog,
  pickJojoPhotoAssetId,
  pickViralPhotoAssetId,
  viralPhotoCatalog
} from "./photoLibrary";
import { parseProject, type ChatMessage, type DramaProject, type ScriptGenerateRequest } from "./schema";
import type { PromptCard } from "./linearStory";

declare const __DEEPSEEK_BROWSER_CONFIG__: {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  defaultProvider?: BrowserDeepSeekProviderConfig;
};

type BrowserDeepSeekProviderConfig = {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
};

export type DeepSeekCompletionConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  source?: "default" | "server";
  label?: string;
};

export type DeepSeekSegmentResult = {
  card: PromptCard;
  messages: ChatMessage[];
  project: DramaProject;
  suggestedPrompt?: string;
  provider?: {
    source?: DeepSeekCompletionConfig["source"];
    label?: string;
    baseUrl: string;
    model: string;
  };
};

const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";

const storyBeats = [
  "3句内进入冲突",
  "试探身份/关系",
  "对方异常熟悉",
  "账单备注/利益动作制造压迫",
  "照片/截图/语音等关键证据",
  "女主反咬或男主误判反转",
  "表情包缓冲情绪",
  "结尾留下二次反转钩子"
];

const staleMotifs: Array<[RegExp, string]> = [
  [/高中合照背面写着[“"']?别等我[”"']?/g, "照片里出现了当前剧情的关键细节"],
  [/旧照片背面写着[：:]?别等我/g, "照片里出现了当前剧情的关键细节"],
  [/这张照片背面写着[：:]?别等我/g, "这张照片里有当前剧情的关键线索"],
  [/转账截图备注是[“"']?甜柚[”"']?/g, "转账截图备注露出当前剧情的关键称呼"],
  [/旧照片第三排马尾女生/g, "照片里的人物细节和当前剧情有关"],
  [/操场后门那家甜柚/g, "只有两人知道的地点"],
  [/高中初恋/g, "旧关系"],
  [/像初恋/g, "像旧关系里的人"]
];

function makeId(prefix: string) {
  return `${prefix}-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;
}

function hashText(value: string) {
  return [...value].reduce((total, char) => total + char.charCodeAt(0), 31);
}

function cleanBaseUrl(value: string) {
  return (value || "https://api.deepseek.com").replace(/\/+$/, "");
}

function suggestedPromptFromDeepSeekJson(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  for (const key of ["suggestedPrompt", "nextPrompt", "followUpPrompt", "continuePrompt"]) {
    const next = record[key];
    if (typeof next === "string" && next.trim()) return next.trim();
  }
  return undefined;
}

function cleanProviderConfig(
  value: BrowserDeepSeekProviderConfig | undefined,
  fallback: BrowserDeepSeekProviderConfig,
  source: DeepSeekCompletionConfig["source"],
  label: string
): DeepSeekCompletionConfig {
  return {
    apiKey: (value?.apiKey || fallback.apiKey || "").trim(),
    baseUrl: cleanBaseUrl(value?.baseUrl || fallback.baseUrl || "https://api.deepseek.com"),
    model: (value?.model || fallback.model || DEFAULT_DEEPSEEK_MODEL).trim(),
    source,
    label
  };
}

function getDefaultBrowserDeepSeekConfig() {
  return cleanProviderConfig(
    __DEEPSEEK_BROWSER_CONFIG__.defaultProvider,
    {
      apiKey: __DEEPSEEK_BROWSER_CONFIG__.apiKey,
      baseUrl: __DEEPSEEK_BROWSER_CONFIG__.baseUrl,
      model: __DEEPSEEK_BROWSER_CONFIG__.model
    },
    "default",
    "浏览器公开 Key"
  );
}

function roleForSide(project: DramaProject, side: ChatMessage["side"]) {
  if (side === "center") return undefined;
  return project.characters.find((character) => character.side === side)?.id;
}

function roleForGeneratedMessage(project: DramaProject, message: ChatMessage, index: number) {
  if (message.side === "center") return undefined;
  if (!isJojoProject(project)) return roleForSide(project, message.side);
  const validRole = message.roleId && project.characters.some((character) => character.id === message.roleId) ? message.roleId : undefined;
  if (validRole) return validRole;
  const corpus = `${message.roleId || ""} ${message.text || ""} ${message.ttsText || ""}`;
  if (/叫叫|jiaojiao|我先|我来|我已经|我/.test(corpus)) return "jiaojiao";
  if (/铃铛|lingdang|分析|冷静|排期|数据|拆/.test(corpus)) return "lingdang";
  if (/猪小弟|zhuxiaodi|垫|早餐|我给|靠谱|跟班/.test(corpus)) return "zhuxiaodi";
  if (/系统|xitong|提醒|已读|流程|通知/.test(corpus)) return "xitong";
  const sequence = ["jiaojiao", "lingdang", "zhuxiaodi", "xitong", "jiaojiao", "lingdang"];
  return sequence[Math.abs(index) % sequence.length];
}

function normalizeJojoGeneratedMessage(message: ChatMessage): ChatMessage {
  if (message.type === "image" && !message.assetId && !message.imageUrl) {
    return { ...message, assetId: pickJojoPhotoAssetId(message.text) };
  }
  if (message.type === "meme" && !message.assetId && !message.imageUrl) {
    const corpus = `${message.roleId || ""} ${message.text} ${message.emotion}`;
    if (/铃铛|lingdang|分析|冷静/.test(corpus)) return { ...message, assetId: "jojo-meme-lingdang-chart" };
    if (/猪小弟|zhuxiaodi|垫|靠谱|点赞|支持/.test(corpus)) return { ...message, assetId: "jojo-meme-zhuxiaodi-like" };
    if (/系统|xitong|提醒|通知|已读/.test(corpus)) return { ...message, assetId: "jojo-meme-xitong-notice" };
    if (/沉默|尴尬|会议/.test(corpus)) return { ...message, assetId: "jojo-meme-meeting-silence" };
    if (/deadline|赶|冒汗|自嘲/.test(corpus)) return { ...message, assetId: "jojo-meme-jiaojiao-deadline" };
    return { ...message, assetId: "jojo-meme-jiaojiao-flag" };
  }
  return message;
}

function normalizeGeneratedImageMessage(project: DramaProject, message: ChatMessage): ChatMessage {
  if (message.type !== "image" || message.assetId || message.imageUrl) return message;
  return {
    ...message,
    assetId: isJojoProject(project) ? pickJojoPhotoAssetId(message.text) : pickViralPhotoAssetId(message.text)
  };
}

function demoteMediaMessage(message: ChatMessage): ChatMessage {
  const { amount, transferNote, assetId, imageUrl, ...rest } = message;
  void amount;
  void transferNote;
  void assetId;
  void imageUrl;
  return {
    ...rest,
    type: "text",
    sendSfx: "send"
  };
}

function transferContextAllowsCard(project: DramaProject, corpus: string) {
  const compact = corpus.replace(/\s+/g, "");
  if (isJojoProject(project)) {
    return /转账|转你|转一笔|付款|收款|报销|垫付|垫钱|费用|会议室费|早餐|咖啡|打车|车费|发票|账单|团建/.test(compact);
  }
  return /转账|转你|转一笔|红包|付款|收款|打钱|¥|￥|金额|钱|定金|账单|差额|订单|尾款|押金|赔|补偿|小费|房租|车费/.test(compact);
}

function reduceTransferFrequency(project: DramaProject, messages: ChatMessage[], premise: string) {
  let keptTransfers = 0;
  return messages.map((message, index) => {
    if (message.type !== "transfer") return message;
    const corpus = `${premise} ${message.text} ${message.ttsText || ""} ${message.transferNote || ""}`;
    const explicit = transferContextAllowsCard(project, corpus);
    const occasionalAllowance = hashText(`${premise}:${project.messages.length}:${index}`) % (isJojoProject(project) ? 5 : 4) === 0;
    if (keptTransfers < 1 && (explicit || occasionalAllowance)) {
      keptTransfers += 1;
      return message;
    }
    return demoteMediaMessage(message);
  });
}

function capJojoImageFrequency(project: DramaProject, messages: ChatMessage[]) {
  if (!isJojoProject(project)) return messages;
  let imageCount = 0;
  return messages.map((message) => {
    if (message.type !== "image") return message;
    imageCount += 1;
    return imageCount <= 2 ? message : demoteMediaMessage(message);
  });
}

function makeJojoPhotoMessage(project: DramaProject, premise: string, messages: ChatMessage[]): ChatMessage {
  const context = `${premise} ${messages.map((message) => message.text || message.ttsText || "").join(" ")}`;
  const assetId = pickJojoPhotoAssetId(context);
  const asset = findJojoPhotoChoice(assetId);
  const text = asset ? `${asset.title}：${asset.tags.slice(0, 3).join("、")}的公司局部照片` : "公司日常局部抓拍";
  return {
    id: makeId("msg"),
    roleId: "xitong",
    side: "left",
    type: "image",
    text,
    ttsText: `你看，${asset?.title || "公司日常局部抓拍"}。`,
    emotion: "现场记录",
    sendSfx: "image",
    pauseMs: 520,
    holdMs: 2400,
    assetId
  };
}

function ensureOccasionalJojoPhoto(project: DramaProject, messages: ChatMessage[], premise: string) {
  if (!isJojoProject(project) || messages.some((message) => message.type === "image")) return messages;
  const corpus = `${premise} ${messages.map((message) => message.text || "").join(" ")}`;
  const relevant = /照片|图片|截图|证据|现场|工位|会议|办公室|老板|需求|排期|周报|咖啡|电梯|通勤|地铁|迟到|雨天|工牌|走廊|加班|日程|客户|工位|打卡/.test(corpus);
  if (!relevant) return messages;
  const shouldAdd = hashText(`${corpus}:${project.messages.length}`) % 3 === 0;
  if (!shouldAdd) return messages;
  const next = [...messages];
  next.splice(Math.min(4, next.length), 0, makeJojoPhotoMessage(project, premise, messages));
  return next;
}

function tuneGeneratedMediaDensity(project: DramaProject, messages: ChatMessage[], premise: string) {
  return ensureOccasionalJojoPhoto(
    project,
    capJojoImageFrequency(project, reduceTransferFrequency(project, messages, premise)),
    premise
  );
}

function mergeAssets(project: DramaProject, generated: DramaProject) {
  const seen = new Set(project.assets.map((asset) => asset.id));
  const next = [...project.assets];
  for (const asset of generated.assets) {
    if (seen.has(asset.id)) continue;
    seen.add(asset.id);
    next.push(asset);
  }
  return next;
}

function serializeMessage(project: DramaProject, message: ChatMessage, index: number) {
  const character = message.roleId ? project.characters.find((item) => item.id === message.roleId) : undefined;
  const speaker = character?.name || (message.side === "right" ? "男主" : message.side === "left" ? "女主" : "系统");
  return `${index + 1}. ${speaker}/${message.type}: ${scrubStaleMotifs(message.text || message.ttsText || "媒体消息")}`;
}

function targetMessageRange(project: DramaProject) {
  return project.messages.length ? "本段新增 20-32 条 messages，最多不要超过 36 条。" : "第一段要一次性成片，生成 48-68 条 messages，绝对不要少于 44 条。";
}

function mediaRule(project: DramaProject) {
  if (isJojoProject(project)) {
    return `图片不是每段必须有；当当前 Prompt 涉及工位、会议、排期、通勤、迟到、咖啡、周报、老板、客户、雨天、工牌、日程等可视化日常时，本段可以自然插入 0-2 条 image，常见情况只用 1 条。图片必须按标签选择现有照片 assetId，不要反复只用会议桌和电梯口两张。可用办公室日常照片目录：${describePhotoAssetCatalog(jojoPhotoCatalog)}。表情消息优先指定现有 jojo-meme-* assetId。`;
  }
  const viralAssets = describePhotoAssetCatalog(viralPhotoCatalog);
  if (!project.messages.length) return `第一段可以按剧情需要插入 image/meme/transfer，但不要为了凑数机械插入；transfer 本段最多 1 条，只有付款纠纷或订单金额是核心冲突时才用。图片消息优先按标签指定这些 assetId：${viralAssets}。`;
  return `续写段如果当前 Prompt 涉及证据、截图、现场、情绪爆点，可以插入 image/meme；transfer 要明显降频，本段最多 1 条，只在付款、补偿、订单、押金、红包确实是剧情核心时出现。图片消息优先按标签指定这些 assetId：${viralAssets}。`;
}

function repairInstruction(attempt: number) {
  const hardTemplate = attempt > 1
    ? [
        "第二次返工，必须按这个密度写：3句内有动作，5句内出现可视化证据，8句内发生关系反转。",
        "证据可以是订单截图、门禁照片、定位截图、收款备注、现场照片，但必须来自当前 Prompt 的剧情，不要套用固定关系梗。",
        "重点：用当前剧情里的具体物件、地点、金额、备注、截图让观众自己意识到反转。"
      ]
    : [];

  return [
    "上一版作废，原因：开头太像普通闲聊，缺少短剧钩子。",
    "重新输出严格 JSON：第一条不得问候，不得问“聊什么”，不得写“声音好熟悉/声音像谁/同学很像/像一个人/大众脸/大众嗓/认错人”。",
    "第一屏必须直接出现当前 Prompt 里的具体事件：下单、金额/定金、现场照片、截图备注、只有两人知道的旧细节、误会被翻出。",
    "图片消息必须写清照片/截图里到底是什么，禁止只写“关键照片/证据/图片”。图片内容只能服务当前剧情，不要复用固定例子。",
    "每 2-3 条消息就要推进一次信息，不要原地追问。",
    ...hardTemplate
  ].join("\n");
}

function scrubStaleMotifs(value: string) {
  return staleMotifs.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}

function isLowQualitySegment(messages: ChatMessage[]) {
  const firstScreen = messages.slice(0, 8).map((message) => message.text || message.ttsText || "").join("\n");
  const hasEmptyImageCopy = messages.some((message) => message.type === "image" && isGenericImageCopy(message.text));
  return hasEmptyImageCopy || /你好|聊什么|声音好熟悉|声音.*像|同学.*像|像一个人|像初恋|大众脸|大众嗓|认错人了|你是谁呀|谁呀|不认识$|真的吗|怎么会这样|我不知道你在说什么/.test(firstScreen);
}

function removeDuplicateMessages(messages: ChatMessage[]) {
  const seen = new Set<string>();
  return messages.filter((message, index) => {
    const signature = `${message.type}:${message.text || message.ttsText || ""}`;
    const previous = messages[index - 1];
    const duplicateAdjacent = previous && (previous.text || previous.ttsText) === (message.text || message.ttsText);
    if (duplicateAdjacent) return false;
    if (["image", "meme", "transfer"].includes(message.type) && seen.has(signature)) return false;
    seen.add(signature);
    return true;
  });
}

function systemPrompt(project: DramaProject) {
  if (isJojoProject(project)) {
    return [
      "你是叫叫公司日常群聊编剧，输出必须是严格 JSON，不要 markdown。",
      "这是钉钉手机版群聊风格：玩家扮演叫叫，界面会把叫叫渲染成右侧蓝色气泡；其他角色在左侧白色气泡。",
      "title 是群聊名称，要像同事背后蛐蛐用的小群名，4-10 个中文字，轻松、机灵、有梗，不要正式公司群名。示例：工位蛐蛐小队、早会避难所、需求受害者联盟、周报幸存者。",
      "只写叫叫公司里的日常吐槽、自嘲、会议、需求、排期、周报、老板、客户、工位、电梯口、咖啡、deadline 等职场小反转。",
      "喜剧密度要更高：多写办公室荒诞、同事吐槽、反差包袱、系统无情补刀；每 4-6 条至少有一个轻笑点，但不要变成段子合集。",
      "固定角色和 roleId：叫叫 roleId=jiaojiao，是勇敢爱冒险的小鸡吉祥物，也是用户自己；铃铛 roleId=lingdang，是高知女生，聪明冷静会来事；猪小弟 roleId=zhuxiaodi，憨厚踏实、家里条件好、正直，是叫叫小跟班；系统 roleId=xitong，冷静无情地提醒流程。",
      "每条非 system 消息必须写 roleId。叫叫消息 side=right，铃铛/猪小弟/系统消息 side=left。视觉左右由前端处理。",
      targetMessageRange(project),
      mediaRule(project),
      "消息必须短，单条中文尽量 4-18 字；不要写小说旁白，不要写爱情误会，不要套网红短剧男女主。",
      "图片消息 text 必须描述真实办公室局部证据：手、电脑、咖啡、背影、走廊、电梯口、运动模糊。禁止真实正脸、卡通脸、吉祥物脸、全身角色、识别性人物。",
      "image 类型只用 text 一个字段描述图片内容，写清这张图里具体有什么；不要拆成 label/title/detail，也不要输出额外图片文案字段。",
      "可用图片 assetId 已在照片目录列出；优先按标签匹配当前剧情，偶尔用 1 张，最多 2 张。",
      "可用表情 assetId：jojo-meme-jiaojiao-flag、jojo-meme-lingdang-chart、jojo-meme-zhuxiaodi-like、jojo-meme-xitong-notice、jojo-meme-jiaojiao-deadline、jojo-meme-meeting-silence。",
      "transfer 很少出现：平均 3-5 段最多 1 段；本段最多 1 条；只有当前 Prompt 明确涉及会议室费、报销、垫付、早餐、车费、发票等公司费用时才用，否则用普通 text 推进。",
      "每条消息都要带 emotion、sendSfx、pauseMs、holdMs，sendSfx 只能是 none/send/image/transfer/meme。",
      "输出结构必须匹配 DramaProject：id,title,brief,stylePreset,fps,canvas,characters,assets,messages,sfx,audioMix。",
      "可以在 JSON 顶层额外输出 suggestedPrompt，作为下一轮可选提示词；没有自然建议就不要输出或留空。",
      "stylePreset 必须是 jojo-company-chat；assets 必须是数组；messages 必须是数组；sfx 必须是对象。"
    ].join("\n");
  }
  return [
    "你是爆款聊天记录短剧编剧，擅长写高密度微信聊天短剧。输出必须是严格 JSON，不要 markdown。",
    "成片观感：横向聊天画布，大字号短消息，连续滚屏，像真实聊天局部放大。用户只看聊天，不看旁白，也必须看懂剧情。",
    project.messages.length ? "你正在续写同一条线。只输出新段落，不要重复已有对话。" : "你正在写第一段。它要一次性生成到位，像能直接剪成短视频的完整开局。",
    `本段节拍：${storyBeats.join(" -> ")}。`,
    targetMessageRange(project),
    mediaRule(project),
    "消息必须短，单条中文尽量 4-18 字；偶尔可到 24 字，但不能写小说旁白。",
    "每一句都要有信息量：试探、隐瞒、证据、反问、误会、旧称呼、金额、截图、沉默、钩子。不要写寒暄废话。",
    "网红版要更暧昧、更情绪化：多写拉扯、吃醋、克制、欲言又止、嘴硬心软、旧关系刺痛；情绪要递进，不要只靠大吵。",
    "第一条消息不得是问候，必须直接进入事件：下单、账单备注、现场照片、误会、旧称呼、截图、备注。",
    "如果 Prompt 里有陪聊/旧关系：第一屏必须出现下单、订单备注、只有两人知道的具体细节、现场照片或备注，不许从陌生人闲聊开始。",
    "用户/玩家/我方永远扮演男主：男主 side=right，女生/女主 side=left。哪怕你先写女主开口，也不能把男女左右写反。",
    "transfer 是低频可选消息类型，本段最多 1 条，只在剧情确实把付款、补偿、订单、押金、红包作为核心冲突时出现；出现时必须给合理 amount 和 transferNote，不要默认 200。",
    "meme 是可选消息类型，只用于真实聊天里的表情反应；text 写情绪或表情名，如“流汗”“白眼”“偷笑”“委屈”，不要写固定口头禅。",
    "image 类型消息的 text 必须描述照片/截图的实际内容：主体是谁、在哪里、出现了什么关键物件/备注/动作。禁止只写“关键照片/证据/图片/截图”。",
    "image 类型只用 text 一个字段描述图片内容，写清这张图里具体有什么；不要拆成 label/title/detail，也不要输出额外图片文案字段。",
    "不要复用上一轮或示例里的固定图片梗、固定关系梗、固定备注梗；除非用户当前 Prompt 明确要求，否则完全按当前剧情生成新照片内容。",
    "禁止低质套话：不要写“你好”“想聊什么”“你声音好熟悉”“声音跟同学很像”“大众脸/大众嗓”“认错人”“真的吗”“你是谁呀”这类平铺直叙；要用具体细节和压迫感推动。",
    "女生永远在左边 side=left，男生永远在右边 side=right，绝对不要反过来。system 只用于时间/提示，少用。",
    "男主可以嘴硬、心虚、急；女主可以冷静、克制、带刺、藏秘密。两个人的语气要明显不同。",
    "每条消息都要带 emotion、sendSfx、pauseMs、holdMs，sendSfx 只能是 none/send/image/transfer/meme。",
    "角色必须是两个：右侧男主、左侧女主；语音描述要利于 TTS 表演。",
    "输出结构必须匹配 DramaProject：id,title,brief,stylePreset,fps,canvas,characters,assets,messages,sfx,audioMix。",
    "可以在 JSON 顶层额外输出 suggestedPrompt，作为下一轮可选提示词；没有自然建议就不要输出或留空。",
    "assets 必须是数组；messages 必须是数组；sfx 必须是对象，不要输出数组。"
  ].join("\n");
}

function isUsableJojoGroupTitle(title: string | undefined) {
  const value = title?.replace(/\s+/g, "").trim();
  if (!value) return false;
  if (value.length < 4 || value.length > 10) return false;
  if (/叫叫公司日常群|公司日常|DramaProject|DeepSeek|Prompt|JSON|剧情|短剧/.test(value)) return false;
  return true;
}

function nextProjectTitle(project: DramaProject, generated: DramaProject) {
  if (isJojoProject(project)) {
    return isUsableJojoGroupTitle(generated.title) ? generated.title : project.title;
  }
  return project.messages.length ? project.title : generated.title;
}

function userPrompt(project: DramaProject, prompt: string, promptCards: PromptCard[]) {
  return [
    `当前新 Prompt：${prompt}`,
    "",
    "此前 Prompt 卡片：",
    promptCards.length ? promptCards.map((card, index) => `${index + 1}. ${scrubStaleMotifs(card.prompt)}`).join("\n") : "无",
    "",
    "目前已经生成的所有对话：",
    project.messages.length ? project.messages.map((message, index) => serializeMessage(project, message, index)).join("\n") : "无",
    "",
    "上面的历史只用于承接人物关系和已发生事实，不要复用上一轮图片文案或固定例子。",
    "请只续写下一段，不要重写整条线。输出严格 JSON。"
  ].join("\n");
}

function makeDeepSeekBody(project: DramaProject, prompt: string, promptCards: PromptCard[], model: string, repairAttempt: number) {
  return {
    model,
    temperature: repairAttempt ? 0.94 : 0.86,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt(project) },
      { role: "user", content: userPrompt(project, prompt, promptCards) },
      ...(repairAttempt ? [{ role: "user", content: repairInstruction(repairAttempt) }] : [])
    ]
  };
}

export function getBrowserDeepSeekConfig() {
  return getDefaultBrowserDeepSeekConfig();
}

export function hasBrowserDeepSeekKey() {
  return Boolean(getDefaultBrowserDeepSeekConfig().apiKey);
}

export async function resolveBrowserDeepSeekConfig(project?: DramaProject) {
  void project;
  const defaultProvider = getDefaultBrowserDeepSeekConfig();
  return defaultProvider;
}

export async function getBrowserDeepSeekStatusText(project?: DramaProject) {
  if (!hasBrowserDeepSeekKey()) return "纯前端静态模式已就绪";
  const provider = await resolveBrowserDeepSeekConfig(project);
  return provider.apiKey ? `DeepSeek 前端直连已就绪（${provider.label}）` : "纯前端静态模式已就绪";
}

export async function generateDeepSeekStorySegmentWithConfig({
  project,
  prompt,
  promptCards,
  config,
  logLabel = "deepseek",
  signal
}: {
  project: DramaProject;
  prompt: string;
  promptCards: PromptCard[];
  config: DeepSeekCompletionConfig;
  logLabel?: string;
  signal?: AbortSignal;
}): Promise<DeepSeekSegmentResult> {
  const normalizedConfig = {
    apiKey: config.apiKey.trim(),
    baseUrl: cleanBaseUrl(config.baseUrl),
    model: config.model.trim() || DEFAULT_DEEPSEEK_MODEL,
    source: config.source,
    label: config.label
  };
  const premise = prompt.replace(/\s+/g, " ").trim();
  if (!premise) throw new Error("Prompt 为空");
  if (!normalizedConfig.apiKey) throw new Error("DeepSeek API key 未配置");

  const request: ScriptGenerateRequest = {
    brief: [...promptCards.map((card) => card.prompt), premise].join("\n"),
    durationSeconds: project.messages.length ? 90 : 180,
    styleNotes: project.messages.length ? "线性续写当前卡片，不要重复旧对话。" : "第一段一次性生成到位，冲突强，反转密。"
  };
  const url = `${normalizedConfig.baseUrl}/chat/completions`;
  async function fetchGeneratedProject(repairAttempt: number) {
    const requestId = makeId("fresh");
    console.info(`[${logLabel}] request`, {
      requestId,
      url,
      model: normalizedConfig.model,
      provider: normalizedConfig.label || normalizedConfig.source || "custom",
      prompt: premise,
      promptCards: promptCards.length,
      existingMessages: project.messages.length,
      repairAttempt,
      stateless: true
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${normalizedConfig.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(makeDeepSeekBody(project, premise, promptCards, normalizedConfig.model, repairAttempt)),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(45000)]) : AbortSignal.timeout(45000)
    });

    console.info(`[${logLabel}] response`, { ok: response.ok, status: response.status, repairAttempt });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`DeepSeek 请求失败：${response.status}${text ? ` ${text.slice(0, 120)}` : ""}`);
    }

    const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("DeepSeek 响应没有 content");
    const extracted = extractJson(content);
    return {
      project: normalizeDeepSeekProject(extracted, request),
      suggestedPrompt: suggestedPromptFromDeepSeekJson(extracted)
    };
  }

  let generated = await fetchGeneratedProject(0);
  for (let repairAttempt = 1; repairAttempt <= 2 && isLowQualitySegment(generated.project.messages); repairAttempt += 1) {
    console.warn(`[${logLabel}] low-quality opening; retrying with repair prompt`, { repairAttempt });
    generated = await fetchGeneratedProject(repairAttempt);
  }
  const baseCharacters = project.characters;
  const cardId = makeId("prompt");
  const normalizedMessages = removeDuplicateMessages(generated.project.messages)
    .map((message, index) => ({
      ...message,
      id: makeId("msg"),
      roleId: roleForGeneratedMessage({ ...project, characters: baseCharacters }, message, index)
    }))
    .map((message) => isJojoProject(project) && message.roleId === "jiaojiao" ? { ...message, side: "right" as const } : message)
    .map((message) => normalizeGeneratedImageMessage(project, message))
    .map((message) => isJojoProject(project) ? normalizeJojoGeneratedMessage(message) : message);
  const messages = tuneGeneratedMediaDensity(project, normalizedMessages, premise);
  const card: PromptCard = {
    id: cardId,
    prompt: premise,
    createdAt: new Date().toISOString(),
    messageIds: messages.map((message) => message.id),
    summary: `DeepSeek 追加 ${messages.length} 条消息，承接 ${project.messages.length} 条历史对话`
  };

  const nextProject = parseProject({
    ...project,
    title: nextProjectTitle(project, generated.project),
    brief: request.brief,
    characters: baseCharacters,
    assets: mergeAssets(project, generated.project),
    messages: [...project.messages, ...messages],
    sfx: { ...project.sfx, ...generated.project.sfx },
    audioMix: { ...project.audioMix, ...generated.project.audioMix }
  });

  return {
    card,
    messages,
    project: nextProject,
    ...(generated.suggestedPrompt ? { suggestedPrompt: generated.suggestedPrompt } : {}),
    provider: {
      source: normalizedConfig.source,
      label: normalizedConfig.label,
      baseUrl: normalizedConfig.baseUrl,
      model: normalizedConfig.model
    }
  };
}

export async function generateDeepSeekStorySegment({
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
  const config = await resolveBrowserDeepSeekConfig(project);
  return generateDeepSeekStorySegmentWithConfig({
    project,
    prompt,
    promptCards,
    config,
    logLabel: "deepseek-browser-default",
    signal
  });
}
