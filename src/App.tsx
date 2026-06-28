import { Button } from "@heroui/react/button";
import { Card, CardContent, CardHeader } from "@heroui/react/card";
import { Player, type PlayerRef } from "@remotion/player";
import { Calligraph } from "calligraph";
import gsap from "gsap";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  Download,
  FileAudio,
  FileDown,
  FileUp,
  Film,
  Lightbulb,
  MessageSquarePlus,
  MoreHorizontal,
  PenLine,
  Play,
  RefreshCcw,
  Save,
  Smartphone,
  Sparkles,
  Video,
  X
} from "lucide-react";
import { type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { exportBrowserVideo, type VideoExportResult } from "./shared/browserVideo";
import { generateBackendStorySegment } from "./shared/deepseekBackend";
import { generateDeepSeekStorySegment, getBrowserDeepSeekStatusText, hasBrowserDeepSeekKey } from "./shared/deepseekBrowser";
import { synthesizeMessageClip, type TtsClipMap } from "./shared/edgeTts";
import {
  createInitialStaticProject,
  createInitialPlaybackProject,
  makeStoryArchive,
  parseStoryArchive,
  suggestNextStoryPrompt,
  type PromptCard,
  type StoryPackage
} from "./shared/linearStory";
import { ChatDrama } from "./remotion/ChatDrama";
import { imageNarrativeCopy, imageSourceForMessage } from "./shared/imageNarrative";
import { jojoCssMemeCardForMessage, type JojoCssMemeCard } from "./shared/jojoMemeCards";
import { isJojoProject } from "./shared/jojoProject";
import { publicAsset, resolvePublicAssetPath } from "./shared/publicPath";
import { getCharacter, isVoiceMessage, type ChatMessage, type DramaProject } from "./shared/schema";
import { buildTimeline, getDurationInFrames } from "./shared/timing";

type ApiState = "idle" | "loading" | "error" | "done";
type PreviewMode = "wechat" | "video";
type PreviewDirection = "left" | "right";
type PreviewTransition = {
  direction: PreviewDirection;
  exiting: PreviewMode;
  id: number;
};
type PendingPromptCard = {
  id: string;
  prompt: string;
  status: "generating" | "queued" | "settling" | "removing";
  completedCardId?: string;
  completedCardNumber?: number;
};
type PromptRestoreUndo = {
  before: string;
  after: string;
};

type AppProps = {
  storyPackage: StoryPackage;
};

const deepSeekServiceToast = "DeepSeek 服务暂时连不上，已停止生成";
const defaultJojoAppUrl = "https://jojodemos.mikeywa.icu/ququ/";
const defaultViralAppUrl = "https://ququ.mikeywa.icu/";
const defaultGithubRepositoryUrl = "https://github.com/yanghaoleng/FakeChat";
const generationProgressCap = 99;
const generationProgressLoadingCap = 96;

const jojoGlassCardStyle: CSSProperties = {
  backdropFilter: "blur(24px) saturate(118%)",
  WebkitBackdropFilter: "blur(24px) saturate(118%)"
};

const jojoPromptCardGlassStyle: CSSProperties = {
  backdropFilter: "blur(14px) saturate(116%)",
  WebkitBackdropFilter: "blur(14px) saturate(116%)"
};

const jojoStoryToggleGlassStyle: CSSProperties = {
  backdropFilter: "blur(14px) saturate(118%)",
  WebkitBackdropFilter: "blur(14px) saturate(118%)"
};

function initialPromptFor(packageId: StoryPackage) {
  return packageId === "jojo"
    ? "老板说这个需求很简单，叫叫准备勇敢接下，铃铛开始冷静拆穿排期，猪小弟默默垫上会议室费用。"
    : "张阿姨给男主介绍相亲对象，聊了半天才发现对方是他小时候暗恋过的小学同学，女生用旧绰号和毕业照把回忆翻出来。";
}

function normalizedPrompt(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function isInitialPresetPrompt(packageId: StoryPackage, prompt: string) {
  return normalizedPrompt(prompt) === normalizedPrompt(initialPromptFor(packageId));
}

function createEmptyInitialProject(packageId: StoryPackage) {
  return { ...createInitialStaticProject(packageId), messages: [] };
}

function createInitialPresetStorySegment(packageId: StoryPackage, prompt: string) {
  const project = { ...createInitialPlaybackProject(packageId), brief: prompt };
  const messages = project.messages;
  const card: PromptCard = {
    id: `prompt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    prompt,
    createdAt: new Date().toISOString(),
    messageIds: messages.map((message) => message.id),
    summary: `追加 ${messages.length} 条消息，承接 0 条历史对话`
  };
  return { card, messages, project };
}

function packageTitle(packageId: StoryPackage) {
  return packageId === "jojo" ? "蛐蛐模拟器" : "聊天记录生成器";
}

function packageReadyText(packageId: StoryPackage) {
  return packageId === "jojo" ? "JOJO 版已就绪：默认公司群剧情已载入" : "网红短剧版已就绪：默认相亲剧情已载入";
}

function packageSwitchLink(packageId: StoryPackage) {
  return packageId === "jojo"
    ? {
        href: import.meta.env.VITE_VIRAL_APP_URL || defaultViralAppUrl,
        label: "去微信版"
      }
    : {
        href: import.meta.env.VITE_JOJO_APP_URL || defaultJojoAppUrl,
        label: "钉钉版"
      };
}

function promptRiseAnimationMs(text: string) {
  return Math.min(3600, Math.max(1100, 700 + Array.from(text).length * 17));
}

function estimatedGenerationMs(project: DramaProject, packageId: StoryPackage) {
  if (!project.messages.length) return packageId === "jojo" ? 32000 : 36000;
  return packageId === "jojo" ? 22000 : 26000;
}

function estimateGenerationProgress(startedAt: number, estimateMs: number) {
  const elapsed = Math.max(0, Date.now() - startedAt);
  if (elapsed <= estimateMs) {
    const progressRatio = Math.min(1, elapsed / estimateMs);
    const easedProgress = 1 - Math.pow(1 - progressRatio, 2.7);
    return Math.max(1, Math.floor(easedProgress * generationProgressLoadingCap));
  }
  const tailElapsed = elapsed - estimateMs;
  const tailProgress = 2 * (1 - Math.exp(-tailElapsed / 18000));
  return Math.min(generationProgressCap - 1, Math.floor(generationProgressLoadingCap + tailProgress));
}

function renderPromptRiseText(text: string) {
  return Array.from(text).map((character, index) => {
    if (character === "\n") return <br key={`prompt-rise-break-${index}`} />;
    return (
      <span
        key={`prompt-rise-${index}-${character}`}
        className="prompt-suggestion-character"
        style={{ "--prompt-character-index": index } as CSSProperties}
      >
        {character}
      </span>
    );
  });
}

function PendingPromptCardView({
  prompt,
  progress,
  status,
  queuePosition,
  onEdit,
  onUpdate,
  onRemove,
  onJumpToBottom,
  onSelect,
  onStartEdit,
  onCancelEdit,
  isSelected,
  isEditing,
  cardId,
  style
}: {
  prompt: string;
  progress: number;
  status: PendingPromptCard["status"];
  queuePosition: number;
  onEdit: () => void;
  onUpdate?: (nextPrompt: string) => void;
  onRemove?: () => void;
  onJumpToBottom?: () => void;
  onSelect?: () => void;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  isSelected?: boolean;
  isEditing?: boolean;
  cardId?: string;
  style?: CSSProperties;
}) {
  const isGenerating = status === "generating";
  const isSettling = status === "settling";
  const isRemoving = status === "removing";
  const [draft, setDraft] = useState(prompt);
  useEffect(() => {
    if (!isEditing) setDraft(prompt);
  }, [isEditing, prompt]);
  const canJumpToBottom = isGenerating && Boolean(onJumpToBottom);
  const canSelect = !isGenerating && !isSettling && !isRemoving && Boolean(onSelect);
  const cardClassName = [
    "prompt-card",
    isGenerating
      ? "prompt-card-pending prompt-card-generating"
      : isSettling
        ? "prompt-card-queued prompt-card-settling prompt-card-active"
        : isRemoving
          ? "prompt-card-queued prompt-card-removing"
          : "prompt-card-queued prompt-card-selectable",
    isSelected ? "prompt-card-active" : "",
    isEditing ? "prompt-card-editing" : ""
  ].filter(Boolean).join(" ");
  const handleClick = () => {
    if (canJumpToBottom) {
      onJumpToBottom?.();
      return;
    }
    if (canSelect) onSelect?.();
  };
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (canJumpToBottom && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onJumpToBottom?.();
      return;
    }
    if (!canSelect) return;
    if (event.key === "Enter") {
      event.preventDefault();
      onStartEdit?.();
      return;
    }
    if (event.key === " ") {
      event.preventDefault();
      onSelect?.();
    }
  };
  const commitEdit = () => {
    const nextPrompt = draft.trim();
    if (!nextPrompt) return;
    onUpdate?.(nextPrompt);
  };
  const cancelEdit = () => {
    setDraft(prompt);
    onCancelEdit?.();
  };
  const handleEditKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    event.stopPropagation();
    if (event.key === "Escape") {
      event.preventDefault();
      cancelEdit();
      return;
    }
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    commitEdit();
  };
  return (
    <article
      className={cardClassName}
      style={style}
      aria-live="polite"
      aria-label={canJumpToBottom ? "滚动到当前对话底部" : canSelect ? `选中第 ${queuePosition} 张排队故事卡` : isSettling ? `第 ${queuePosition} 张故事卡已生成` : isRemoving ? `第 ${queuePosition} 张故事卡正在移除` : undefined}
      aria-pressed={canSelect ? Boolean(isSelected) : undefined}
      data-pending-prompt-card-id={cardId}
      data-prompt-list-card-key={cardId ? `pending-${cardId}` : undefined}
      role={canJumpToBottom || canSelect ? "button" : undefined}
      tabIndex={canJumpToBottom || canSelect ? 0 : undefined}
      onClick={handleClick}
      onDoubleClick={() => {
        if (canSelect) onStartEdit?.();
      }}
      onFocus={() => {
        if (canSelect) onSelect?.();
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="prompt-card-progress" aria-label={isGenerating ? `生成进度 ${progress}%` : `第 ${queuePosition} 张故事卡`}>
        {isGenerating ? (
          <div className="prompt-card-generating-progress">
            <Calligraph as="strong" variant="number" animation="snappy" className="prompt-card-progress-number">
              {`${progress}%`}
            </Calligraph>
          </div>
        ) : (
          <div className="prompt-card-index">{queuePosition}</div>
        )}
      </div>
      <div className="prompt-card-pending-body">
        {isEditing ? (
          <textarea
            className="prompt-card-edit-textarea"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleEditKeyDown}
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={(event) => event.stopPropagation()}
            rows={3}
            autoFocus
          />
        ) : (
          <p>{prompt}</p>
        )}
        {isGenerating ? (
          <button
            className="prompt-card-edit-button"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
          >
            重新编辑
          </button>
        ) : isSettling ? (
          <div className="prompt-card-queue-actions prompt-card-settling-actions">
            <span className="prompt-card-queue-status">已生成</span>
          </div>
        ) : isRemoving ? (
          <div className="prompt-card-queue-actions">
            <span className="prompt-card-queue-status">移除中</span>
          </div>
        ) : isEditing ? (
          <div className="prompt-card-queue-actions">
            <span className="prompt-card-queue-status">编辑中</span>
            <div className="prompt-card-queue-controls">
              <button
                className="prompt-card-icon-button prompt-card-confirm-button"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  commitEdit();
                }}
                aria-label="确认编辑"
                disabled={!draft.trim()}
              >
                <Check size={14} />
                <span>确认</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="prompt-card-queue-actions">
            <span className="prompt-card-queue-status">排队中</span>
            <div className="prompt-card-queue-controls">
              {onUpdate ? (
                <button
                  className="prompt-card-icon-button"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onStartEdit?.();
                  }}
                  aria-label="编辑排队中的故事卡"
                >
                  <PenLine size={14} />
                </button>
              ) : null}
              {onRemove ? (
                <button
                  className="prompt-card-icon-button prompt-card-remove-button"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemove();
                  }}
                  aria-label="删除排队中的故事卡"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function StoryPromptCardView({
  card,
  cardNumber,
  isSelected,
  isCompletingFromPending,
  isMenuOpen,
  layoutKey,
  onFocusCard,
  onToggleMenu,
  onRestartFromHere,
  onCopyPrompt,
  style
}: {
  card: PromptCard;
  cardNumber: number;
  isSelected: boolean;
  isCompletingFromPending?: boolean;
  isMenuOpen: boolean;
  layoutKey?: string;
  onFocusCard: () => void;
  onToggleMenu: () => void;
  onRestartFromHere: () => void;
  onCopyPrompt: () => void;
  style?: CSSProperties;
}) {
  const cardClassName = [
    "prompt-card",
    "prompt-card-button",
    isSelected ? "prompt-card-active" : "",
    isCompletingFromPending ? "prompt-card-completed-settling" : "",
    isMenuOpen ? "prompt-card-menu-open" : ""
  ].filter(Boolean).join(" ");
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onFocusCard();
  };
  return (
    <article
      className={cardClassName}
      style={style}
      role="button"
      tabIndex={0}
      data-prompt-list-card-key={layoutKey ?? `prompt-${card.id}`}
      data-prompt-card-id={card.id}
      aria-pressed={isSelected}
      aria-label={`定位到第 ${cardNumber} 张故事卡`}
      onClick={onFocusCard}
      onKeyDown={handleKeyDown}
    >
      <div className="prompt-card-index">{cardNumber}</div>
      <p>{card.prompt}</p>
      <div className="prompt-card-menu-root">
        <button
          className="prompt-card-menu-trigger"
          type="button"
          aria-label="打开故事卡菜单"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={(event) => {
            event.stopPropagation();
            onToggleMenu();
          }}
        >
          <MoreHorizontal size={16} />
        </button>
        {isMenuOpen ? (
          <div className="prompt-card-menu" role="menu" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              role="menuitem"
              onClick={(event) => {
                event.stopPropagation();
                onRestartFromHere();
              }}
            >
              <RefreshCcw size={14} />
              <span>从这里重新开始</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={(event) => {
                event.stopPropagation();
                onCopyPrompt();
              }}
            >
              <Copy size={14} />
              <span>复制</span>
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function shouldUseStoryModal() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 1079px)").matches;
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void) => {
    finished?: Promise<void>;
  };
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function archiveTimestamp(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getFullYear() % 100)}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

function archiveFilename(date = new Date()) {
  return `存档-fakechat-${archiveTimestamp(date)}.json`;
}

type LayoutSnapshot = Map<string, { left: number; top: number }>;

function getLeftPanelLayoutKey(element: HTMLElement) {
  if (element.classList.contains("story-composer-card")) return "composer";
  if (element.classList.contains("prompt-history-card")) return "history";
  return "";
}

function getLeftPanelLayoutTargets(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(".left-panel-scroll > .story-composer-card, .left-panel-scroll > .prompt-history-card"));
}

function readLeftPanelLayoutSnapshot(root: HTMLElement): LayoutSnapshot {
  const snapshot: LayoutSnapshot = new Map();
  getLeftPanelLayoutTargets(root).forEach((element) => {
    const key = getLeftPanelLayoutKey(element);
    if (!key) return;
    snapshot.set(key, { left: element.offsetLeft, top: element.offsetTop });
  });
  return snapshot;
}

function getPromptCardLayoutKey(element: HTMLElement) {
  return element.dataset.promptListCardKey || "";
}

function getPromptCardLayoutTargets(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>(".prompt-card-list > [data-prompt-list-card-key]"));
}

function readPromptCardLayoutSnapshot(root: HTMLElement): LayoutSnapshot {
  const snapshot: LayoutSnapshot = new Map();
  getPromptCardLayoutTargets(root).forEach((element) => {
    const key = getPromptCardLayoutKey(element);
    if (!key) return;
    snapshot.set(key, { left: element.offsetLeft, top: element.offsetTop });
  });
  return snapshot;
}

function updateMessage(project: DramaProject, id: string, patch: Partial<ChatMessage>): DramaProject {
  return {
    ...project,
    messages: project.messages.map((message) => (message.id === id ? { ...message, ...patch } : message))
  };
}

function WechatAvatar({ project, message }: { project: DramaProject; message: ChatMessage }) {
  const character = getCharacter(project, message);
  if (character.avatarUrl) return <img className="wechat-avatar" src={resolvePublicAssetPath(character.avatarUrl)} alt="" />;
  return (
    <div className="wechat-avatar wechat-avatar-fallback" style={{ background: character.avatarGradient }}>
      {character.avatarInitial}
    </div>
  );
}

function JojoCssMemeCardView({ card }: { card: JojoCssMemeCard }) {
  return (
    <div className={`jojo-css-meme-card jojo-css-meme-card-${card.tone}`}>
      <div className="jojo-css-meme-mark" aria-hidden="true">
        <span>{card.mark}</span>
      </div>
      <strong>{card.title}</strong>
      <small>{card.subtitle}</small>
    </div>
  );
}

function WechatMessageContent({ project, message }: { project: DramaProject; message: ChatMessage }) {
  const jojoMode = isJojoProject(project);
  if (message.type === "transfer") {
    return (
      <div className="wechat-transfer">
        <div className="wechat-transfer-main">
          <div className="wechat-transfer-icon">¥</div>
          <div>
            <strong>¥{(message.amount ?? 88).toFixed(2)}</strong>
            <span>{message.transferNote || message.text || "转账给你"}</span>
          </div>
        </div>
        <div className="wechat-transfer-footer">{jojoMode ? "钉钉转账" : "微信转账"}</div>
      </div>
    );
  }
  if (message.type === "image") {
    const src = resolvePublicAssetPath(imageSourceForMessage(project, message));
    const copy = imageNarrativeCopy(project, message);
    return (
      <div className="wechat-image-card">
        {src ? <img src={src} alt={copy.alt} /> : (
          <div className="wechat-photo-placeholder">
            <p>{copy.description}</p>
          </div>
        )}
      </div>
    );
  }
  if (message.type === "meme") {
    const cssCard = jojoCssMemeCardForMessage(message);
    const src = cssCard ? undefined : resolvePublicAssetPath(imageSourceForMessage(project, message));
    return (
      <div className={cssCard ? "wechat-meme-card wechat-meme-card-css" : "wechat-meme-card"}>
        {cssCard ? <JojoCssMemeCardView card={cssCard} /> : src ? <img src={src} alt={message.text || "表情"} /> : <div className="wechat-meme-fallback">表情</div>}
        {!cssCard && message.text ? <span>{message.text}</span> : null}
      </div>
    );
  }
  return <div className="wechat-bubble">{message.text || message.ttsText || " "}</div>;
}

function visualSideFor(project: DramaProject, message: ChatMessage) {
  if (!isJojoProject(project)) return message.side;
  if (message.roleId === "jiaojiao") return "right";
  if (message.side === "center") return "center";
  return "left";
}

function WechatStoryPreview({
  project,
  onReplay,
  showReplay
}: {
  project: DramaProject;
  onReplay?: () => void;
  showReplay?: boolean;
}) {
  const jojoMode = isJojoProject(project);
  const peer = project.characters.find((character) => character.side === "left") ?? project.characters[0];
  return (
    <div className="wechat-preview-shell">
      <div className={`wechat-phone ${jojoMode ? "dingtalk-phone" : ""}`} aria-label={jojoMode ? "钉钉手机版聊天预览" : "9:16 微信聊天预览"}>
        <div className={jojoMode ? "dingtalk-topbar" : "wechat-topbar"}>
          <img className={jojoMode ? "dingtalk-topbar-img" : "wechat-topbar-img"} src={publicAsset(jojoMode ? "/dingtalk-ui/topbar.webp" : "/wechat-ui/topbar.webp")} alt="" draggable={false} />
          {jojoMode ? <strong className="dingtalk-topbar-title">{project.title || "工位蛐蛐小队"}</strong> : <strong className="wechat-topbar-title">{peer?.name || project.title}</strong>}
        </div>
        <div className={`wechat-chat-scroll ${jojoMode ? "dingtalk-chat-scroll" : ""}`}>
          <div className="wechat-chat-date">{jojoMode ? "今天 09:27" : "今天 17:32"}</div>
          {project.messages.map((message) => {
            if (message.type === "system" || message.side === "center") {
              return <div key={message.id} className="wechat-system-row" data-message-id={message.id}>{message.text}</div>;
            }
            const character = getCharacter(project, message);
            const visualSide = visualSideFor(project, message);
            return (
              <div
                key={message.id}
                className={`wechat-row wechat-row-${visualSide} ${jojoMode ? `dingtalk-row ${message.roleId === "jiaojiao" ? "dingtalk-row-self" : "dingtalk-row-other"}` : ""}`}
                data-message-id={message.id}
              >
                {visualSide === "left" ? <WechatAvatar project={project} message={message} /> : null}
                <div className="wechat-message-stack">
                  {jojoMode ? <div className="wechat-speaker-name">{character.name}</div> : null}
                  <WechatMessageContent project={project} message={message} />
                </div>
                {visualSide === "right" ? <WechatAvatar project={project} message={message} /> : null}
              </div>
            );
          })}
          {showReplay ? (
            <div className="chat-replay-row">
              <button className="chat-replay-button" type="button" onClick={onReplay} aria-label="再来一遍">
                再来一遍
              </button>
            </div>
          ) : null}
        </div>
        <img className={jojoMode ? "dingtalk-inputbar-img" : "wechat-bottombar-img"} src={publicAsset(jojoMode ? "/dingtalk-ui/inputbar.webp" : "/wechat-ui/bottombar.webp")} alt="" draggable={false} />
      </div>
    </div>
  );
}

export default function App({ storyPackage }: AppProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [project, setProject] = useState<DramaProject>(() => createEmptyInitialProject(storyPackage));
  const [promptCards, setPromptCards] = useState<PromptCard[]>([]);
  const [draftPrompt, setDraftPrompt] = useState("");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("wechat");
  const [status, setStatus] = useState<ApiState>("idle");
  const [statusText, setStatusText] = useState("正在检查 DeepSeek 配置...");
  const [clips, setClips] = useState<TtsClipMap>({});
  const [videoResult, setVideoResult] = useState<VideoExportResult | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [visibleMessageCount, setVisibleMessageCount] = useState(0);
  const [storyPanelOpen, setStoryPanelOpen] = useState(true);
  const [previewTransition, setPreviewTransition] = useState<PreviewTransition | null>(null);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [promptSuggestionActive, setPromptSuggestionActive] = useState(false);
  const [promptSuggestionKey, setPromptSuggestionKey] = useState(0);
  const [deferredSuggestedPrompt, setDeferredSuggestedPrompt] = useState<string | null>(null);
  const [suggestionDialogOpen, setSuggestionDialogOpen] = useState(false);
  const [pendingPromptCards, setPendingPromptCards] = useState<PendingPromptCard[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [focusedPromptCardId, setFocusedPromptCardId] = useState<string | null>(null);
  const [focusedPendingPromptCardId, setFocusedPendingPromptCardId] = useState<string | null>(null);
  const [editingPendingPromptCardId, setEditingPendingPromptCardId] = useState<string | null>(null);
  const [openPromptCardMenuId, setOpenPromptCardMenuId] = useState<string | null>(null);
  const [scrollTargetMessageId, setScrollTargetMessageId] = useState<string | null>(null);
  const [leftPanelScrolling, setLeftPanelScrolling] = useState(false);
  const scrollTargetMessageIdRef = useRef<string | null>(null);
  const projectRef = useRef(project);
  const promptCardsRef = useRef(promptCards);
  const draftPromptRef = useRef(draftPrompt);
  const pendingPromptCardsRef = useRef<PendingPromptCard[]>([]);
  const leftPanelLayoutSnapshotRef = useRef<LayoutSnapshot>(new Map());
  const promptCardLayoutSnapshotRef = useRef<LayoutSnapshot>(new Map());
  const pendingLeftPanelLayoutSnapshotRef = useRef<LayoutSnapshot | null>(null);
  const pendingPromptCardLayoutSnapshotRef = useRef<LayoutSnapshot | null>(null);
  const storyLayoutSnapshotLockedRef = useRef(false);
  const storyLayoutUnlockTimerRef = useRef<number | undefined>(undefined);
  const settledPromptCardIdsRef = useRef<Set<string>>(new Set());
  const completedPromptCardLayoutKeysRef = useRef<Map<string, string>>(new Map());
  const previousStoryPanelOpenRef = useRef(storyPanelOpen);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const revealTimerRef = useRef<number | undefined>(undefined);
  const previewTransitionTimerRef = useRef<number | undefined>(undefined);
  const promptSuggestionTimerRef = useRef<number | undefined>(undefined);
  const leftPanelScrollTimerRef = useRef<number | undefined>(undefined);
  const toastTimerRef = useRef<number | undefined>(undefined);
  const generationAbortRef = useRef<AbortController | null>(null);
  const generationProgressRef = useRef(0);
  const generationProgressTimerRef = useRef<number | undefined>(undefined);
  const pendingPromptRemovalTimersRef = useRef<Map<string, number>>(new Map());
  const generationRunRef = useRef(0);
  const queueProcessingRef = useRef(false);
  const activePromptCardIdRef = useRef<string | null>(null);
  const promptRestoreUndoRef = useRef<PromptRestoreUndo | null>(null);
  const promptAnimationFocusGuardUntilRef = useRef(0);
  const playerRef = useRef<PlayerRef>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const jojoMode = storyPackage === "jojo";
  const durationInFrames = useMemo(() => getDurationInFrames(project), [project]);
  const previewInitialFrame = useMemo(() => buildTimeline(project)[0]?.startFrame ?? 0, [project]);
  const previewProject = useMemo(
    () => ({ ...project, messages: project.messages.slice(0, visibleMessageCount) }),
    [project, visibleMessageCount]
  );

  function syncCurrentStoryLayoutSnapshot() {
    const root = rootRef.current;
    if (!root) return;
    leftPanelLayoutSnapshotRef.current = readLeftPanelLayoutSnapshot(root);
    promptCardLayoutSnapshotRef.current = readPromptCardLayoutSnapshot(root);
  }

  function captureCurrentStoryLayoutSnapshot() {
    if (storyLayoutSnapshotLockedRef.current) return;
    const root = rootRef.current;
    if (!root) return;
    if (storyLayoutUnlockTimerRef.current) {
      window.clearTimeout(storyLayoutUnlockTimerRef.current);
      storyLayoutUnlockTimerRef.current = undefined;
    }
    pendingLeftPanelLayoutSnapshotRef.current = readLeftPanelLayoutSnapshot(root);
    pendingPromptCardLayoutSnapshotRef.current = readPromptCardLayoutSnapshot(root);
    storyLayoutSnapshotLockedRef.current = true;
  }

  function updateScrollTargetMessageId(nextMessageId: string | null) {
    scrollTargetMessageIdRef.current = nextMessageId;
    setScrollTargetMessageId(nextMessageId);
  }

  function handleLeftPanelScroll() {
    setLeftPanelScrolling(true);
    if (leftPanelScrollTimerRef.current) window.clearTimeout(leftPanelScrollTimerRef.current);
    leftPanelScrollTimerRef.current = window.setTimeout(() => {
      setLeftPanelScrolling(false);
      leftPanelScrollTimerRef.current = undefined;
    }, 720);
  }

  function updatePendingPromptCards(updater: (current: PendingPromptCard[]) => PendingPromptCard[]) {
    const currentCards = pendingPromptCardsRef.current;
    const nextCards = updater(currentCards);
    if (nextCards === currentCards) return currentCards;
    captureCurrentStoryLayoutSnapshot();
    pendingPromptCardsRef.current = nextCards;
    setPendingPromptCards(nextCards);
    return nextCards;
  }

  function canGeneratePendingPromptCard(card: PendingPromptCard) {
    return card.status === "queued" || card.status === "generating";
  }

  function clearPendingPromptRemovalTimers() {
    pendingPromptRemovalTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    pendingPromptRemovalTimersRef.current.clear();
  }

  function finalizePendingPromptCardRemoval(cardId: string) {
    const existingTimer = pendingPromptRemovalTimersRef.current.get(cardId);
    if (existingTimer) window.clearTimeout(existingTimer);
    const timer = window.setTimeout(() => {
      pendingPromptRemovalTimersRef.current.delete(cardId);
      updatePendingPromptCards((cards) => cards.filter((card) => card.id !== cardId));
    }, 280);
    pendingPromptRemovalTimersRef.current.set(cardId, timer);
  }

  function markPendingPromptCardRemoving(cardId: string) {
    const nextCards = updatePendingPromptCards((cards) => cards.map((card) => (
      card.id === cardId ? { ...card, status: "removing" } : card
    )));
    finalizePendingPromptCardRemoval(cardId);
    return nextCards;
  }

  function updateGenerationProgress(nextProgress: number | ((current: number) => number)) {
    const rawProgress = typeof nextProgress === "function" ? nextProgress(generationProgressRef.current) : nextProgress;
    const roundedProgress = Math.round(Math.max(0, Math.min(generationProgressCap, rawProgress)));
    generationProgressRef.current = roundedProgress;
    setGenerationProgress(roundedProgress);
    return roundedProgress;
  }

  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  useEffect(() => {
    promptCardsRef.current = promptCards;
  }, [promptCards]);

  useEffect(() => {
    draftPromptRef.current = draftPrompt;
  }, [draftPrompt]);

  useEffect(() => () => {
    if (revealTimerRef.current) window.clearInterval(revealTimerRef.current);
    if (previewTransitionTimerRef.current) window.clearTimeout(previewTransitionTimerRef.current);
    if (promptSuggestionTimerRef.current) window.clearTimeout(promptSuggestionTimerRef.current);
    if (leftPanelScrollTimerRef.current) window.clearTimeout(leftPanelScrollTimerRef.current);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    if (generationProgressTimerRef.current) window.clearInterval(generationProgressTimerRef.current);
    if (storyLayoutUnlockTimerRef.current) window.clearTimeout(storyLayoutUnlockTimerRef.current);
    clearPendingPromptRemovalTimers();
    generationAbortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!settingsMenuOpen) return undefined;
    const handlePointerDown = (event: PointerEvent) => {
      if (settingsMenuRef.current?.contains(event.target as Node)) return;
      setSettingsMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSettingsMenuOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [settingsMenuOpen]);

  useEffect(() => {
    if (!openPromptCardMenuId) return undefined;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest(".prompt-card-menu-root")) return;
      setOpenPromptCardMenuId(null);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPromptCardMenuId(null);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openPromptCardMenuId]);

  useEffect(() => {
    if (project.messages.length) startMessageReveal(0, project.messages.length);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (draftPromptRef.current.trim()) return;
      showSuggestedPrompt(initialPromptFor(storyPackage));
      setStatusText((current) => current === "正在检查 DeepSeek 配置..." ? "准备生成第一段故事" : current);
    }, 260);
    return () => window.clearTimeout(timer);
  }, [storyPackage]);

  useEffect(() => {
    let cancelled = false;
    async function checkDeepSeek() {
      const browserReadyText = await getBrowserDeepSeekStatusText(project);
      if (storyPackage === "jojo") {
        if (!cancelled) {
          setStatusText((current) => current === "正在检查 DeepSeek 配置..." ? browserReadyText : current);
        }
        return;
      }
      try {
        const response = await fetch("/api/settings/deepseek", { signal: AbortSignal.timeout(2500) });
        if (!response.ok) throw new Error(`settings ${response.status}`);
        const settings = await response.json() as { hasApiKey?: boolean; source?: string };
        const sourceLabel = settings.source === "env" ? "环境变量" : settings.source === "company" ? "公司中转" : "已保存";
        const nextText = settings.hasApiKey
          ? `DeepSeek 后端代理已就绪（${sourceLabel}）`
          : browserReadyText;
        if (!cancelled) {
          setStatusText((current) => current === "正在检查 DeepSeek 配置..." ? nextText : current);
        }
      } catch {
        if (!cancelled) {
          setStatusText((current) => current === "正在检查 DeepSeek 配置..." ? browserReadyText : current);
        }
      }
    }
    void checkDeepSeek();
    return () => {
      cancelled = true;
    };
  }, [project, storyPackage]);

  useEffect(() => {
    if (!rootRef.current) return undefined;
    const root = rootRef.current;
    const context = gsap.context(() => {
      gsap.fromTo(
        ".motion-in",
        { y: 18, opacity: 0, filter: "blur(6px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.55,
          stagger: 0.055,
          ease: "power3.out"
        }
      );
    }, root);

    const interactiveSelector = "button,a,textarea,.prompt-card";
    const findInteractive = (target: EventTarget | null) => target instanceof Element ? target.closest<HTMLElement>(interactiveSelector) : null;
    const isMovingInside = (event: PointerEvent, target: HTMLElement) => event.relatedTarget instanceof Node && target.contains(event.relatedTarget);
    const usesOwnMotion = (target: HTMLElement) => target.classList.contains("story-action-button");
    const handleOver = (event: PointerEvent) => {
      const target = findInteractive(event.target);
      if (!target || isMovingInside(event, target) || target.matches("[disabled],[aria-disabled='true']")) return;
      if (usesOwnMotion(target)) return;
      gsap.to(target, { y: -2, scale: 1.01, duration: 0.18, ease: "power2.out" });
    };
    const handleOut = (event: PointerEvent) => {
      const target = findInteractive(event.target);
      if (!target || isMovingInside(event, target)) return;
      if (usesOwnMotion(target)) return;
      gsap.to(target, { y: 0, scale: 1, duration: 0.2, ease: "power2.out" });
    };
    const handleDown = (event: PointerEvent) => {
      const target = findInteractive(event.target);
      if (!target || target.matches("[disabled],[aria-disabled='true']")) return;
      if (usesOwnMotion(target)) return;
      gsap.to(target, { scale: 0.985, duration: 0.08, ease: "power2.out" });
    };
    const handleUp = (event: PointerEvent) => {
      const target = findInteractive(event.target);
      if (!target) return;
      if (usesOwnMotion(target)) return;
      gsap.to(target, { scale: 1.01, duration: 0.12, ease: "power2.out" });
    };

    root.addEventListener("pointerover", handleOver);
    root.addEventListener("pointerout", handleOut);
    root.addEventListener("pointerdown", handleDown);
    root.addEventListener("pointerup", handleUp);
    root.addEventListener("pointercancel", handleOut);

    return () => {
      root.removeEventListener("pointerover", handleOver);
      root.removeEventListener("pointerout", handleOut);
      root.removeEventListener("pointerdown", handleDown);
      root.removeEventListener("pointerup", handleUp);
      root.removeEventListener("pointercancel", handleOut);
      context.revert();
    };
  }, []);

  useEffect(() => {
    if (!rootRef.current || previewMode !== "wechat") return undefined;
    if (scrollTargetMessageId) return undefined;
    const root = rootRef.current;
    const chatScroll = root.querySelector<HTMLElement>(".wechat-chat-scroll");
    if (!chatScroll) return undefined;
    const messages = chatScroll.querySelectorAll<HTMLElement>(".wechat-row, .wechat-system-row");
    const replayRow = chatScroll.querySelector<HTMLElement>(".chat-replay-row");
    if (!messages.length && !replayRow) return undefined;
    const latest = replayRow ?? messages.item(messages.length - 1);
    if (latest) {
      if (latest.classList.contains("wechat-row")) {
        gsap.fromTo(latest, { y: 18, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.28, ease: "power3.out" });
      }
      const exposeLatest = (behavior: ScrollBehavior) => {
        if (!chatScroll.isConnected || !latest.isConnected) return;
        const containerRect = chatScroll.getBoundingClientRect();
        const latestRect = latest.getBoundingClientRect();
        const bottomPadding = 18;
        if (latestRect.bottom <= containerRect.bottom - bottomPadding && latestRect.top >= containerRect.top) return;
        const nextTop = chatScroll.scrollTop + latestRect.bottom - containerRect.bottom + bottomPadding;
        chatScroll.scrollTo({
          top: Math.max(0, Math.min(nextTop, chatScroll.scrollHeight - chatScroll.clientHeight)),
          behavior
        });
      };
      window.requestAnimationFrame(() => exposeLatest("smooth"));
      const lateScroll = window.setTimeout(() => exposeLatest("smooth"), 260);
      return () => window.clearTimeout(lateScroll);
    }
    return undefined;
  }, [previewMode, previewProject.messages.length, visibleMessageCount, project.messages.length, scrollTargetMessageId]);

  useEffect(() => {
    if (!rootRef.current || previewMode !== "wechat" || !scrollTargetMessageId) return undefined;
    const root = rootRef.current;
    const chatScroll = root.querySelector<HTMLElement>(".wechat-chat-scroll");
    if (!chatScroll) return undefined;
    const target = Array.from(chatScroll.querySelectorAll<HTMLElement>("[data-message-id]"))
      .find((element) => element.dataset.messageId === scrollTargetMessageId);
    if (!target) return undefined;
    const exposeTarget = () => {
      if (!chatScroll.isConnected || !target.isConnected) return;
      const containerRect = chatScroll.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const topPadding = 16;
      const nextTop = chatScroll.scrollTop + targetRect.top - containerRect.top - topPadding;
      chatScroll.scrollTo({
        top: Math.max(0, Math.min(nextTop, chatScroll.scrollHeight - chatScroll.clientHeight)),
        behavior: "smooth"
      });
      target.classList.add("wechat-row-jump-target");
      gsap.fromTo(target, { scale: 0.985 }, { scale: 1, duration: 0.36, ease: "power3.out" });
    };
    const frame = window.requestAnimationFrame(exposeTarget);
    const cleanupHighlight = window.setTimeout(() => {
      target.classList.remove("wechat-row-jump-target");
    }, 1400);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(cleanupHighlight);
      target.classList.remove("wechat-row-jump-target");
    };
  }, [previewMode, previewProject.messages.length, scrollTargetMessageId]);

  useEffect(() => {
    if (!rootRef.current || !promptCards.length) return;
    const latestCardId = promptCards[promptCards.length - 1]?.id;
    if (latestCardId && settledPromptCardIdsRef.current.has(latestCardId)) {
      settledPromptCardIdsRef.current.delete(latestCardId);
      return;
    }
    const latest = Array.from(rootRef.current.querySelectorAll<HTMLElement>("[data-prompt-card-id]"))
      .find((element) => element.dataset.promptCardId === latestCardId);
    if (latest) {
      gsap.fromTo(latest, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.32, ease: "power3.out" });
    }
  }, [promptCards.length]);

  useEffect(() => {
    if (!rootRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const targets = Array.from(rootRef.current.querySelectorAll<HTMLElement>(".preview-tilt-target"));
    if (!targets.length) return undefined;

    const cleanups = targets.map((target) => {
      const handleMove = (event: PointerEvent) => {
        if (event.pointerType === "touch") return;
        if (window.matchMedia("(max-width: 1079px)").matches) {
          gsap.set(target, { rotateX: 0, rotateY: 0 });
          return;
        }
        const rect = target.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        gsap.to(target, {
          rotateX: y * -6,
          rotateY: x * 6,
          transformPerspective: 900,
          transformOrigin: "center center",
          duration: 0.22,
          ease: "power3.out"
        });
      };
      const handleLeave = () => {
        gsap.to(target, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.42,
          ease: "power3.out"
        });
      };
      target.addEventListener("pointermove", handleMove);
      target.addEventListener("pointerleave", handleLeave);
      return () => {
        target.removeEventListener("pointermove", handleMove);
        target.removeEventListener("pointerleave", handleLeave);
        gsap.killTweensOf(target);
        gsap.set(target, { rotateX: 0, rotateY: 0 });
      };
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  useEffect(() => {
    if (previewMode !== "video" || !project.messages.length) return undefined;
    const timer = window.setTimeout(() => {
      playerRef.current?.seekTo(previewInitialFrame);
      playerRef.current?.play();
    }, 80);
    return () => window.clearTimeout(timer);
  }, [previewMode, project.messages.length, previewInitialFrame]);

  function handleError(label: string, error: unknown) {
    console.error(`[static-tool] ${label}`, error);
    setStatus("error");
    setStatusText(error instanceof Error ? error.message : `${label}失败`);
  }

  function showToast(message: string) {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToastMessage(message);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = undefined;
    }, 4200);
  }

  function isCurrentGeneration(runId: number, signal: AbortSignal) {
    return generationRunRef.current === runId && !signal.aborted;
  }

  function stopGenerationProgress() {
    if (generationProgressTimerRef.current) {
      window.clearInterval(generationProgressTimerRef.current);
      generationProgressTimerRef.current = undefined;
    }
  }

  function startGenerationProgress(estimateMs: number) {
    stopGenerationProgress();
    const startedAt = Date.now();
    updateGenerationProgress(1);
    generationProgressTimerRef.current = window.setInterval(() => {
      updateGenerationProgress(estimateGenerationProgress(startedAt, estimateMs));
    }, 320);
  }

  async function completeGenerationProgress(runId: number, signal: AbortSignal) {
    stopGenerationProgress();
    const startProgress = Math.min(generationProgressRef.current || 1, generationProgressCap - 1);
    const startedAt = performance.now();
    const durationMs = Math.max(260, Math.min(520, (generationProgressCap - startProgress) * 18));

    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        if (!isCurrentGeneration(runId, signal)) {
          resolve();
          return;
        }
        const progressRatio = Math.min(1, (now - startedAt) / durationMs);
        const easedProgress = 1 - Math.pow(1 - progressRatio, 3);
        updateGenerationProgress(startProgress + (generationProgressCap - startProgress) * easedProgress);
        if (progressRatio < 1) {
          window.requestAnimationFrame(tick);
          return;
        }
        updateGenerationProgress(generationProgressCap);
        resolve();
      };
      window.requestAnimationFrame(tick);
    });

    if (!isCurrentGeneration(runId, signal)) return false;
    await new Promise((resolve) => window.setTimeout(resolve, 90));
    return isCurrentGeneration(runId, signal);
  }

  function stopStoryGeneration() {
    if (status !== "loading") return;
    const activeCardId = activePromptCardIdRef.current;
    const activeCard = pendingPromptCardsRef.current.find((card) => card.id === activeCardId && card.status === "generating");
    const promptToEdit = activeCard?.prompt || "";
    if (!activeCard) return;
    generationRunRef.current += 1;
    generationAbortRef.current?.abort();
    generationAbortRef.current = null;
    stopGenerationProgress();
    if (promptToEdit) restorePromptForEditing(promptToEdit);
    activePromptCardIdRef.current = null;
    const remainingCards = markPendingPromptCardRemoving(activeCard.id);
    updateGenerationProgress(0);
    setVideoProgress(0);
    if (remainingCards.some(canGeneratePendingPromptCard)) {
      setStatus("loading");
      setStatusText("已取回当前卡片，继续处理排队中的故事");
    } else {
      setStatus("idle");
      setStatusText("已停止生成，可以重新编辑这张故事卡");
    }
  }

  function startMessageReveal(fromCount: number, toCount: number) {
    if (revealTimerRef.current) window.clearInterval(revealTimerRef.current);
    setVisibleMessageCount(fromCount);
    let nextCount = fromCount;
    revealTimerRef.current = window.setInterval(() => {
      nextCount += 1;
      setVisibleMessageCount(Math.min(nextCount, toCount));
      if (nextCount >= toCount && revealTimerRef.current) {
        window.clearInterval(revealTimerRef.current);
        revealTimerRef.current = undefined;
      }
    }, 1000);
  }

  function finishPromptSuggestionAnimation() {
    if (promptSuggestionTimerRef.current) {
      window.clearTimeout(promptSuggestionTimerRef.current);
      promptSuggestionTimerRef.current = undefined;
    }
    setPromptSuggestionActive(false);
  }

  function focusPromptTextareaAtEnd(text: string, preserveAnimation = false) {
    if (preserveAnimation) promptAnimationFocusGuardUntilRef.current = Date.now() + 600;
    window.requestAnimationFrame(() => {
      const textarea = promptTextareaRef.current;
      if (!textarea) {
        promptAnimationFocusGuardUntilRef.current = 0;
        return;
      }
      textarea.focus({ preventScroll: true });
      textarea.setSelectionRange(text.length, text.length);
    });
  }

  function showSuggestedPrompt(nextPrompt: string, options: { preservePromptUndo?: boolean; focusAtEnd?: boolean } = {}) {
    if (promptSuggestionTimerRef.current) window.clearTimeout(promptSuggestionTimerRef.current);
    if (!options.preservePromptUndo) promptRestoreUndoRef.current = null;
    const animationMs = promptRiseAnimationMs(nextPrompt);
    setDraftPrompt(nextPrompt);
    setPromptSuggestionKey((current) => current + 1);
    setPromptSuggestionActive(true);
    if (options.focusAtEnd) focusPromptTextareaAtEnd(nextPrompt, true);
    promptSuggestionTimerRef.current = window.setTimeout(() => {
      setPromptSuggestionActive(false);
      promptSuggestionTimerRef.current = undefined;
    }, animationMs);
  }

  function dismissDeferredSuggestion() {
    setSuggestionDialogOpen(false);
  }

  function adoptDeferredSuggestion() {
    const suggestedPrompt = deferredSuggestedPrompt?.trim();
    if (!suggestedPrompt) return;
    const previousPrompt = draftPromptRef.current;
    promptRestoreUndoRef.current = previousPrompt === suggestedPrompt ? null : { before: previousPrompt, after: suggestedPrompt };
    setSuggestionDialogOpen(false);
    setDeferredSuggestedPrompt(null);
    showSuggestedPrompt(suggestedPrompt, { preservePromptUndo: true, focusAtEnd: true });
  }

  function offerSuggestedPrompt(nextPrompt: string) {
    const suggestedPrompt = nextPrompt.trim();
    if (!suggestedPrompt) return;
    if (draftPromptRef.current.trim()) {
      setDeferredSuggestedPrompt(suggestedPrompt);
      setSuggestionDialogOpen(false);
      return;
    }
    setDeferredSuggestedPrompt(null);
    setSuggestionDialogOpen(false);
    showSuggestedPrompt(suggestedPrompt);
  }

  function suggestedPromptForSegment(
    result: { project: DramaProject; card: PromptCard; messages: ChatMessage[]; suggestedPrompt?: string },
    nextPromptCards: PromptCard[]
  ) {
    const deepseekSuggestion = result.suggestedPrompt?.trim();
    if (deepseekSuggestion) return deepseekSuggestion;
    if (nextPromptCards.length !== 1) return "";
    return suggestNextStoryPrompt({
      project: result.project,
      prompt: result.card.prompt,
      promptCards: nextPromptCards,
      messages: result.messages
    });
  }

  function restorePromptForEditing(nextPrompt: string) {
    const previousPrompt = draftPrompt;
    promptRestoreUndoRef.current = previousPrompt === nextPrompt ? null : { before: previousPrompt, after: nextPrompt };
    showSuggestedPrompt(nextPrompt, { preservePromptUndo: true, focusAtEnd: true });
  }

  function undoPromptRestore() {
    const undo = promptRestoreUndoRef.current;
    if (!undo || draftPrompt !== undo.after) return false;
    promptRestoreUndoRef.current = null;
    finishPromptSuggestionAnimation();
    setDraftPrompt(undo.before);
    focusPromptTextareaAtEnd(undo.before);
    setStatus("idle");
    setStatusText("已撤回重新编辑填入的提示词");
    return true;
  }

  function handleDraftPromptChange(nextPrompt: string) {
    if (promptRestoreUndoRef.current && nextPrompt !== promptRestoreUndoRef.current.after) {
      promptRestoreUndoRef.current = null;
    }
    setDraftPrompt(nextPrompt);
    finishPromptSuggestionAnimation();
  }

  function handlePromptTextareaFocus() {
    if (!promptSuggestionActive) return;
    if (Date.now() < promptAnimationFocusGuardUntilRef.current) return;
    finishPromptSuggestionAnimation();
  }

  function applyStorySegment(
    result: { project: DramaProject; card: PromptCard; messages: ChatMessage[]; suggestedPrompt?: string },
    nextStatusText: string,
    options: {
      baseProject?: DramaProject;
      basePromptCards?: PromptCard[];
      queueWillContinue?: boolean;
    } = {}
  ) {
    const baseProject = options.baseProject ?? projectRef.current;
    const basePromptCards = options.basePromptCards ?? promptCardsRef.current;
    const previousCount = baseProject.messages.length;
    let nextCard = result.card;
    const suggestedPrompt = suggestedPromptForSegment(result, [...basePromptCards, nextCard]);
    if (suggestedPrompt) nextCard = { ...nextCard, suggestedPrompt };
    const nextPromptCards = [...basePromptCards, nextCard];
    captureCurrentStoryLayoutSnapshot();
    projectRef.current = result.project;
    promptCardsRef.current = nextPromptCards;
    setProject(result.project);
    setPromptCards(nextPromptCards);
    stopGenerationProgress();
    if (!scrollTargetMessageIdRef.current) {
      setFocusedPromptCardId(nextCard.id);
    }
    generationAbortRef.current = null;
    if (!options.queueWillContinue) offerSuggestedPrompt(suggestedPrompt);
    setVideoResult(null);
    setStatus(options.queueWillContinue ? "loading" : "done");
    setStatusText(options.queueWillContinue ? `${nextStatusText}，继续生成下一张...` : nextStatusText);
    if (!options.queueWillContinue && shouldUseStoryModal()) setStoryPanelOpenWithContinuity(false);
    startMessageReveal(previousCount, result.project.messages.length);
  }

  function closeSettingsMenu() {
    setSettingsMenuOpen(false);
  }

  function setStoryPanelOpenWithContinuity(next: boolean | ((current: boolean) => boolean)) {
    const update = () => setStoryPanelOpen(next);
    const doc = document as ViewTransitionDocument;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!shouldUseStoryModal() || !doc.startViewTransition || reduceMotion) {
      update();
      return;
    }
    doc.startViewTransition(() => flushSync(update));
  }

  async function generateStoryForPrompt({
    prompt,
    projectSnapshot,
    promptCardsSnapshot,
    runId,
    signal
  }: {
    prompt: string;
    projectSnapshot: DramaProject;
    promptCardsSnapshot: PromptCard[];
    runId: number;
    signal: AbortSignal;
  }) {
    if (!projectSnapshot.messages.length && !promptCardsSnapshot.length && isInitialPresetPrompt(storyPackage, prompt)) {
      setStatusText("正在展开默认开场...");
      const result = createInitialPresetStorySegment(storyPackage, prompt);
      if (!isCurrentGeneration(runId, signal)) throw new Error("generation cancelled");
      return { result, statusText: `默认开场已追加 ${result.messages.length} 条消息` };
    }

    let backendError: unknown;
    setStatusText("正在请求后端 DeepSeek 续写...");
    try {
      const result = await generateBackendStorySegment({ project: projectSnapshot, prompt, promptCards: promptCardsSnapshot, signal });
      if (!isCurrentGeneration(runId, signal)) throw new Error("generation cancelled");
      return { result, statusText: `DeepSeek 后端已追加 ${result.messages.length} 条消息` };
    } catch (error) {
      if (!isCurrentGeneration(runId, signal)) throw error;
      backendError = error;
      console.warn("[deepseek] backend unavailable", error);
    }

    if (hasBrowserDeepSeekKey()) {
      setStatusText("后端不可用，正在尝试浏览器公开配置...");
      try {
        const result = await generateDeepSeekStorySegment({ project: projectSnapshot, prompt, promptCards: promptCardsSnapshot, signal });
        if (!isCurrentGeneration(runId, signal)) throw new Error("generation cancelled");
        return { result, statusText: `DeepSeek 前端已追加 ${result.messages.length} 条消息` };
      } catch (browserError) {
        if (!isCurrentGeneration(runId, signal)) throw browserError;
        console.warn("[deepseek] browser direct unavailable", browserError);
        setStatusText("DeepSeek 未连通，已停止生成");
        throw browserError;
      }
    }

    setStatusText("DeepSeek 未连通，已停止生成");
    throw backendError instanceof Error ? backendError : new Error("DeepSeek 未连通");
  }

  async function drainPromptQueue() {
    if (queueProcessingRef.current) return;
    queueProcessingRef.current = true;

    try {
      while (pendingPromptCardsRef.current.some(canGeneratePendingPromptCard)) {
        const activeCard = pendingPromptCardsRef.current.find(canGeneratePendingPromptCard);
        if (!activeCard) break;
        activePromptCardIdRef.current = activeCard.id;
        setFocusedPendingPromptCardId((current) => current === activeCard.id ? null : current);
        setEditingPendingPromptCardId((current) => current === activeCard.id ? null : current);
        updatePendingPromptCards((cards) => {
          let changed = false;
          const nextCards = cards.map((card) => {
            const nextStatus: PendingPromptCard["status"] = card.id === activeCard.id ? "generating" : card.status === "generating" ? "queued" : card.status;
            if (nextStatus === card.status) return card;
            changed = true;
            return { ...card, status: nextStatus };
          });
          return changed ? nextCards : cards;
        });

        const projectSnapshot = projectRef.current;
        const promptCardsSnapshot = promptCardsRef.current;
        const controller = new AbortController();
        const runId = generationRunRef.current + 1;
        generationRunRef.current = runId;
        generationAbortRef.current = controller;
        const signal = controller.signal;

        setStatus("loading");
        setVideoProgress(0);
        startGenerationProgress(estimatedGenerationMs(projectSnapshot, storyPackage));

        try {
          const { result, statusText } = await generateStoryForPrompt({
            prompt: activeCard.prompt,
            projectSnapshot,
            promptCardsSnapshot,
            runId,
            signal
          });
          if (!isCurrentGeneration(runId, signal)) continue;
          if (!await completeGenerationProgress(runId, signal)) continue;

          updatePendingPromptCards((cards) => cards.map((card) => (
            card.id === activeCard.id
              ? {
                  ...card,
                  status: "settling",
                  completedCardId: result.card.id,
                  completedCardNumber: promptCardsSnapshot.length + 1
                }
              : card
          )));
          await new Promise((resolve) => window.setTimeout(resolve, 300));
          if (!isCurrentGeneration(runId, signal)) continue;

          const queueWillContinue = pendingPromptCardsRef.current.some((card) => card.id !== activeCard.id && canGeneratePendingPromptCard(card));
          settledPromptCardIdsRef.current.add(result.card.id);
          completedPromptCardLayoutKeysRef.current.set(result.card.id, `pending-${activeCard.id}`);
          applyStorySegment(result, statusText, {
            baseProject: projectSnapshot,
            basePromptCards: promptCardsSnapshot,
            queueWillContinue
          });
          updatePendingPromptCards((cards) => cards.filter((card) => card.id !== activeCard.id));
        } catch (error) {
          if (!isCurrentGeneration(runId, signal)) continue;
          console.error("[deepseek] queue failed", error);
          showToast(deepSeekServiceToast);
          const message = error instanceof Error ? error.message : "DeepSeek 续写失败";
          restorePromptForEditing(activeCard.prompt);
          setStatus("error");
          setStatusText(message);
          markPendingPromptCardRemoving(activeCard.id);
          break;
        } finally {
          if (generationRunRef.current === runId) {
            generationAbortRef.current = null;
            stopGenerationProgress();
            updateGenerationProgress(0);
          }
        }
      }
    } finally {
      queueProcessingRef.current = false;
      activePromptCardIdRef.current = null;
      if (!pendingPromptCardsRef.current.some(canGeneratePendingPromptCard)) {
        generationAbortRef.current = null;
        stopGenerationProgress();
        updateGenerationProgress(0);
      }
    }
  }

  function removeQueuedPromptCard(cardId: string) {
    const targetCard = pendingPromptCardsRef.current.find((card) => card.id === cardId);
    if (!targetCard || targetCard.status !== "queued") return;
    markPendingPromptCardRemoving(cardId);
    setFocusedPendingPromptCardId((current) => current === cardId ? null : current);
    setEditingPendingPromptCardId((current) => current === cardId ? null : current);
    setStatusText("已移除排队中的故事卡");
  }

  function updateQueuedPromptCard(cardId: string, nextPrompt: string) {
    const targetCard = pendingPromptCardsRef.current.find((card) => card.id === cardId);
    const prompt = nextPrompt.trim();
    if (!targetCard || targetCard.status === "generating" || !prompt) return;
    updatePendingPromptCards((cards) => cards.map((card) => (
      card.id === cardId ? { ...card, prompt } : card
    )));
    setFocusedPendingPromptCardId(cardId);
    setEditingPendingPromptCardId(null);
    setStatusText("已更新排队中的故事卡");
  }

  function selectPendingPromptCard(cardId: string, options: { focusElement?: boolean } = {}) {
    const targetCard = pendingPromptCardsRef.current.find((card) => card.id === cardId && card.status === "queued");
    if (!targetCard) return false;
    setFocusedPromptCardId(null);
    setFocusedPendingPromptCardId(cardId);
    setEditingPendingPromptCardId((current) => current && current !== cardId ? null : current);
    if (options.focusElement) {
      window.requestAnimationFrame(() => {
        const targetCardElement = rootRef.current?.querySelector<HTMLElement>(`[data-pending-prompt-card-id="${cardId}"]`);
        targetCardElement?.focus({ preventScroll: true });
      });
    }
    return true;
  }

  function startPendingPromptCardEdit(cardId: string) {
    const targetCard = pendingPromptCardsRef.current.find((card) => card.id === cardId && card.status === "queued");
    if (!targetCard) return false;
    setFocusedPromptCardId(null);
    setFocusedPendingPromptCardId(cardId);
    setEditingPendingPromptCardId(cardId);
    return true;
  }

  function cancelPendingPromptCardEdit() {
    if (!editingPendingPromptCardId) return false;
    setEditingPendingPromptCardId(null);
    setStatusText("已取消编辑排队中的故事卡");
    return true;
  }

  function editFocusedPendingPromptCard() {
    if (!focusedPendingPromptCardId) return false;
    return startPendingPromptCardEdit(focusedPendingPromptCardId);
  }

  function removeFocusedPendingPromptCard() {
    if (!focusedPendingPromptCardId) return false;
    const targetCard = pendingPromptCardsRef.current.find((card) => card.id === focusedPendingPromptCardId && card.status === "queued");
    if (!targetCard) return false;
    removeQueuedPromptCard(targetCard.id);
    return true;
  }

  function continueStory() {
    const prompt = draftPrompt.trim();
    if (!prompt) return;
    promptRestoreUndoRef.current = null;
    finishPromptSuggestionAnimation();
    setDeferredSuggestedPrompt(null);
    setSuggestionDialogOpen(false);
    const card: PendingPromptCard = {
      id: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      prompt,
      status: pendingPromptCardsRef.current.some(canGeneratePendingPromptCard) || queueProcessingRef.current ? "queued" : "generating"
    };
    const nextQueue = updatePendingPromptCards((cards) => [...cards, card]);
    const cardsAhead = nextQueue.filter((item) => item.id !== card.id && canGeneratePendingPromptCard(item)).length;
    setStatus("loading");
    setVideoProgress(0);
    setDraftPrompt("");
    if (!scrollTargetMessageIdRef.current) {
      setFocusedPromptCardId(null);
      updateScrollTargetMessageId(null);
    }
    setStatusText(cardsAhead ? `已加入队列，前面还有 ${cardsAhead} 张` : "已加入队列，准备生成...");
  }

  function suggestPromptAfterCard(card: PromptCard, nextProject: DramaProject, nextPromptCards: PromptCard[]) {
    const storedSuggestion = card.suggestedPrompt?.trim();
    if (storedSuggestion) return storedSuggestion;
    const cardMessageIdSet = new Set(card.messageIds);
    const segmentMessages = nextProject.messages.filter((message) => cardMessageIdSet.has(message.id));
    return suggestNextStoryPrompt({
      project: nextProject,
      prompt: card.prompt,
      promptCards: nextPromptCards,
      messages: segmentMessages.length ? segmentMessages : nextProject.messages
    });
  }

  function restartFromPromptCard(card: PromptCard) {
    const currentPromptCards = promptCardsRef.current;
    const cardIndex = currentPromptCards.findIndex((item) => item.id === card.id);
    if (cardIndex < 0) {
      setStatus("error");
      setStatusText("没有找到这张故事卡");
      return;
    }

    generationRunRef.current += 1;
    generationAbortRef.current?.abort();
    generationAbortRef.current = null;
    stopGenerationProgress();
    if (revealTimerRef.current) {
      window.clearInterval(revealTimerRef.current);
      revealTimerRef.current = undefined;
    }
    pendingPromptRemovalTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    pendingPromptRemovalTimersRef.current.clear();
    queueProcessingRef.current = false;
    activePromptCardIdRef.current = null;

    const currentProject = projectRef.current;
    const nextPromptCards = currentPromptCards.slice(0, cardIndex + 1);
    const lastMessageId = [...card.messageIds].reverse().find((messageId) => (
      currentProject.messages.some((message) => message.id === messageId)
    ));
    const lastMessageIndex = lastMessageId
      ? currentProject.messages.findIndex((message) => message.id === lastMessageId)
      : -1;
    const nextMessages = lastMessageIndex >= 0
      ? currentProject.messages.slice(0, lastMessageIndex + 1)
      : currentProject.messages.filter((message) => nextPromptCards.some((item) => item.messageIds.includes(message.id)));
    const nextMessageIds = new Set(nextMessages.map((message) => message.id));
    const nextProject: DramaProject = {
      ...currentProject,
      brief: nextPromptCards.map((item) => item.prompt).join("\n") || currentProject.brief,
      messages: nextMessages
    };
    const nextSuggestedPrompt = suggestPromptAfterCard(card, nextProject, nextPromptCards);

    captureCurrentStoryLayoutSnapshot();
    projectRef.current = nextProject;
    promptCardsRef.current = nextPromptCards;
    settledPromptCardIdsRef.current.clear();
    completedPromptCardLayoutKeysRef.current.clear();
    setProject(nextProject);
    setPromptCards(nextPromptCards);
    updatePendingPromptCards(() => []);
    setFocusedPromptCardId(card.id);
    setFocusedPendingPromptCardId(null);
    setEditingPendingPromptCardId(null);
    setOpenPromptCardMenuId(null);
    updateScrollTargetMessageId(null);
    updateGenerationProgress(0);
    setVideoProgress(0);
    setVideoResult(null);
    setVisibleMessageCount(nextMessages.length);
    setClips((current) => Object.fromEntries(
      Object.entries(current).filter(([messageId]) => nextMessageIds.has(messageId))
    ) as TtsClipMap);
    offerSuggestedPrompt(nextSuggestedPrompt);
    setStatus("done");
    setStatusText(`已从第 ${cardIndex + 1} 张故事卡重新开始`);
  }

  function copyTextWithHiddenTextarea(text: string) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  }

  async function copyPromptCardText(card: PromptCard) {
    setOpenPromptCardMenuId(null);
    if (copyTextWithHiddenTextarea(card.prompt)) {
      setStatus("done");
      setStatusText("已复制当前故事卡文本");
      return;
    }
    try {
      await navigator.clipboard.writeText(card.prompt);
      setStatus("done");
      setStatusText("已复制当前故事卡文本");
    } catch {
      setStatus("error");
      setStatusText("复制失败，请手动复制故事卡文本");
    }
  }

  function clearLine() {
    generationRunRef.current += 1;
    generationAbortRef.current?.abort();
    generationAbortRef.current = null;
    stopGenerationProgress();
    clearPendingPromptRemovalTimers();
    const nextProject = createEmptyInitialProject(storyPackage);
    captureCurrentStoryLayoutSnapshot();
    projectRef.current = nextProject;
    promptCardsRef.current = [];
    settledPromptCardIdsRef.current.clear();
    completedPromptCardLayoutKeysRef.current.clear();
    setProject(nextProject);
    setPromptCards([]);
    updatePendingPromptCards(() => []);
    settledPromptCardIdsRef.current.clear();
    setDeferredSuggestedPrompt(null);
    setSuggestionDialogOpen(false);
    activePromptCardIdRef.current = null;
    setFocusedPendingPromptCardId(null);
    setEditingPendingPromptCardId(null);
    setOpenPromptCardMenuId(null);
    updateGenerationProgress(0);
    setFocusedPromptCardId(null);
    updateScrollTargetMessageId(null);
    promptRestoreUndoRef.current = null;
    showSuggestedPrompt(initialPromptFor(storyPackage));
    setClips({});
    setVideoResult(null);
    setVisibleMessageCount(0);
    setStatus("idle");
    setStatusText("故事已重新开始，模拟界面已清空");
  }

  function replayConversation() {
    setVideoResult(null);
    setFocusedPromptCardId(null);
    setFocusedPendingPromptCardId(null);
    setEditingPendingPromptCardId(null);
    updateScrollTargetMessageId(null);
    setStatus("done");
    setStatusText("聊天会话已重新播放入场");
    startMessageReveal(0, project.messages.length);
  }

  function changePreviewMode(nextMode: PreviewMode) {
    if (nextMode === previewMode) return;
    const transition: PreviewTransition = {
      direction: nextMode === "video" ? "right" : "left",
      exiting: previewMode,
      id: Date.now()
    };
    if (previewTransitionTimerRef.current) window.clearTimeout(previewTransitionTimerRef.current);
    setPreviewTransition(transition);
    setPreviewMode(nextMode);
    previewTransitionTimerRef.current = window.setTimeout(() => {
      setPreviewTransition((current) => current?.id === transition.id ? null : current);
    }, 360);
  }

  function choosePreviewMode(nextMode: PreviewMode) {
    changePreviewMode(nextMode);
    if (nextMode === "video" && !project.messages.length) {
      setStatus("idle");
      setStatusText("先生成对话，再播放视频版");
    }
  }

  function scrollConversationToBottom() {
    if (revealTimerRef.current) {
      window.clearInterval(revealTimerRef.current);
      revealTimerRef.current = undefined;
    }
    setVideoResult(null);
    setFocusedPromptCardId(null);
    setFocusedPendingPromptCardId(null);
    setEditingPendingPromptCardId(null);
    updateScrollTargetMessageId(null);
    setVisibleMessageCount(projectRef.current.messages.length);
    changePreviewMode("wechat");

    const exposeBottom = () => {
      const chatScroll = rootRef.current?.querySelector<HTMLElement>(".wechat-chat-scroll");
      if (!chatScroll?.isConnected) return;
      chatScroll.scrollTo({
        top: Math.max(0, chatScroll.scrollHeight - chatScroll.clientHeight),
        behavior: "smooth"
      });
    };

    window.requestAnimationFrame(exposeBottom);
    window.setTimeout(exposeBottom, 140);
    window.setTimeout(exposeBottom, 380);
  }

  function focusPromptCard(card: PromptCard, options: { focusButton?: boolean } = {}) {
    const firstMessageId = card.messageIds[0];
    if (!firstMessageId) {
      setStatus("error");
      setStatusText("这张故事卡没有可定位的对话");
      return;
    }
    const targetIndex = project.messages.findIndex((message) => message.id === firstMessageId);
    if (targetIndex < 0) {
      setStatus("error");
      setStatusText("没有找到这张故事卡对应的起始对话");
      return;
    }
    if (revealTimerRef.current) {
      window.clearInterval(revealTimerRef.current);
      revealTimerRef.current = undefined;
    }
    setVideoResult(null);
    setFocusedPendingPromptCardId(null);
    setEditingPendingPromptCardId(null);
    setOpenPromptCardMenuId(null);
    setFocusedPromptCardId(card.id);
    updateScrollTargetMessageId(firstMessageId);
    setVisibleMessageCount((current) => Math.max(current, targetIndex + 1));
    changePreviewMode("wechat");
    setStatus("done");
    setStatusText("已定位到这张故事卡的起始对话");
    if (options.focusButton) {
      window.requestAnimationFrame(() => {
        const targetCard = Array.from(rootRef.current?.querySelectorAll<HTMLElement>("[data-prompt-card-id]") || [])
          .find((element) => element.dataset.promptCardId === card.id);
        targetCard?.focus({ preventScroll: true });
      });
    }
  }

  function focusPromptCardByStep(directionToLatest: 1 | -1) {
    const queuedItems = pendingPromptCards
      .filter((card) => card.status === "queued")
      .map((card) => ({ type: "pending" as const, id: card.id }))
      .reverse();
    const promptItems = [...promptCards].reverse().map((card) => ({ type: "prompt" as const, id: card.id, card }));
    const navigationItems = [...queuedItems, ...promptItems];
    if (!navigationItems.length) return false;
    const currentIndex = focusedPendingPromptCardId
      ? navigationItems.findIndex((item) => item.type === "pending" && item.id === focusedPendingPromptCardId)
      : focusedPromptCardId
        ? navigationItems.findIndex((item) => item.type === "prompt" && item.id === focusedPromptCardId)
        : -1;
    const nextIndex = currentIndex < 0
      ? directionToLatest > 0 ? 0 : navigationItems.length - 1
      : (currentIndex - directionToLatest + navigationItems.length) % navigationItems.length;
    const nextItem = navigationItems[nextIndex];
    if (nextItem.type === "pending") return selectPendingPromptCard(nextItem.id, { focusElement: true });
    focusPromptCard(nextItem.card, { focusButton: true });
    return true;
  }

  function exportJson() {
    const archive = makeStoryArchive(project, promptCards);
    downloadBlob(new Blob([`${JSON.stringify(archive, null, 2)}\n`], { type: "application/json" }), archiveFilename());
    setStatus("done");
    setStatusText("存档已导出");
  }

  async function importJson(file: File | undefined) {
    if (!file) return;
    try {
      generationRunRef.current += 1;
      generationAbortRef.current?.abort();
      generationAbortRef.current = null;
      stopGenerationProgress();
      clearPendingPromptRemovalTimers();
      const archive = parseStoryArchive(JSON.parse(await file.text()));
      const archivePackage: StoryPackage = isJojoProject(archive.project) ? "jojo" : "viral";
      if (archivePackage !== storyPackage) {
        setStatus("error");
        setStatusText(storyPackage === "jojo" ? "当前是 JOJO 版，请读取 JOJO 版存档" : "当前是网红短剧版，请读取网红短剧版存档");
        return;
      }
      captureCurrentStoryLayoutSnapshot();
      projectRef.current = archive.project;
      promptCardsRef.current = archive.promptCards;
      settledPromptCardIdsRef.current.clear();
      completedPromptCardLayoutKeysRef.current.clear();
      setProject(archive.project);
      setPromptCards(archive.promptCards);
      updatePendingPromptCards(() => []);
      setDeferredSuggestedPrompt(null);
      setSuggestionDialogOpen(false);
      activePromptCardIdRef.current = null;
      setFocusedPendingPromptCardId(null);
      setEditingPendingPromptCardId(null);
      updateGenerationProgress(0);
      setFocusedPromptCardId(null);
      updateScrollTargetMessageId(null);
      promptRestoreUndoRef.current = null;
      setDraftPrompt("");
      finishPromptSuggestionAnimation();
      setVisibleMessageCount(archive.project.messages.length);
      setClips({});
      setVideoResult(null);
      setStatus("done");
      setStatusText(`已读档 ${archive.promptCards.length} 张故事卡`);
    } catch (error) {
      handleError("读档", error);
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  async function generateVoice() {
    if (!project.messages.length) {
      setStatus("error");
      setStatusText("先生成对话，再生成配音");
      return;
    }
    setStatus("loading");
    setStatusText("正在连接 Edge TTS 生成固定男女声...");
    try {
      const nextClips: TtsClipMap = { ...clips };
      let nextProject = project;
      const voiceMessages = project.messages.filter(isVoiceMessage);
      for (let index = 0; index < voiceMessages.length; index += 1) {
        const message = voiceMessages[index];
        if (!nextClips[message.id]) {
          console.info(`[edge-tts] -> ${message.id}`, message.text || message.ttsText);
          const clip = await synthesizeMessageClip(nextProject, message);
          if (clip) {
            nextClips[message.id] = clip;
            nextProject = updateMessage(nextProject, message.id, { audioUrl: clip.url, durationMs: clip.durationMs });
          }
        }
        setStatusText(`Edge TTS ${index + 1}/${voiceMessages.length}`);
      }
      setClips(nextClips);
      setProject(nextProject);
      setStatus("done");
      setStatusText("配音已生成，可导出视频");
    } catch (error) {
      handleError("Edge TTS", error);
    }
  }

  async function exportVideo() {
    if (!project.messages.length) {
      setStatus("error");
      setStatusText("先生成对话，再导出视频");
      return;
    }
    setStatus("loading");
    setStatusText("正在浏览器内录制 16:9 视频...");
    try {
      const result = await exportBrowserVideo(project, clips, (progress) => {
        setVideoProgress(progress.progress);
        setStatusText(progress.phase === "preparing" ? "正在准备音频轨..." : `正在录制视频 ${Math.round(progress.progress * 100)}%`);
      });
      setVideoResult(result);
      setStatus("done");
      setStatusText(`视频已生成：${result.extension.toUpperCase()}`);
    } catch (error) {
      handleError("视频导出", error);
    }
  }

  function renderVideoActions() {
    return (
      <div className="video-action-strip">
        <div className="action-grid">
          <Button variant="secondary" onPress={generateVoice} isDisabled={status === "loading" || !project.messages.length}>
            <FileAudio size={17} />
            生成语音（开发中）
          </Button>
          <Button variant="primary" onPress={exportVideo} isDisabled={status === "loading" || !project.messages.length}>
            <Film size={17} />
            导出视频
          </Button>
        </div>
        {status === "loading" && videoProgress > 0 ? <progress className="video-progress" max={1} value={videoProgress} /> : null}
        {videoResult ? (
          <a className="download-link" href={videoResult.url} download={`chat-drama-${Date.now()}.${videoResult.extension}`}>
            <Download size={16} />
            下载 {videoResult.extension.toUpperCase()}
          </a>
        ) : null}
      </div>
    );
  }

  function renderPreviewPane(mode: PreviewMode, isActive: boolean) {
    if (mode === "wechat") {
      return (
        <WechatStoryPreview
          project={previewProject}
          onReplay={replayConversation}
          showReplay={project.messages.length > 0 && visibleMessageCount >= project.messages.length}
        />
      );
    }
    if (!project.messages.length) {
      return (
        <div className="video-preview-stack">
          <div className="player-frame video-empty-frame" style={{ width: "100%", aspectRatio: `${project.canvas.width} / ${project.canvas.height}` }}>
            <div className="empty-state large-empty video-empty-state">
              <Play size={28} />
              等待第一段剧情
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="video-preview-stack">
        <div className="player-frame">
          <Player
            ref={isActive ? playerRef : undefined}
            component={ChatDrama}
            inputProps={{ project }}
            durationInFrames={durationInFrames}
            initialFrame={previewInitialFrame}
            compositionWidth={project.canvas.width}
            compositionHeight={project.canvas.height}
            fps={project.fps}
            controls
            autoPlay={isActive && previewMode === "video"}
            acknowledgeRemotionLicense
            style={{ width: "100%", aspectRatio: `${project.canvas.width} / ${project.canvas.height}` }}
          />
        </div>
        {renderVideoActions()}
      </div>
    );
  }

  const switchLink = packageSwitchLink(storyPackage);
  const githubRepositoryUrl = import.meta.env.VITE_GITHUB_REPO_URL || defaultGithubRepositoryUrl;
  const storyCardCount = promptCards.length + pendingPromptCards.length;
  const canSubmitStory = Boolean(draftPrompt.trim());
  const storyActionButtonClassName = [
    "button button--full-width button--md button--primary story-action-button",
    "story-action-button-visible",
    canSubmitStory && status !== "loading" ? "story-action-button-ready" : ""
  ].filter(Boolean).join(" ");

  useEffect(() => {
    if (status !== "loading" || !pendingPromptCards.length || queueProcessingRef.current) return;
    void drainPromptQueue();
  }, [pendingPromptCards.length, status]);
  const deferredSuggestionText = deferredSuggestedPrompt?.trim() || "";
  const promptTextareaShellClassName = [
    "prompt-textarea-shell",
    promptSuggestionActive ? "prompt-textarea-shell-animating" : "",
    deferredSuggestionText ? "prompt-textarea-shell-has-suggestion" : ""
  ].filter(Boolean).join(" ");

  useLayoutEffect(() => {
    if (!rootRef.current) return;
    const root = rootRef.current;
    const panelVisibilityChanged = previousStoryPanelOpenRef.current !== storyPanelOpen;
    const pendingPreviousSnapshot = pendingLeftPanelLayoutSnapshotRef.current;
    if (storyLayoutSnapshotLockedRef.current && !pendingPreviousSnapshot) {
      previousStoryPanelOpenRef.current = storyPanelOpen;
      return;
    }
    const targets = getLeftPanelLayoutTargets(root);
    gsap.killTweensOf(targets);
    targets.forEach((element) => {
      element.style.transform = "";
    });

    const nextSnapshot = readLeftPanelLayoutSnapshot(root);
    const previousSnapshot = pendingPreviousSnapshot ?? leftPanelLayoutSnapshotRef.current;
    const shouldAnimate = previousSnapshot.size > 0
      && storyPanelOpen
      && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shouldAnimatePanelVisibility = panelVisibilityChanged && window.matchMedia("(min-width: 1080px)").matches;
    const shouldAnimateContentShift = !panelVisibilityChanged;

    let didAnimateLayoutShift = false;
    if (shouldAnimate && (shouldAnimatePanelVisibility || shouldAnimateContentShift)) {
      targets.forEach((element) => {
        const key = getLeftPanelLayoutKey(element);
        const previousRect = previousSnapshot.get(key);
        const nextRect = nextSnapshot.get(key);
        if (!previousRect || !nextRect) return;
        const deltaY = previousRect.top - nextRect.top;
        if (Math.abs(deltaY) < 0.5) return;
        didAnimateLayoutShift = true;
        gsap.fromTo(
          element,
          { y: deltaY },
          { y: 0, duration: 0.46, ease: "power3.out", overwrite: "auto", clearProps: "transform" }
        );
      });
    }

    leftPanelLayoutSnapshotRef.current = nextSnapshot;
    pendingLeftPanelLayoutSnapshotRef.current = null;
    previousStoryPanelOpenRef.current = storyPanelOpen;
    if (storyLayoutUnlockTimerRef.current) {
      window.clearTimeout(storyLayoutUnlockTimerRef.current);
      storyLayoutUnlockTimerRef.current = undefined;
    }
    if (didAnimateLayoutShift) {
      storyLayoutUnlockTimerRef.current = window.setTimeout(() => {
        storyLayoutSnapshotLockedRef.current = false;
        storyLayoutUnlockTimerRef.current = undefined;
      }, 500);
    } else {
      storyLayoutSnapshotLockedRef.current = false;
    }
  }, [storyPanelOpen, pendingPromptCards, promptCards, editingPendingPromptCardId]);

  useLayoutEffect(() => {
    if (!rootRef.current) return;
    const root = rootRef.current;
    const targets = getPromptCardLayoutTargets(root);
    gsap.killTweensOf(targets);
    targets.forEach((element) => {
      element.style.transform = "";
    });

    const nextSnapshot = readPromptCardLayoutSnapshot(root);
    const previousSnapshot = pendingPromptCardLayoutSnapshotRef.current ?? promptCardLayoutSnapshotRef.current;
    const shouldAnimate = previousSnapshot.size > 0
      && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (shouldAnimate) {
      targets.forEach((element) => {
        const key = getPromptCardLayoutKey(element);
        const previousRect = previousSnapshot.get(key);
        const nextRect = nextSnapshot.get(key);
        if (!previousRect || !nextRect) return;
        const deltaY = previousRect.top - nextRect.top;
        if (Math.abs(deltaY) < 0.5) return;
        gsap.fromTo(
          element,
          { y: deltaY },
          { y: 0, duration: 0.34, ease: "power3.out", overwrite: "auto", clearProps: "transform" }
        );
      });
    }

    promptCardLayoutSnapshotRef.current = nextSnapshot;
    pendingPromptCardLayoutSnapshotRef.current = null;
  }, [pendingPromptCards, promptCards, editingPendingPromptCardId]);

  useEffect(() => {
    const isTextEditingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      if (target.isContentEditable) return true;
      if (target instanceof HTMLTextAreaElement) return true;
      if (!(target instanceof HTMLInputElement)) return false;
      return !["button", "checkbox", "file", "radio", "range", "reset", "submit"].includes(target.type);
    };
    const isButtonLikeTarget = (target: EventTarget | null) => (
      target instanceof Element && Boolean(target.closest("button,a,[role='button']"))
    );
    const isPendingCardEditorTarget = (target: EventTarget | null) => (
      target instanceof Element && Boolean(target.closest(".prompt-card-edit-textarea"))
    );
    const handlePageShortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      const key = event.key;
      const isUndoKey = (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && key.toLowerCase() === "z";
      if (isUndoKey) {
        if (undoPromptRestore()) event.preventDefault();
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (key === "Enter") {
        if (isPendingCardEditorTarget(event.target)) return;
        if (!event.shiftKey && !isButtonLikeTarget(event.target) && editFocusedPendingPromptCard()) {
          event.preventDefault();
          return;
        }
        if (event.shiftKey || isButtonLikeTarget(event.target)) return;
        event.preventDefault();
        continueStory();
        return;
      }

      if (key === "Escape") {
        if (openPromptCardMenuId) {
          event.preventDefault();
          setOpenPromptCardMenuId(null);
          return;
        }
        if (cancelPendingPromptCardEdit()) {
          event.preventDefault();
          return;
        }
        if (suggestionDialogOpen) {
          event.preventDefault();
          setSuggestionDialogOpen(false);
          return;
        }
        if (status === "loading" && pendingPromptCards.some((card) => card.status === "generating")) {
          event.preventDefault();
          stopStoryGeneration();
          return;
        }
        if (promptSuggestionActive) {
          event.preventDefault();
          finishPromptSuggestionAnimation();
        }
        return;
      }

      if (key === "Delete" && !isTextEditingTarget(event.target) && removeFocusedPendingPromptCard()) {
        event.preventDefault();
        return;
      }

      if (key === "Tab") {
        if (!promptCards.length && !pendingPromptCards.some((card) => card.status === "queued")) return;
        event.preventDefault();
        focusPromptCardByStep(event.shiftKey ? -1 : 1);
        return;
      }

      const arrowDirection = key === "ArrowUp" || key === "ArrowLeft"
        ? 1
        : key === "ArrowDown" || key === "ArrowRight"
          ? -1
          : 0;
      if (!arrowDirection || isTextEditingTarget(event.target) || (!promptCards.length && !pendingPromptCards.some((card) => card.status === "queued"))) return;
      event.preventDefault();
      focusPromptCardByStep(arrowDirection);
    };

    window.addEventListener("keydown", handlePageShortcut);
    return () => window.removeEventListener("keydown", handlePageShortcut);
  }, [draftPrompt, editingPendingPromptCardId, focusedPendingPromptCardId, focusedPromptCardId, openPromptCardMenuId, pendingPromptCards, promptCards, promptSuggestionActive, status, suggestionDialogOpen]);

  return (
    <div ref={rootRef} className={`app-shell dark ${storyPackage === "jojo" ? "app-shell-jojo" : ""}`} data-theme="dark" data-vibrant-palette="true">
      <header className="topbar motion-in">
        <div className="brand-block">
          <h1>{packageTitle(storyPackage)}</h1>
          <div ref={settingsMenuRef} className="title-menu-wrap">
            <button
              className={settingsMenuOpen ? "title-menu-button title-menu-button-open" : "title-menu-button"}
              type="button"
              aria-haspopup="menu"
              aria-expanded={settingsMenuOpen}
              aria-label="打开设置菜单"
              onClick={() => setSettingsMenuOpen((current) => !current)}
            >
              <ChevronDown size={17} />
            </button>
            {settingsMenuOpen ? (
              <div className="title-menu-popover" role="menu">
                <div className="title-menu-tabs" role="tablist" aria-label="预览模式">
                  <button
                    className={previewMode === "wechat" ? "title-menu-tab title-menu-tab-active" : "title-menu-tab"}
                    type="button"
                    role="tab"
                    aria-selected={previewMode === "wechat"}
                    onClick={() => choosePreviewMode("wechat")}
                  >
                    <Smartphone size={15} />
                    <span>界面版</span>
                  </button>
                  <button
                    className={previewMode === "video" ? "title-menu-tab title-menu-tab-active" : "title-menu-tab"}
                    type="button"
                    role="tab"
                    aria-selected={previewMode === "video"}
                    onClick={() => choosePreviewMode("video")}
                  >
                    <Video size={15} />
                    <span>视频版</span>
                  </button>
                </div>
                <a className="title-menu-item" role="menuitem" href={switchLink.href} onClick={closeSettingsMenu}>
                  <ArrowUpRight size={16} />
                  <span>{switchLink.label}</span>
                  <small>切换版本</small>
                </a>
                <a className="title-menu-item" role="menuitem" href={githubRepositoryUrl} target="_blank" rel="noreferrer" onClick={closeSettingsMenu}>
                  <ArrowUpRight size={16} />
                  <span>Github</span>
                  <small>公开仓库</small>
                </a>
                <div className="title-menu-separator" />
                <button
                  className="title-menu-item"
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    closeSettingsMenu();
                    exportJson();
                  }}
                >
                  <FileDown size={16} />
                  <span>存档</span>
                  <small>导出当前存档</small>
                </button>
                <button
                  className="title-menu-item"
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    closeSettingsMenu();
                    importInputRef.current?.click();
                  }}
                >
                  <FileUp size={16} />
                  <span>读档</span>
                  <small>导入 JSON</small>
                </button>
              </div>
            ) : null}
          </div>
          <input ref={importInputRef} hidden type="file" accept="application/json,.json" onChange={(event) => importJson(event.currentTarget.files?.[0])} />
        </div>
      </header>
      {toastMessage ? (
        <div className="app-toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      ) : null}

      <main className="workspace static-workspace">
        <div className={`left-panel ${storyPanelOpen ? "story-panel-open" : ""}`}>
          <div
            className={leftPanelScrolling ? "left-panel-scroll panel-scroll left-panel-scroll-scrolling" : "left-panel-scroll panel-scroll"}
            onScroll={handleLeftPanelScroll}
          >
            <button
              className="story-panel-status"
              style={jojoMode ? jojoStoryToggleGlassStyle : undefined}
              type="button"
              onClick={() => setStoryPanelOpenWithContinuity((current) => !current)}
              aria-expanded={storyPanelOpen}
              aria-label={storyPanelOpen ? "收起编故事" : "展开编故事"}
            >
              <span className="story-panel-status-icon" aria-hidden="true">
                {storyPanelOpen ? <ChevronDown size={16} /> : <PenLine size={16} />}
              </span>
              <small>{storyCardCount ? `${storyCardCount} 张故事卡` : "准备生成"}</small>
            </button>
            <Card className="surface-card story-composer-card motion-in" style={jojoMode ? jojoGlassCardStyle : undefined}>
              <CardHeader className="card-header">
                <div className="panel-title">
                  <Sparkles size={18} />
                  编故事
                </div>
              </CardHeader>
              <CardContent className="card-content">
                <div className={promptTextareaShellClassName}>
                  <textarea
                    ref={promptTextareaRef}
                    className="hero-textarea prompt-textarea"
                    value={draftPrompt}
                    onChange={(event) => handleDraftPromptChange(event.target.value)}
                    onFocus={handlePromptTextareaFocus}
                    placeholder="输入下一段要推进的剧情。它会结合此前故事卡和现有对话继续往后写。"
                    rows={5}
                  />
                  {promptSuggestionActive ? (
                    <div key={promptSuggestionKey} className="prompt-suggestion-overlay" aria-hidden="true">
                      <span className="prompt-suggestion-rise">
                        {renderPromptRiseText(draftPrompt)}
                      </span>
                    </div>
                  ) : null}
                  {deferredSuggestionText ? (
                    <button
                      className="prompt-suggestion-trigger"
                      type="button"
                      aria-label="查看建议提示词"
                      aria-expanded={suggestionDialogOpen}
                      onClick={() => setSuggestionDialogOpen(true)}
                    >
                      <Lightbulb size={16} />
                    </button>
                  ) : null}
                  {deferredSuggestionText && suggestionDialogOpen ? (
                    <div className="prompt-suggestion-popover" role="dialog" aria-label="建议提示词">
                      <div className="prompt-suggestion-popover-header">
                        <strong>建议提示词</strong>
                        <button type="button" onClick={dismissDeferredSuggestion} aria-label="关闭建议提示词">
                          <X size={14} />
                        </button>
                      </div>
                      <p>{deferredSuggestionText}</p>
                      <div className="prompt-suggestion-popover-actions">
                        <button type="button" className="prompt-suggestion-secondary" onClick={dismissDeferredSuggestion}>
                          关闭
                        </button>
                        <button type="button" className="prompt-suggestion-primary" onClick={adoptDeferredSuggestion}>
                          采用
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
                <button
                  className={storyActionButtonClassName}
                  type="button"
                  onClick={continueStory}
                  disabled={!canSubmitStory}
                >
                  {status === "loading" ? <MessageSquarePlus size={17} /> : <MessageSquarePlus size={17} />}
                  {status === "loading" ? "加入队列" : "开始编"}
                </button>
              </CardContent>
            </Card>

            {storyCardCount ? (
              <section className="prompt-history-card motion-in" aria-label="故事卡">
                <div className="card-header prompt-history-header">
                  <div className="panel-title">
                    <Save size={18} />
                    故事卡
                  </div>
                </div>
                <div className="card-content prompt-card-list">
                  {pendingPromptCards.map((card, index) => ({
                    card,
                    cardNumber: card.completedCardNumber ?? promptCards.length + index + 1
                  })).reverse().map(({ card, cardNumber }) => (
                    <PendingPromptCardView
                      key={card.id}
                      cardId={card.id}
                      prompt={card.prompt}
                      progress={card.status === "generating" ? generationProgress : 0}
                      status={card.status}
                      queuePosition={cardNumber}
                      onEdit={stopStoryGeneration}
                      onUpdate={card.status === "queued" ? (nextPrompt) => updateQueuedPromptCard(card.id, nextPrompt) : undefined}
                      onRemove={card.status === "queued" ? () => removeQueuedPromptCard(card.id) : undefined}
                      onJumpToBottom={scrollConversationToBottom}
                      onSelect={card.status === "queued" ? () => selectPendingPromptCard(card.id) : undefined}
                      onStartEdit={card.status === "queued" ? () => startPendingPromptCardEdit(card.id) : undefined}
                      onCancelEdit={card.status === "queued" ? cancelPendingPromptCardEdit : undefined}
                      isSelected={focusedPendingPromptCardId === card.id}
                      isEditing={editingPendingPromptCardId === card.id}
                      style={jojoMode ? jojoPromptCardGlassStyle : undefined}
                    />
                  ))}
                  {[...promptCards].reverse().map((card, index) => {
                    const cardNumber = promptCards.length - index;
                    const isCompletingFromPending = settledPromptCardIdsRef.current.has(card.id);
                    return (
                      <StoryPromptCardView
                        key={card.id}
                        card={card}
                        cardNumber={cardNumber}
                        isSelected={focusedPromptCardId === card.id}
                        isCompletingFromPending={isCompletingFromPending}
                        isMenuOpen={openPromptCardMenuId === card.id}
                        layoutKey={completedPromptCardLayoutKeysRef.current.get(card.id) ?? `prompt-${card.id}`}
                        style={jojoMode ? jojoPromptCardGlassStyle : undefined}
                        onFocusCard={() => focusPromptCard(card)}
                        onToggleMenu={() => setOpenPromptCardMenuId((current) => current === card.id ? null : card.id)}
                        onRestartFromHere={() => restartFromPromptCard(card)}
                        onCopyPrompt={() => void copyPromptCardText(card)}
                      />
                    );
                  })}
                  <Button className="prompt-reset-button prompt-history-reset-button" fullWidth variant="secondary" onPress={clearLine}>
                    <RefreshCcw size={16} />
                    重新开始
                  </Button>
                </div>
              </section>
            ) : null}
          </div>
        </div>

        <div className="right-panel panel-scroll">
          <Card className="surface-card preview-wrap preview-tilt-target motion-in">
            <CardContent className="card-content">
              <div className={`preview-content-stage ${previewTransition ? `preview-content-stage-${previewTransition.direction}` : ""}`}>
                {previewTransition ? (
                  <div key={`exit-${previewTransition.id}-${previewTransition.exiting}`} className={`preview-pane preview-pane-exit preview-pane-exit-${previewTransition.direction}`}>
                    {renderPreviewPane(previewTransition.exiting, false)}
                  </div>
                ) : null}
                <div key={`enter-${previewTransition?.id ?? "steady"}-${previewMode}`} className={`preview-pane ${previewTransition ? `preview-pane-enter preview-pane-enter-${previewTransition.direction}` : ""}`}>
                  {renderPreviewPane(previewMode, true)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
