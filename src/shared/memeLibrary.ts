import type { ChatMessage, MemeAsset } from "./schema";

type LocalMeme = {
  id: string;
  title: string;
  file: string;
  tags: string[];
};

const qfaceLicense = "腾讯官方表情资源，仅供学习交流，请勿直接商用。";

const localMemes: LocalMeme[] = [
  { id: "qface-0", title: "惊讶", file: "0.png", tags: ["惊讶", "震惊", "意外", "愣住", "反转"] },
  { id: "qface-1", title: "撇嘴", file: "1.png", tags: ["不满", "嫌弃", "嘴硬", "冷淡"] },
  { id: "qface-3", title: "发呆", file: "3.png", tags: ["发呆", "沉默", "懵", "停顿"] },
  { id: "qface-5", title: "流泪", file: "5.png", tags: ["流泪", "委屈", "难受", "心软"] },
  { id: "qface-9", title: "大哭", file: "9.png", tags: ["大哭", "崩溃", "委屈", "难过"] },
  { id: "qface-10", title: "尴尬", file: "10.png", tags: ["尴尬", "心虚", "圆场", "露馅"] },
  { id: "qface-11", title: "发怒", file: "11.png", tags: ["生气", "发怒", "急了", "质问"] },
  { id: "qface-12", title: "调皮", file: "12.png", tags: ["调侃", "轻松", "逗", "玩笑"] },
  { id: "qface-14", title: "微笑", file: "14.png", tags: ["微笑", "平静", "礼貌", "克制"] },
  { id: "qface-15", title: "难过", file: "15.png", tags: ["难过", "失落", "低落", "遗憾"] },
  { id: "qface-18", title: "抓狂", file: "18.png", tags: ["抓狂", "崩溃", "急", "解释不清"] },
  { id: "qface-20", title: "偷笑", file: "20.png", tags: ["偷笑", "看穿", "调侃", "坏笑"] },
  { id: "qface-22", title: "白眼", file: "22.png", tags: ["白眼", "无语", "嫌弃", "不信"] },
  { id: "qface-26", title: "惊恐", file: "26.png", tags: ["惊恐", "害怕", "慌", "被发现"] },
  { id: "qface-27", title: "流汗", file: "27.png", tags: ["流汗", "紧张", "心虚", "尴尬"] },
  { id: "qface-28", title: "憨笑", file: "28.png", tags: ["憨笑", "装傻", "缓和", "圆场"] },
  { id: "qface-30", title: "奋斗", file: "30.png", tags: ["坚持", "认真", "解释", "补救"] },
  { id: "qface-32", title: "疑问", file: "32.png", tags: ["疑问", "不懂", "追问", "你说什么"] },
  { id: "qface-33", title: "嘘", file: "33.png", tags: ["嘘", "保密", "别说", "压低声音"] },
  { id: "qface-34", title: "晕", file: "34.png", tags: ["晕", "混乱", "信息量大", "懵"] },
  { id: "qface-38", title: "敲打", file: "38.png", tags: ["敲打", "警告", "敲醒", "别装"] },
  { id: "qface-41", title: "发抖", file: "41.png", tags: ["发抖", "害怕", "紧张", "慌"] },
  { id: "qface-49", title: "拥抱", file: "49.png", tags: ["安慰", "和解", "心软", "抱抱"] },
  { id: "qface-56", title: "刀", file: "56.png", tags: ["威胁", "狠话", "刀", "别逼我"] },
  { id: "qface-63", title: "玫瑰", file: "63.png", tags: ["暧昧", "示好", "礼物", "哄"] },
  { id: "qface-67", title: "心碎", file: "67.png", tags: ["心碎", "难过", "失望", "裂开"] },
  { id: "qface-76", title: "赞", file: "76.png", tags: ["赞", "认可", "可以", "成交"] },
  { id: "qface-77", title: "踩", file: "77.png", tags: ["踩", "否定", "不行", "嫌弃"] },
  { id: "qface-78", title: "握手", file: "78.png", tags: ["成交", "合作", "和解", "握手"] },
  { id: "qface-86", title: "怄火", file: "86.png", tags: ["火大", "生气", "忍住", "压火"] },
  { id: "qface-96", title: "冷汗", file: "96.png", tags: ["冷汗", "心虚", "危险", "被抓"] },
  { id: "qface-97", title: "擦汗", file: "97.png", tags: ["擦汗", "尴尬", "松口气", "险"] },
  { id: "qface-99", title: "鼓掌", file: "99.png", tags: ["鼓掌", "讽刺", "厉害", "佩服"] },
  { id: "qface-100", title: "糗大了", file: "100.png", tags: ["糗", "尴尬", "露馅", "丢脸"] },
  { id: "qface-101", title: "坏笑", file: "101.png", tags: ["坏笑", "试探", "看戏", "套话"] },
  { id: "qface-105", title: "鄙视", file: "105.png", tags: ["鄙视", "不信", "嫌弃", "嘲讽"] },
  { id: "qface-106", title: "委屈", file: "106.png", tags: ["委屈", "受伤", "难过", "不甘"] },
  { id: "qface-107", title: "快哭了", file: "107.png", tags: ["快哭", "委屈", "压抑", "忍住"] },
  { id: "qface-108", title: "阴险", file: "108.png", tags: ["阴险", "反咬", "套路", "设局"] },
  { id: "qface-110", title: "吓", file: "110.png", tags: ["吓", "震惊", "突然", "害怕"] },
  { id: "qface-111", title: "可怜", file: "111.png", tags: ["可怜", "求饶", "心软", "委屈"] }
];

export const localMemeAssets: MemeAsset[] = localMemes.map((meme) => ({
  id: meme.id,
  kind: "meme",
  title: meme.title,
  sourceName: "QFace",
  sourceUrl: "",
  licenseNote: qfaceLicense,
  localPath: `/memes/qface/${meme.file}`,
  tags: meme.tags,
  riskLevel: "restricted"
}));

const genericMemePattern = /^(meme|表情|表情包|发个表情|贴个表情|先别急|别急|破防了?|绷不住了?)$/i;

function hashText(value: string) {
  return [...value].reduce((total, char) => total + char.charCodeAt(0), 17);
}

export function isGenericMemeCopy(value?: string) {
  const text = (value || "").replace(/\s+/g, "").trim();
  return !text || genericMemePattern.test(text);
}

export function selectMemeAsset(text: string, emotion?: string) {
  const corpus = `${text} ${emotion || ""}`;
  let best = localMemes[hashText(corpus) % localMemes.length];
  let bestScore = 0;

  for (const meme of localMemes) {
    const score = meme.tags.reduce((total, tag) => total + (corpus.includes(tag) ? 3 : 0), 0) + (corpus.includes(meme.title) ? 4 : 0);
    if (score > bestScore) {
      best = meme;
      bestScore = score;
    }
  }

  return localMemeAssets.find((asset) => asset.id === best.id) || localMemeAssets[0];
}

export function normalizeMemeMessage(message: ChatMessage, context: string): ChatMessage {
  if (message.type !== "meme") return message;
  const selected = selectMemeAsset(`${message.text} ${context}`, message.emotion);
  const copy = isGenericMemeCopy(message.text) ? selected.title : message.text;
  return {
    ...message,
    text: copy,
    ttsText: undefined,
    assetId: selected.id,
    imageUrl: undefined,
    sendSfx: "meme"
  };
}
