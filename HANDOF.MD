# 交接记录

## 当前任务

基于现有核心功能新增 JOJO 版包装，同时保留原网红短剧版；JOJO 版用于公司内网娱乐，默认使用公司中转模型生成。

## 已完成

- 确认项目为 Vite + React 静态前端，保留 Fastify 全栈开发入口。
- 发现当前目录不是 git 仓库，无法执行部署前的 `git pull`、`git push`。
- 首次构建失败原因：`node_modules` 不完整，缺少 `.bin/tsc`。
- 重新执行 `npm install --registry=https://registry.npmjs.org/`。
- 修复 `esbuild` 二进制执行权限后，依赖安装成功。
- `npm run build` 已通过，生成独立产物 `dist/jojo` 与 `dist/viral`。
- 当前已切换为 Fastify 全栈内网预览，JOJO 版地址：`http://127.0.0.1:4173/`、`http://10.131.48.68:4173/`。
- HTTP 验证通过：首页、JS、CSS 均返回 `200 OK`。
- 已尝试用内置浏览器打开，但内置浏览器自身出现 `This page crashed`；随后已用系统默认浏览器打开预览地址。

## 注意事项

- 当前本线程预览服务占用 `0.0.0.0:4173`，托管 `dist/jojo`，由 `screen` 会话 `chat-record-drama-preview` 保持。
- 停止当前本线程预览可执行 `screen -S chat-record-drama-preview -X quit`。
- NPM 安装时出现 Node 版本提示：Vitest 声明支持 `^20 || ^22 || >=24`，当前为 Node `23.10.0`；本次构建未受影响。
- 若要远端部署，先把目录初始化或切到 git 仓库，再按项目约定执行拉取、推送、部署。

## 2026-06-12 DeepSeek 修复

- 根因 1：生产静态包中的 `__DEEPSEEK_BROWSER_CONFIG__.apiKey` 被编译成空字符串，页面启动时只能显示“纯前端静态模式”，不会请求 DeepSeek。
- 根因 2：`data/settings.json` 里已保存 DeepSeek 配置，但此前纯静态前端读不到；这份配置只属于 Fastify 后端。
- 根因 3：新增后端代理首次验证时发现接口复用了 `projectSchema`，而首段生成前 `messages=[]`，被 `min(1)` 拦截，导致还没请求 DeepSeek 就兜底。
- 已修复：前端生成链路改为优先调用 `/api/story/continue`，后端代理读取保存配置或环境变量请求 DeepSeek；后端不可用时再浏览器直连，最后才本地续写。
- 已修复：新增启动状态检查 `/api/settings/deepseek`，页面可显示“DeepSeek 后端代理已就绪（已保存）”。
- 已修复：Fastify 生产模式可托管 `dist/`，支持同域页面和 API。
- 已验证：`npm run build` 通过，`npm run test` 通过（5 个测试文件、14 个用例）。
- 已验证：当前 `http://127.0.0.1:4173/` 由全栈预览提供，`/api/settings/deepseek` 返回 `hasApiKey: true`。
- 已验证：点击“生成”后，后端日志显示 DeepSeek `/chat/completions` 返回 `200`，页面显示“DeepSeek 后端已追加 36 条消息”。
- 当前预览服务：`screen` 会话 `chat-record-drama-preview`，Node 进程 PID `64054`，端口 `4173`。

## 2026-06-12 微信顶底图替换

- 来源：Figma 文件“叫叫职场”，节点 `2:2` 下的 `微信顶栏`（`2:4`）和 `微信底部`（`1:255`）。
- 已导出：`public/wechat-ui/topbar.png`（1206x300）和 `public/wechat-ui/bottombar.png`（1206x270）。
- 已调整：`WechatStoryPreview` 改为顶部整图 + 中间叠联系人名 + 聊天区 + 底部整图。
- 已移除旧自绘导航 `.wechat-nav`，避免和 Figma 顶栏重复。
- 已验证：`npm run build` 通过，`npm run test` 通过；内置浏览器中顶栏渲染约 `388x97`，底栏渲染约 `388x87`。

## 2026-06-12 JOJO 版新增

- 已新增 `src/shared/jojoProject.ts`：四个角色为叫叫、铃铛、猪小弟、系统。
- 已设定：叫叫是玩家扮演的勇敢小鸡吉祥物；铃铛聪明冷静会来事；猪小弟憨厚踏实、正直、条件好，是叫叫小跟班。
- 已保留原网红短剧版；最新架构改为独立构建产物，不再通过顶部按钮互相切换。
- 已设定 JOJO 版默认启动，并内置一套公司早会吐槽剧情。
- 已接入 `assets/avatar-jojo` 头像到 `public/avatars/jojo`。
- 已从 Figma“叫叫职场”下载钉钉顶栏和底部到 `public/dingtalk-ui`。
- 已按最新要求替换钉钉顶栏：Figma 节点 `3:14`（钉钉顶部）下载为 `public/dingtalk-ui/topbar-node-3-14.png`，并覆盖运行时 `public/dingtalk-ui/topbar.png`。
- 已实现 JOJO 钉钉手机预览：叫叫作为玩家永远右侧蓝色气泡；铃铛/猪小弟/系统在左侧白色气泡。
- 已同步 Remotion 视频预览：JOJO 版导出视频时也使用叫叫右侧蓝泡、其他人左侧白泡。
- 已按杨总要求替换公司照片素材方向：使用真实办公室局部抓拍、手、背影、运动模糊，不出现真实正脸或卡通角色脸。
- 已生成并接入固定照片：`company-meeting-blur.png`、`company-corridor-blur.png`。
- 已将表情包改为基于 `avatar-jojo` 源头像生成的蓝色职场表情卡，避免 AI 重画角色形状。
- 已让剧情续写自动调用头像、图片、表情素材；界面不提供头像或场景选择器。

## 2026-06-12 公司中转模型配置

- 已把后端默认 OpenAI Chat Completions 兼容地址改为 `https://token.xjjj.co/v1`。
- 已把默认模型改为 `deepseek-v4-flash`。
- 专用 key 已改为从环境变量读取，不在代码中硬编码；后端使用 `DEEPSEEK_API_KEY` 或 `COMPANY_DEEPSEEK_API_KEY`，静态构建使用 `VITE_COMPANY_DEEPSEEK_API_KEY`。
- 旧 `data/settings.json` 默认不再覆盖公司中转；如需恢复旧保存配置，需要设置 `USE_SAVED_DEEPSEEK_SETTINGS=1`。
- 已验证 `/api/settings/deepseek` 返回 `source: "company"`、`baseUrl: "https://token.xjjj.co/v1"`、`model: "deepseek-v4-flash"`。

## 2026-06-12 独立构建与 JOJO 蓝色调整

- 已改为构建期固定版本：`__APP_STORY_PACKAGE__` 注入 `jojo` 或 `viral`，`App({ storyPackage })` 不再在运行时切换版本。
- 已新增构建脚本：`npm run build` 同时输出 `dist/jojo`、`dist/viral`；`preview:lan` 托管 JOJO 版，`preview:lan:viral` 可单独托管网红版。
- 已移除顶部 `JOJO版 / 网红短剧版` 切换按钮，仅保留当前版本标签；导入存档时禁止跨版本导入导致界面变包。
- 已按要求只调整 JOJO 版视觉：板块填充改为蓝色系并贴近边框色，蓝底按钮文字/图标为白色；网红版保持原绿色体系。
- 已验证 JOJO 版：浏览器中无网红版入口，`.surface-card` 为 `rgba(18, 41, 68, 0.96)`，生成按钮为蓝底白字。
- 已验证网红版：临时 4174 预览无 JOJO 入口，面板仍为 `rgba(16, 31, 23, 0.96)`。
- 当前 JOJO 内网预览：`screen` 会话 `chat-record-drama-preview`，Node 进程 PID `1243`，端口 `4173`。

## 当前验证

- `npm run test` 通过：5 个测试文件、15 个用例。
- `npm run build` 通过；产物为 `dist/jojo` 与 `dist/viral`，仅有 Vite 大 chunk 提醒，不影响功能。
- Chrome headless 已截图：`tmp/qa/jojo-topbar-right-self.png`，确认新钉钉顶栏、群名、叫叫右侧蓝泡和其他人左侧白泡。
- 当前内网预览由本线程 Fastify 启动：`http://127.0.0.1:4173/`、`http://10.131.48.68:4173/`。

## 2026-06-12 UI 文案与顶栏图标

- 已将左侧标题从“线性 Prompt”改为“编故事”。
- 已将主按钮改为“生成一段”，并把“重启故事”固定放到该按钮下面。
- 已将右侧“视频预览”改为“视频版”，顶栏“导出当前存档/导入”改为“存档/读档”。
- 已同步占位文案和状态文案，把可见的 Prompt/导入表述改为故事卡片/读档。
- 已在聊天手机右下角新增小刷新按钮，点击后通过 `startMessageReveal(0, messages.length)` 重播当前会话入场。
- 已移除网站顶栏底部分割线，并把存档/读档从分段按钮组改为普通并排按钮。
- 已新增 `public/site-icon.svg` 用作 favicon 和顶栏产品名左侧 logo；后续已更新为白底黑色单色蛐蛐。

## 2026-06-12 群名与重播按钮微调

- 已将 JOJO 默认群名从正式的“叫叫公司日常群”改为“工位蛐蛐小队”。
- 已更新 DeepSeek JOJO 提示词：群名要像同事背后蛐蛐的小群，4-10 字，轻松有梗，不要正式公司群名。
- 已允许 JOJO 续写时采用 DeepSeek 返回的合格短群名；不合格时继续沿用当前群名。
- 已纠正 DeepSeek 提示词里关于叫叫气泡方向的旧描述：叫叫为右侧蓝泡，其他人为左侧白泡。
- 已把聊天重播按钮弱化颜色和透明度；后续已移到页面最底部居中。

## 2026-06-12 浏览器批注调整

- 已移除顶栏“JOJO版”版本标签。
- 已将顶栏产品名改为“蛐蛐模拟器”。
- 已将顶栏背景改为透明，不再额外铺色，和页面背景拉通。
- 已调整 JOJO 版左侧卡片视觉；后续已改为低饱和深蓝毛玻璃和白色高光描边。
- 已移除编故事面板里的 DeepSeek 常驻状态，仅错误时展示提示。
- 已将 JOJO 版编故事输入框背景改为纯黑。
- 已将“视频版”切换改为自动播放：Player 挂载时 `autoPlay`，并通过 `playerRef.play()` 兜底触发。
- 已将右侧切换按钮“聊天界面”改为“界面版”。
- 已新增聊天自动滚屏：新气泡入场后滚动 `.wechat-chat-scroll`，确保最新消息在手机可视区域里。
- 已将右侧预览板块改为透明无边承载区，去掉整体填充背景和边框。
- 已调整“界面版 / 视频版”切换组位置；后续已放回预览内容上方居中。

## 2026-06-12 编故事浮层与响应式

- 已将桌面端“编故事”固定到页面左下角，允许覆盖预览内容；内容变多时从底部向上延展。
- 已将 400px 以下作为手机版阈值；手机版“编故事”默认展开，可收起为星星圆按钮并再次展开。
- 已给预览内容设置最大宽度：界面版沿用当前手机宽度，视频版最大宽度约为界面版 1.5 倍。

## 2026-06-12 预览与移动端收口

- 已将网站图标改为白底黑色单色蛐蛐，并继续用于 favicon 与顶栏 logo。
- 已将“界面版 / 视频版”切换按钮放回预览内容上方居中，选中态只用明暗区分。
- 已将切换动画改为淡入淡出，去掉左右滑动；视频版切入后自动播放。
- 已让右侧预览负极容器保持 100% 占位宽度，减少界面版/视频版切换时的横向偏移。
- 已给预览内容增加桌面鼠标 hover 的轻微 3D 斜切效果，触摸设备和减少动效时关闭。
- 已将 JOJO 聊天区域背景统一为 `#f1f2f3`，让钉钉界面上下更拉通。
- 已将桌面端钉钉手机壳改为接近 iPhone 的窄长比例；400px 以下手机版压缩为 16:9，避免横向溢出并给编故事留空间。
- 已将聊天重播按钮改到聊天信息流末尾，播放完成后显示弱灰色“再来一遍”，不再放在页面底部或手机外侧，避免和编故事面板重叠。
- 已将启动默认剧情改为从空信息流自动逐条播放，播放完成后才出现“再来一遍”。
- 已将编故事面板改成低饱和深蓝毛玻璃，边框只保留白色高光；输入框桌面约 5 行、手机版约 3 行。
- 已将 1080px 以下的手机/平板编故事改为底部居中半弹窗：默认展开，展开态右上角为向下箭头，收起后只保留底部居中的钢笔圆按钮，点击钢笔可重新展开。
- 已给编故事底部弹窗按钮接入 continuity transition：`setStoryPanelOpenWithContinuity` 使用 View Transition API，CSS 使用 `story-panel-toggle`，按钮会从弹窗右上角连续过渡到底部居中。
- 已设置 1080px 以下生成成功后自动收起编故事半弹窗，再开始播放/观看故事。
- 已调整“重启故事”：只清空信息流气泡和故事卡片，保留模拟手机、顶栏、底栏和输入栏框架。
- 已去掉视频操作区底部暗色渐变/深色条，操作按钮区背景保持透明。
- 已调整视频版重启后的空态：仍保留与有内容时一致的 16:9 视频画布和操作区尺寸，占位文案只显示在画布内。
- 已把“生成语音”文案改成“生成语音（开发中）”，并把视频操作区顶部横线去掉、导出按钮右对齐。
- 已验证：`npm run typecheck`、`npm run test`、`npm run build` 均通过；Vite 仅提示大 chunk，不影响功能。
- 已验证移动端指标：354px 宽视口下页面无横向滚动，钉钉预览为 `336x189` 的 16:9，编故事输入框高度为 `96px`。

## 2026-06-12 内网部署确认

- 当前目录不是 git 仓库，无法执行部署前 `git pull` / `git push`。
- 已确认 JOJO 内网服务监听 `*:4173`，由 `screen` 会话 `chat-record-drama-preview` 保持运行。
- 内网访问地址：`http://10.131.48.68:4173/`。
- 已验证 `http://127.0.0.1:4173/api/health` 与 `http://10.131.48.68:4173/api/health` 均返回 `{"ok":true}`。
- 已验证 `/api/settings/deepseek` 返回公司中转：`https://token.xjjj.co/v1`、模型 `deepseek-v4-flash`。

## 2026-06-12 窄屏交互与清空逻辑

- 已将编故事收起按钮改为双状态：展开时显示向下箭头，收起后显示钢笔图标。
- 已给编故事面板展开/收起加入 `max-height`、透明度和位移缩放过渡。
- 已将收起/展开结构扩展到 `1080px` 以下；平板和手机都使用底部居中半弹窗。
- 已取消 `400px` 以下的 16:9 手机预览；现在 400px 以下只让模拟聊天手机本体按宽度轻微等比缩小，其他结构保持和较宽移动端一致。
- 已修复“重启故事”：点击后清空模拟界面中的消息，不再恢复 JOJO 默认剧情。
- 已去掉视频操作条继承出来的深色/黑色底部带，生成语音和导出视频按钮下方保持透明。

## 2026-06-12 /ququ 静态部署准备

- 已新增公共路径解析 `src/shared/publicPath.ts`，头像、钉钉/微信 UI、表情、照片和 Remotion 图片资源会跟随 `import.meta.env.BASE_URL`，支持部署在 `/ququ/` 子路径。
- 已新增 `npm run build:ququ`，输出 `dist/ququ`，并显式启用公司中转浏览器直连配置。
- 已在外网不可达公司 token 中转时增加 Toast：`token服务连不上，请连到叫叫的 Wi-Fi`，再降级本地续写。
- 已把 `dist/ququ` 同步到同级 `📍JUDS/ququ`，并在 `📍JUDS/DEMO/index.html` 首页列表第一项加入“蛐蛐模拟器”，入口为 `/ququ/`。
- 已在 `📍JUDS/vercel.json` 增加 `/ququ` 到 `/ququ/index.html` 的 rewrite。
- 已把 1080px 以下收起态“编故事”按钮父级增大到 `136px`，按钮增大到 `62px`，底部上移，避免阴影和 continuity transition 被视口裁切。
- 已用本地静态服务核验 `/ququ/`：390/360/302px 宽均无横向滚动，钉钉手机保持 `9:19.5` 比例，仅等比缩小；DEMO 首页第一项为“蛐蛐模拟器”。
- 已模拟阻断 `token.xjjj.co`，点击“开始编”后会出现 Toast：`token服务连不上，请连到叫叫的 Wi-Fi`。
- 已按项目约定尝试部署前 `git pull` / `git push`：`📍JUDS` 当前分支没有 tracking 信息，且没有配置 push remote，因此两步均无法完成；未擅自添加 remote，避免影响既有脏工作区。
- 已执行 Vercel 生产部署：`dpl_BNruNFgoKnYT413KgHhGbDXjSCP4`，并显式 alias 到 `https://jojodemos.mikeywa.icu`。
- 已验证公网 `https://jojodemos.mikeywa.icu/ququ/` 返回 `200`，HTML 引用 `/ququ/static/index-EQnrbLJK.js` 与 `/ququ/static/index-C2jw5fkf.css`。
- 已验证公网 JS、CSS、`/ququ/site-icon.svg` 均返回 `200`；`https://jojodemos.mikeywa.icu/DEMO/` 首页列表第一项包含“蛐蛐模拟器”，入口为 `/ququ/`。

## 2026-06-15 GitHub 公开仓库准备

- 项目名统一为“聊天记录短剧模拟器”，`package.json` 包名改为 `chat-record-drama-simulator`。
- 已从 `server/settings.ts` 与 `vite.config.ts` 移除真实 token，改为通过 `.env` 或 CI 环境变量注入。
- 已更新 `.env.example`，新增 `COMPANY_DEEPSEEK_API_KEY`、`VITE_COMPANY_DEEPSEEK_API_KEY` 等配置占位。
- 已加强 `.gitignore`，排除 `.env`、临时目录、渲染视频、录屏、同步冲突文件和系统文件，避免公开仓库误提交敏感或大体积文件。
- GitHub 不保留中文仓库 slug，首次创建被规范成 `-`；已重命名为公开仓库 `yanghaoleng/chat-record-drama-simulator`，README 中文项目名仍为“聊天记录短剧模拟器”。
- 已推送 `main` 到 `https://github.com/yanghaoleng/chat-record-drama-simulator`。
- 标题菜单已新增 `Github` 公开仓库入口，默认指向 `https://github.com/yanghaoleng/chat-record-drama-simulator`，也可通过 `VITE_GITHUB_REPO_URL` 覆盖。
- 桌面端“编故事”面板已改为固定像素垂直偏移 `--desktop-story-panel-top-offset: 190px`，不再依赖百分比/视口高度居中；移动端底部半弹窗结构不变。
- 桌面端视频版右侧预览面板已使用 `--desktop-preview-window-top-offset`，在 `--desktop-story-panel-top-offset: 190px` 上补 `12px` 视觉内边距，视频窗口顶部和可见“编故事”卡片保持同高。
