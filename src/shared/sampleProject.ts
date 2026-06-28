import type { DramaProject } from "./schema.js";
import { avatarById } from "./avatarLibrary.js";
import { localMemeAssets } from "./memeLibrary.js";
import { viralPhotoAssets } from "./photoLibrary.js";

export const sampleProject: DramaProject = {
  id: "sample-blind-date-classmate",
  title: "张阿姨的相亲局",
  brief: "张阿姨给男主介绍了一个相亲对象，两人聊了半天，男主发现对方竟是小时候暗恋过的小学同学。女生一边装不熟，一边用旧绰号和小学毕业照把回忆翻出来。",
  stylePreset: "kuaishou-horizontal-chat",
  fps: 30,
  canvas: {
    width: 1516,
    height: 852
  },
  characters: [
    {
      id: "boy",
      name: "阿泽",
      side: "right",
      avatarInitial: "泽",
      avatarUrl: avatarById("boy-soft-selfie")?.url,
      avatarGradient: "linear-gradient(135deg,#0f172a,#7c2d12)",
      voiceId: "boy-nervous",
      voicePreset: "young_male",
      voiceDescription: "特别青年音的真实男生，20岁出头，声音干净偏低一点，语速自然，嘴硬但心虚，像真人微信语音"
    },
    {
      id: "girl",
      name: "林夏",
      side: "left",
      avatarInitial: "夏",
      avatarUrl: avatarById("girl-sweater-soft")?.url,
      avatarGradient: "linear-gradient(135deg,#f9a8d4,#64748b)",
      voiceId: "girl-calm",
      voicePreset: "young_real_female",
      voiceDescription: "非常年轻的真实女生，18到22岁，声音清亮自然，有轻微气声，冷静克制但带一点试探，像真人微信语音"
    }
  ],
  assets: [
    ...localMemeAssets,
    ...viralPhotoAssets,
    {
      id: "image-old-photo",
      kind: "image",
      title: "小学毕业照截图",
      sourceName: "Local Placeholder",
      sourceUrl: "",
      licenseNote: "本地占位图，正式导出前可替换为授权图片。",
      localPath: "/viral-assets/photos/phone-chat-blur.webp",
      tags: ["相亲", "小学同学", "毕业照", "旧照片"],
      riskLevel: "safe"
    }
  ],
  messages: [
    { id: "m01", roleId: "boy", side: "right", type: "text", text: "张阿姨把你推给我了", emotion: "试探", holdMs: 1300, pauseMs: 280, sendSfx: "send" },
    { id: "m02", roleId: "girl", side: "left", type: "text", text: "她也把你推给我了", emotion: "冷静", holdMs: 1250, pauseMs: 280, sendSfx: "send" },
    { id: "m03", roleId: "boy", side: "right", type: "text", text: "那我们算被安排了", emotion: "尴尬", holdMs: 1300, pauseMs: 300, sendSfx: "send" },
    { id: "m04", roleId: "girl", side: "left", type: "text", text: "你先别急着尴尬", emotion: "压着笑", holdMs: 1250, pauseMs: 300, sendSfx: "send" },
    { id: "m05", roleId: "boy", side: "right", type: "text", text: "聊了半天还不知道你名", emotion: "试探", holdMs: 1500, pauseMs: 360, sendSfx: "send" },
    { id: "m06", roleId: "girl", side: "left", type: "text", text: "林夏", emotion: "平静", holdMs: 850, pauseMs: 260, sendSfx: "send" },
    { id: "m07", roleId: "boy", side: "right", type: "text", text: "这个名字有点耳熟", emotion: "迟疑", holdMs: 1350, pauseMs: 340, sendSfx: "send" },
    { id: "m08", roleId: "girl", side: "left", type: "text", text: "大众名", emotion: "装淡定", holdMs: 900, pauseMs: 280, sendSfx: "send" },
    { id: "m09", roleId: "boy", side: "right", type: "text", text: "你小学在哪上的", emotion: "警觉", holdMs: 1300, pauseMs: 330, sendSfx: "send" },
    { id: "m10", roleId: "girl", side: "left", type: "text", text: "你终于问到重点了", emotion: "轻笑", holdMs: 1500, pauseMs: 380, sendSfx: "send" },
    { id: "m11", roleId: "boy", side: "right", type: "text", text: "等下", emotion: "慌", holdMs: 850, pauseMs: 260, sendSfx: "send" },
    { id: "m12", roleId: "boy", side: "right", type: "text", text: "你是三班那个林夏？", emotion: "震惊", holdMs: 1450, pauseMs: 360, sendSfx: "send" },
    { id: "m13", roleId: "girl", side: "left", type: "meme", text: "偷笑", assetId: "qface-20", emotion: "调侃", holdMs: 2300, pauseMs: 520, sendSfx: "meme" },
    { id: "m14", roleId: "girl", side: "left", type: "text", text: "张阿姨没告诉你？", emotion: "反问", holdMs: 1300, pauseMs: 340, sendSfx: "send" },
    { id: "m15", roleId: "boy", side: "right", type: "text", text: "她只说你很合适", emotion: "心虚", holdMs: 1350, pauseMs: 320, sendSfx: "send" },
    { id: "m16", roleId: "girl", side: "left", type: "text", text: "她还说你小时候乖", emotion: "试探", holdMs: 1450, pauseMs: 360, sendSfx: "send" },
    { id: "m17", roleId: "boy", side: "right", type: "text", text: "别提小时候", emotion: "躲闪", holdMs: 1150, pauseMs: 300, sendSfx: "send" },
    { id: "m18", roleId: "girl", side: "left", type: "text", text: "那你还记得小卖部吗", emotion: "回忆", holdMs: 1550, pauseMs: 380, sendSfx: "send" },
    { id: "m19", roleId: "boy", side: "right", type: "transfer", text: "我把豆浆钱还你", ttsText: "我把小时候欠你的豆浆钱还你。", amount: 8.8, transferNote: "小时候欠你的豆浆", emotion: "装轻松", holdMs: 1700, pauseMs: 420, sendSfx: "transfer" },
    { id: "m20", roleId: "girl", side: "left", type: "text", text: "欠了十五年才还？", emotion: "压着笑", holdMs: 1400, pauseMs: 340, sendSfx: "send" },
    { id: "m21", roleId: "boy", side: "right", type: "text", text: "你真是她？", emotion: "紧张", holdMs: 1050, pauseMs: 300, sendSfx: "send" },
    { id: "m22", roleId: "girl", side: "left", type: "image", text: "小学毕业照里你站我后排", ttsText: "你看，小学毕业照里你站我后排。", assetId: "image-old-photo", emotion: "摊牌", holdMs: 2600, pauseMs: 580, sendSfx: "image" },
    { id: "m23", roleId: "girl", side: "left", type: "text", text: "你那会儿老偷看我", emotion: "戳穿", holdMs: 1450, pauseMs: 360, sendSfx: "send" },
    { id: "m24", roleId: "boy", side: "right", type: "text", text: "我没有", emotion: "嘴硬", holdMs: 900, pauseMs: 280, sendSfx: "send" },
    { id: "m25", roleId: "girl", side: "left", type: "text", text: "你铅笔盒写了我名字", emotion: "温柔", holdMs: 1600, pauseMs: 380, sendSfx: "send" },
    { id: "m26", roleId: "boy", side: "right", type: "text", text: "张阿姨知道这事吗", emotion: "急", holdMs: 1300, pauseMs: 320, sendSfx: "send" },
    { id: "m27", roleId: "girl", side: "left", type: "text", text: "你张阿姨是我妈同学", emotion: "反转", holdMs: 1650, pauseMs: 420, sendSfx: "send" },
    { id: "m28", roleId: "girl", side: "left", type: "text", text: "也是我先点的头", emotion: "留钩子", holdMs: 1900, pauseMs: 700, sendSfx: "send" }
  ],
  sfx: {},
  audioMix: {
    ttsVolume: 1,
    sfxVolume: 0.28,
    ambientVolume: 0.035,
    limiterPeakDb: -1
  }
};
