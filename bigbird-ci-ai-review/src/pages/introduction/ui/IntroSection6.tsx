import { cn } from "@/shared/lib";

import { type CssVariableStyle } from "../lib/css-variable-style";
import { CONTAINER, REVEAL } from "../lib/tw";
import { section6 } from "../model/data";

interface Props {
  className?: string;
}

// Horizontal pitch of a card including the gap (0 / 305 / 610 / 915).
const CARD_PITCH = 305;

type Group = (typeof section6.groups)[number];
type MobileSprite = (typeof section6.spriteMo)[number];

// PC and TAB/MO use different sprites. Coordinates differ per card, so the media
// queries alone cannot pick them; both sets go in as CSS variables and the
// styles' media queries choose.
function spriteStyle(
  group: Group,
  mo: MobileSprite,
  cardIndex: number,
): CssVariableStyle {
  const { sprite, spriteSize } = section6;
  return {
    "--s6-pc-img": `url(${sprite})`,
    "--s6-pc-size": `${spriteSize.w}px ${spriteSize.h}px`,
    "--s6-pc-pos": `-${cardIndex * CARD_PITCH}px -${group.spriteY}px`,
    "--s6-mo-img": `url(${mo.src})`,
    "--s6-mo-size": `${mo.w}px ${mo.h}px`,
    // The slice width (320) can differ from the card width, so x is centered.
    "--s6-mo-pos": `center -${mo.ys[cardIndex]}px`,
  };
}

export function IntroSection6({ className }: Props) {
  return (
    // py: the design's title y is 100 on PC / 80 on TAB / 60 on MO.
    <section className={cn("py-25 max-introtab:py-20 max-mo:py-15", className)}>
      <div className={CONTAINER}>
        {/* max-w-[626px] is the design's title width; mb is title end -> groups. */}
        <div
          className={cn(
            REVEAL,
            "mx-auto mb-15 flex max-w-[626px] flex-col items-center gap-4 text-center max-introtab:mb-8 max-mo:mb-8 max-mo:max-w-80",
          )}
          data-reveal=""
        >
          <h2 className="m-0 text-[32px] leading-[1.4] font-bold break-keep text-[#222] max-mo:text-2xl">
            {section6.titleParts.map((part) => (
              <span
                key={part.text}
                className={part.accent ? "text-[#4b80c2]" : undefined}
              >
                {part.text}
              </span>
            ))}
          </h2>
          <p className="m-0 text-lg leading-[1.4] font-medium break-keep text-[#868e96] max-mo:text-base">
            {section6.description}
          </p>
        </div>

        {section6.groups.map((group, groupIndex) => {
          const mobileSprite = section6.spriteMo[groupIndex];
          if (!mobileSprite) return null;
          return (
            <div
              key={group.heading}
              className={cn(
                REVEAL,
                // Gap between groups: 48 on PC, 32 on TAB; on MO the section gap.
                groupIndex > 0 && "mt-12 max-introtab:mt-8",
              )}
              data-reveal=""
            >
              {/* Band #4b80c2 = bigbird/primary, with no radius in the design; text
                #f8f9fa = bigbird/contents-bg, 18px on all 3 screens. */}
              <h3 className="m-0 mb-[21px] flex h-[45px] items-center justify-center bg-[#4b80c2] text-lg leading-[1.4] font-semibold text-[#f8f9fa] max-mo:mb-2">
                {group.heading}
              </h3>

              {/* TAB is 2 columns x 2 rows (row gap 8, column gap 20). MO is one
                column with the cards touching; the gap comes from each card's own
                inner padding. */}
              <ul className="m-0 flex list-none gap-5 p-0 max-introtab:flex-wrap max-introtab:gap-x-5 max-introtab:gap-y-2 max-mo:flex-col max-mo:gap-0">
                {group.cards.map((card, cardIndex) => (
                  // gap-4: only on PC is the image-to-text gap open; on TAB and MO
                  // the text sits against the image.
                  <li
                    key={card.no}
                    className="flex min-w-0 flex-1 flex-col gap-4 max-introtab:flex-[0_0_calc((100%-20px)/2)] max-introtab:gap-0 max-mo:w-full max-mo:flex-none"
                  >
                    {/* All 8 card images live in one sprite and each card shows only
                      its region. TAB and MO rearrange the images to 334x236, so
                      they cannot use the PC sprite. Background #f1f3f5 =
                      bigbird/forms (differs from the S1/S4 cards). */}
                    <div
                      className="h-[236px] w-full rounded-[4px] bg-[#f1f3f5] [background-image:var(--s6-pc-img)] [background-size:var(--s6-pc-size)] [background-position:var(--s6-pc-pos)] bg-no-repeat max-introtab:[background-image:var(--s6-mo-img)] max-introtab:[background-size:var(--s6-mo-size)] max-introtab:[background-position:var(--s6-mo-pos)]"
                      style={spriteStyle(group, mobileSprite, cardIndex)}
                    />
                    {/* The height is fixed at 158px so cards with 1-line and 2-line
                      descriptions have the same bottom space (only MO grows with
                      its content). */}
                    <div className="flex h-[158px] flex-col gap-3 px-2.5 py-5 max-mo:h-auto">
                      <p className="m-0 text-xl leading-none font-bold text-[#4b80c2] max-mo:text-base">
                        {card.no}
                      </p>
                      <div className="flex flex-col gap-2">
                        <h4 className="m-0 text-2xl leading-[1.4] font-bold break-keep text-[#222] max-mo:text-xl">
                          {card.title}
                        </h4>
                        {/* 16px on MO as well. */}
                        <p className="m-0 text-base leading-[1.4] font-medium break-keep text-[#868e96]">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
