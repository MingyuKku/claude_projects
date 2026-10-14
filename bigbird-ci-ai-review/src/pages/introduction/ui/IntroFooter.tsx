import { cn } from "@/shared/lib";

import { footer } from "../model/data";

interface Props {
  className?: string;
}

export function IntroFooter({ className }: Props) {
  return (
    // Padding follows the design tokens (62 / 80); PC sides are (1440-1200)/2 = 120.
    // border-top 2px #595a5d = gray/500.
    <footer
      className={cn(
        "flex flex-col items-start gap-5 border-t-2 border-[#595a5d] bg-[#222] px-30 pt-[62px] pb-20 max-introtab:px-10 max-mo:px-5",
        className,
      )}
    >
      <img
        className="h-[26.37px] w-[120.001px]"
        src={footer.logo}
        alt="Bigbird"
        loading="lazy"
      />

      <div className="flex w-full flex-col gap-5 pt-1">
        <ul className="m-0 flex list-none gap-5 p-0">
          {footer.links.map((link) => (
            <li key={link.href}>
              {/* inline-block so the line-height counts toward the 21px box height. */}
              <a
                className="inline-block text-sm leading-[21px] font-normal whitespace-nowrap text-[#a1a3a7] underline"
                href={link.href}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2.5">
          {/* The two lines are forced breaks in one text node in the design; each
              wraps again on narrow widths, so they are blocks left to auto-wrap. */}
          <p className="m-0 text-sm leading-[21px] font-normal text-white/30">
            {footer.companyLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
          <p className="m-0 text-sm leading-[21px] font-normal text-white/30">
            {footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
