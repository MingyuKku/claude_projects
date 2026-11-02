import { CalendarIcon } from "lucide-react";
import { CalendarDay } from "react-day-picker";
import { ko } from "react-day-picker/locale";

import carouselCardImage from "@/shared/assets/img/sample/carousel-card.png";
import photo1 from "@/shared/assets/img/sample/photo-1.png";
import photo2 from "@/shared/assets/img/sample/photo-2.png";
import photo3 from "@/shared/assets/img/sample/photo-3.png";
import { DatePicker } from "@/shared/components/date-picker";
import { cn } from "@/shared/lib/utils";
import { Calendar, CalendarDayButton } from "@/shared/ui/calendar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/shared/ui/carousel";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/ui/pagination";
import { ScrollArea, ScrollBar } from "@/shared/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Separator } from "@/shared/ui/separator";

import { PreviewMatrix, previewStateProps } from "../PreviewMatrix";
import { Section } from "../Section";

import type { PreviewState } from "../PreviewMatrix";
import type { ComponentProps } from "react";

const ERROR_TEXT = "Your one-time password must be 6 characters.";

// ---------- Scroll Area ----------
const TAGS = Array.from({ length: 23 }, (_, i) => `v1.2.0-beta.${50 - i}`);
const PHOTOS = [
  { src: photo1, author: "Ornella Binni" },
  { src: photo2, author: "Tom Byrom" },
  { src: photo3, author: "Vladimir Malyavko" },
];

function ScrollAreaExamples() {
  return (
    <div className="flex flex-wrap items-start gap-15">
      <figure className="flex flex-col items-center gap-5">
        <ScrollArea
          type="always"
          className="h-72 w-48 rounded-md border bg-popover"
        >
          <div className="flex flex-col gap-4 p-4">
            <p className="text-sm leading-5 font-medium">Tags</p>
            <ul>
              {TAGS.map((tag, i) => (
                <li key={tag}>
                  <p
                    className={cn(
                      "text-sm leading-5",
                      i === 0 ? "pb-2" : "py-2",
                    )}
                  >
                    {tag}
                  </p>
                  <Separator />
                </li>
              ))}
            </ul>
          </div>
        </ScrollArea>
        <figcaption className="text-xs leading-5 text-muted-foreground">
          Vertical
        </figcaption>
      </figure>
      <figure className="flex flex-col items-center gap-5">
        <ScrollArea type="always" className="w-94 rounded-md border">
          <div className="flex gap-4 p-4">
            {PHOTOS.map((photo) => (
              <div
                key={photo.author}
                className="flex w-37.5 shrink-0 flex-col gap-1.5"
              >
                <img
                  src={photo.src}
                  alt={photo.author}
                  className="aspect-3/4 w-full rounded-md object-cover"
                />
                <p className="flex gap-0.5 text-xs leading-5 whitespace-nowrap">
                  <span className="text-muted-foreground">Photo by</span>
                  <span className="font-semibold">{photo.author}</span>
                </p>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <figcaption className="text-xs leading-5 text-muted-foreground">
          Horizontal
        </figcaption>
      </figure>
    </div>
  );
}

// Figma Scroll-area Base / Scrollbar(161:1756): 행 = 방향, 열 = Size.
function ScrollBarMatrix() {
  return (
    <PreviewMatrix
      rows={["Vertical", "Horizontal"] as const}
      columns={["medium", "small"] as const}
      rowLabel={(row) => row}
      columnLabel={(column) => `Size: ${column}`}
      renderCell={(row, column) => {
        const size = column === "medium" ? "md" : "sm";
        if (row === "Vertical") {
          return (
            <ScrollArea
              type="always"
              className="h-30 w-16"
              scrollBarSize={size}
            >
              <div className="h-60" />
            </ScrollArea>
          );
        }
        return (
          <ScrollArea type="always" className="w-30">
            <div className="h-4 w-60" />
            <ScrollBar orientation="horizontal" size={size} />
          </ScrollArea>
        );
      }}
    />
  );
}

// ---------- Carousel ----------
const SLIDES = ["1", "2", "3", "4", "5"];
const CAROUSEL_STATES = ["default", "hover", "disabled", "focus"] as const;

function SlideCard({
  index,
  className,
}: {
  index: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-lg border bg-card p-6 shadow-xs",
        className,
      )}
    >
      <span className="text-4xl leading-10 font-semibold tracking-[-0.075em]">
        {index}
      </span>
    </div>
  );
}

type CarouselSize = "md" | "sm";
type CarouselOrientation = "Horizontal" | "Vertical";

function CarouselSample({
  orientation,
  size,
}: {
  orientation: CarouselOrientation;
  size: CarouselSize;
}) {
  const isVertical = orientation === "Vertical";
  const itemBasis = size === "md" ? "basis-full" : "basis-1/3";
  const cardSize = {
    Horizontal: { md: "size-80", sm: "size-40" },
    Vertical: { md: "h-80 w-full", sm: "h-30 w-full" },
  }[orientation][size];
  return (
    <div className={isVertical ? "py-12" : "px-12"}>
      <Carousel
        orientation={isVertical ? "vertical" : "horizontal"}
        className={size === "sm" && !isVertical ? "w-128" : "w-80"}
      >
        <CarouselContent
          className={cn(isVertical && (size === "md" ? "h-84" : "h-102"))}
        >
          {SLIDES.map((slide) => (
            <CarouselItem key={slide} className={itemBasis}>
              <SlideCard index={slide} className={cardSize} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}

function CarouselButtonMatrix() {
  return (
    <PreviewMatrix
      rows={CAROUSEL_STATES}
      columns={["Button"] as const}
      renderCell={(state: PreviewState) => (
        <Carousel>
          <CarouselPrevious
            className="static translate-y-0"
            disabled={state === "disabled"}
            {...previewStateProps(state)}
          />
        </Carousel>
      )}
    />
  );
}

function CarouselCardMatrix() {
  return (
    <PreviewMatrix
      rows={["default"] as const}
      columns={[":index", ":image"] as const}
      rowLabel={() => ""}
      renderCell={(_, column) =>
        column === ":index" ? (
          <SlideCard index="1" className="size-80" />
        ) : (
          <div className="w-80 overflow-hidden rounded-lg border bg-card shadow-xs">
            <img
              src={carouselCardImage}
              alt=""
              className="aspect-square w-full object-cover"
            />
          </div>
        )
      }
    />
  );
}

// ---------- Calendar ----------
// Figma 예시 기준일: 2026년 11월, 오늘 = 11월 4일.
const SAMPLE_MONTH = new Date(2026, 10, 1);
const SAMPLE_TODAY = new Date(2026, 10, 4);
const SAMPLE_RANGE = {
  from: new Date(2026, 10, 17),
  to: new Date(2026, 11, 6),
};
// Figma는 캡션만 한국어(2026년 11월), 요일은 영문 두 글자(Su Mo …).
const sampleCalendarProps = {
  locale: ko,
  today: SAMPLE_TODAY,
  defaultMonth: SAMPLE_MONTH,
  formatters: {
    formatWeekdayName: (date: Date) =>
      date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2),
  },
} satisfies ComponentProps<typeof Calendar>;
const PRESETS = ["Today", "Tomorrow", "In 3 days", "In a week"];

function CalendarExamples() {
  return (
    <div className="flex flex-wrap items-start gap-5">
      <figure className="flex flex-col items-center gap-5">
        <figcaption className="text-xs leading-5 text-muted-foreground">
          Default
        </figcaption>
        <Calendar {...sampleCalendarProps} />
      </figure>
      <figure className="flex flex-col items-center gap-5">
        <figcaption className="text-xs leading-5 text-muted-foreground">
          Date Range
        </figcaption>
        <Calendar
          {...sampleCalendarProps}
          mode="range"
          numberOfMonths={2}
          defaultMonth={SAMPLE_MONTH}
          selected={SAMPLE_RANGE}
        />
      </figure>
      <figure className="flex flex-col items-center gap-5">
        <figcaption className="text-xs leading-5 text-muted-foreground">
          With Presets
        </figcaption>
        <div className="flex w-71 flex-col gap-2 rounded-lg border bg-popover p-2">
          <Select>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent position="popper">
              {PRESETS.map((preset) => (
                <SelectItem key={preset} value={preset}>
                  {preset}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Figma 284px 상자 안에 7칸이 들어가도록 칸을 34px로 줄임. */}
          <Calendar
            {...sampleCalendarProps}
            className="w-full p-2 [--cell-size:--spacing(8.5)]"
          />
        </div>
      </figure>
    </div>
  );
}

// Figma Calenday Base(6777:63594): 행 = 상태, 열 = Default / Range(Left·Central·Right) / Selected.
const DAY_ROWS = ["default", "hover-active", "disabled", "focus"] as const;
const DAY_COLUMNS = [
  "Default",
  "Range · Left",
  "Range",
  "Range · Right",
  "Selected",
] as const;
const SAMPLE_DAY = new CalendarDay(new Date(2026, 10, 2), SAMPLE_MONTH);

type DayRow = (typeof DAY_ROWS)[number];
type DayColumn = (typeof DAY_COLUMNS)[number];

function hasDayCell(row: DayRow, column: DayColumn) {
  if (column === "Default") return true;
  if (column === "Selected") return row === "default" || row === "focus";
  return row === "default" || row === "disabled";
}

function DayCell({ row, column }: { row: DayRow; column: DayColumn }) {
  if (!hasDayCell(row, column)) return null;
  const isRange = column.startsWith("Range");
  const state = row === "hover-active" ? "hover" : row;
  // 날짜 칸 크기(--cell-size)는 Calendar 루트가 정하므로, 칸만 따로 그릴 때도 같은 값을 줌.
  return (
    <div className="w-(--cell-size) [--cell-size:--spacing(9)]">
      <CalendarDayButton
        day={SAMPLE_DAY}
        modifiers={{
          focused: false,
          selected: column === "Selected",
          range_middle: isRange,
        }}
        disabled={row === "disabled"}
        className={cn(
          row === "disabled" && "opacity-50",
          column === "Range · Left" && "data-[selection=middle]:rounded-l-md",
          column === "Range · Right" && "data-[selection=middle]:rounded-r-md",
        )}
        {...previewStateProps(state)}
      >
        2
      </CalendarDayButton>
    </div>
  );
}

// Figma Date Picker(6901:49560): 행 = 상태, 열 = Default / Destructive.
const DATE_PICKER_ROWS = [
  "default",
  "hover",
  "focus",
  "filled",
  "disabled",
] as const;

// ---------- Pagination ----------
type PageItem = number | "ellipsis";
const PAGINATION_EXAMPLES: {
  type: string;
  pages: PageItem[];
  active: number;
}[] = [
  { type: "Start", pages: [1, 2, 3, 4, 5, 6, "ellipsis"], active: 1 },
  { type: "Middle", pages: [1, 2, 3, 4, 5, 6, "ellipsis"], active: 4 },
  { type: "End", pages: ["ellipsis", 3, 4, 5, 6, 7, 8], active: 8 },
];

function PaginationExamples() {
  return (
    <PreviewMatrix
      rows={PAGINATION_EXAMPLES.map((example) => example.type)}
      columns={["Pagination"] as const}
      rowLabel={(row) => row}
      columnLabel={() => ""}
      renderCell={(row) => {
        const example = PAGINATION_EXAMPLES.find((item) => item.type === row);
        if (!example) return null;
        const isFirst = example.active === 1;
        return (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={isFirst || undefined}
                  tabIndex={isFirst ? -1 : undefined}
                >
                  이전
                </PaginationPrevious>
              </PaginationItem>
              {example.pages.map((page, i) => (
                <PaginationItem
                  key={page === "ellipsis" ? `ellipsis-${i}` : page}
                >
                  {page === "ellipsis" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink href="#" isActive={page === example.active}>
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext href="#">다음</PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        );
      }}
    />
  );
}

// Figma Pagination Base / Item(6901:49858). Figma 열 라벨은 위치가 뒤바뀌어 있어 실제 모양 기준으로 붙임.
const PAGE_ITEM_STATES = ["default", "hover", "focus", "disabled"] as const;
const PAGE_ITEM_COLUMNS = [
  "Selected: False",
  "Selected: True",
  "Ellipsis",
] as const;

function PaginationItemMatrix() {
  return (
    <PreviewMatrix
      rows={PAGE_ITEM_STATES}
      columns={PAGE_ITEM_COLUMNS}
      renderCell={(state, column) => {
        if (column === "Ellipsis") {
          return state === "default" ? <PaginationEllipsis /> : null;
        }
        return (
          <PaginationLink
            href="#"
            isActive={column === "Selected: True"}
            aria-disabled={state === "disabled" || undefined}
            {...previewStateProps(state)}
          >
            1
          </PaginationLink>
        );
      }}
    />
  );
}

export function NavigationSection() {
  return (
    <>
      <Section title="Scroll Area (4733:8422)">
        <div className="flex flex-col gap-10">
          <ScrollAreaExamples />
          <ScrollBarMatrix />
        </div>
      </Section>
      <Section title="Carousel (4732:18999)">
        <div className="flex flex-col gap-10">
          <PreviewMatrix
            rows={["Horizontal", "Vertical"] as const}
            columns={["md", "sm"] as const}
            rowLabel={(row) => row}
            columnLabel={(column) => `Size: ${column}`}
            renderCell={(orientation, size) => (
              <CarouselSample orientation={orientation} size={size} />
            )}
          />
          <div className="flex flex-wrap items-start gap-10">
            <CarouselButtonMatrix />
            <CarouselCardMatrix />
          </div>
        </div>
      </Section>
      <Section title="Calendar (6777:63386)">
        <div className="flex flex-col gap-10">
          <CalendarExamples />
          <PreviewMatrix
            rows={DAY_ROWS}
            columns={DAY_COLUMNS}
            renderCell={(row, column) => <DayCell row={row} column={column} />}
          />
          <PreviewMatrix
            rows={DATE_PICKER_ROWS}
            columns={["Default", "Destructive"] as const}
            renderCell={(row, column) => (
              <DatePicker
                className="w-96"
                label="Label"
                helpText="Enter your email address"
                errorText={column === "Destructive" ? ERROR_TEXT : undefined}
                placeholder="Pick a date"
                icon={<CalendarIcon />}
                value={row === "filled" ? SAMPLE_RANGE.from : undefined}
                disabled={row === "disabled"}
                {...previewStateProps(row === "filled" ? "default" : row)}
              />
            )}
          />
        </div>
      </Section>
      <Section title="Pagination (6901:49805)">
        <div className="flex flex-col gap-10">
          <PaginationExamples />
          <PaginationItemMatrix />
        </div>
      </Section>
    </>
  );
}
