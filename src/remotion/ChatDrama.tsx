import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { imageNarrativeCopy, imageSourceForMessage } from "../shared/imageNarrative";
import { jojoCssMemeCardForMessage, type JojoCssMemeCard } from "../shared/jojoMemeCards";
import { isJojoProject } from "../shared/jojoProject";
import { resolvePublicAssetPath } from "../shared/publicPath";
import { getCharacter, type ChatMessage, type DramaProject } from "../shared/schema";
import { buildTimeline, getDurationInFrames, type TimelineEntry } from "../shared/timing";
import { sampleProject } from "../shared/sampleProject";
import "./style.css";

interface ChatDramaProps {
  project?: DramaProject;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

const scrollTargetFor = (project: DramaProject, timeline: TimelineEntry[], entry: TimelineEntry): number => {
  const focusY = project.canvas.height * 0.62;
  const last = timeline[timeline.length - 1];
  const maxY = Math.max(0, last.y + last.height - project.canvas.height + 180);
  return clamp(entry.y + entry.height * 0.58 - focusY, 0, maxY);
};

function Avatar({ project, message }: { project: DramaProject; message: ChatMessage }) {
  const character = getCharacter(project, message);

  if (character.avatarUrl) {
    const avatarUrl = resolvePublicAssetPath(character.avatarUrl) || character.avatarUrl;
    return <Img className="chat-avatar" src={avatarUrl} />;
  }

  return (
    <div className="chat-avatar avatar-fallback" style={{ background: character.avatarGradient }}>
      {character.avatarInitial}
    </div>
  );
}

function visualSideFor(project: DramaProject, message: ChatMessage) {
  if (!isJojoProject(project)) return message.side;
  if (message.roleId === "jiaojiao") return "right";
  if (message.side === "center") return "center";
  return "left";
}

function TextBubble({ message, visualSide }: { message: ChatMessage; visualSide: ChatMessage["side"] }) {
  return (
    <div className={`bubble bubble-${visualSide}`}>
      <span>{message.text}</span>
    </div>
  );
}

function TransferBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="transfer-card">
      <div className="transfer-icon">↔</div>
      <div>
        <div className="transfer-amount">¥{(message.amount ?? 88).toFixed(2)}</div>
        <div className="transfer-note">{message.transferNote || "你发起了一笔转账"}</div>
        <div className="transfer-footer">聊天转账</div>
      </div>
    </div>
  );
}

function ImageBubble({ project, message }: { project: DramaProject; message: ChatMessage }) {
  const src = resolvePublicAssetPath(imageSourceForMessage(project, message));
  const copy = imageNarrativeCopy(project, message);

  return (
    <div className="media-card">
      {src ? (
        <Img src={src} className="media-image" />
      ) : (
        <div className="photo-placeholder">
          <div className="photo-description">{copy.description}</div>
        </div>
      )}
    </div>
  );
}

function JojoCssMemeCardView({ card }: { card: JojoCssMemeCard }) {
  return (
    <div className={`jojo-render-meme jojo-render-meme-${card.tone}`}>
      <div className="jojo-render-meme-mark" aria-hidden="true">
        <span>{card.mark}</span>
      </div>
      <strong>{card.title}</strong>
      <small>{card.subtitle}</small>
    </div>
  );
}

function MemeBubble({ project, message }: { project: DramaProject; message: ChatMessage }) {
  const cssCard = jojoCssMemeCardForMessage(message);
  const src = cssCard ? undefined : resolvePublicAssetPath(imageSourceForMessage(project, message));

  return (
    <div className={cssCard ? "meme-card meme-card-css" : "meme-card"}>
      {cssCard ? <JojoCssMemeCardView card={cssCard} /> : src ? <Img src={src} className="meme-image" /> : <div className="meme-text">表情</div>}
      {!cssCard && message.text ? <div className="meme-caption">{message.text}</div> : null}
    </div>
  );
}

function MessageBody({ project, message }: { project: DramaProject; message: ChatMessage }) {
  const visualSide = visualSideFor(project, message);
  if (message.type === "transfer") return <TransferBubble message={message} />;
  if (message.type === "image") return <ImageBubble project={project} message={message} />;
  if (message.type === "meme") return <MemeBubble project={project} message={message} />;
  if (message.type === "system") return <div className="system-message">{message.text}</div>;
  return <TextBubble message={message} visualSide={visualSide} />;
}

function MessageRow({ project, entry }: { project: DramaProject; entry: TimelineEntry }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - entry.startFrame;
  const pop = spring({
    frame: Math.max(0, localFrame),
    fps,
    config: { damping: 18, stiffness: 155, mass: 0.8 }
  });
  const opacity = interpolate(frame, [entry.startFrame - 3, entry.startFrame + 7], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const translateY = interpolate(frame, [entry.startFrame - 3, entry.startFrame + 10], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const scale = 0.94 + pop * 0.06;

  if (frame < entry.startFrame - 3) return null;

  if (entry.message.type === "system") {
    return (
      <div className="message-row message-center" style={{ top: entry.y, opacity, transform: `translateY(${translateY}px) scale(${scale})` }}>
        <MessageBody project={project} message={entry.message} />
      </div>
    );
  }

  const visualSide = visualSideFor(project, entry.message);
  const jojoMode = isJojoProject(project);

  return (
    <div
      className={`message-row message-${visualSide} ${jojoMode ? (entry.message.roleId === "jiaojiao" ? "message-self" : "message-other") : ""}`}
      style={{ top: entry.y, opacity, transform: `translateY(${translateY}px) scale(${scale})` }}
    >
      {visualSide === "left" ? <Avatar project={project} message={entry.message} /> : null}
      <MessageBody project={project} message={entry.message} />
      {visualSide === "right" ? <Avatar project={project} message={entry.message} /> : null}
    </div>
  );
}

function ChatAudio({ project, timeline }: { project: DramaProject; timeline: TimelineEntry[] }) {
  const sfx = project.sfx || {};
  const mix = project.audioMix || {};

  return (
    <>
      {sfx.ambient ? <Audio src={resolvePublicAssetPath(sfx.ambient)} volume={mix.ambientVolume ?? 0.035} loop /> : null}
      {timeline.map((entry) => {
        const message = entry.message;
        const sfxUrl = message.sendSfx && message.sendSfx !== "none" ? sfx[message.sendSfx] : undefined;
        const duration = Math.max(8, entry.endFrame - entry.startFrame);

        return (
          <Sequence key={`audio-${message.id}`} from={entry.startFrame} durationInFrames={duration}>
            {sfxUrl ? <Audio src={resolvePublicAssetPath(sfxUrl)} volume={mix.sfxVolume ?? 0.28} /> : null}
            {message.audioUrl ? <Audio src={resolvePublicAssetPath(message.audioUrl)} volume={mix.ttsVolume ?? 1} /> : null}
          </Sequence>
        );
      })}
    </>
  );
}

export function ChatDrama({ project = sampleProject }: ChatDramaProps) {
  const frame = useCurrentFrame();
  const timeline = buildTimeline(project);
  let foundActiveIndex = 0;
  for (let index = timeline.length - 1; index >= 0; index -= 1) {
    if (frame >= timeline[index].startFrame) {
      foundActiveIndex = index;
      break;
    }
  }
  const activeIndex = Math.max(0, foundActiveIndex);
  const activeEntry = timeline[activeIndex] ?? timeline[0];
  const previousEntry = timeline[Math.max(0, activeIndex - 1)] ?? activeEntry;
  const activeTarget = scrollTargetFor(project, timeline, activeEntry);
  const previousTarget = scrollTargetFor(project, timeline, previousEntry);
  const scrollProgress = interpolate(frame, [activeEntry.startFrame, activeEntry.startFrame + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const scrollY = previousTarget + (activeTarget - previousTarget) * easeOutCubic(scrollProgress);

  return (
    <AbsoluteFill className={`stage ${isJojoProject(project) ? "stage-jojo" : ""}`} style={{ width: project.canvas.width, height: project.canvas.height }}>
      <ChatAudio project={project} timeline={timeline} />
      <div className="soft-vignette" />
      <div className="chat-stream" style={{ transform: `translate3d(0, ${-scrollY}px, 0)` }}>
        {timeline.map((entry) => (
          <MessageRow key={entry.message.id} project={project} entry={entry} />
        ))}
      </div>
    </AbsoluteFill>
  );
}

export const chatDramaMetadata = {
  width: sampleProject.canvas.width,
  height: sampleProject.canvas.height,
  fps: sampleProject.fps,
  durationInFrames: getDurationInFrames(sampleProject)
};
