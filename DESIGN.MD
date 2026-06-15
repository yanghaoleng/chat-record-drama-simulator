# 设计记录

## 风格定位

深色创作工作台，界面强调可操作、可扫描、少说明文字。默认 JOJO 版偏蓝色公司 IM 工具感；网红短剧版保留微信聊天与短剧剪辑工具气质。

## 色彩

- 背景：`--app-bg #07130d`，卡片面：`--app-surface #101f17`。
- 主色：微信绿 `--wechat-green #07c160`，用于主按钮、焦点、成功状态。
- JOJO 版通过 `.app-shell-jojo` 覆盖为钉钉蓝：主色 `#1677ff`，背景 `#07130d`，编故事浮层使用低饱和深蓝毛玻璃。
- JOJO 版蓝底按钮使用白色文字/图标；网红短剧版保持原微信绿和深色按钮字。
- 辅色：紫 `--app-purple #b779ff`、橙 `--app-orange #f6ad55`、警示黄 `--app-warning #f2c94c`。
- 文本：主文本 `#f2f7f4`，弱文本 `#9fb5a8`，更弱文本 `#6f8a7b`。

## 布局

- 顶部固定工具栏 `.topbar`，无底部分割线、无额外背景，和页面背景拉通；左侧品牌带 `site-icon.svg` 小 logo，右侧为存档、读档。
- 顶栏不显示 JOJO版 / 网红短剧版标签；标题旁下拉菜单承载版本互跳、`Github` 公开仓库、存档和读档。
- 主工作区 `.workspace.static-workspace` 以预览内容为中心，右侧预览负极容器固定按视频宽度占位，避免界面版/视频版切换时横向跳动。
- 桌面端界面版手机壳采用接近 iPhone 的窄长比例；1080px 以下把编故事面板改为底部居中半弹窗，400px 以下仅让模拟聊天手机轻微等比缩小，不再切成 16:9 或改变整体结构。
- 桌面端左侧“编故事”用固定像素偏移定位：1080px 以上 `--desktop-story-panel-top-offset: 190px`，不要用百分比或视口高度居中；视频版右侧面板使用 `--desktop-preview-window-top-offset`，在故事面板固定偏移上补 `12px` 视觉内边距，让视频窗口顶部和可见编故事卡片齐平。
- 1080px 以下进入底部编故事交互：默认展开为半弹窗，展开态按钮是向下箭头，收起后变为底部居中的钢笔圆按钮，再点击钢笔恢复完整面板；收起按钮父级预留阴影空间，避免阴影和过渡被裁切；生成成功后自动收起开始看故事。
- 卡片统一 `.surface-card`；JOJO 版左侧卡片使用深蓝毛玻璃、轻微角落光感和白色高光描边。
- 右侧预览容器 `.preview-wrap` 是透明无边承载区，不使用整块填充背景；预览切换按钮跟随预览内容，居中放在内容上方。
- 视频版空态使用 `.video-empty-frame`，保持和 Remotion Player 一样的 16:9 画布宽高，只在画布内显示弱占位文案。
- JOJO 版手机壳使用 Figma 导出的钉钉顶栏和底部：`public/dingtalk-ui/topbar.png` 来自 Figma `3:14`，`public/dingtalk-ui/inputbar.png` 来自底部资源。
- JOJO 版中间聊天区左右分布：叫叫作为玩家永远右侧蓝色气泡；铃铛、猪小弟、系统在左侧白色气泡。

## 动效

- 首屏进入：`.motion-in` 使用 GSAP，`y: 18 -> 0`、透明和模糊渐入，时长 `0.55s`。
- 交互悬停：按钮、链接、Prompt 卡片轻微上浮 `y: -2`、`scale: 1.01`。
- 按下反馈：`scale: 0.985`，保持轻量。
- 聊天重播按钮 `.chat-replay-button` 放在聊天信息流末尾，文案为“再来一遍”，弱灰色居中；只在播放完成后出现，只重播当前会话入场，不改变剧情内容。
- 启动默认剧情时先显示完整手机框架，再逐条播放消息入场。
- 新气泡入场后自动滚动 `.wechat-chat-scroll`，保证最新消息曝光在手机可视区域内。
- 界面版/视频版切换使用淡入淡出和轻微缩放/模糊，不再做左右滑动。
- 预览内容在桌面端支持鼠标位置驱动的轻微 3D 斜切；触摸设备和减少动效设置下关闭。
- 1080px 以下编故事面板展开/收起使用底部半弹窗动效；按钮通过 `document.startViewTransition` 与 `view-transition-name: story-panel-toggle` 做 continuity transition，从弹窗右上角连续移动到底部居中。

## 可复用样式

- 面板滚动：`.panel-scroll`。
- 底部半弹窗收起按钮：`.story-panel-status`，由 `storyPanelOpen` 控制展开/收起；展开态用向下箭头，收起态用钢笔图标，1080px 以下启用 continuity transition。
- 卡片容器：`.surface-card`、`.card-header`、`.card-content`。
- 编故事输入框：`.prompt-textarea` 在 JOJO 版使用纯黑背景。
- 预览容器：`.preview-wrap`、`.wechat-preview-shell`、`.player-frame`；`.wechat-preview-shell` 左对齐承载手机。
- 微信预览顶底图：`.wechat-topbar-img` 使用 `topbar.png`，`.wechat-bottombar-img` 使用 `bottombar.png`；联系人名用 `.wechat-topbar-title` 叠在顶栏中间。
- 钉钉预览顶底图：`.dingtalk-topbar-img`、`.dingtalk-inputbar-img`；聊天区 `.dingtalk-chat-scroll`。
- JOJO 气泡：`.dingtalk-row-self .wechat-bubble` 为蓝底白字，`.dingtalk-row-other .wechat-bubble` 为白底深色字。
- 品牌图标：`.brand-logo` 使用白底黑色单色蛐蛐，和 favicon 同源。
- 状态文案：`.deepseek-status` 只在错误时展示，正常待机不显示 DeepSeek 常驻状态。

## JOJO 素材审美

- JOJO 群名默认偏同事“蛐蛐小群”语气，如“工位蛐蛐小队”；DeepSeek 续写时可生成 4-10 字的轻松群名，避免正式公司群名称。
- 头像严格使用 `avatar-jojo` 源图，不让生成模型重画角色脸。
- 公司照片使用真实办公室局部抓拍感，允许手、背影、运动模糊、电脑、咖啡、走廊、电梯口，不出现可识别正脸或卡通角色脸。
- 表情包使用本地头像组合成蓝色职场表情卡，优先保证角色形状准确。

## 状态反馈

- DeepSeek 正常待机时不常驻显示状态条，避免占用创作区视觉焦点。
- DeepSeek 或生成链路失败时才显示错误状态，文案需要明确“未连通/本地续写”等降级信息。
- 内网部署使用同域 Fastify 服务，页面状态和生成请求优先走 `/api/settings/deepseek` 与 `/api/story/continue`。
- 静态 `/ququ/` 部署在外网访问且公司 token 中转不可达时，使用右上 Toast 提示 `token服务连不上，请连到叫叫的 Wi-Fi`，随后降级本地续写。
