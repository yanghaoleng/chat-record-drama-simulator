import { getCharacter, messageVoiceText, type ChatMessage, type DramaProject } from "./schema";
import { imageNarrativeCopy, imageSourceForMessage } from "./imageNarrative";
import { jojoCssMemeCardForMessage, type JojoCssMemeCard, type JojoCssMemeTone } from "./jojoMemeCards";
import { isJojoProject } from "./jojoProject";
import { resolvePublicAssetPath } from "./publicPath";
import { buildTimeline, getDurationInFrames, getScrollY, type TimelineEntry } from "./timing";
import type { TtsClipMap } from "./edgeTts";

export type VideoExportResult = {
  blob: Blob;
  url: string;
  extension: "mp4" | "webm";
  mimeType: string;
};

export type VideoExportProgress = {
  phase: "preparing" | "recording" | "done";
  progress: number;
};

const videoMimeTypes = [
  { mimeType: "video/mp4;codecs=avc1.42E01E,mp4a.40.2", extension: "mp4" as const },
  { mimeType: "video/webm;codecs=vp9,opus", extension: "webm" as const },
  { mimeType: "video/webm;codecs=vp8,opus", extension: "webm" as const },
  { mimeType: "video/webm", extension: "webm" as const }
];
const exportSize = { width: 1280, height: 720 };
type VisualSide = "left" | "right";
type ImageCache = {
  avatars: Map<string, HTMLImageElement>;
  media: Map<string, HTMLImageElement>;
};

function pickMimeType() {
  return videoMimeTypes.find((item) => MediaRecorder.isTypeSupported(item.mimeType)) || videoMimeTypes.at(-1)!;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const chars = [...text];
  const lines: string[] = [];
  let line = "";
  for (const char of chars) {
    const next = `${line}${char}`;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function loadCanvasImage(src: string): Promise<HTMLImageElement | undefined> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(undefined);
    image.src = src;
  });
}

function visualSideFor(project: DramaProject, message: ChatMessage): ChatMessage["side"] {
  if (!isJojoProject(project)) return message.side;
  if (message.side === "center") return "center";
  const character = message.roleId ? project.characters.find((item) => item.id === message.roleId) : undefined;
  return character?.side || message.side;
}

function parseGradientColors(value: string | undefined, fallback: [string, string]): [string, string] {
  const colors = value?.match(/#[0-9a-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)/gi);
  return [colors?.[0] || fallback[0], colors?.[1] || colors?.[0] || fallback[1]];
}

function drawImageCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  if (!sourceWidth || !sourceHeight) return;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawImageContain(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  if (!sourceWidth || !sourceHeight) return;
  const scale = Math.min(width / sourceWidth, height / sourceHeight, 1);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

async function preloadRenderImages(project: DramaProject) {
  const cache: ImageCache = {
    avatars: new Map(),
    media: new Map()
  };

  await Promise.all(project.characters.map(async (character) => {
    const src = resolvePublicAssetPath(character.avatarUrl);
    if (!src) return;
    const image = await loadCanvasImage(src);
    if (image) cache.avatars.set(character.id, image);
  }));

  await Promise.all(project.messages.map(async (message) => {
    if (message.type !== "image" && message.type !== "meme") return;
    const src = resolvePublicAssetPath(imageSourceForMessage(project, message));
    if (!src) return;
    const image = await loadCanvasImage(src);
    if (image) cache.media.set(message.id, image);
  }));

  return cache;
}

function drawAvatar(ctx: CanvasRenderingContext2D, project: DramaProject, message: ChatMessage, x: number, y: number, imageCache: ImageCache) {
  const character = getCharacter(project, message);
  const avatarImage = imageCache.avatars.get(character.id);
  const background = isJojoProject(project) ? "#eef3f9" : "#ebebeb";
  const radius = isJojoProject(project) ? 18 : 12;
  ctx.save();
  roundRect(ctx, x, y, 112, 112, radius);
  ctx.clip();
  let drewAvatarImage = false;
  if (avatarImage) {
    ctx.fillStyle = background;
    ctx.fillRect(x, y, 112, 112);
    try {
      drawImageCover(ctx, avatarImage, x, y, 112, 112);
      drewAvatarImage = true;
    } catch {
      // Cross-origin images without canvas permission fall back to initials.
    }
  }
  if (!drewAvatarImage) {
    const fallbackColors: [string, string] = message.side === "left" ? ["#f9a8d4", "#64748b"] : ["#0f172a", "#7c2d12"];
    const [startColor, endColor] = parseGradientColors(character.avatarGradient, fallbackColors);
    const gradient = ctx.createLinearGradient(x, y, x + 112, y + 112);
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, 112, 112);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 48px PingFang SC, Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(character.avatarInitial || character.name.slice(0, 1), x + 56, y + 57);
  }
  ctx.restore();
}

function drawTextBubble(ctx: CanvasRenderingContext2D, project: DramaProject, message: ChatMessage, visualSide: VisualSide, x: number, y: number, maxWidth: number) {
  ctx.font = "500 62px PingFang SC, Microsoft YaHei, sans-serif";
  const lines = wrapText(ctx, message.text || messageVoiceText(message), maxWidth - 112);
  const width = Math.min(maxWidth, Math.max(260, ...lines.map((line) => ctx.measureText(line).width + 112)));
  const height = Math.max(112, 62 * lines.length * 1.18 + 60);
  const jojoMode = isJojoProject(project);
  const bubbleColor = jojoMode && visualSide === "right" ? "#1677ff" : visualSide === "right" ? "#95ec69" : "#ffffff";
  const textColor = jojoMode && visualSide === "right" ? "#ffffff" : jojoMode ? "#162033" : "#111111";
  ctx.fillStyle = bubbleColor;
  roundRect(ctx, x, y, width, height, 8);
  ctx.fill();
  ctx.beginPath();
  if (visualSide === "left") {
    ctx.moveTo(x, y + 42);
    ctx.lineTo(x - 24, y + 60);
    ctx.lineTo(x, y + 78);
  } else {
    ctx.moveTo(x + width, y + 42);
    ctx.lineTo(x + width + 24, y + 60);
    ctx.lineTo(x + width, y + 78);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = textColor;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  lines.forEach((line, index) => {
    ctx.fillText(line, x + 56, y + 28 + index * 72);
  });
  return { width, height };
}

function drawTransfer(ctx: CanvasRenderingContext2D, message: ChatMessage, x: number, y: number) {
  ctx.fillStyle = "#f49a37";
  roundRect(ctx, x, y, 700, 228, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(x + 92, y + 92, 48, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 52px PingFang SC, Microsoft YaHei, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("¥", x + 92, y + 94);
  ctx.textAlign = "left";
  ctx.font = "600 54px PingFang SC, Microsoft YaHei, sans-serif";
  ctx.fillText(`¥${(message.amount ?? 88).toFixed(2)}`, x + 170, y + 62);
  ctx.font = "400 34px PingFang SC, Microsoft YaHei, sans-serif";
  ctx.fillText(message.transferNote || message.text || "你发起了一笔转账", x + 170, y + 132);
  return { width: 700, height: 228 };
}

function drawImageCard(ctx: CanvasRenderingContext2D, project: DramaProject, message: ChatMessage, x: number, y: number, imageCache: ImageCache) {
  const copy = imageNarrativeCopy(project, message);
  const image = imageCache.media.get(message.id);
  const gradient = ctx.createLinearGradient(x, y, x + 700, y + 430);
  gradient.addColorStop(0, "#7c2d12");
  gradient.addColorStop(0.5, "#eab308");
  gradient.addColorStop(1, "#334155");
  roundRect(ctx, x, y, 700, 430, 10);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, 700, 430);
  let drewImage = false;
  if (image) {
    try {
      drawImageCover(ctx, image, x, y, 700, 430);
      drewImage = true;
    } catch {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(x, y, 700, 430);
    }
  }
  if (!drewImage) {
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(x, y, 700, 430);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#ffffff";
    ctx.font = "650 44px PingFang SC, Microsoft YaHei, sans-serif";
    wrapText(ctx, copy.description, 610).slice(0, 4).forEach((line, index) => {
      ctx.fillText(line, x + 42, y + 164 + index * 56);
    });
  }
  ctx.restore();
  return { width: 700, height: 430 };
}

const jojoMemeToneColors: Record<JojoCssMemeTone, { top: string; accent: string; ink: string }> = {
  jiaojiao: { top: "#c9f3ff", accent: "#7ddcff", ink: "#13233a" },
  lingdang: { top: "#c9f3ff", accent: "#7ddcff", ink: "#13233a" },
  zhuxiaodi: { top: "#c9f3ff", accent: "#7ddcff", ink: "#13233a" },
  xitong: { top: "#c9f3ff", accent: "#7ddcff", ink: "#13233a" },
  meeting: { top: "#c9f3ff", accent: "#7ddcff", ink: "#13233a" }
};

function drawJojoCssMemeCard(ctx: CanvasRenderingContext2D, card: JojoCssMemeCard, x: number, y: number) {
  const colors = jojoMemeToneColors[card.tone];
  const width = 250;
  const height = 250;
  ctx.save();
  roundRect(ctx, x, y, width, height, 32);
  ctx.clip();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, width, height);

  const topGradient = ctx.createLinearGradient(x, y, x + width, y + 106);
  topGradient.addColorStop(0, colors.top);
  topGradient.addColorStop(1, colors.accent);
  ctx.fillStyle = topGradient;
  ctx.fillRect(x, y, width, 104);

  ctx.fillStyle = "#eef6ff";
  ctx.strokeStyle = "#d6e7f8";
  ctx.lineWidth = 3;
  roundRect(ctx, x + 26, y + 150, width - 52, 84, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  roundRect(ctx, x + 61, y + 40, 128, 128, 36);
  ctx.fill();
  const markGradient = ctx.createLinearGradient(x + 61, y + 40, x + 189, y + 168);
  markGradient.addColorStop(0, "#f8fdff");
  markGradient.addColorStop(1, "#dcf6ff");
  ctx.fillStyle = markGradient;
  roundRect(ctx, x + 69, y + 48, 112, 112, 30);
  ctx.fill();

  ctx.fillStyle = colors.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 98px Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, PingFang SC, Microsoft YaHei, sans-serif";
  ctx.fillStyle = "#1a75bc";
  ctx.fillText(card.mark, x + width / 2, y + 104);
  ctx.fillStyle = colors.ink;
  ctx.font = "850 29px PingFang SC, Microsoft YaHei, sans-serif";
  ctx.fillText(card.title, x + width / 2, y + 186);
  ctx.fillStyle = "#60768b";
  ctx.font = "500 23px PingFang SC, Microsoft YaHei, sans-serif";
  ctx.fillText(card.subtitle, x + width / 2, y + 222);
  ctx.restore();
}

function drawMeme(ctx: CanvasRenderingContext2D, message: ChatMessage, x: number, y: number, imageCache: ImageCache) {
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, x, y, 520, 360, 10);
  ctx.fill();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const cssCard = jojoCssMemeCardForMessage(message);
  if (cssCard) {
    drawJojoCssMemeCard(ctx, cssCard, x + 135, y + 48);
    return { width: 520, height: 360 };
  }
  const image = imageCache.media.get(message.id);
  if (image) {
    try {
      drawImageContain(ctx, image, x + 70, y + 34, 380, 240);
    } catch {
      ctx.fillStyle = "#111111";
      ctx.font = "800 62px PingFang SC, Microsoft YaHei, sans-serif";
      ctx.fillText(message.text || "表情", x + 260, y + 180);
    }
    ctx.fillStyle = "#111111";
    ctx.font = "700 34px PingFang SC, Microsoft YaHei, sans-serif";
    ctx.fillText(message.text || "表情", x + 260, y + 308);
  } else {
    ctx.fillStyle = "#111111";
    ctx.font = "800 62px PingFang SC, Microsoft YaHei, sans-serif";
    ctx.fillText(message.text || "表情", x + 260, y + 180);
  }
  return { width: 520, height: 360 };
}

function drawMessage(ctx: CanvasRenderingContext2D, project: DramaProject, entry: TimelineEntry, y: number, imageCache: ImageCache) {
  const message = entry.message;
  const opacity = 1;
  ctx.globalAlpha = opacity;

  if (message.type === "system" || message.side === "center") {
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    roundRect(ctx, 560, y, 400, 70, 12);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "400 30px PingFang SC, Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(message.text, 760, y + 35);
    return;
  }

  const avatarY = y;
  const bubbleY = y;
  const leftAvatarX = 70;
  const rightAvatarX = project.canvas.width - 70 - 112;
  const leftBubbleX = leftAvatarX + 112 + 52;
  const visualSide: VisualSide = visualSideFor(project, message) === "right" ? "right" : "left";

  if (visualSide === "left") {
    drawAvatar(ctx, project, message, leftAvatarX, avatarY, imageCache);
    if (message.type === "transfer") drawTransfer(ctx, message, leftBubbleX, bubbleY);
    else if (message.type === "image") drawImageCard(ctx, project, message, leftBubbleX, bubbleY, imageCache);
    else if (message.type === "meme") drawMeme(ctx, message, leftBubbleX, bubbleY, imageCache);
    else drawTextBubble(ctx, project, message, visualSide, leftBubbleX, bubbleY, 980);
  } else {
    const maxBubbleWidth = 980;
    const probeX = 0;
    let size = { width: 520, height: 112 };
    if (message.type === "transfer") size = { width: 700, height: 228 };
    else if (message.type === "image") size = { width: 700, height: 430 };
    else if (message.type === "meme") size = { width: 520, height: 360 };
    else {
      ctx.font = "500 62px PingFang SC, Microsoft YaHei, sans-serif";
      const lines = wrapText(ctx, message.text || messageVoiceText(message), maxBubbleWidth - 112);
      size = {
        width: Math.min(maxBubbleWidth, Math.max(260, ...lines.map((line) => ctx.measureText(line).width + 112))),
        height: Math.max(112, 62 * lines.length * 1.18 + 60)
      };
    }
    const bubbleX = rightAvatarX - 52 - size.width;
    if (message.type === "transfer") drawTransfer(ctx, message, bubbleX, bubbleY);
    else if (message.type === "image") drawImageCard(ctx, project, message, bubbleX, bubbleY, imageCache);
    else if (message.type === "meme") drawMeme(ctx, message, bubbleX, bubbleY, imageCache);
    else drawTextBubble(ctx, project, message, visualSide, bubbleX || probeX, bubbleY, maxBubbleWidth);
    drawAvatar(ctx, project, message, rightAvatarX, avatarY, imageCache);
  }

  ctx.globalAlpha = 1;
}

function drawFrame(ctx: CanvasRenderingContext2D, project: DramaProject, frame: number, imageCache: ImageCache) {
  ctx.clearRect(0, 0, project.canvas.width, project.canvas.height);
  const background = isJojoProject(project) ? "#eef3f9" : "#ebebeb";
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, project.canvas.width, project.canvas.height);
  const scrollY = getScrollY(project, frame);
  const timeline = buildTimeline(project);
  for (const entry of timeline) {
    if (frame < entry.startFrame - 3) continue;
    const y = entry.y - scrollY;
    if (y > project.canvas.height + 100 || y + entry.height < -100) continue;
    drawMessage(ctx, project, entry, y, imageCache);
  }
  const fade = ctx.createLinearGradient(0, project.canvas.height - 120, 0, project.canvas.height);
  fade.addColorStop(0, isJojoProject(project) ? "rgba(238,243,249,0)" : "rgba(235,235,235,0)");
  fade.addColorStop(1, isJojoProject(project) ? "rgba(238,243,249,0.95)" : "rgba(235,235,235,0.95)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, project.canvas.height - 120, project.canvas.width, 120);
}

async function decodeClip(audioContext: AudioContext, clip?: { blob: Blob }) {
  if (!clip) return undefined;
  return audioContext.decodeAudioData(await clip.blob.arrayBuffer());
}

async function resumeAudioContext(audioContext: AudioContext) {
  if (audioContext.state !== "suspended") return;
  await Promise.race([
    audioContext.resume(),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, 1200);
    })
  ]);
}

function stopAudioNode(node: AudioScheduledSourceNode) {
  try {
    node.stop();
  } catch {
    // The node may already have a scheduled stop; either way cleanup can continue.
  }
}

function scheduleSfx(audioContext: AudioContext, destination: AudioNode, type: ChatMessage["sendSfx"], time: number) {
  if (!type || type === "none") return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.type = type === "transfer" ? "triangle" : "sine";
  oscillator.frequency.setValueAtTime(type === "meme" ? 520 : type === "image" ? 420 : type === "transfer" ? 660 : 880, time);
  oscillator.frequency.exponentialRampToValueAtTime(type === "transfer" ? 990 : 620, time + 0.12);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(type === "transfer" ? 0.22 : 0.12, time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
  oscillator.start(time);
  oscillator.stop(time + 0.2);
}

export async function exportBrowserVideo(
  project: DramaProject,
  clips: TtsClipMap,
  onProgress?: (progress: VideoExportProgress) => void
): Promise<VideoExportResult> {
  const canvas = document.createElement("canvas");
  canvas.width = exportSize.width;
  canvas.height = exportSize.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("当前浏览器无法创建 Canvas 渲染上下文");
  const scaleX = canvas.width / project.canvas.width;
  const scaleY = canvas.height / project.canvas.height;
  const imageCache = await preloadRenderImages(project);

  const audioContext = new AudioContext({ sampleRate: 48000 });
  const audioDestination = audioContext.createMediaStreamDestination();
  const stream = canvas.captureStream(project.fps);
  audioDestination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));

  const silent = audioContext.createOscillator();
  const silentGain = audioContext.createGain();
  silentGain.gain.value = 0.00001;
  silent.connect(silentGain).connect(audioDestination);

  const { mimeType, extension } = pickMimeType();
  const recorder = new MediaRecorder(stream, {
    mimeType,
    audioBitsPerSecond: 128000,
    videoBitsPerSecond: 2500000
  });
  const chunks: BlobPart[] = [];
  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size) chunks.push(event.data);
  });

  const durationInFrames = getDurationInFrames(project);
  const timeline = buildTimeline(project);
  onProgress?.({ phase: "preparing", progress: 0 });
  const decodedClips = new Map<string, AudioBuffer>();
  for (const entry of timeline) {
    const decoded = await decodeClip(audioContext, clips[entry.message.id]);
    if (decoded) decodedClips.set(entry.message.id, decoded);
  }

  await resumeAudioContext(audioContext);
  return new Promise((resolve, reject) => {
    recorder.addEventListener("error", () => reject(new Error("浏览器视频录制失败")));
    recorder.addEventListener("stop", () => {
      stopAudioNode(silent);
      audioContext.close().catch(() => undefined);
      const blob = new Blob(chunks, { type: mimeType });
      resolve({ blob, url: URL.createObjectURL(blob), extension, mimeType });
    });

    const audioStart = audioContext.currentTime + 0.2;
    const startedAt = performance.now() + 200;
    silent.start(audioStart);
    silent.stop(audioStart + durationInFrames / project.fps + 1);

    for (const entry of timeline) {
      const startTime = audioStart + entry.startFrame / project.fps;
      scheduleSfx(audioContext, audioDestination, entry.message.sendSfx, startTime);
      const audioBuffer = decodedClips.get(entry.message.id);
      if (audioBuffer) {
        const source = audioContext.createBufferSource();
        const gain = audioContext.createGain();
        source.buffer = audioBuffer;
        gain.gain.value = project.audioMix.ttsVolume;
        source.connect(gain).connect(audioDestination);
        source.start(startTime + 0.12);
      }
    }

    recorder.start(1000);
    const draw = () => {
      const elapsedMs = Math.max(0, performance.now() - startedAt);
      const frame = Math.min(durationInFrames - 1, Math.floor((elapsedMs / 1000) * project.fps));
      ctx.save();
      ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
      drawFrame(ctx, project, frame, imageCache);
      ctx.restore();
      onProgress?.({ phase: "recording", progress: frame / durationInFrames });
      if (frame >= durationInFrames - 1) {
        onProgress?.({ phase: "done", progress: 1 });
        window.setTimeout(() => recorder.stop(), 350);
      } else {
        window.requestAnimationFrame(draw);
      }
    };
    window.requestAnimationFrame(draw);
  });
}
