# 前端元素映射

| 俗称 | 所属区域 | 代码变量/组件 | 样式类 |
| --- | --- | --- | --- |
| 顶栏 | 全局 | `header` | `.topbar` |
| 产品名 | 顶栏 | `packageTitle(storyPackage)` | `.brand-block h1` |
| 网站小 logo | 顶栏 / favicon | `/site-icon.svg` | `.brand-logo`，白底黑色蛐蛐 |
| Github 菜单项 | 标题下拉菜单 | `VITE_GITHUB_REPO_URL`、`defaultGithubRepositoryUrl` | `.title-menu-item` |
| 构建版本 | 应用入口 | `__APP_STORY_PACKAGE__`、`App({ storyPackage })` | `.app-shell-jojo` 仅 JOJO 版存在 |
| 独立产物 | 构建脚本 | `STORY_PACKAGE=jojo|viral` | `dist/jojo`、`dist/viral` |
| `/ququ` 部署产物 | 构建脚本 | `npm run build:ququ`、`VITE_BASE_PATH=/ququ/` | `dist/ququ` |
| JOJO 内网预览 | 部署/预览 | `npm run preview:lan` | `HOST=0.0.0.0 API_PORT=4173 DIST_DIR=dist/jojo` |
| 存档按钮 | 顶栏 | `exportJson` | `.ghost-top-actions` |
| 读档按钮 | 顶栏 | `importInputRef`、`importJson` | `.ghost-top-actions` |
| 错误状态提示 | 编故事 | `status === "error"`、`statusText` | `.deepseek-status-error` |
| token 服务 Toast | 全局状态反馈 | `toastMessage`、`showToast(tokenServiceWifiToast)` | `.app-toast` |
| 左侧面板 | 主工作区 | `ScrollShadow` | `.left-panel.panel-scroll` |
| 桌面编故事垂直位置 | 主工作区 | CSS 变量 | `--desktop-story-panel-top-offset: 190px` |
| 桌面视频窗口垂直位置 | 视频预览 | CSS 变量 | `.right-panel:has(.video-preview-stack)` 使用 `--desktop-preview-window-top-offset` |
| 编故事底部弹窗按钮 | 1080px 以下适配 | `storyPanelOpen`、`setStoryPanelOpenWithContinuity`、`ChevronDown`、`PenLine` | `.story-panel-status`、`.story-panel-open`、`story-panel-toggle` |
| 编故事输入框 | 编故事 | `draftPrompt` | `.hero-textarea.prompt-textarea` |
| 开始编按钮 | 编故事 | `continueStory` | HeroUI `Button` |
| 重启故事按钮 | 编故事 | `clearLine`，清空 `project.messages` 和故事卡片，保留手机框架 | `.prompt-reset-button` |
| 生成状态 | 编故事 | `status`、`statusText`、`generateBackendStorySegment` | 正常不常驻显示，错误时用 `.deepseek-status-error` |
| 故事卡片列表 | 编故事历史 | `promptCards` | `.prompt-card-list` |
| 单张故事卡片 | 编故事历史 | `PromptCard` | `.prompt-card`、`.prompt-card-index` |
| 右侧预览面板 | 预览区 | `previewMode` | `.right-panel.panel-scroll` |
| 右侧透明承载区 | 预览区 | `Card.preview-wrap` | `.preview-wrap`、`.preview-content-stage` |
| 界面版按钮 | 预览区切换 | `changePreviewMode("wechat")` | `.preview-mode-controls`、`.preview-tab` |
| 视频版按钮 | 预览区切换 | `changePreviewMode("video")`、`playerRef.play()` | `.preview-mode-controls`、`.preview-tab` |
| 微信手机预览 | 微信预览 | `WechatStoryPreview` | `.wechat-preview-shell`、`.wechat-phone` |
| 预览最大宽度 | 预览区 | CSS 变量 | `--chat-preview-width`、`--video-preview-width` |
| 聊天自动滚屏 | 微信/钉钉预览 | `visibleMessageCount`、`.scrollTo()` | `.wechat-chat-scroll` |
| 聊天重播按钮 | 聊天信息流末尾 | `replayConversation`、`startMessageReveal`，播放完显示“再来一遍” | `.chat-replay-row`、`.chat-replay-button` |
| JOJO 群聊名 | 钉钉顶栏 | `project.title`、`nextProjectTitle` | `.dingtalk-topbar-title` |
| 微信顶栏整图 | 微信预览 | `/wechat-ui/topbar.png` | `.wechat-topbar`、`.wechat-topbar-img` |
| 微信顶栏名字 | 微信预览 | `peer?.name || project.title` | `.wechat-topbar-title` |
| 微信底部整图 | 微信预览 | `/wechat-ui/bottombar.png` | `.wechat-bottombar-img` |
| 聊天气泡 | 微信预览 | `WechatMessageContent` | `.wechat-bubble` |
| 钉钉手机预览 | JOJO 预览 | `isJojoProject(project)` | `.dingtalk-phone`；1080px 以下配合底部半弹窗，400px 以下只等比缩小手机本体 |
| 钉钉顶栏整图 | JOJO 预览 | `/dingtalk-ui/topbar.png`，Figma `3:14` | `.dingtalk-topbar-img` |
| 钉钉底部整图 | JOJO 预览 | `/dingtalk-ui/inputbar.png` | `.dingtalk-inputbar-img` |
| 叫叫右侧蓝色气泡 | JOJO 预览 | `visualSideFor`、`roleId === "jiaojiao"` | `.dingtalk-row-self.wechat-row-right .wechat-bubble` |
| 其他人左侧白色气泡 | JOJO 预览 | `visualSideFor` | `.dingtalk-row-other.wechat-row-left .wechat-bubble` |
| 说话人名字 | JOJO 预览 | `getCharacter(project, message).name` | `.wechat-speaker-name` |
| 转账卡片 | 微信预览 | `message.type === "transfer"` | `.wechat-transfer` |
| 图片卡片 | 微信预览 | `message.type === "image"` | `.wechat-image-card` |
| 表情卡片 | 微信预览 | `message.type === "meme"` | `.wechat-meme-card` |
| 视频播放器 | 视频预览 | `Player`、`ChatDrama` | `.player-frame` |
| 视频空态占位 | 视频预览 | `renderPreviewPane("video")` 无消息分支 | `.video-empty-frame`、`.video-empty-state` |
| 生成语音按钮 | 视频预览 | `generateVoice` | `.video-action-strip` |
| 导出视频按钮 | 视频预览 | `exportVideo` | `.video-action-strip` |
| 视频进度条 | 视频导出 | `videoProgress` | `.video-progress` |
| 下载视频链接 | 视频导出 | `videoResult` | `.download-link` |

## 数据与素材映射

| 俗称 | 所属区域 | 代码变量/组件 | 路径/说明 |
| --- | --- | --- | --- |
| JOJO 默认项目 | 数据预设 | `jojoProject` | `src/shared/jojoProject.ts` |
| JOJO 固定素材池 | 数据预设 | `jojoCompanyAssets` | `src/shared/jojoProject.ts` |
| 叫叫头像 | JOJO 头像 | `roleId: "jiaojiao"` | `/avatars/jojo/jiaojiao.png` |
| 铃铛头像 | JOJO 头像 | `roleId: "lingdang"` | `/avatars/jojo/lingdang.png` |
| 猪小弟头像 | JOJO 头像 | `roleId: "zhuxiaodi"` | `/avatars/jojo/zhuxiaodi.png` |
| 系统头像 | JOJO 头像 | `roleId: "xitong"` | `/avatars/jojo/xitong.png` |
| 会议局部照片 | JOJO 图片 | `assetId: "jojo-photo-meeting-blur"` | `/jojo-assets/photos/company-meeting-blur.png` |
| 电梯背影照片 | JOJO 图片 | `assetId: "jojo-photo-corridor-blur"` | `/jojo-assets/photos/company-corridor-blur.png` |
| JOJO 表情卡 | JOJO 表情 | `assetId: "jojo-meme-*"` | `/jojo-assets/memes/*.png` |
| 公司中转配置 | 后端模型 | `getDeepSeekConfig` | `server/settings.ts` |
| 静态部署公司中转 | 构建注入 | `VITE_INCLUDE_COMPANY_TOKEN=1`、`VITE_COMPANY_DEEPSEEK_API_KEY` | `vite.config.ts` 仅从环境变量读取 token |
| 后端公司中转 token | 后端模型 | `COMPANY_DEEPSEEK_API_KEY`、`DEEPSEEK_API_KEY` | `server/settings.ts`，不再硬编码真实 key |
