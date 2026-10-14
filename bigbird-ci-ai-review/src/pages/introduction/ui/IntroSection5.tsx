import { cn } from "@/shared/lib";

import { CONTAINER, REVEAL } from "../lib/tw";
import { section5 } from "../model/data";

interface Props {
  className?: string;
}

// The card background photo is placed differently per column. Card 1 is scaled to
// 106.1% / 141.31% and cropped, card 2 stays close to its original ratio. On TAB
// and MO both cards simply fill the card (size-full + object-cover): the card
// ratio differs, so the PC placement would overlap the person with the text.
const CARD_BG = [
  "top-[-15.71%] left-[-6.03%] h-[141.31%] w-[106.1%]",
  "top-[-16.52%] left-0 h-[133.28%] w-[100.07%]",
];

export function IntroSection5({ className }: Props) {
  return (
    // py: the design's title y is 100 on PC / 80 on TAB / 60 on MO.
    <section className={cn("py-25 max-introtab:py-20 max-mo:py-15", className)}>
      <div className={CONTAINER}>
        {/* max-w-[563px] is the design's title width. */}
        <div
          className={cn(
            REVEAL,
            "mx-auto flex max-w-[563px] flex-col items-center gap-4 text-center max-mo:max-w-80",
          )}
          data-reveal=""
        >
          <h2 className="m-0 text-[32px] leading-[1.4] font-bold break-keep text-[#222] max-mo:text-2xl">
            {section5.titleParts.map((part) => (
              <span
                key={part.text}
                className={part.accent ? "text-[#4b80c2]" : undefined}
              >
                {part.text}
              </span>
            ))}
          </h2>
          <p className="m-0 text-lg leading-[1.4] font-medium break-keep text-[#868e96] max-mo:text-base">
            {section5.description}
          </p>
        </div>

        {/* gap: 20 on PC / 32 on TAB / 24 on MO. */}
        <div className="mt-15 flex items-start gap-5 max-introtab:mt-8 max-introtab:flex-col max-introtab:gap-8 max-mo:mt-8 max-mo:gap-6">
          {section5.columns.map((column, columnIndex) => (
            <div
              key={column.card.badge}
              className={cn(REVEAL, "min-w-0 flex-1 max-introtab:w-full")}
              data-reveal=""
            >
              {/* On MO the card is square (design QA). A fixed 320px height would
                  stretch the card vertically below 360px wide, and cover would
                  zoom the square photo to the height and crop its sides (the
                  person grows). A width-following ratio avoids that. */}
              <article className="group relative flex h-[443px] flex-col items-start justify-between overflow-hidden rounded-[4px] px-5 pt-5 pb-8 max-mo:aspect-square max-mo:h-auto">
                {/* ::after is a gradient darkening toward the bottom plus an
                    overall tone-down, as designed. */}
                <div
                  className="pointer-events-none absolute inset-0 overflow-hidden rounded-[4px] after:absolute after:inset-0 after:rounded-[4px] after:[background-image:linear-gradient(180deg,rgba(34,34,34,0)_41.196%,rgba(34,34,34,0.8)_76.479%),linear-gradient(90deg,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.2)_100%)] after:content-['']"
                  aria-hidden="true"
                >
                  {/* Hover scales only the background photo to 136.63% (1.288x of
                      106.1%). It is on only for PC width with a mouse: touch
                      devices keep the state stuck, and a narrowed desktop window
                      must match tablet (design QA). max-w-none: preflight's
                      img{max-width:100%} would shave the 106.1%. */}
                  <img
                    className={cn(
                      "absolute max-w-none object-cover transition-transform duration-500 ease-[ease] max-introtab:top-0 max-introtab:left-0 max-introtab:size-full",
                      CARD_BG[columnIndex],
                      "introtab:group-hover:scale-[1.288]",
                    )}
                    src={column.card.image}
                    alt=""
                    loading="lazy"
                  />
                </div>

                {/* The badge is Bold (700) on card 1 "브랜드형" and SemiBold (600)
                    on card 2 "공구형", on all 3 screens. Background #f1f3f5. */}
                <p
                  className={cn(
                    "relative m-0 rounded-[4px] bg-[#f1f3f5] px-4 py-2.5 text-sm leading-[1.4] text-[#222]",
                    columnIndex === 1 ? "font-semibold" : "font-bold",
                  )}
                >
                  {column.card.badge}
                </p>

                <div className="relative flex flex-col gap-4 pl-3 text-white">
                  {/* 20px on all 3 screens; it does not shrink per screen. */}
                  <h3 className="m-0 text-xl leading-[1.4] font-bold break-keep whitespace-pre-line text-white">
                    {column.card.title}
                  </h3>
                  {/* MO wraps naturally. The data file's breaks fit the PC/TAB
                      width (376); at MO's 268 they would give 4 lines and push the
                      text block up over the person's face. The design has 3. */}
                  <p className="m-0 text-base leading-[1.4] font-medium break-keep whitespace-pre-line max-mo:whitespace-normal">
                    {column.card.description}
                  </p>
                </div>
              </article>

              {/* gap-2 between items (design: items at y 0 / 127 / 254, 119+8 each).
                  mt: 32 on PC (card end 443 -> list start 475), 8 on TAB/MO. */}
              <ul className="m-0 mt-8 flex list-none flex-col gap-2 p-0 max-introtab:mt-2">
                {column.items.map((item) => (
                  // gap-[37px]: icon x=20-80, text x=117 on PC/TAB. On MO the
                  // icon sits above the text. border-b #dee2e6 = bigbird/line2.
                  <li
                    key={item.title}
                    className="flex min-h-[119px] items-center gap-[37px] border-b border-[#dee2e6] bg-white p-5 max-mo:min-h-0 max-mo:flex-col max-mo:items-start max-mo:gap-5 max-mo:px-2.5 max-mo:py-5"
                  >
                    <span className="flex size-15 flex-none items-center justify-center rounded-[4px] bg-[#f1f3f5]">
                      <img
                        className="size-8"
                        src={item.icon}
                        alt=""
                        loading="lazy"
                      />
                    </span>
                    <div className="flex min-w-0 flex-col gap-2">
                      <p className="m-0 text-sm leading-[1.4] font-semibold text-[#222]">
                        {item.title}
                      </p>
                      {/* 18px on all 3 screens. */}
                      <p className="m-0 text-lg leading-[1.4] font-medium break-keep text-[#222]">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
