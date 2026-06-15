# 聊天记录短剧模拟器

面向中文短视频创作和公司内网娱乐的本地 Web 工具，用来生成“聊天剧情 + 编故事续写 + 语音 + 视频导出”的聊天记录短剧。

当前内置两个独立包装，共用底层组件、生成逻辑和 API：

- JOJO版：默认构建，页面标题为“蛐蛐模拟器”。玩家扮演叫叫，使用 `avatar-jojo` 头像、钉钉手机版顶栏/底部、叫叫右侧蓝色气泡、其他角色左侧白色气泡；桌面端“编故事”和视频预览窗口共用固定顶部偏移，1080px 以下“编故事”改为底部居中半弹窗，400px 以下只让模拟聊天界面轻微等比缩小，整体结构不再切换。
- 网红短剧版：独立构建产物，保留原来的男女主微信式聊天短剧玩法。

## 快速启动

```bash
npm install --registry=https://registry.npmjs.org/
cp .env.example .env
npm run dev
```

打开 `http://127.0.0.1:5173`。默认只启动 Vite 静态前端；没有后端时 DeepSeek 会退回本地规则续写。

公司内网使用推荐：

```bash
npm run dev:fullstack
```

## 本地预览

```bash
npm run build
npm run preview
```

`npm run build` 会生成两套互不链接的静态产物：`dist/jojo` 和 `dist/viral`。`npm run preview` 默认预览 JOJO 版静态包，地址为 `http://127.0.0.1:4173/`，不包含后端 API。

部署到 `jojodemos.mikeywa.icu/ququ` 使用：

```bash
npm run build:ququ
```

它会用 `/ququ/` 作为静态资源前缀输出到 `dist/ququ`。

带 DeepSeek 后端代理的生产预览：

```bash
npm run preview:jojo
npm run preview:viral
```

默认地址为 `http://127.0.0.1:8787/`。内网预览 JOJO 版使用：

```bash
npm run preview:lan
```

它会监听 `0.0.0.0:4173` 并托管 `dist/jojo`；网红版可用 `npm run preview:lan:viral` 单独监听 `0.0.0.0:4174`。

当前 JOJO 内网访问地址：

- `http://10.131.48.68:4173/`
- 服务监听：`0.0.0.0:4173`
- 当前由 `screen` 会话 `chat-record-drama-preview` 保持运行。

## 模型配置

- 后端默认中转地址：`https://token.xjjj.co/v1`。
- 后端默认模型：`deepseek-v4-flash`。
- 公开仓库不保存任何真实 token；本地请复制 `.env.example` 为 `.env` 后填写环境变量。
- 后端优先读取 `DEEPSEEK_API_KEY`，也支持公司内网专用的 `COMPANY_DEEPSEEK_API_KEY`。
- `build:ququ` 如需在纯静态页面中浏览器直连公司中转，需要在本地或 CI 环境设置 `VITE_COMPANY_DEEPSEEK_API_KEY`。
- 如需临时覆盖，可设置 `DEEPSEEK_BASE_URL`、`DEEPSEEK_MODEL`、`VITE_COMPANY_DEEPSEEK_BASE_URL`、`VITE_COMPANY_DEEPSEEK_MODEL`、`VITE_GITHUB_REPO_URL` 环境变量。
- 旧的 `data/settings.json` 保存配置默认不覆盖公司中转；只有设置 `USE_SAVED_DEEPSEEK_SETTINGS=1` 才启用。

如果没有后端、未配置 token 或模型请求失败，工具会使用本地规则续写。外网访问静态部署时，如果公司中转不可达，会弹出 Toast：`token服务连不上，请连到叫叫的 Wi-Fi`。Edge TTS 在浏览器端直连微软语音服务；如果当前浏览器或网络策略拦截 WebSocket，会在页面状态和控制台里报错。

## 线性存档

每次在“编故事”里输入一段内容，都会追加一张故事卡片，并把 DeepSeek 生成的新对话接到同一条线上。顶部“存档”会导出 JSON，“读档”会导入此前导出的 JSON 继续创作。

## 核心功能

- 输入下一段剧情，基于历史故事卡片和当前对话续写剧情。
- JOJO版 / 网红短剧版是两套独立构建产物，标题菜单支持版本互跳，并提供 `Github` 公开仓库入口。
- 在界面版和 Remotion 视频版之间切换，聊天播放完后可在信息流末尾点“再来一遍”重播入场；视频版空态保持和有内容时相同的画布尺寸。
- 启动时默认内置剧情会从空信息流自动入场播放。
- 1080px 以下编故事使用底部居中半弹窗，生成成功后自动收起，并通过连续过渡把按钮从弹窗右上角移动到底部居中；400px 以下只收窄模拟聊天手机，不改变整体交互结构。
- “重启故事”会清空当前信息流气泡和故事卡片，但保留手机壳、顶栏和底栏，不再恢复默认内置剧情。
- 支持读档、存档线性 JSON。
- 支持 Edge TTS 生成男女声语音，并在浏览器内导出视频。
- JOJO 版自动调用固定头像、真实办公室局部照片、头像表情卡，不让用户手动选择头像或场景。

## API

日常静态模式不依赖后端。保留的 Fastify 开发 API 通过 `npm run dev:fullstack` 启动，默认端口 `8787`：

- `GET /api/health`：健康检查。
- `GET /api/settings/deepseek`：读取 DeepSeek 配置状态，不返回明文 key。
- `POST /api/story/continue`：编故事续写，后端通过 OpenAI Chat Completions 兼容接口请求公司中转。
- `GET /api/project/sample`：示例项目。
- `POST /api/script/generate`：DeepSeek 剧情生成。
- `POST /api/tts/batch`：批量合成语音。
- `POST /api/render`：服务端渲染视频。

## 关键技术架构

- 前端：Vite、React 19、HeroUI、Tailwind CSS、GSAP。
- 构建：`STORY_PACKAGE=jojo|viral` 注入 `__APP_STORY_PACKAGE__`，分别输出 `dist/jojo`、`dist/viral`；`build:ququ` 输出可部署到 `/ququ/` 的 `dist/ququ`。
- 预览与渲染：Remotion Player + 浏览器录制导出。
- 剧情数据：`src/shared/schema.ts` 定义项目、角色、消息类型。
- 生成逻辑：全栈模式优先走后端公司中转；后端不可用时尝试浏览器直连；都不可用时走本地规则续写。
- JOJO 资源：`assets/avatar-jojo` 为头像源；`public/avatars/jojo`、`public/dingtalk-ui`、`public/jojo-assets` 为运行时静态资源。
- 静态资源：微信/钉钉 UI、音频、表情、渲染产物分别放在 `public/`、`data/`、`assets/`、`renders/`。
- 聊天预览顶部和底部使用 Figma 导出的整图：微信 `public/wechat-ui`，钉钉 `public/dingtalk-ui`。
- 站点图标：`public/site-icon.svg`，白底黑色蛐蛐，用于 favicon 和顶栏产品名左侧 logo。

## 功能边界

- Remotion 模板默认 `1516x852`，匹配参考录屏的横向聊天画布。
- 消息支持 `text`、`image`、`meme`、`transfer`、`system`。
- JOJO 版图片素材要求真实办公室局部、手、背影、运动模糊，不出现真实正脸或卡通角色脸。
- 表情包候选接入 `QFace`、`ChineseBQB`、`SOOGIF`、`sorrypy` 来源记录。
- `QFace` README 明确写明腾讯官方表情资源仅供学习交流，请勿直接商用；`ChineseBQB` 未声明明确 license。工具会记录来源和风险，但不阻断导入。

## 验证

```bash
npm run test
npm run build
npm run render:sample
```

公司内网要使用固定中转生成时，请运行 `npm run dev:fullstack` 或部署 Fastify 后端。
