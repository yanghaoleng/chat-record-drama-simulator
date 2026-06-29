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

export type PresetInitialArchive = {
  preset: PresetStory;
  presetIndex: number;
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

const viralPresetStories: PresetStory[] = [
  {
    id: "viral-blind-date-classmate",
    title: "张阿姨的相亲局",
    prompt: "男主被张阿姨安排相亲，对方一开始装作普通相亲对象，聊着聊着却露出儿时同学的线索，用旧绰号和毕业照把两个人的感情基础一点点翻出来。",
    nextPrompt: "接着写女生承认这场相亲是她先点头的，男主嘴硬说只是巧合，但她拿出一个只有小学同桌才知道的小秘密继续推进暧昧。",
    messages: [
      m("boy", "张阿姨把你推给我了"),
      m("girl", "她也把你推给我了"),
      m("boy", "那我们算被安排了"),
      m("girl", "你先别急着尴尬"),
      m("boy", "聊了半天还不知道你名"),
      m("girl", "你以前也不敢问"),
      m("boy", "以前？"),
      m("girl", "你小学是不是三班"),
      m("boy", "等下"),
      m("girl", "小卖部门口，豆浆，两根吸管"),
      m("boy", "你是那个总抢我橡皮的人？"),
      m("girl", "你那叫主动借"),
      m("girl", "小学毕业照里你站我后排", { type: "image", assetId: "image-old-photo", emotion: "摊牌" }),
      m("boy", "张阿姨知道这事吗"),
      m("girl", "她不知道"),
      m("girl", "但这场相亲是我先点的头")
    ]
  },
  {
    id: "viral-wrong-gym-coach",
    title: "加错的健身顾问",
    prompt: "一个像健身房推销顾问的女生加错微信，男主本来想礼貌拒绝，结果她突然喊出男主大学时的外号，推销话术变成旧识试探。",
    nextPrompt: "接着写女生解释自己不是故意装陌生，她当年其实在操场见过男主很多次，这次加错微信像是把以前没说的话补上。",
    messages: [
      m("girl", "你好，体验课这周还有两个名额"),
      m("boy", "你是不是加错人了"),
      m("girl", "你不是想减脂吗"),
      m("boy", "我什么时候说过"),
      m("girl", "大学操场，跑两圈就去买冰可乐"),
      m("boy", "你怎么知道"),
      m("girl", "因为你外号叫两圈哥"),
      m("boy", "这个外号已经封存了"),
      m("girl", "那我重新介绍一下"),
      m("girl", "我是隔壁新闻班那个总借你球拍的人"),
      m("boy", "你不是来卖课的？"),
      m("girl", "课是真的"),
      m("girl", "想找你也是真的"),
      m("boy", "那体验课还剩几个名额"),
      m("girl", "对你来说，只剩一个")
    ]
  },
  {
    id: "viral-client-old-coworker",
    title: "客户方的旧同事",
    prompt: "男主在对接工作需求时，发现客户方女生是以前一起熬夜改方案的旧同事。两个人先聊需求，后来聊到当年凌晨那页 PPT，工作默契慢慢变成暧昧默契。",
    nextPrompt: "接着写女生把需求说得很官方，最后补一句当年那杯冰美式她一直记得，男主开始意识到这次合作不只是工作。",
    messages: [
      m("girl", "这个需求我们这边想周五前看一版"),
      m("boy", "周五前有点赶"),
      m("girl", "你以前不是最会赶吗"),
      m("boy", "你认识我？"),
      m("girl", "凌晨三点，B 座茶水间"),
      m("boy", "你是那个改首页文案的？"),
      m("girl", "你终于想起来了"),
      m("boy", "那页 PPT 我改到天亮"),
      m("girl", "我也记得你把最后一杯冰美式让给我"),
      m("girl", "会议桌局部截图：电脑旁边还有冷掉的咖啡", { type: "image", assetId: "viral-photo-cafe-table", emotion: "回忆" }),
      m("boy", "你现在变甲方了"),
      m("girl", "所以这次轮到我提需求"),
      m("boy", "那你手下留情"),
      m("girl", "看你表现"),
      m("girl", "工作上和别的地方都是")
    ]
  },
  {
    id: "viral-rainy-carpool",
    title: "网约车拼到前任同桌",
    prompt: "雨夜拼车后，对方女生加微信说男主落了东西。男主以为只是普通乘客，结果她认出他的字迹，原来是高中时坐过前后桌的熟人。",
    nextPrompt: "接着写女生说她当年其实看过男主写在草稿纸上的一句话，男主不承认，女生开始一点点逼他想起来。",
    messages: [
      m("girl", "你东西落车上了"),
      m("boy", "什么东西"),
      m("girl", "一支黑笔，还有半张便签"),
      m("boy", "麻烦你拍一下"),
      m("girl", "不用拍，我认得你的字"),
      m("boy", "你认得？"),
      m("girl", "高中晚自习，你坐我后面"),
      m("boy", "你是前桌？"),
      m("girl", "终于不是路人了"),
      m("girl", "雨夜车窗外的路灯，便签压在手机壳下面", { type: "image", assetId: "viral-photo-rainy-car-window", emotion: "证据" }),
      m("boy", "那张便签你别看"),
      m("girl", "已经晚了"),
      m("girl", "你还是喜欢把话写一半"),
      m("boy", "那时候不敢写完"),
      m("girl", "现在敢了吗")
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
    id: "viral-landlord-daughter",
    title: "房东女儿来催租",
    prompt: "房东女儿冷冰冰催男主交房租和水电，男主越聊越觉得熟悉，最后认出她是小时候小区里一起玩过的女生。",
    nextPrompt: "接着写女生嘴硬说只是按流程催租，却提起小时候男主替她藏过一次坏掉的风筝，两个人从对账变成旧事重逢。",
    messages: [
      m("girl", "这个月房租和水电麻烦今天结一下"),
      m("boy", "你是房东女儿？"),
      m("girl", "对，按合同来"),
      m("boy", "语气这么凶"),
      m("girl", "欠钱的人没资格评价语气"),
      m("boy", "你小时候是不是也住这个小区"),
      m("girl", "你问这个干嘛"),
      m("boy", "有个女生以前总把风筝挂我窗台"),
      m("girl", "你还记得？"),
      m("girl", "门口鞋子和旧钥匙局部，像老小区玄关", { type: "image", assetId: "viral-photo-shoes-door", emotion: "旧事" }),
      m("boy", "原来是你"),
      m("girl", "现在先交房租"),
      m("boy", "交完能聊风筝吗"),
      m("girl", "看你转账速度"),
      m("boy", "那我突然有点想按时了")
    ]
  },
  {
    id: "viral-familiar-support-voice",
    title: "售后客服声音很熟",
    prompt: "男主报修空调，售后客服女生按流程询问信息，却突然问他是不是参加过某次校园比赛。官方话术被熟人感打破。",
    nextPrompt: "接着写女生承认当年在台下听过男主唱歌，男主一边报修一边心虚，售后流程变成双向试探。",
    messages: [
      m("girl", "您好，请问空调是什么故障"),
      m("boy", "制冷不太行"),
      m("girl", "机器型号发我一下"),
      m("boy", "你声音有点耳熟"),
      m("girl", "客服声音都差不多"),
      m("boy", "不太一样"),
      m("girl", "你大学是不是参加过校园歌手"),
      m("boy", "你怎么知道"),
      m("girl", "你唱到副歌破音了"),
      m("boy", "这也太具体了"),
      m("girl", "床头遥控器和维修单局部", { type: "image", assetId: "viral-photo-bedside-props", emotion: "流程" }),
      m("girl", "先说空调"),
      m("boy", "现在空调没你重要"),
      m("girl", "先生，这边通话有录音"),
      m("boy", "那你下班后还回吗"),
      m("girl", "看你报修态度")
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
    id: "viral-bridesmaid-code",
    title: "婚礼伴娘的暗号",
    prompt: "朋友婚礼结束后，伴娘女生加男主发照片。照片角落有一句男主高中时写过的暗号，男主以为是偶遇，结果她很早前就知道他。",
    nextPrompt: "接着写女生解释自己为什么记得那句暗号，男主发现这场婚礼不是第一次见面，而是一次迟到很久的重逢。",
    messages: [
      m("girl", "婚礼照片我发你几张"),
      m("boy", "谢谢，今天辛苦了"),
      m("girl", "你看第三张角落"),
      m("boy", "那句字是谁写的"),
      m("girl", "你高中写过"),
      m("boy", "不可能"),
      m("girl", "天台，蓝色便利贴"),
      m("boy", "你到底是谁"),
      m("girl", "你把暗号留给风，我捡到了"),
      m("girl", "模糊合照截图：桌牌旁露出一句手写暗号", { type: "image", assetId: "viral-photo-phone-chat", emotion: "暗号" }),
      m("boy", "所以你今天是故意坐我旁边"),
      m("girl", "伴娘座位很忙的"),
      m("girl", "但可以忙里偷闲"),
      m("boy", "那现在算偷闲吗"),
      m("girl", "算攻略开始")
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

function presetStoriesFor(packageId: StoryPackage) {
  return packageId === "jojo" ? jojoPresetStories : viralPresetStories;
}

function baseProjectFor(packageId: StoryPackage) {
  return cloneBaseProject(packageId === "jojo" ? jojoProject : sampleProject);
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

export function presetStoryCount(packageId: StoryPackage) {
  return presetStoriesFor(packageId).length;
}

export function randomPresetStoryIndex(packageId: StoryPackage) {
  return Math.floor(Math.random() * presetStoryCount(packageId));
}

export function nextPresetStoryIndex(packageId: StoryPackage, currentIndex: number) {
  return (currentIndex + 1) % presetStoryCount(packageId);
}

export function isPresetPromptCard(card: PromptCard | undefined) {
  return Boolean(card?.id.startsWith("preset-"));
}

export function createPresetInitialArchive(packageId: StoryPackage, requestedIndex = randomPresetStoryIndex(packageId)): PresetInitialArchive {
  const stories = presetStoriesFor(packageId);
  const presetIndex = ((requestedIndex % stories.length) + stories.length) % stories.length;
  const preset = stories[presetIndex];
  const baseProject = baseProjectFor(packageId);
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
