import { Fragment } from "react";

import { cn } from "@/shared/lib";

import SCROLL_INDICATOR from "../assets/hero-scroll-indicator.svg";
import { type CssVariableStyle } from "../lib/css-variable-style";
import { hero } from "../model/data";

const VARIANT = {
  // Secondary CTA: white fill, #222 text, no icon.
  secondary: "bg-white text-[#222]",
  // Primary CTA: brand fill, white text, arrow on the right.
  primary: "bg-[#4b80c2] text-white",
  ghost: "",
} as const;

interface Props {
  /** Hero shrink progress, 0 to 1. */
  progress: number;
  className?: string;
}

export function IntroHero({ progress, className }: Props) {
  const style: CssVariableStyle = { "--hero-progress": progress };

  return (
    // The max shrink values live here; JS only passes --hero-progress (0-1).
    //
    // The shrunk video is 1200px wide. On a viewport narrower than 1200 the side
    // margins would go negative and the video would overflow, so max() clamps at 0.
    // The shrink effect is PC-only: TAB and MO stay full-bleed (0 below introtab).
    //
    // -mt-[72px] cancels the sticky header's 72px of flow so the hero starts at
    // y=0 (see IntroHeader). Height is the full viewport (h-dvh), not the design's
    // 836/600px: the requirement is an initial full bleed, so it must not leave a
    // gap on big monitors or crop on small screens.
    <section
      className={cn(
        "[--hero-max-bottom:68px] [--hero-max-inset:max(0px,calc((100%-1200px)/2))] [--hero-max-radius:32px]",
        "max-introtab:[--hero-max-bottom:0px] max-introtab:[--hero-max-inset:0px] max-introtab:[--hero-max-radius:0px]",
        "relative flex h-dvh items-center justify-center overflow-hidden",
        "-mt-[72px]",
        "ml-[calc(var(--hero-max-inset)*var(--hero-progress))]",
        "mr-[calc(var(--hero-max-inset)*var(--hero-progress))]",
        "mb-[calc(var(--hero-max-bottom)*var(--hero-progress))]",
        "rounded-[calc(var(--hero-max-radius)*var(--hero-progress))]",
        className,
      )}
      style={style}
    >
      <video
        className="absolute inset-0 size-full object-cover"
        poster={hero.poster}
        src={hero.video}
        autoPlay
        muted
        loop
        playsInline
      />

      {/* PC/TAB center the headline and the button group as one gap-20 block.
          MO is not a scaled-down version: the headline sits at 39% of the height
          and the buttons 20px from the bottom, with no fixed gap between them, so
          a flex gap cannot reproduce it and MO uses absolute positioning. */}
      <div className="relative z-[1] flex flex-col items-center gap-20 px-5 text-center max-mo:absolute max-mo:inset-0 max-mo:block max-mo:gap-0 max-mo:p-0">
        {/* Default Korean wrapping breaks mid-word ("더 정확 / 하게"). Lines are
            split by the spans below, and break-keep covers a row folding further
            on a narrow screen.
            On MO the heading is not width-limited to 219px: its 3 rows render
            218.5px wide, which sub-pixel rounding counts as overflow and folds an
            extra line. Only side margins are set and each row's nowrap holds it. */}
        <h1 className="m-0 text-[42px] leading-[1.4] font-bold break-keep text-white max-introtab:text-[32px] max-mo:absolute max-mo:top-[39%] max-mo:right-5 max-mo:left-5 max-mo:text-2xl max-mo:leading-[34px]">
          {hero.titleLines.map((line, i) => (
            <Fragment key={line}>
              {/* PC/TAB use 2 lines: row 1 alone, rows 2 and 3 run together. The
                  word space must be explicit because JSX drops whitespace between
                  spans; on MO every row owns a line, so it is hidden there. */}
              {i >= 2 && <span className="max-mo:hidden"> </span>}
              <span
                className={cn(
                  "inline max-mo:block max-mo:whitespace-nowrap",
                  i === 0 && "block",
                )}
              >
                {line}
              </span>
            </Fragment>
          ))}
        </h1>

        {/* MO: two stacked 48px buttons 8px apart, 20px from the bottom. */}
        <div className="flex items-center gap-4 max-mo:absolute max-mo:right-5 max-mo:bottom-5 max-mo:left-5 max-mo:w-auto max-mo:max-w-none max-mo:flex-col max-mo:items-stretch max-mo:gap-2">
          {hero.buttons.map((button) => (
            <a
              key={button.label}
              className={cn(
                "flex h-12 items-center justify-center gap-2 rounded-[4px] px-6 text-base leading-6 font-medium whitespace-nowrap no-underline",
                VARIANT[button.variant],
              )}
              href={button.href}
              download={button.download}
            >
              {button.label}
              {button.icon && (
                // The icon slot is 16x16 (that width makes the 159px button) and
                // the arrow graphic is 5.99x10.665 inside it. The svg uses
                // preserveAspectRatio="none", so slot and graphic are sized apart.
                <span className="flex size-4 flex-none items-center justify-center">
                  <img
                    className="block h-[10.665px] w-[5.99px]"
                    src={button.icon}
                    alt=""
                  />
                </span>
              )}
            </a>
          ))}
        </div>
      </div>

      {/* The design's bottom padding is 83px on PC and TAB. The designer's
          "68px bottom margin" refers to the shrunk video, not this (it is
          --hero-max-bottom). The indicator does not exist on MO. */}
      <img
        className="absolute bottom-[83px] left-1/2 z-[1] size-[60px] -translate-x-1/2 max-mo:hidden"
        src={SCROLL_INDICATOR}
        alt=""
      />
    </section>
  );
}
