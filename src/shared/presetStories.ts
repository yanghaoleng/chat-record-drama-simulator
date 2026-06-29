import { jojoProject } from "./jojoProject.js";
import { sampleProject } from "./sampleProject.js";
import { parseProject, type ChatMessage, type DramaProject } from "./schema.js";
import type { PromptCard, StoryPackage } from "./linearStory.js";

type PresetMessageSpec = {
  roleId: string;
  text: string;
  type?: ChatMessage["type"];
  assetId?: string;
  emotion?: string;
  ttsText?: string;
  pauseMs?: number;
  holdMs?: number;
  amount?: number;
  transferNote?: string;
  sendSfx?: ChatMessage["sendSfx"];
};

export type PresetStory = {
  id: string;
  title: string;
  prompt: string;
  nextPrompt: string;
  messages: PresetMessageSpec[];
};

export type ViralPresetRole = "male" | "female";
export type JojoPresetRole = "jiaojiao" | "zhuxiaodi" | "lingdang";
export type PresetRoleSelection = {
  viralRole: ViralPresetRole;
  jojoRole: JojoPresetRole;
};

export type PresetInitialArchive = {
  preset: PresetStory;
  presetIndex: number;
  roleSelection: PresetRoleSelection;
  project: DramaProject;
  promptCards: PromptCard[];
  nextPrompt: string;
  cachedFirstSegment: {
    project: DramaProject;
    card: PromptCard;
    messages: ChatMessage[];
    suggestedPrompt: string;
  };
};

const m = (
  roleId: string,
  text: string,
  options: Omit<PresetMessageSpec, "roleId" | "text"> = {}
): PresetMessageSpec => ({ roleId, text, ...options });

export const defaultPresetRoleSelection: PresetRoleSelection = {
  viralRole: "male",
  jojoRole: "jiaojiao"
};

export function normalizePresetRoleSelection(selection: Partial<PresetRoleSelection> = {}): PresetRoleSelection {
  return {
    viralRole: selection.viralRole === "female" ? "female" : "male",
    jojoRole: selection.jojoRole === "lingdang" || selection.jojoRole === "zhuxiaodi" ? selection.jojoRole : "jiaojiao"
  };
}

const viralMalePresetStories: PresetStory[] = [
  {
    id: "viral-blind-date-standin",
    title: "相亲对象临时顶号",
    prompt: "男主被张阿姨安排相亲，对方女生一开始很配合，聊到一半才承认自己是替朋友顶号来的陌生人。她本来想帮朋友拒绝，却因为男主资料里的一个备注临时改主意。",
    nextPrompt: "接着写女生把朋友的拒绝话术截图发来，男主发现她把最狠的几句删掉了。两个人从尴尬顶号，变成陌生人之间的互相试用。",
    messages: [
      m("boy", "张阿姨把你推给我了"),
      m("girl", "她推的是我朋友"),
      m("boy", "那你是谁"),
      m("girl", "临时顶号的人"),
      m("boy", "这算相亲诈骗吗"),
      m("girl", "本来是来帮她拒绝你"),
      m("boy", "那现在拒了吗"),
      m("girl", "还没"),
      m("boy", "为什么犹豫"),
      m("girl", "相亲资料截图局部：备注写着会做饭，不催婚", { type: "image", assetId: "viral-photo-phone-chat", emotion: "改主意" }),
      m("girl", "这个备注挺少见"),
      m("boy", "你要求挺具体"),
      m("girl", "陌生人只能先看条件"),
      m("boy", "那我条件过了吗"),
      m("girl", "先给你一轮试用")
    ]
  },
  {
    id: "viral-wrong-gym-report",
    title: "错发的体测报告",
    prompt: "健身房女生把体测报告错发给男主，男主准备删掉，却发现报告里备注了一个很危险的训练计划。两个陌生人从尴尬错发，变成一起阻止黑心私教。",
    nextPrompt: "接着写女生承认那份报告不是男主的，但她怀疑私教在批量骗新会员。男主一边嘴硬说别拉他下水，一边开始帮她对证据。",
    messages: [
      m("girl", "你的体测报告出来了"),
      m("boy", "你发错人了"),
      m("girl", "等下，别删"),
      m("boy", "陌生报告我不看"),
      m("girl", "里面有私教备注"),
      m("boy", "跟我有什么关系"),
      m("girl", "他说这个人必须买课"),
      m("boy", "这不是坑人吗"),
      m("girl", "手机截图局部：体测表旁边写着重点推高价课", { type: "image", assetId: "viral-photo-hand-phone", emotion: "证据" }),
      m("boy", "你们内部都这么写？"),
      m("girl", "所以我才发给你"),
      m("boy", "我只是路过的陌生人"),
      m("girl", "陌生人才好作证"),
      m("boy", "你倒挺会拉人"),
      m("girl", "你倒挺会看重点")
    ]
  },
  {
    id: "viral-client-price-test",
    title: "甲方在测试底线",
    prompt: "男主接到一个陌生女客户，对方连续压价又改需求，像故意找茬。男主快要拒单时，她发来内部报价截图，暗示自己其实在帮他挡更狠的采购。",
    nextPrompt: "接着写女生把真正的采购群截图发给男主，男主发现她刚刚那些难听话是在预演压价。两个人从互相防备，变成临时同盟。",
    messages: [
      m("girl", "这个报价还能再低吗"),
      m("boy", "已经是最低了"),
      m("girl", "交付还要提前三天"),
      m("boy", "那你找别人吧"),
      m("girl", "先别急着退"),
      m("boy", "你都压到骨折了"),
      m("girl", "我在替你挡采购"),
      m("boy", "我们认识吗"),
      m("girl", "不认识，所以才好说实话"),
      m("girl", "电脑屏幕局部：采购群里有人要求再砍 40%", { type: "image", assetId: "viral-photo-cafe-table", emotion: "摊牌" }),
      m("boy", "你刚刚是在演？"),
      m("girl", "预演他们会怎么压你"),
      m("boy", "那你站哪边"),
      m("girl", "站能把项目做完那边"),
      m("boy", "突然没那么讨厌你了")
    ]
  },
  {
    id: "viral-rainy-carpool-proof",
    title: "拼车乘客的录音",
    prompt: "雨夜拼车后，陌生女乘客加男主说他被司机绕路多扣了钱。男主以为她多管闲事，直到她发来录音和路线截图，两个陌生人开始一起投诉。",
    nextPrompt: "接着写女生说自己不是第一次遇到这个司机，男主本来只想拿回车费，却发现她一直在帮陌生乘客留证据。",
    messages: [
      m("girl", "你刚刚被绕路了"),
      m("boy", "你是拼车那个？"),
      m("girl", "坐后排那个陌生人"),
      m("boy", "你怎么知道绕路"),
      m("girl", "我录了路线"),
      m("boy", "你还录音？"),
      m("girl", "他说前面堵车"),
      m("girl", "但导航不是这么走"),
      m("girl", "雨夜车窗局部：导航路线和实际轨迹明显分叉", { type: "image", assetId: "viral-photo-rainy-car-window", emotion: "证据" }),
      m("boy", "你为什么帮我"),
      m("girl", "因为他也坑过我"),
      m("boy", "那这次一起投诉？"),
      m("girl", "我证据齐了"),
      m("boy", "你挺厉害"),
      m("girl", "陌生人互救一下")
    ]
  },
  {
    id: "viral-scammer-soft-heart",
    title: "骗子也会心软吗",
    prompt: "女生伪装成投资客服用套路开场，男主很快识破但没有拉黑。两个人互相拆招，女生从话术里漏出真实情绪，男主开始想把她攻略回正轨。",
    nextPrompt: "接着写女生第一次不用话术回复男主，承认自己只是临时顶班，男主顺势提出一个交换条件：她说真话，他就继续聊。",
    messages: [
      m("girl", "先生，最近有个稳健收益项目了解一下吗"),
      m("boy", "第一句就这么官方"),
      m("girl", "我们这边名额有限"),
      m("boy", "你们话术第几页了"),
      m("girl", "你很懂？"),
      m("boy", "懂一点，也被骗过一点"),
      m("girl", "那你还不拉黑"),
      m("boy", "因为你复制慢了"),
      m("boy", "说明你在犹豫"),
      m("girl", "模糊聊天屏幕：项目表格停在未发送状态", { type: "image", assetId: "viral-photo-phone-chat", emotion: "露馅" }),
      m("girl", "你这人挺烦的"),
      m("boy", "但你还在回"),
      m("girl", "今天没人问我累不累"),
      m("boy", "那我问"),
      m("boy", "现在还想骗我吗"),
      m("girl", "不太想了")
    ]
  },
  {
    id: "viral-coffee-wrong-order",
    title: "咖啡店的错单",
    prompt: "常去咖啡店的女生把别人的订单误发给男主，男主发现备注里写着“靠窗那个总装冷静的人”。错单变成互相观察的入口。",
    nextPrompt: "接着写女生假装只是工作备注，男主开始反问她为什么知道自己每次都坐靠窗，暧昧从日常细节里升温。",
    messages: [
      m("girl", "你的冰拿铁好了"),
      m("boy", "我今天没点"),
      m("girl", "啊，发错了"),
      m("boy", "备注也发错了吗"),
      m("girl", "你看到了？"),
      m("boy", "靠窗那个总装冷静的人"),
      m("girl", "工作需要，方便识别客人"),
      m("boy", "那你识别得挺细"),
      m("girl", "你每次都等冰化一半才喝"),
      m("girl", "昏暗咖啡桌空镜：杯子旁有一张写错的订单纸", { type: "image", assetId: "viral-photo-cafe-table", emotion: "错单" }),
      m("boy", "你观察多久了"),
      m("girl", "从你第一次坐靠窗开始"),
      m("boy", "那我明天换位置"),
      m("girl", "别换"),
      m("girl", "我会找不到你")
    ]
  },
  {
    id: "viral-property-wrong-bill",
    title: "物业群加错账单",
    prompt: "陌生物业女生发来停车费催缴，男主发现车牌不是自己的。女生一开始按流程催，后来发现系统把两户账单合并，她开始偷偷教男主怎么反查物业漏洞。",
    nextPrompt: "接着写女生把后台截图发给男主，证明不止他一个人被合并扣费。男主从反感催缴，变成和她一起把账单问题捅出来。",
    messages: [
      m("girl", "停车费今天要补缴"),
      m("boy", "我没有车"),
      m("girl", "系统显示你有"),
      m("boy", "系统还挺会造谣"),
      m("girl", "车牌尾号 7A2"),
      m("boy", "完全不是我的"),
      m("girl", "等一下"),
      m("girl", "你这户被合并了"),
      m("boy", "还能这么离谱？"),
      m("girl", "门口鞋柜和物业缴费单局部，户号被红笔圈出", { type: "image", assetId: "viral-photo-shoes-door", emotion: "漏洞" }),
      m("boy", "你刚刚还催得很凶"),
      m("girl", "流程要凶，脑子不用"),
      m("boy", "那现在怎么办"),
      m("girl", "我教你查后台编号"),
      m("boy", "你不怕被投诉？"),
      m("girl", "怕你白交钱")
    ]
  },
  {
    id: "viral-support-breaks-script",
    title: "售后客服不按流程",
    prompt: "男主报修空调，陌生售后女生突然让他先别付款，说维修师傅给的报价明显异常。她一边按流程聊天，一边用很小声的文字提醒男主别被坑。",
    nextPrompt: "接着写女生发来正规价目表截图，男主发现上门师傅多报了一倍。女生表面继续客服话术，实际在教他怎么当场拒绝。",
    messages: [
      m("girl", "您好，请问空调是什么故障"),
      m("boy", "制冷不太行"),
      m("girl", "师傅到你家了吗"),
      m("boy", "到了，说要 680"),
      m("girl", "先别付"),
      m("boy", "你不是客服吗"),
      m("girl", "客服也看不下去"),
      m("boy", "这价格不对？"),
      m("girl", "高了一倍"),
      m("girl", "床头遥控器和维修报价单局部，手写金额 680", { type: "image", assetId: "viral-photo-bedside-props", emotion: "提醒" }),
      m("boy", "你这样提醒我合规吗"),
      m("girl", "我没提醒"),
      m("girl", "我只是发价目表"),
      m("boy", "懂了"),
      m("girl", "先生，请按正规流程确认"),
      m("boy", "你这流程挺救命")
    ]
  },
  {
    id: "viral-umbrella-convenience-store",
    title: "便利店雨伞归还",
    prompt: "楼下便利店常遇见的女生发来消息说男主的伞落在她那里。男主以为她是店员，后来发现她只是每晚同时间出现的同城路人。",
    nextPrompt: "接着写女生说她不是店员，只是每晚都在那里等雨停，男主意识到两个人的日常轨迹早就重叠很久了。",
    messages: [
      m("girl", "你的伞落我这了"),
      m("boy", "你是便利店店员？"),
      m("girl", "不是"),
      m("boy", "那怎么在你那"),
      m("girl", "因为你昨晚把伞让给我了"),
      m("boy", "雨太大，我没想那么多"),
      m("girl", "我想了挺多"),
      m("boy", "比如？"),
      m("girl", "比如你每晚十点二十都会下楼"),
      m("girl", "夜晚街道路灯空镜，便利店门口有一把黑伞", { type: "image", assetId: "viral-photo-night-street", emotion: "缘分" }),
      m("boy", "你观察我？"),
      m("girl", "是路线重合"),
      m("boy", "那今晚还重合吗"),
      m("girl", "看你来不来拿伞"),
      m("boy", "十点二十见")
    ]
  },
  {
    id: "viral-wedding-photo-misfire",
    title: "伴娘发错照片",
    prompt: "朋友婚礼结束后，陌生伴娘女生把一组照片误发给男主。男主准备提醒她删掉，却发现照片角落拍到了新郎偷偷收起另一枚戒指。",
    nextPrompt: "接着写女生意识到那不是普通花絮，而是婚礼现场的关键证据。男主只想置身事外，她却请他帮忙确认照片时间线。",
    messages: [
      m("girl", "婚礼照片我发你几张"),
      m("boy", "你发错人了"),
      m("girl", "啊？你不是摄影师？"),
      m("boy", "我是同桌宾客"),
      m("girl", "那你先别删"),
      m("boy", "为什么"),
      m("girl", "第三张角落"),
      m("boy", "新郎手里是什么"),
      m("girl", "我也想问"),
      m("girl", "模糊婚礼照片局部：桌牌旁露出一枚被握住的戒指", { type: "image", assetId: "viral-photo-phone-chat", emotion: "疑点" }),
      m("boy", "这不是新娘那枚吧"),
      m("girl", "所以麻烦了"),
      m("boy", "我只是吃席的"),
      m("girl", "吃席也有眼睛"),
      m("boy", "你这求助挺硬"),
      m("girl", "因为照片挺硬")
    ]
  }
];

const viralFemalePresetStories: PresetStory[] = [
  {
    id: "viral-female-leaking-neighbor",
    title: "楼下陌生邻居",
    prompt: "女主收到楼下陌生男生消息，说她洗衣机漏水漏到他家。女主以为对方讹人，对方却发来天花板滴水和维修单，两个陌生邻居从互怼变成一起找物业。",
    nextPrompt: "接着写男生没有急着要赔偿，而是提醒女主先拍自家地漏。女主发现真正的问题可能是公共管道，两个人临时结盟对物业。",
    messages: [
      m("boy", "你家是不是在洗衣服"),
      m("girl", "你谁啊"),
      m("boy", "你楼下"),
      m("girl", "楼下也不能乱加人"),
      m("boy", "我家天花板在下雨"),
      m("girl", "你别一上来讹我"),
      m("boy", "我也不想认识你"),
      m("boy", "门口拖鞋和水桶局部，天花板正往下滴水", { type: "image", assetId: "viral-photo-shoes-door", emotion: "证据" }),
      m("girl", "这真是我家漏的？"),
      m("boy", "先别赔钱"),
      m("boy", "你拍下地漏"),
      m("girl", "你还挺懂"),
      m("boy", "被物业坑过"),
      m("girl", "那我们先别互坑"),
      m("boy", "先坑物业")
    ]
  },
  {
    id: "viral-female-roadside-jumpstart",
    title: "路边临时搭电",
    prompt: "女主车坏在路边，陌生男生主动说可以帮她搭电。女主怀疑他是骗局，对方先发证件和工具箱照片，还提醒她全程开着视频，陌生防备慢慢变成信任。",
    nextPrompt: "接着写男生搭电成功后不收钱，只让女主把故障码拍下来留证。女主发现他不是热心过头，而是刚刚也看见修理厂准备乱报价。",
    messages: [
      m("girl", "你多久能到"),
      m("boy", "我在你车后面"),
      m("girl", "你不是平台师傅"),
      m("boy", "路过，有搭电线"),
      m("girl", "陌生人我不敢开门"),
      m("boy", "对，别开"),
      m("boy", "你车窗留缝就行"),
      m("girl", "你倒挺会避嫌"),
      m("boy", "路边车灯和工具箱局部，搭电线放在雨里", { type: "image", assetId: "viral-photo-rainy-car-window", emotion: "自证" }),
      m("girl", "这个工具真能用？"),
      m("boy", "能，但先开视频"),
      m("girl", "你怕我讹你？"),
      m("boy", "也怕你怕我"),
      m("girl", "行，陌生人合作"),
      m("boy", "合作到车能启动")
    ]
  },
  {
    id: "viral-female-wrong-transfer-note",
    title: "转账备注误会",
    prompt: "女主突然收到陌生男生一笔转账，对方说转错了。她准备退回，却看见备注写着“别让她知道”，一笔错账牵出对方被朋友利用的秘密。",
    nextPrompt: "接着写男生急着解释这笔钱不是给女主的，女主要求他先把聊天截图讲清楚。两个陌生人因为一条备注，被迫一起拆一个局。",
    messages: [
      m("boy", "不好意思，转错人了"),
      m("girl", "你转了 520"),
      m("boy", "手滑，麻烦退下"),
      m("girl", "备注也手滑？"),
      m("boy", "你别看那个"),
      m("girl", "别让她知道"),
      m("girl", "这句给谁看的"),
      m("boy", "不是给你的"),
      m("girl", "那我更不能秒退"),
      m("boy", "微信转账截图局部：金额 520，备注写着别让她知道", { type: "image", assetId: "viral-photo-phone-chat", emotion: "疑点" }),
      m("boy", "我朋友拿我号转的"),
      m("girl", "证据呢"),
      m("boy", "你一个陌生人这么谨慎？"),
      m("girl", "陌生钱更要谨慎"),
      m("boy", "行，我发聊天记录")
    ]
  },
  {
    id: "viral-female-pharmacy-mixup",
    title: "深夜药袋拿错",
    prompt: "女主半夜买药，回家后收到陌生男生消息，说两人的药袋被店员拿错了。女主以为是搭讪，对方发来药袋照片和用药禁忌，陌生提醒变成惊险换药。",
    nextPrompt: "接着写男生发现女主那袋药里有不能混吃的成分，催她先别吃。女主从防备变成主动让他拍完整小票核对。",
    messages: [
      m("boy", "你药袋是不是拿错了"),
      m("girl", "你哪位"),
      m("boy", "刚刚药店排你后面"),
      m("girl", "你怎么加到我"),
      m("boy", "小票上有手机号"),
      m("girl", "这更吓人了"),
      m("boy", "所以我先发证据"),
      m("boy", "药袋和小票局部，姓名贴纸被折住一半", { type: "image", assetId: "viral-photo-bedside-props", emotion: "换错" }),
      m("girl", "这袋确实不是我的"),
      m("boy", "先别吃胃药"),
      m("girl", "为什么"),
      m("boy", "里面有个不能混"),
      m("girl", "你等下拍完整小票"),
      m("boy", "已经在拍")
    ]
  },
  {
    id: "viral-female-design-client-trap",
    title: "临时甲方太难搞",
    prompt: "女主作为设计师对接陌生男客户，对方连续改需求，像故意折磨人。女主准备拉黑时，对方发来竞品抄袭截图，说明他是在逼她把关键证据藏进方案里。",
    nextPrompt: "接着写男客户承认公司内部有人想偷女主方案，刚才那些奇怪要求是在帮她留痕。女主不再客气，开始反过来设计一版能自证版权的稿。",
    messages: [
      m("boy", "首页标题想再克制一点"),
      m("girl", "你已经改第六次了"),
      m("boy", "还要再留一个暗标"),
      m("girl", "你是客户还是找茬"),
      m("boy", "先别撤单"),
      m("girl", "给我一个理由"),
      m("boy", "有人想拿你的稿"),
      m("girl", "你们内部？"),
      m("boy", "对，所以要留痕"),
      m("boy", "手机屏幕局部：竞品页面和女主设计稿局部高度相似", { type: "image", assetId: "viral-photo-hand-phone", emotion: "证据" }),
      m("girl", "你刚刚是在拖时间？"),
      m("boy", "也是在帮你埋证据"),
      m("girl", "陌生客户这么好心？"),
      m("boy", "陌生客户也怕背锅"),
      m("girl", "那这版我来设计陷阱")
    ]
  },
  {
    id: "viral-female-driver-earring",
    title: "车里捡到耳钉",
    prompt: "女主打车后发现耳钉不见了，陌生男司机发来照片说在后座。女主怕被套路要求快递，对方却发来行车记录仪截图，里面还拍到她朋友偷偷翻她包。",
    nextPrompt: "接着写男司机说耳钉可以明天送到派出所，但行车记录仪那段要不要先发给女主。女主意识到真正麻烦的不是耳钉，而是身边人。",
    messages: [
      m("boy", "你耳钉落我车上了"),
      m("girl", "哪只？"),
      m("boy", "银色月亮那只"),
      m("girl", "你是刚刚司机？"),
      m("boy", "嗯，尾号 36"),
      m("girl", "我让朋友去拿"),
      m("boy", "先别让她来"),
      m("girl", "为什么"),
      m("boy", "车座缝里的银色耳钉局部，后排包链也被拉开", { type: "image", assetId: "viral-photo-night-street", emotion: "遗落" }),
      m("girl", "你拍到什么了？"),
      m("boy", "行车记录仪有后排"),
      m("girl", "她翻我包？"),
      m("boy", "我只说有画面"),
      m("girl", "耳钉先别给任何人"),
      m("boy", "可以送派出所"),
      m("girl", "你比朋友靠谱")
    ]
  },
  {
    id: "viral-female-wedding-host-rescue",
    title: "婚礼司仪临时求救",
    prompt: "女主临时当伴娘，陌生男司仪突然私聊她，说新娘在后台哭到不肯上台，请她把发言稿改成能救场的版本。女主一开始拒绝，却发现流程单上有新郎瞒着所有人的环节。",
    nextPrompt: "接着写司仪把被删掉的流程页发给女主，里面有一个会让新娘难堪的惊喜。女主和这个陌生司仪临时配合，把婚礼从翻车边缘拉回来。",
    messages: [
      m("boy", "伴娘发言稿能改吗"),
      m("girl", "现在？"),
      m("boy", "新娘在后台哭"),
      m("girl", "你是司仪？"),
      m("boy", "对，现场快顶不住了"),
      m("girl", "我又不是救火队"),
      m("boy", "新郎加了隐藏环节"),
      m("girl", "什么环节"),
      m("boy", "婚礼桌牌和流程单局部，红笔圈出惊喜视频", { type: "image", assetId: "viral-photo-phone-chat", emotion: "救场" }),
      m("girl", "她根本不想放这个"),
      m("boy", "所以我找你"),
      m("girl", "陌生司仪挺敢"),
      m("boy", "伴娘更敢"),
      m("girl", "把流程页全发我"),
      m("boy", "发，救场靠你")
    ]
  },
  {
    id: "viral-female-rental-contract",
    title: "合租合同里的旧名",
    prompt: "女主看新房合租合同，发现对方男室友的紧急联系人写着她以前的网名。她开始怀疑这不是普通合租。",
    nextPrompt: "接着写男生解释那是很早以前记下的名字，女主逼问他是不是论坛里那个一直帮她回帖的人。",
    messages: [
      m("girl", "合同我看了"),
      m("boy", "哪里不对？"),
      m("girl", "紧急联系人为什么写星野"),
      m("boy", "你看到那页了"),
      m("girl", "那是我以前网名"),
      m("boy", "我知道"),
      m("girl", "你最好解释"),
      m("boy", "高中论坛，你总半夜发帖"),
      m("girl", "你是那个回帖的人？"),
      m("boy", "租房合同和旧钥匙局部，联系人一栏被手指压住", { type: "image", assetId: "viral-photo-shoes-door", emotion: "旧名" }),
      m("boy", "我怕你删号后找不到"),
      m("girl", "所以你把我写进合同？"),
      m("boy", "不太理智"),
      m("girl", "确实"),
      m("girl", "但我想听完")
    ]
  },
  {
    id: "viral-female-food-delivery",
    title: "外卖备注太熟",
    prompt: "女主点外卖，骑手男生发来消息说备注写得像她本人。她以为对方嘴甜，结果发现他是以前总给她带夜宵的学长。",
    nextPrompt: "接着写男生说他不是故意接单，是看到地址后犹豫很久才联系。女主嘴上嫌他绕，心里已经认出来。",
    messages: [
      m("boy", "你的外卖到了"),
      m("girl", "放门口就行"),
      m("boy", "备注写少辣多醋"),
      m("girl", "有什么问题"),
      m("boy", "你以前也这样"),
      m("girl", "你们骑手还查历史？"),
      m("boy", "不是平台历史"),
      m("boy", "是我记性不好忘不掉"),
      m("girl", "你是谁"),
      m("boy", "夜宵外卖袋局部，备注贴纸写着少辣多醋", { type: "image", assetId: "viral-photo-takeout-food", emotion: "旧习惯" }),
      m("boy", "以前给你带炒粉的学长"),
      m("girl", "程礼？"),
      m("boy", "嗯"),
      m("girl", "你绕这么大一圈"),
      m("boy", "怕你不收")
    ]
  },
  {
    id: "viral-female-subway-seat",
    title: "地铁让座的人",
    prompt: "女主地铁上收到陌生男生消息，说她包上的挂件快掉了。她回头没看到人，对方却发来一个只有老同学才知道的称呼。",
    nextPrompt: "接着写男生说他站在下一节车厢，不敢直接叫她。女主让他下一站别下车，两个人隔着人群重新连上。",
    messages: [
      m("boy", "你包上挂件快掉了"),
      m("girl", "你是谁"),
      m("boy", "刚刚站你旁边"),
      m("girl", "我没看到"),
      m("boy", "人太多"),
      m("girl", "那你怎么加到我"),
      m("boy", "校友群里翻到的"),
      m("girl", "你别吓我"),
      m("boy", "小鹿班长，别紧张"),
      m("boy", "夜晚街道虚焦：包带上的小鹿挂件快松开", { type: "image", assetId: "viral-photo-night-street", emotion: "隔着人群" }),
      m("girl", "这个称呼只有初中同学知道"),
      m("boy", "所以我不是陌生人"),
      m("girl", "你在哪节车厢"),
      m("boy", "下一节"),
      m("girl", "下一站别下")
    ]
  }
];

const jojoPresetStories: PresetStory[] = [
  {
    id: "jojo-new-coworker",
    title: "新同事像领导亲戚",
    prompt: "公司来了一个神秘新同事，大家从头像、入群方式和自我介绍里疯狂推理他的来头，主打蛐蛐空降和入职仪式感。",
    nextPrompt: "接着写新同事第一天就被拉去开会，叫叫想套近乎，铃铛冷静观察，猪小弟开始判断他到底是关系户还是隐藏高手。",
    messages: [
      m("xitong", "新人已加入本群"),
      m("jiaojiao", "欢迎欢迎"),
      m("lingdang", "他头像怎么有点眼熟"),
      m("zhuxiaodi", "像老板朋友圈那种构图"),
      m("jiaojiao", "别乱说，可能只是审美同步"),
      m("xitong", "新人职位：特别项目协同"),
      m("lingdang", "这个职位名字很会绕"),
      m("zhuxiaodi", "是不是很厉害的意思"),
      m("jiaojiao", "也可能是还没想好干啥"),
      m("xitong", "工牌挂绳局部：新工牌还没有贴照片", { type: "image", assetId: "jojo-photo-badge-lanyard", emotion: "入职" }),
      m("lingdang", "先别蛐蛐，等他发第一份文档"),
      m("jiaojiao", "第一份文档决定江湖地位"),
      m("zhuxiaodi", "我已经准备好点赞了"),
      m("zhuxiaodi", "猪小弟点赞", { type: "meme", assetId: "jojo-meme-zhuxiaodi-like", emotion: "支持" })
    ]
  },
  {
    id: "jojo-flexible-work",
    title: "新政策：弹性上班",
    prompt: "公司宣布弹性上班，叫叫以为终于自由，铃铛指出弹性的是下班时间，群里开始吐槽制度文字游戏。",
    nextPrompt: "接着写大家研究弹性上班到底弹在哪里，系统给出一串规则，叫叫发现自己只是从固定焦虑变成弹性焦虑。",
    messages: [
      m("xitong", "公司新政策：试行弹性上班"),
      m("jiaojiao", "自由的风吹进工区"),
      m("lingdang", "先看细则"),
      m("zhuxiaodi", "我已经开心了"),
      m("xitong", "弹性范围：到岗时间前后 15 分钟"),
      m("jiaojiao", "这叫橡皮筋上班"),
      m("lingdang", "而且下班需根据项目情况灵活调整"),
      m("zhuxiaodi", "那弹的是下班？"),
      m("jiaojiao", "自由的风又吹走了"),
      m("xitong", "通勤地铁车厢虚焦：屏幕显示早高峰", { type: "image", assetId: "jojo-photo-subway-commute", emotion: "通勤" }),
      m("lingdang", "制度写得很美，生活过得很紧"),
      m("jiaojiao", "弹性上班，刚性开会"),
      m("zhuxiaodi", "迟到算不算弹性的一部分"),
      m("xitong", "不算")
    ]
  },
  {
    id: "jojo-office-cp",
    title: "茶水间 CP 观察",
    prompt: "群里开始蛐蛐公司里疑似 CP 的两位同事：请假时间、茶水间偶遇、一起加班的频率都很可疑，主打轻松八卦和合理但离谱的推理。",
    nextPrompt: "接着写叫叫拿出更多离谱证据，铃铛负责把推理拉回现实，系统突然提示两人一起预约了同一间会议室。",
    messages: [
      m("zhuxiaodi", "我发现一个事情"),
      m("jiaojiao", "这种开头一般有瓜"),
      m("lingdang", "先声明，不造谣"),
      m("zhuxiaodi", "他们俩又同时去茶水间了"),
      m("jiaojiao", "频率多少"),
      m("zhuxiaodi", "今天第三次"),
      m("lingdang", "也可能只是都爱喝水"),
      m("jiaojiao", "成年人哪有这么爱喝水"),
      m("xitong", "办公室走廊背影：两个人一前一后经过茶水间", { type: "image", assetId: "jojo-photo-office-corridor", emotion: "观察" }),
      m("zhuxiaodi", "我刚刚听到他们说一起下楼"),
      m("lingdang", "可能是拿快递"),
      m("jiaojiao", "CP 的第一步就是一起拿快递"),
      m("xitong", "提醒：请勿在工作群传播未经证实信息"),
      m("jiaojiao", "收到，我们改成学术研究")
    ]
  },
  {
    id: "jojo-afternoon-tea",
    title: "下午茶是谁点的",
    prompt: "公司突然来了下午茶，大家以为是福利，系统说费用归属待确认。既想吃又怕背锅，最后发现是客户送错楼层。",
    nextPrompt: "接着写叫叫已经吃完才发现送错楼层，铃铛开始设计归还话术，猪小弟认真思考能不能按精神损失留下奶茶。",
    messages: [
      m("xitong", "前台收到下午茶 12 份"),
      m("jiaojiao", "公司终于想起我们了"),
      m("zhuxiaodi", "有芋泥吗"),
      m("lingdang", "先问谁点的"),
      m("xitong", "费用归属待确认"),
      m("jiaojiao", "这句话让奶茶变沉了"),
      m("zhuxiaodi", "我已经插管了"),
      m("lingdang", "你动作太快"),
      m("xitong", "夜宵外卖模糊照：袋子上贴着隔壁公司名称", { type: "image", assetId: "viral-photo-takeout-food", emotion: "送错" }),
      m("jiaojiao", "隔壁公司也太客气了"),
      m("lingdang", "那叫送错"),
      m("zhuxiaodi", "喝过的怎么还"),
      m("jiaojiao", "用感谢信还"),
      m("lingdang", "你先别代表公司")
    ]
  },
  {
    id: "jojo-ex-coworker-client",
    title: "离职同事变甲方",
    prompt: "刚离职的同事成了客户方负责人，昨天还一起骂需求，今天开始提需求。群里一边怀念一边吐槽身份变化。",
    nextPrompt: "接着写前同事发来第一版反馈，开口就是“这个很简单”，叫叫破防，铃铛冷静指出这叫职场轮回。",
    messages: [
      m("xitong", "新客户联系人已同步"),
      m("jiaojiao", "这名字怎么这么熟"),
      m("lingdang", "上周刚离职那位"),
      m("zhuxiaodi", "他变甲方了？"),
      m("jiaojiao", "昨天还一起骂需求"),
      m("lingdang", "今天开始提需求"),
      m("xitong", "会议桌局部抓拍：电脑上打开新需求文档", { type: "image", assetId: "jojo-photo-meeting-blur", emotion: "轮回" }),
      m("zhuxiaodi", "身份切换好快"),
      m("jiaojiao", "他会不会放我们一马"),
      m("lingdang", "不一定，熟人更敢提"),
      m("xitong", "客户反馈：这个应该很简单"),
      m("jiaojiao", "熟悉的刀扎回来了"),
      m("zhuxiaodi", "他成长了"),
      m("lingdang", "成长成了甲方")
    ]
  },
  {
    id: "jojo-okr-wishing-well",
    title: "OKR 写成许愿池",
    prompt: "公司开始定 OKR，老板希望大家写得有挑战性，叫叫把 O 写成愿望，铃铛指出 KR 全靠玄学，群里吐槽目标管理。",
    nextPrompt: "接着写大家互相围观 OKR，叫叫想把“活着交付”写进去，系统提示该表述不够积极。",
    messages: [
      m("xitong", "本季度 OKR 填写提醒"),
      m("jiaojiao", "O：平安度过本季度"),
      m("lingdang", "太真实，不够战略"),
      m("zhuxiaodi", "KR：每天准时吃饭"),
      m("jiaojiao", "这很关键"),
      m("xitong", "请填写可衡量结果"),
      m("lingdang", "比如少改 3 次需求"),
      m("jiaojiao", "这个不可控"),
      m("xitong", "电脑日程表虚焦：OKR 截止时间标红", { type: "image", assetId: "jojo-photo-laptop-calendar", emotion: "目标" }),
      m("zhuxiaodi", "那写提升幸福感 20%"),
      m("lingdang", "谁来测幸福感"),
      m("jiaojiao", "看我今天有没有叹气"),
      m("xitong", "检测到叹气 7 次"),
      m("jiaojiao", "系统你退出评审")
    ]
  },
  {
    id: "jojo-performance-review",
    title: "绩效自评文学",
    prompt: "绩效自评开始，大家研究怎么把“救火、背锅、忍住没哭”写成正向表达，主打职场话术和互相打趣。",
    nextPrompt: "接着写叫叫把自评写得像求生记录，铃铛帮他翻译成职场表达，猪小弟意外写出全场最真诚的一版。",
    messages: [
      m("xitong", "绩效自评入口已开放"),
      m("jiaojiao", "年度玄学开始了"),
      m("lingdang", "注意措辞"),
      m("zhuxiaodi", "我写：努力活着"),
      m("lingdang", "改成：持续保持高压环境下的稳定输出"),
      m("jiaojiao", "我写：帮同事背锅"),
      m("lingdang", "改成：跨团队协同解决不确定问题"),
      m("xitong", "键盘旁冷掉咖啡：绩效表格停在自评栏", { type: "image", assetId: "jojo-photo-keyboard-coffee", emotion: "自评" }),
      m("zhuxiaodi", "那忍住没哭怎么写"),
      m("jiaojiao", "情绪管理能力突出"),
      m("lingdang", "这句可以"),
      m("xitong", "建议补充量化数据"),
      m("jiaojiao", "本季度眼泪节省率 100%"),
      m("zhuxiaodi", "叫哥稳了")
    ]
  },
  {
    id: "jojo-before-holiday",
    title: "放假前最后一天",
    prompt: "放假前最后一天，大家都想安静摸到下班，系统突然提醒还有待办。群里一边期待假期一边害怕节前临门一脚。",
    nextPrompt: "接着写老板节前发来一句“大家辛苦了，顺便”，群里瞬间从假期模式切回求生模式。",
    messages: [
      m("xitong", "距离假期还有 6 小时"),
      m("jiaojiao", "心已经在路上"),
      m("zhuxiaodi", "我行李都带公司了"),
      m("lingdang", "别高兴太早"),
      m("xitong", "检测到未关闭待办 4 项"),
      m("jiaojiao", "系统假期前不要说脏话"),
      m("lingdang", "待办不是脏话，但很伤人"),
      m("xitong", "雨天办公室窗边：灯光还亮着，桌上有半杯咖啡", { type: "image", assetId: "jojo-photo-rainy-office-window", emotion: "节前" }),
      m("zhuxiaodi", "我能不能先精神放假"),
      m("jiaojiao", "我已经精神离职又复职了"),
      m("lingdang", "先把文档关掉"),
      m("xitong", "老板正在输入"),
      m("jiaojiao", "不许输入"),
      m("zhuxiaodi", "我开始紧张了")
    ]
  },
  {
    id: "jojo-just-a-quick-thing",
    title: "领导说顺手一下",
    prompt: "下班前领导丢来小任务，说只是顺手一下。叫叫想装没看见，系统提示已读，铃铛统计这种话术平均耗时 3.7 天。",
    nextPrompt: "接着写叫叫试图把“顺手一下”拆成任务清单，发现它包含调研、方案、设计、对齐和复盘五件事。",
    messages: [
      m("xitong", "老板：这个顺手一下就行"),
      m("jiaojiao", "我刚刚是不是眼花了"),
      m("lingdang", "你已读了"),
      m("zhuxiaodi", "顺手一般要多久"),
      m("lingdang", "历史均值 3.7 天"),
      m("jiaojiao", "那叫顺命"),
      m("xitong", "电脑日程表虚焦：下班时间旁边新增待办", { type: "image", assetId: "jojo-photo-laptop-calendar", emotion: "顺手" }),
      m("zhuxiaodi", "能不能不顺"),
      m("lingdang", "可以，但要有勇气"),
      m("jiaojiao", "我只有叫叫气"),
      m("xitong", "老板正在补充细节"),
      m("jiaojiao", "不要补充"),
      m("lingdang", "已经从顺手变成项目了"),
      m("zhuxiaodi", "我去买咖啡")
    ]
  },
  {
    id: "jojo-fishing-at-work",
    title: "摸鱼侦察系统",
    prompt: "大家讨论怎样在不影响工作的情况下优雅摸鱼，系统突然上线活动检测，叫叫、铃铛、猪小弟开始互相掩护。",
    nextPrompt: "接着写系统识别到叫叫长时间静止，叫叫解释自己在深度思考，铃铛补刀说他是在加载人生。",
    messages: [
      m("jiaojiao", "如何优雅地摸鱼"),
      m("lingdang", "先把优雅去掉"),
      m("zhuxiaodi", "我可以帮你望风"),
      m("xitong", "检测到本群出现高风险词：摸鱼"),
      m("jiaojiao", "我们说的是鱼类生态研究"),
      m("lingdang", "研究地点：工位"),
      m("xitong", "早晨工位桌面抓拍：屏幕角落有未关闭的待办", { type: "image", assetId: "jojo-photo-desk-morning", emotion: "摸鱼" }),
      m("zhuxiaodi", "叫哥刚刚 8 分钟没动"),
      m("jiaojiao", "我在深度思考"),
      m("lingdang", "思考午饭吃什么"),
      m("xitong", "活动状态：低频移动"),
      m("jiaojiao", "这是节能模式"),
      m("zhuxiaodi", "叫哥省电"),
      m("lingdang", "但不省事")
    ]
  }
];

function cloneBaseProject(project: DramaProject): DramaProject {
  return parseProject({
    ...project,
    characters: project.characters.map((character) => ({ ...character })),
    assets: project.assets.map((asset) => ({ ...asset, tags: [...asset.tags] })),
    messages: project.messages.map((message) => ({ ...message })),
    sfx: { ...project.sfx },
    audioMix: { ...project.audioMix }
  });
}

function presetStoriesFor(packageId: StoryPackage, roleSelection: Partial<PresetRoleSelection> = {}) {
  const role = normalizePresetRoleSelection(roleSelection);
  if (packageId === "jojo") return jojoPresetStories;
  return role.viralRole === "female" ? viralFemalePresetStories : viralMalePresetStories;
}

function applyViralRole(project: DramaProject, viralRole: ViralPresetRole): DramaProject {
  if (viralRole === "male") return project;
  return parseProject({
    ...project,
    id: `${project.id}-female`,
    brief: project.brief.replace(/男主/g, "女主").replace(/女生/g, "男生").replace(/女主/g, "女主"),
    characters: project.characters.map((character) => {
      if (character.id === "girl") return { ...character, side: "right" as const };
      if (character.id === "boy") return { ...character, side: "left" as const };
      return character;
    }),
    messages: project.messages.map((message) => {
      if (message.roleId === "girl") return { ...message, side: "right" as const };
      if (message.roleId === "boy") return { ...message, side: "left" as const };
      return message;
    })
  });
}

function applyJojoRole(project: DramaProject, jojoRole: JojoPresetRole): DramaProject {
  return parseProject({
    ...project,
    id: `${project.id}-${jojoRole}`,
    brief: project.brief.replace(/叫叫是用户自己扮演/g, `${project.characters.find((character) => character.id === jojoRole)?.name || "叫叫"}是用户自己扮演`),
    characters: project.characters.map((character) => ({
      ...character,
      side: character.id === jojoRole ? "right" as const : "left" as const
    })),
    messages: project.messages.map((message) => {
      if (!message.roleId) return message;
      return { ...message, side: message.roleId === jojoRole ? "right" as const : "left" as const };
    })
  });
}

function baseProjectFor(packageId: StoryPackage, roleSelection: PresetRoleSelection) {
  const baseProject = cloneBaseProject(packageId === "jojo" ? jojoProject : sampleProject);
  return packageId === "jojo"
    ? applyJojoRole(baseProject, roleSelection.jojoRole)
    : applyViralRole(baseProject, roleSelection.viralRole);
}

function messageSide(project: DramaProject, roleId: string): ChatMessage["side"] {
  return project.characters.find((character) => character.id === roleId)?.side ?? "left";
}

function sendSfxFor(type: ChatMessage["type"]): ChatMessage["sendSfx"] {
  if (type === "image" || type === "meme" || type === "transfer") return type;
  return type === "system" ? "none" : "send";
}

function holdMsFor(text: string, type: ChatMessage["type"]) {
  if (type === "image") return 2500;
  if (type === "meme") return 2100;
  if (type === "transfer") return 1700;
  return Math.min(2400, Math.max(1050, text.length * 96));
}

function buildPresetMessages(project: DramaProject, preset: PresetStory): ChatMessage[] {
  return preset.messages.map((message, index) => {
    const type = message.type ?? "text";
    const side = type === "system" ? "center" : messageSide(project, message.roleId);
    return {
      id: `${preset.id}-m${String(index + 1).padStart(2, "0")}`,
      roleId: side === "center" ? undefined : message.roleId,
      side,
      type,
      text: message.text,
      ttsText: message.ttsText ?? (type === "image" ? `你看，${message.text}。` : type === "meme" ? undefined : undefined),
      emotion: message.emotion ?? (type === "image" ? "现场" : type === "meme" ? "表情" : "推进"),
      sendSfx: message.sendSfx ?? sendSfxFor(type),
      pauseMs: message.pauseMs ?? (type === "image" || type === "meme" ? 520 : 320),
      holdMs: message.holdMs ?? holdMsFor(message.text, type),
      assetId: message.assetId,
      amount: message.amount,
      transferNote: message.transferNote
    };
  });
}

export function presetStoryCount(packageId: StoryPackage, roleSelection: Partial<PresetRoleSelection> = {}) {
  return presetStoriesFor(packageId, roleSelection).length;
}

export function randomPresetStoryIndex(packageId: StoryPackage, roleSelection: Partial<PresetRoleSelection> = {}) {
  return Math.floor(Math.random() * presetStoryCount(packageId, roleSelection));
}

export function nextPresetStoryIndex(packageId: StoryPackage, currentIndex: number, roleSelection: Partial<PresetRoleSelection> = {}) {
  return (currentIndex + 1) % presetStoryCount(packageId, roleSelection);
}

export function isPresetPromptCard(card: PromptCard | undefined) {
  return Boolean(card?.id.startsWith("preset-"));
}

export function createPresetInitialArchive(
  packageId: StoryPackage,
  requestedIndex?: number,
  roleSelection: Partial<PresetRoleSelection> = {}
): PresetInitialArchive {
  const resolvedRoleSelection = normalizePresetRoleSelection(roleSelection);
  const stories = presetStoriesFor(packageId, resolvedRoleSelection);
  const selectedIndex = requestedIndex ?? randomPresetStoryIndex(packageId, resolvedRoleSelection);
  const presetIndex = ((selectedIndex % stories.length) + stories.length) % stories.length;
  const preset = stories[presetIndex];
  const baseProject = baseProjectFor(packageId, resolvedRoleSelection);
  const messages = buildPresetMessages(baseProject, preset);
  const project = parseProject({
    ...baseProject,
    id: `${packageId}-${preset.id}`,
    title: preset.title,
    brief: preset.prompt,
    messages: []
  });
  const cachedProject = parseProject({
    ...baseProject,
    id: `${packageId}-${preset.id}`,
    title: preset.title,
    brief: preset.prompt,
    messages
  });
  const promptCard: PromptCard = {
    id: `preset-${preset.id}`,
    prompt: preset.prompt,
    createdAt: new Date().toISOString(),
    messageIds: messages.map((message) => message.id),
    summary: `预设开场 ${messages.length} 条消息`,
    suggestedPrompt: preset.nextPrompt
  };

  return {
    preset,
    presetIndex,
    roleSelection: resolvedRoleSelection,
    project,
    promptCards: [],
    nextPrompt: preset.prompt,
    cachedFirstSegment: {
      project: cachedProject,
      card: promptCard,
      messages,
      suggestedPrompt: preset.nextPrompt
    }
  };
}
