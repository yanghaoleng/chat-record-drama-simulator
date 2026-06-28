import type { ChatMessage, DramaProject, MemeAsset } from "./schema";
import { localMemeAssets } from "./memeLibrary";
import { jojoPhotoAssets } from "./photoLibrary";

export const jojoCompanyAssets: MemeAsset[] = [
  {
    id: "jojo-photo-meeting-blur",
    kind: "image",
    title: "会议桌局部抓拍",
    sourceName: "AI-generated local bitmap",
    sourceUrl: "",
    licenseNote: "本地生成的真实办公室局部照片资产，无可识别正脸，公开商用前建议人工复核。",
    localPath: "/jojo-assets/photos/company-meeting-blur.webp",
    tags: ["公司", "会议", "办公室", "日常", "手", "电脑", "咖啡", "局部", "模糊"],
    riskLevel: "safe"
  },
  {
    id: "jojo-photo-corridor-blur",
    kind: "image",
    title: "电梯口背影抓拍",
    sourceName: "AI-generated local bitmap",
    sourceUrl: "",
    licenseNote: "本地生成的真实办公室局部照片资产，无可识别正脸，公开商用前建议人工复核。",
    localPath: "/jojo-assets/photos/company-corridor-blur.webp",
    tags: ["公司", "电梯", "走廊", "背影", "手", "手机", "运动模糊", "局部"],
    riskLevel: "safe"
  },
  {
    id: "jojo-meme-jiaojiao-flag",
    kind: "meme",
    title: "叫叫冲锋",
    sourceName: "CSS-rendered local component",
    sourceUrl: "",
    licenseNote: "由前端 HTML/CSS 绘制的固定表情卡。",
    tags: ["叫叫", "勇敢", "冲", "冒险", "开干"],
    riskLevel: "safe"
  },
  {
    id: "jojo-meme-lingdang-chart",
    kind: "meme",
    title: "铃铛分析",
    sourceName: "CSS-rendered local component",
    sourceUrl: "",
    licenseNote: "由前端 HTML/CSS 绘制的固定表情卡。",
    tags: ["铃铛", "冷静", "分析", "高知", "复盘"],
    riskLevel: "safe"
  },
  {
    id: "jojo-meme-zhuxiaodi-like",
    kind: "meme",
    title: "猪小弟点赞",
    sourceName: "CSS-rendered local component",
    sourceUrl: "",
    licenseNote: "由前端 HTML/CSS 绘制的固定表情卡。",
    tags: ["猪小弟", "靠谱", "点赞", "跟班", "支持"],
    riskLevel: "safe"
  },
  {
    id: "jojo-meme-xitong-notice",
    kind: "meme",
    title: "系统提醒",
    sourceName: "CSS-rendered local component",
    sourceUrl: "",
    licenseNote: "由前端 HTML/CSS 绘制的固定表情卡。",
    tags: ["系统", "提醒", "通知", "蓝色", "流程"],
    riskLevel: "safe"
  },
  {
    id: "jojo-meme-jiaojiao-deadline",
    kind: "meme",
    title: "叫叫赶工",
    sourceName: "CSS-rendered local component",
    sourceUrl: "",
    licenseNote: "由前端 HTML/CSS 绘制的固定表情卡。",
    tags: ["叫叫", "deadline", "赶工", "冒汗", "自嘲"],
    riskLevel: "safe"
  },
  {
    id: "jojo-meme-meeting-silence",
    kind: "meme",
    title: "会议沉默",
    sourceName: "CSS-rendered local component",
    sourceUrl: "",
    licenseNote: "由前端 HTML/CSS 绘制的固定表情卡。",
    tags: ["会议", "沉默", "尴尬", "背锅", "无语"],
    riskLevel: "safe"
  }
];

export const jojoProject: DramaProject = {
  id: "jojo-company-default",
  title: "工位蛐蛐小队",
  brief: "叫叫是用户自己扮演的勇敢小鸡吉祥物，和铃铛、猪小弟、系统在叫叫公司上班。剧情围绕公司日常吐槽、自嘲、会议、需求、排期和职场小反转展开。",
  stylePreset: "jojo-company-chat",
  fps: 30,
  canvas: {
    width: 1516,
    height: 852
  },
  characters: [
    {
      id: "jiaojiao",
      name: "叫叫",
      side: "right",
      avatarInitial: "叫",
      avatarUrl: "/avatars/jojo/jiaojiao.webp",
      avatarGradient: "linear-gradient(135deg,#fbbf24,#2563eb)",
      voiceId: "jojo-jiaojiao",
      voicePreset: "young_male",
      voiceDescription: "年轻、有冒险感的小鸡吉祥物声线，语速轻快，带一点嘴硬和热血，像用户自己在公司群里发言"
    },
    {
      id: "lingdang",
      name: "铃铛",
      side: "left",
      avatarInitial: "铃",
      avatarUrl: "/avatars/jojo/lingdang.webp",
      avatarGradient: "linear-gradient(135deg,#60a5fa,#c4b5fd)",
      voiceId: "jojo-lingdang",
      voicePreset: "young_real_female",
      voiceDescription: "年轻女生，高知、冷静、聪明机灵，表达清晰，偶尔带一点温柔吐槽"
    },
    {
      id: "zhuxiaodi",
      name: "猪小弟",
      side: "left",
      avatarInitial: "猪",
      avatarUrl: "/avatars/jojo/zhuxiaodi.webp",
      avatarGradient: "linear-gradient(135deg,#f9a8d4,#f97316)",
      voiceId: "jojo-zhuxiaodi",
      voicePreset: "young_male",
      voiceDescription: "憨厚踏实的年轻男生，语气诚恳慢一点，家里条件好但不炫耀，是叫叫的小跟班"
    },
    {
      id: "xitong",
      name: "系统",
      side: "left",
      avatarInitial: "系",
      avatarUrl: "/avatars/jojo/xitong.webp",
      avatarGradient: "linear-gradient(135deg,#38bdf8,#0f172a)",
      voiceId: "jojo-xitong",
      voicePreset: "young_real_female",
      voiceDescription: "中性偏女性的系统播报声，冷静、短促、带一点无情流程感"
    }
  ],
  assets: [...localMemeAssets, ...jojoCompanyAssets, ...jojoPhotoAssets],
  messages: [
    { id: "jojo-m01", roleId: "xitong", side: "left", type: "text", text: "早会还有3分钟", emotion: "提醒", holdMs: 1300, pauseMs: 300, sendSfx: "send" },
    { id: "jojo-m02", roleId: "jiaojiao", side: "right", type: "text", text: "我已经在路上了", emotion: "嘴硬", holdMs: 1400, pauseMs: 320, sendSfx: "send" },
    { id: "jojo-m03", roleId: "lingdang", side: "left", type: "text", text: "你定位在电梯口", emotion: "冷静戳穿", holdMs: 1600, pauseMs: 340, sendSfx: "send" },
    { id: "jojo-m04", roleId: "zhuxiaodi", side: "left", type: "text", text: "叫哥算进公司了", emotion: "憨厚圆场", holdMs: 1400, pauseMs: 300, sendSfx: "send" },
    { id: "jojo-m05", roleId: "jiaojiao", side: "right", type: "text", text: "电梯口也是前线", emotion: "热血自嘲", holdMs: 1450, pauseMs: 320, sendSfx: "send" },
    { id: "jojo-m06", roleId: "lingdang", side: "left", type: "text", text: "勇敢和迟到不冲突", emotion: "淡定吐槽", holdMs: 1600, pauseMs: 340, sendSfx: "send" },
    { id: "jojo-m07", roleId: "xitong", side: "left", type: "image", text: "会议桌局部抓拍：几只手围着电脑，旁边有一杯冷掉的咖啡", ttsText: "会议桌局部抓拍，几只手围着电脑，旁边有一杯冷掉的咖啡。", assetId: "jojo-photo-meeting-blur", emotion: "无情记录", holdMs: 2500, pauseMs: 520, sendSfx: "image" },
    { id: "jojo-m08", roleId: "jiaojiao", side: "right", type: "meme", text: "叫叫赶工", assetId: "jojo-meme-jiaojiao-deadline", emotion: "冒汗", holdMs: 2200, pauseMs: 480, sendSfx: "meme" },
    { id: "jojo-m09", roleId: "zhuxiaodi", side: "left", type: "text", text: "我给你占位了", emotion: "踏实", holdMs: 1200, pauseMs: 300, sendSfx: "send" },
    { id: "jojo-m10", roleId: "zhuxiaodi", side: "left", type: "text", text: "顺便买了早餐", emotion: "憨厚", holdMs: 1300, pauseMs: 320, sendSfx: "send" },
    { id: "jojo-m11", roleId: "jiaojiao", side: "right", type: "text", text: "不愧是我小跟班", emotion: "得意", holdMs: 1500, pauseMs: 340, sendSfx: "send" },
    { id: "jojo-m12", roleId: "lingdang", side: "left", type: "text", text: "他还垫了会议室费", emotion: "机灵补刀", holdMs: 1500, pauseMs: 340, sendSfx: "send" },
    { id: "jojo-m13", roleId: "jiaojiao", side: "right", type: "text", text: "会议室还要钱？", emotion: "震惊", holdMs: 1300, pauseMs: 300, sendSfx: "send" },
    { id: "jojo-m14", roleId: "xitong", side: "left", type: "transfer", text: "会议室超时费用", ttsText: "会议室超时费用，请叫叫确认。", amount: 88, transferNote: "会议室超时费用", emotion: "流程无情", holdMs: 1800, pauseMs: 420, sendSfx: "transfer" },
    { id: "jojo-m15", roleId: "lingdang", side: "left", type: "text", text: "冒险的代价出现了", emotion: "平静", holdMs: 1550, pauseMs: 340, sendSfx: "send" },
    { id: "jojo-m16", roleId: "jiaojiao", side: "right", type: "text", text: "今天先冒险到账单", emotion: "自嘲", holdMs: 1600, pauseMs: 360, sendSfx: "send" },
    { id: "jojo-m17", roleId: "zhuxiaodi", side: "left", type: "meme", text: "猪小弟点赞", assetId: "jojo-meme-zhuxiaodi-like", emotion: "支持", holdMs: 2100, pauseMs: 520, sendSfx: "meme" },
    { id: "jojo-m18", roleId: "lingdang", side: "left", type: "text", text: "别急，老板还没进群", emotion: "会来事", holdMs: 1500, pauseMs: 340, sendSfx: "send" },
    { id: "jojo-m19", roleId: "xitong", side: "left", type: "text", text: "老板已读", emotion: "冷淡", holdMs: 1200, pauseMs: 500, sendSfx: "send" },
    { id: "jojo-m20", roleId: "jiaojiao", side: "right", type: "text", text: "那我先勇敢下线", emotion: "反转逃跑", holdMs: 1900, pauseMs: 700, sendSfx: "send" }
  ] satisfies ChatMessage[],
  sfx: {},
  audioMix: {
    ttsVolume: 1,
    sfxVolume: 0.28,
    ambientVolume: 0.035,
    limiterPeakDb: -1
  }
};

export function isJojoProject(project: DramaProject) {
  return project.stylePreset === "jojo-company-chat";
}
