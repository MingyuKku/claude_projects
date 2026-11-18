import { useEffect, useRef } from "react";

import { cn } from "@/shared/lib/utils";

import type { ComponentProps } from "react";

// 레퍼런스: Aceternity UI wavy-background. 외부 의존성 없이 사인파 합성으로 같은 울렁임을 그림.
// 굵은 선을 겹쳐 그린 뒤 캔버스째 블러로 번지게 해, 겹친 곳이 섞이며 부드러운 빛줄기처럼 보이게 함.
// 색은 Tailwind 토큰(색 클래스)을 마운트 때 계산값으로 풀어 씀. 캔버스는 var()를 못 읽음.
// 직접 조절해 보는 값. 컴포넌트 props로도 같은 이름으로 덮어쓸 수 있음(<WavyBackground tiltDeg={20} />).
const WAVE_SETTINGS = {
  /** 파도 무리 전체의 기울기(도). 양수면 오른쪽이 올라가는 우상향, 0이면 수평. */
  tiltDeg: 20,
  /** 파도 무리의 세로 중심 위치 비율(0=위, 0.5=세로 중앙, 1=아래). */
  centerY: 0.5,
  /** 움직임 속도 배율. 1이 기본, 클수록 빠름. */
  speed: 1.3,
  /** 번짐 정도(px). 클수록 흐릿함. */
  blurPx: 36,
  /** 채도 배율. 1이 원색 그대로, 작을수록 차분함. */
  saturation: 0.75,
  /** 초당 최대 그리기 횟수. rAF는 화면 주사율(120Hz면 초당 120번)로 불리는데, 번지는 느린 움직임이라 30이면 충분하고 부담이 줄어듦. */
  maxFps: 30,
};

// rAF 타임스탬프는 주사율 간격(60Hz에서 16.7ms)으로 떨어지므로, 목표 간격보다 이만큼 일찍 와도 그려서 한 프레임씩 더 건너뛰지 않게 함.
const FRAME_TOLERANCE_MS = 4;

interface WaveLayer {
  /** 색을 정하는 Tailwind 텍스트 색 클래스. */
  colorClass: string;
  alpha: number;
  /** 선 굵기(px). */
  lineWidth: number;
  /** 파도 중심선이 무리 중심(centerY)에서 벗어난 정도(높이 대비 비율). 음수면 위, 양수면 아래. */
  offset: number;
  /** 진폭(높이 대비 비율). */
  amplitude: number;
  /** 가로 한 화면에 들어가는 파장 수. */
  frequency: number;
  /** 초당 위상 변화(라디안). 음수면 반대 방향. */
  speed: number;
  phase: number;
}

const WAVE_LAYERS: WaveLayer[] = [
  {
    colorClass: "text-blue-300",
    alpha: 0.28,
    lineWidth: 460,
    offset: -0.07,
    amplitude: 0.16,
    frequency: 1.0,
    speed: 0.55,
    phase: 0,
  },
  {
    colorClass: "text-blue-100",
    alpha: 0.6,
    lineWidth: 235,
    offset: 0.07,
    amplitude: 0.15,
    frequency: 0.9,
    speed: 0.7,
    phase: 4,
  },
];

const STEP_PX = 6;

// x는 회전한 좌표계의 가로 위치(중심이 0). 반환값은 파도 무리 중심선에서의 세로 거리(px).
function waveOffsetY(
  layer: WaveLayer,
  x: number,
  width: number,
  height: number,
  time: number,
) {
  const angle =
    ((x + width / 2) / width) * Math.PI * 2 * layer.frequency +
    layer.phase +
    time * layer.speed;
  // 두 번째 사인파(다른 파장·속도)를 섞어 규칙적인 반복처럼 보이지 않게 함.
  const wobble =
    Math.sin(angle) + 0.5 * Math.sin(angle * 0.47 + time * layer.speed * 0.6);
  return height * (layer.offset + (layer.amplitude * wobble) / 1.5);
}

interface DrawOptions {
  colors: string[];
  width: number;
  height: number;
  time: number;
  tiltDeg: number;
  centerY: number;
}

function drawWaves(
  ctx: CanvasRenderingContext2D,
  { colors, width, height, time, tiltDeg, centerY }: DrawOptions,
) {
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  // 무리 중심으로 옮겨 기울임. 캔버스 y는 아래로 늘어나므로 우상향은 반시계(-) 회전.
  ctx.translate(width / 2, height * centerY);
  ctx.rotate((-tiltDeg * Math.PI) / 180);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // 기울여도 모서리가 비지 않게 대각선의 두 배 폭으로 그림.
  const halfSpan = Math.hypot(width, height);
  WAVE_LAYERS.forEach((layer, index) => {
    ctx.beginPath();
    for (let x = -halfSpan; x <= halfSpan; x += STEP_PX) {
      const y = waveOffsetY(layer, x, width, height, time);
      if (x === -halfSpan) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.globalAlpha = layer.alpha;
    ctx.lineWidth = layer.lineWidth;
    ctx.strokeStyle = colors[index] ?? "transparent";
    ctx.stroke();
  });
  ctx.restore();
}

// 색 클래스를 임시 요소에 달아 계산된 색(oklch 등)을 읽음.
function resolveColors(parent: HTMLElement) {
  return WAVE_LAYERS.map((layer) => {
    const probe = document.createElement("span");
    probe.className = layer.colorClass;
    parent.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
}

interface WavyBackgroundProps
  extends ComponentProps<"canvas">, Partial<typeof WAVE_SETTINGS> {}

// 배경 장식용 캔버스. 부모를 채우도록 absolute로 둠.
// 모션 줄이기 설정이면 한 프레임만 그리고 멈춤. 탭이 가려지면 rAF가 멈춰 비용이 들지 않음.
export function WavyBackground({
  tiltDeg = WAVE_SETTINGS.tiltDeg,
  centerY = WAVE_SETTINGS.centerY,
  speed = WAVE_SETTINGS.speed,
  blurPx = WAVE_SETTINGS.blurPx,
  saturation = WAVE_SETTINGS.saturation,
  maxFps = WAVE_SETTINGS.maxFps,
  className,
  style,
  ...props
}: WavyBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !canvas.parentElement) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const colors = resolveColors(canvas.parentElement);
    let width = 0;
    let height = 0;
    let frameId = 0;
    let lastRenderedAt = Number.NEGATIVE_INFINITY;
    const frameInterval = 1000 / maxFps;
    const startedAt = performance.now();

    const render = (now: number) => {
      drawWaves(ctx, {
        colors,
        width,
        height,
        time: ((now - startedAt) / 1000) * speed,
        tiltDeg,
        centerY,
      });
    };
    const loop = (now: number) => {
      if (now - lastRenderedAt >= frameInterval - FRAME_TOLERANCE_MS) {
        render(now);
        lastRenderedAt = now;
      }
      frameId = requestAnimationFrame(loop);
    };
    const stop = () => cancelAnimationFrame(frameId);
    const start = () => {
      stop();
      lastRenderedAt = Number.NEGATIVE_INFINITY;
      if (reducedMotion.matches) render(startedAt);
      else frameId = requestAnimationFrame(loop);
    };

    // 블러로 번지는 그림이라 해상도를 올릴 필요가 없어 CSS 픽셀 그대로 그림(DPR 1).
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      width = canvas.width = Math.round(entry.contentRect.width);
      height = canvas.height = Math.round(entry.contentRect.height);
      start();
    });
    observer.observe(canvas);
    reducedMotion.addEventListener("change", start);

    return () => {
      stop();
      observer.disconnect();
      reducedMotion.removeEventListener("change", start);
    };
  }, [speed, tiltDeg, centerY, maxFps]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 size-full",
        className,
      )}
      style={{ filter: `blur(${blurPx}px) saturate(${saturation})`, ...style }}
      {...props}
    />
  );
}
