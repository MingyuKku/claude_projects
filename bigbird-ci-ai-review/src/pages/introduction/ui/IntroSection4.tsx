import { cn } from "@/shared/lib";

import { type CssVariableStyle } from "../lib/css-variable-style";
import { CONTAINER, REVEAL } from "../lib/tw";
import { section4 } from "../model/data";

interface Props {
  className?: string;
}

type Card = (typeof section4.cards)[number];

// PC, TAB and MO each use their own sprite. Coordinates differ per card, so the
// media queries alone cannot pick them; all three sets go in as CSS variables
// and the styles choose.
//
// Only TAB is converted to %. Between 768 and 1239 the image box grows, but a px
// background would not grow with it and leave an empty area on the right (design
// QA). With % the same cell scales with the box, whatever its size:
//   size     = sprite / cell size (holds because the box keeps its aspect-ratio)
//   position = offset / (sprite - cell) - % is the share of the leftover space,
//              not an absolute distance
// PC's box is a fixed 794x400, and on MO the vertical pitch and box height differ,
// so those stay in px.
function spriteStyle(index: number, card: Card): CssVariableStyle {
  const { sprites, layout } = section4;
  // The MO layout has no rightX: its image is on top, so no horizontal offset.
  const spritePosition = (
    sizes: { pitch: number; rightX?: number },
    hasOffsetX: boolean,
  ) => {
    const x = hasOffsetX && card.reverse ? -(sizes.rightX ?? 0) : 0;
    return `${x}px -${index * sizes.pitch}px`;
  };
  const tab = layout.tab;
  const tabSprite = sprites.tab;
  const toPercent = (numerator: number, denominator: number) =>
    `${(numerator / denominator) * 100}%`;
  return {
    "--s4-pc-img": `url(${sprites.pc.src})`,
    "--s4-pc-size": `${sprites.pc.w}px ${sprites.pc.h}px`,
    "--s4-pc-pos": spritePosition(layout.pc, true),
    "--s4-tab-img": `url(${tabSprite.src})`,
    "--s4-tab-size": `${toPercent(tabSprite.w, tab.imgW)} ${toPercent(tabSprite.h, tab.imgH)}`,
    "--s4-tab-pos": [
      card.reverse ? toPercent(tab.rightX, tabSprite.w - tab.imgW) : "0%",
      toPercent(index * tab.pitch, tabSprite.h - tab.imgH),
    ].join(" "),
    "--s4-mo-img": `url(${sprites.mo.src})`,
    "--s4-mo-size": `${sprites.mo.w}px ${sprites.mo.h}px`,
    "--s4-mo-pos": spritePosition(layout.mo, false),
  };
}

export function IntroSection4({ className }: Props) {
  return (
    // py: the design's title y is 160 on PC / 80 on TAB / 60 on MO.
    <section className={cn("py-40 max-introtab:py-20 max-mo:py-15", className)}>
      <div className={CONTAINER}>
        {/* max-w is the design's title width. */}
        <div
          className={cn(
            REVEAL,
            "mx-auto flex max-w-[701px] flex-col items-center gap-4 text-center max-introtab:max-w-[688px] max-mo:max-w-80",
          )}
          data-reveal=""
        >
          {/* Only TAB breaks after "...과정을". Left to the width, "한곳에서" would
              climb onto line 1, so pre-line is on there; MO flows as one
              paragraph, so it is switched back off. */}
          <h2 className="m-0 text-[32px] leading-[1.4] font-bold break-keep text-[#222] max-introtab:whitespace-pre-line max-mo:text-2xl max-mo:whitespace-normal">
            {section4.titleParts.map((part) => (
              // Only "한곳에서 관리" is in the primary color.
              <span
                key={part.text}
                className={part.accent ? "text-[#4b80c2]" : undefined}
              >
                {part.text}
              </span>
            ))}
          </h2>
          {/* pre-line keeps the data file's line break on PC and TAB; MO wraps
              naturally. */}
          <p className="m-0 text-lg leading-[1.4] font-medium break-keep whitespace-pre-line text-[#868e96] max-mo:text-base max-mo:whitespace-normal">
            {section4.description}
          </p>
        </div>

        <ul className="m-0 mt-15 flex list-none flex-col gap-12 p-0 max-introtab:mt-8 max-mo:mt-8 max-mo:gap-8">
          {section4.cards.map((card, index) => (
            <li
              key={card.label}
              className={cn(
                REVEAL,
                // The TAB design is 768 wide with px values; since it must stretch
                // to 1239px they are converted to ratios of the 688 content width
                // (23 / 688). On MO the image goes on top and the text below.
                "flex items-center gap-15 pr-[34px] max-introtab:gap-[3.343%] max-introtab:pr-0 max-mo:flex-col max-mo:items-stretch max-mo:gap-6",
                // Cards 2 and 4 put the image on the right (not flipped on MO).
                card.reverse &&
                  "flex-row-reverse pr-0 pl-[34px] max-introtab:pl-0 max-mo:flex-col",
              )}
              data-reveal=""
            >
              {/* Card images are cut from the per-screen sprite (see the data
                  file). Video cards show only a screen-capture video centered on a
                  #fafafa background instead of the sprite.
                  aspect: the %-based background-size only holds if the ratio is fixed. */}
              <div
                className={cn(
                  "relative h-[400px] w-[794px] flex-none overflow-hidden rounded-[4px] bg-[#fafafa] bg-no-repeat",
                  "[background-image:var(--s4-pc-img)] [background-size:var(--s4-pc-size)] [background-position:var(--s4-pc-pos)]",
                  "max-introtab:aspect-[456/232] max-introtab:h-auto max-introtab:w-[66.279%] max-introtab:[background-image:var(--s4-tab-img)] max-introtab:[background-size:var(--s4-tab-size)] max-introtab:[background-position:var(--s4-tab-pos)]",
                  "max-mo:h-[232px] max-mo:w-full max-mo:[background-image:var(--s4-mo-img)] max-mo:[background-size:var(--s4-mo-size)] max-mo:[background-position:var(--s4-mo-pos)]",
                  card.video &&
                    "[background-image:none] max-introtab:[background-image:none] max-mo:[background-image:none]",
                )}
                role="img"
                aria-label={card.label}
                style={spriteStyle(index, card)}
              >
                {/* The video is wrapped because Safari does not clip the corners
                    of a video with its own radius. Size, border and shadow are the
                    design's and shrink 600 -> 320 -> 300 per screen; on TAB they
                    are ratios of the 456 image box, so they grow with it. */}
                {card.video && (
                  <span className="absolute top-1/2 left-1/2 h-[290px] w-[600px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[16px] border-2 border-white shadow-[0_4px_10px_rgba(0,0,0,0.2),0_4px_40px_rgba(75,128,194,0.2)] max-introtab:aspect-[320/154.67] max-introtab:h-auto max-introtab:w-[70.175%] max-introtab:rounded-[8.533px] max-introtab:border-[1.067px] max-introtab:shadow-[0_2.133px_5.333px_rgba(0,0,0,0.2),0_2.133px_21.333px_rgba(75,128,194,0.2)] max-mo:h-[145px] max-mo:w-[300px] max-mo:rounded-[8px] max-mo:border max-mo:shadow-[0_2px_5px_rgba(0,0,0,0.2),0_2px_20px_rgba(75,128,194,0.2)]">
                    {/* The video is 2.067:1 and the frame 2.069:1, so cover crops
                        nothing visible. The 4-6px black strip on the right of the
                        1920x926 original was trimmed and the 2x playback speed is
                        baked into the file. */}
                    <video
                      className="block size-full object-cover"
                      src={card.video}
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  </span>
                )}
              </div>

              {/* On MO the icon is pinned to the top right of the title instead of
                  sitting above the text: it leaves the flow, and only the label and
                  title wrap around it while the description spans the full 320px.
                  TAB width is 29.215% (201/688): letting flex:1 take all the
                  leftover would give 209 at 768, off the design. */}
              <div className="flex w-[312px] flex-col gap-8 max-introtab:w-[29.215%] max-introtab:flex-none max-introtab:gap-4 max-mo:relative max-mo:w-full max-mo:gap-0">
                {/* rounded: the image has its own #e4ecf5 background, so only the
                    corners are matched. On MO it is 60px, 5.5px below the label. */}
                <img
                  className="block size-20 rounded-[12px] max-introtab:size-10 max-mo:absolute max-mo:top-[5.5px] max-mo:right-0 max-mo:size-15"
                  src={card.icon}
                  alt=""
                  loading="lazy"
                />
                <div className="flex flex-col gap-3 max-introtab:gap-1">
                  {/* max-w-[248px] keeps clear of the 60px icon + 12px gap. */}
                  <p className="m-0 text-sm leading-[1.4] font-bold text-[#4b80c2] max-introtab:text-xs max-mo:max-w-[248px]">
                    {card.label}
                  </p>
                  {/* Line breaks follow the data file's \n on MO too (pre-line);
                      leaving it to the width breaks each card at a different spot. */}
                  <h3 className="m-0 text-2xl leading-[1.4] font-bold break-keep whitespace-pre-line text-[#222] max-introtab:text-lg max-mo:max-w-[248px]">
                    {card.title}
                  </h3>
                  {/* On MO it sits 12px below the title; the gap above is 4px, so
                      8px is added. */}
                  <p className="m-0 text-lg leading-[1.4] font-medium break-keep text-[#868e96] max-introtab:text-sm max-mo:mt-2">
                    {card.description}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
