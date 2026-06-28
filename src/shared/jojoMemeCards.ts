import type { ChatMessage } from "./schema";

export type JojoCssMemeTone = "jiaojiao" | "lingdang" | "zhuxiaodi" | "xitong" | "meeting";

export type JojoCssMemeCard = {
  id: string;
  title: string;
  subtitle: string;
  mark: string;
  tone: JojoCssMemeTone;
};

const jojoCssMemeCards: Record<string, JojoCssMemeCard> = {
  "jojo-meme-jiaojiao-flag": {
    id: "jojo-meme-jiaojiao-flag",
    title: "叫叫冲锋",
    subtitle: "先冲再说",
    mark: "🚀",
    tone: "jiaojiao"
  },
  "jojo-meme-lingdang-chart": {
    id: "jojo-meme-lingdang-chart",
    title: "铃铛分析",
    subtitle: "风险清单",
    mark: "📊",
    tone: "lingdang"
  },
  "jojo-meme-zhuxiaodi-like": {
    id: "jojo-meme-zhuxiaodi-like",
    title: "猪小弟点赞",
    subtitle: "靠谱支持",
    mark: "👍",
    tone: "zhuxiaodi"
  },
  "jojo-meme-xitong-notice": {
    id: "jojo-meme-xitong-notice",
    title: "系统已读",
    subtitle: "JOJO 职场",
    mark: "✅",
    tone: "xitong"
  },
  "jojo-meme-jiaojiao-deadline": {
    id: "jojo-meme-jiaojiao-deadline",
    title: "叫叫赶工",
    subtitle: "Deadline",
    mark: "⏰",
    tone: "jiaojiao"
  },
  "jojo-meme-meeting-silence": {
    id: "jojo-meme-meeting-silence",
    title: "会议沉默",
    subtitle: "全员静音",
    mark: "🤫",
    tone: "meeting"
  }
};

export function isJojoCssMemeAssetId(assetId: string | undefined) {
  return Boolean(assetId && jojoCssMemeCards[assetId]);
}

export function jojoCssMemeCardForMessage(message: ChatMessage) {
  return message.assetId ? jojoCssMemeCards[message.assetId] : undefined;
}
