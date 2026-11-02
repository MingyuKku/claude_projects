import {
  ArrowUp,
  CheckIcon,
  ChevronDown,
  ChevronRightIcon,
  Folder,
  HandCoins,
  Paperclip,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { ko } from "react-day-picker/locale";

import playIcon from "@/shared/assets/img/chat/play.svg";
import instagramIcon from "@/shared/assets/img/platform/instagram.svg";
import sampleThumbnail from "@/shared/assets/img/sample/thumbnail.jpg";
import { ButtonGroup } from "@/shared/components/button-group";
import { ButtonList } from "@/shared/components/button-list";
import { FloatingButton } from "@/shared/components/floating-button";
import {
  ChatbotTextField,
  PriceField,
  ReplyTextField,
  TextField,
  TextFieldPanel,
} from "@/shared/components/text-field";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/command";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  menuContentClassName,
  menuItemClassName,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";

import { PreviewMatrix, previewStateProps } from "../PreviewMatrix";
import { Section } from "../Section";

import type { ReactNode } from "react";

// Figma 문서의 샘플 문구
const PLACEHOLDER = "Place Holder";
const EXAMPLE_PLACEHOLDER =
  "ex) 스킨케어 신제품 홍보, 20대 여성 타깃, 인스타 중심";
const TYPING = "텍스트 입력중..";
const FILLED = "텍스트 입력 완료";
const FULL = "텍스트 입력 완료 ".repeat(40).trim();
const MAX_LENGTH = 3000;
const DROP_TITLE = "파일을 여기에 드롭하세요.";
const DROP_DESCRIPTION = "(30MB이하, JPG, JPEG, PNG, WebP, MP4만 가능)";
const REPLY_RECIPIENT = "빅버드 담당자에게 답장";
const REPLY_QUOTE =
  "안녕하세요, 빅버드 담당자입니다. 확인해보니 시스템 이슈로 인해 리포트 발행이 좀 지연되었습니다. 안녕하세요, 빅버드 담당자입니다. 확인해보니 시스템 이슈로 인해 리포트 발행이 좀 지연되었습니다.";

const FIELD_STATES = [
  "Default",
  "Focus-Empty",
  "Focus-Filled",
  "Filled",
] as const;
const WIDE_STATES = [...FIELD_STATES, "Filled-Full", "Drag-Drop"] as const;
const REPLY_STATES = [...FIELD_STATES, "Filled-Full"] as const;
const PRICE_STATES = [...FIELD_STATES, "Disabled"] as const;

type WideState = (typeof WIDE_STATES)[number];

const valueOf = (state: WideState) =>
  ({
    Default: "",
    "Focus-Empty": "",
    "Focus-Filled": TYPING,
    Filled: FILLED,
    "Filled-Full": FULL,
    "Drag-Drop": "",
  })[state];

const focusOf = (state: WideState) =>
  previewStateProps(state.startsWith("Focus") ? "focus" : "default");

function Thumbnail({
  isVideo = false,
  className,
}: {
  isVideo?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-md border",
        className,
      )}
    >
      <img src={sampleThumbnail} alt="" className="size-full object-cover" />
      {isVideo && (
        <img
          src={playIcon}
          alt=""
          className="absolute top-1/2 left-1/2 size-6 -translate-1/2"
        />
      )}
    </span>
  );
}

const THUMBNAIL_IDS = ["video", "photo-1", "photo-2", "photo-3"] as const;

function Thumbnails({
  count,
  className,
}: {
  count: number;
  className: string;
}) {
  return THUMBNAIL_IDS.slice(0, count).map((id) => (
    <Thumbnail key={id} isVideo={id === "video"} className={className} />
  ));
}

function PlatformButton() {
  return (
    <Button variant="outline" size="sm" className="pl-3">
      플랫폼
      <ChevronDown />
    </Button>
  );
}

function AttachButton() {
  return (
    <Button variant="outline-muted" size="sm" className="pl-3">
      <Paperclip />
      첨부
    </Button>
  );
}

function SendButton({ isDestructive = false }: { isDestructive?: boolean }) {
  return (
    <Button size="sm" destructive={isDestructive}>
      {isDestructive ? "거절" : "전송"}
    </Button>
  );
}

function DefaultTypeField({
  state,
  isWide,
}: {
  state: WideState;
  isWide: boolean;
}) {
  const submit = isWide ? (
    <Button size="sm">
      <Search />
      인플루언서 탐색
    </Button>
  ) : (
    <Button size="icon-sm" aria-label="검색">
      <Search />
    </Button>
  );
  return (
    <TextField
      className="w-174.5"
      isWide={isWide}
      leading={<PlatformButton />}
      submit={submit}
      placeholder={state === "Focus-Empty" ? EXAMPLE_PLACEHOLDER : PLACEHOLDER}
      value={valueOf(state)}
      readOnly
      isDragging={state === "Drag-Drop"}
      dropTitle={DROP_TITLE}
      dropDescription={DROP_DESCRIPTION}
      aria-label="Text Field Default"
      {...focusOf(state)}
    />
  );
}

function CountTypeField({
  state,
  isWide,
}: {
  state: WideState;
  isWide: boolean;
}) {
  const submit = isWide ? (
    <SendButton />
  ) : (
    <Button size="icon-sm" aria-label="전송">
      <ArrowUp />
    </Button>
  );
  return (
    <TextField
      className="w-174.5"
      variant="count"
      isWide={isWide}
      leading={<AttachButton />}
      submit={submit}
      attachments={<Thumbnails count={3} className="size-20" />}
      placeholder={PLACEHOLDER}
      maxLength={MAX_LENGTH}
      value={valueOf(state)}
      readOnly
      isDragging={state === "Drag-Drop"}
      dropTitle={DROP_TITLE}
      dropDescription={DROP_DESCRIPTION}
      aria-label="Text Field Text Count"
      {...focusOf(state)}
    />
  );
}

const TYPE_COLUMNS = ["Default", "Text Count"] as const;

function TextFieldDefaultSection() {
  return (
    <Section title="Text Field / Default (5065:84064)">
      {[false, true].map((isWide) => (
        <div key={String(isWide)} className="flex flex-col gap-3">
          <span className="text-xs font-medium text-muted-foreground">
            Wide={isWide ? "True" : "False"}
          </span>
          <PreviewMatrix
            rows={isWide ? WIDE_STATES : FIELD_STATES}
            columns={TYPE_COLUMNS}
            rowLabel={(row) => row}
            renderCell={(state, type) =>
              type === "Default" ? (
                <DefaultTypeField state={state} isWide={isWide} />
              ) : (
                <CountTypeField state={state} isWide={isWide} />
              )
            }
          />
        </div>
      ))}
    </Section>
  );
}

function TextFieldReplySection() {
  return (
    <Section title="Text Field / Reply (6766:52659)">
      <PreviewMatrix
        rows={REPLY_STATES}
        columns={["Thumbnail=False", "Thumbnail=True"] as const}
        rowLabel={(row) => row}
        renderCell={(state, column) => (
          <ReplyTextField
            className="w-[739px]"
            recipient={REPLY_RECIPIENT}
            quote={REPLY_QUOTE}
            thumbnail={
              column === "Thumbnail=True" && <Thumbnail className="size-10.5" />
            }
            closeLabel="답장 취소"
            submit={<SendButton />}
            placeholder="답장 내용을 입력하세요. (최대 3,000자)"
            maxLength={MAX_LENGTH}
            value={valueOf(state)}
            readOnly
            aria-label="답장 내용"
            {...focusOf(state)}
          />
        )}
      />
    </Section>
  );
}

function TextFieldPriceSection() {
  return (
    <Section title="Text Field / Price (6958:57035)">
      <PreviewMatrix
        rows={PRICE_STATES}
        columns={["Price"] as const}
        rowLabel={(row) => row}
        renderCell={(state) => (
          <PriceField
            className="w-85.75"
            label="Label"
            unit="원"
            placeholder="금액을 입력하세요."
            value={
              state === "Focus-Filled" || state === "Filled"
                ? "금액을 입력하세요."
                : ""
            }
            readOnly
            disabled={state === "Disabled"}
            {...previewStateProps(
              state.startsWith("Focus") ? "focus" : "default",
            )}
          />
        )}
      />
    </Section>
  );
}

function TextFieldChatbotSection() {
  return (
    <Section title="Text Field / Chatbot (6977:43438)">
      <PreviewMatrix
        rows={WIDE_STATES}
        columns={["Chatbot"] as const}
        rowLabel={(row) => row}
        renderCell={(state) => (
          <ChatbotTextField
            className="w-69.5"
            attachLabel="파일 첨부"
            submitLabel="전송"
            attachments={
              state === "Filled-Full" && (
                <Thumbnails count={4} className="aspect-square w-full" />
              )
            }
            placeholder="Placeholder"
            value={valueOf(state)}
            readOnly
            isDragging={state === "Drag-Drop"}
            dropTitle={DROP_TITLE}
            dropDescription={DROP_DESCRIPTION}
            aria-label="챗봇 메시지"
            {...focusOf(state)}
          />
        )}
      />
    </Section>
  );
}

function TextFieldPanelSection() {
  return (
    <Section title="Text Field · Charge Suggestion / Reject (7085:112646)">
      <div className="flex flex-col gap-16">
        <TextFieldPanel
          className="w-110.5"
          title="금액 다시 제안하기"
          closeLabel="닫기"
        >
          <div className="flex gap-3 px-4 pt-4 pb-0.5">
            <PriceField
              className="flex-1"
              label="현재 요청 금액"
              unit="원"
              placeholder="999,999"
              disabled
            />
            <PriceField
              className="flex-1"
              label="제안 금액"
              unit="원"
              placeholder="금액을 입력하세요."
            />
          </div>
          <div className="flex justify-end p-4">
            <Button size="sm">
              <HandCoins />
              금액 제안하기
            </Button>
          </div>
        </TextFieldPanel>
        <TextFieldPanel
          className="w-110.5"
          title="거절 메시지 입력"
          closeLabel="닫기"
        >
          <TextField
            className="rounded-none border-0 p-4"
            variant="count"
            isWide
            leading={<AttachButton />}
            submit={<SendButton isDestructive />}
            placeholder="메시지를 입력하세요. (최대 3,000자)"
            maxLength={MAX_LENGTH}
            aria-label="거절 메시지"
          />
        </TextFieldPanel>
      </div>
    </Section>
  );
}

const LIST_TYPES = ["Handle", "Handle+Input", "Checkbox"] as const;

function ButtonListSection() {
  return (
    <Section title="Button / List (7021:164334)">
      <PreviewMatrix
        rows={["default", "hover"] as const}
        columns={LIST_TYPES}
        renderCell={(state, type) => (
          <ButtonList
            className="w-94"
            type={type === "Checkbox" ? "checkbox" : "handle"}
            title="Title"
            count="9999"
            icon={<Folder />}
            handleLabel="순서 변경"
            actions={
              type === "Handle" && (
                <>
                  <Button
                    variant="outline-foreground"
                    size="icon"
                    aria-label="수정"
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="outline-foreground"
                    size="icon"
                    aria-label="삭제"
                  >
                    <Trash2 />
                  </Button>
                </>
              )
            }
            editor={
              type === "Handle+Input" && (
                <span className="flex items-center gap-2">
                  <Input
                    defaultValue="전체"
                    aria-label="폴더 이름"
                    {...previewStateProps("focus")}
                  />
                  <Button variant="outline">수정 완료</Button>
                </span>
              )
            }
            {...previewStateProps(state)}
          />
        )}
      />
    </Section>
  );
}

const GROUP_SIZES = ["Button / Group", "Button / Group / Mobile"] as const;

function ButtonGroupSection() {
  return (
    <Section title="Button / Group (7021:168638 · 7149:169922)">
      <PreviewMatrix
        rows={["default", "focus"] as const}
        columns={GROUP_SIZES}
        renderCell={(state, column) => {
          const isMobile = column === "Button / Group / Mobile";
          return (
            <ButtonGroup
              className={isMobile ? "w-32.5" : "w-50"}
              size={isMobile ? "mobile" : "default"}
              title="Title"
              count="999"
              icon={<Folder />}
              {...previewStateProps(state)}
            />
          );
        }}
      />
    </Section>
  );
}

function FloatingButtonSection() {
  return (
    <Section title="Button / Floating (6982:62159)">
      <PreviewMatrix
        rows={["False", "True"] as const}
        columns={["Chat Bot", "Scroll"] as const}
        rowLabel={(row) => `Active / Inactive=${row}`}
        renderCell={(isActive, type) => (
          <FloatingButton
            type={type === "Chat Bot" ? "chatbot" : "scroll"}
            isActive={isActive === "True"}
            aria-label={type}
          />
        )}
      />
    </Section>
  );
}

// Radix 메뉴 항목은 메뉴 루트 밖에서 렌더링할 수 없어, 같은 클래스로 정적 마크업을 그림.
const CONTEXT_STATES = ["Default", "Hover", "Focus", "Focus-Hover"] as const;

function StaticMenuItem({
  label,
  trailing,
  isHover = false,
}: {
  label: string;
  trailing?: "check" | "chevron";
  isHover?: boolean;
}) {
  return (
    <div
      role="menuitem"
      className={menuItemClassName}
      {...previewStateProps(isHover ? "hover" : "default")}
    >
      <img src={instagramIcon} alt="" className="size-5 shrink-0" />
      <span className="flex-1">{label}</span>
      {trailing === "check" && (
        <CheckIcon className="ml-auto size-4 text-primary" />
      )}
      {trailing === "chevron" && (
        <ChevronRightIcon className="ml-auto size-4" />
      )}
    </div>
  );
}

// 실제 동작 확인용: 트리거를 클릭하면 열리고, 다시 클릭하거나 바깥을 누르면 닫힘.
// 항목을 누르면 선택(체크)이 토글되고(Figma Focus), 화살표 항목은 하위 메뉴를 엶(Figma Chevron).
const LIVE_MENU_ITEMS = ["Menu Item 01", "Menu Item 02"] as const;

function LiveMenuDemo() {
  const [checked, setChecked] = useState<string[]>([LIVE_MENU_ITEMS[0]]);
  const toggle = (item: string) =>
    setChecked((prev) =>
      prev.includes(item)
        ? prev.filter((value) => value !== item)
        : [...prev, item],
    );
  const icon = <img src={instagramIcon} alt="" className="size-5 shrink-0" />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline-foreground">클릭해서 열기</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-50">
        {LIVE_MENU_ITEMS.map((item) => (
          <DropdownMenuCheckboxItem
            key={item}
            checked={checked.includes(item)}
            onCheckedChange={() => toggle(item)}
            onSelect={(event) => event.preventDefault()}
          >
            {icon}
            {item}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {icon}
            Menu Item
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-50">
            <DropdownMenuItem>Sub Item 01</DropdownMenuItem>
            <DropdownMenuItem>Sub Item 02</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ContextMenuSection() {
  return (
    <Section title="Context Menu (5084:103796)">
      <PreviewMatrix
        rows={CONTEXT_STATES}
        columns={["Default", "Chevron"] as const}
        rowLabel={(row) => row}
        columnLabel={(column) => `Type=${column}`}
        renderCell={(state, type) => {
          const isChecked = state.startsWith("Focus");
          const trailing =
            type === "Chevron" ? "chevron" : isChecked ? "check" : undefined;
          return (
            <div className="w-48">
              <StaticMenuItem
                label="Menu Item"
                trailing={trailing}
                isHover={state.endsWith("Hover")}
              />
            </div>
          );
        }}
      />
      <div role="menu" className={cn(menuContentClassName, "w-50")}>
        <StaticMenuItem label="Menu Item 01" />
        <StaticMenuItem label="Menu Item 02" />
      </div>
      <LiveMenuDemo />
    </Section>
  );
}

// Figma 예시 기준일: 2026년 11월, 오늘 = 11월 4일. 요일은 영문 두 글자.
const DRAWER_CALENDAR_MONTH = new Date(2026, 10, 1);
const DRAWER_CALENDAR_TODAY = new Date(2026, 10, 4);
const formatWeekdayName = (date: Date) =>
  date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2);
const DRAWER_ITEMS = ["Menu Item 01", "Menu Item 02"] as const;

// vaul 드로어는 화면에 고정(fixed)되므로 DrawerContent와 같은 클래스로 열린 모습을 정적으로 그림.
function StaticDrawer({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="text-xs text-muted-foreground">{title}</figcaption>
      <div className="flex w-90 flex-col rounded-t-xl bg-background shadow-lg">
        <div className="mx-auto mt-4 h-2 w-25 shrink-0 rounded-full bg-muted" />
        <div className="flex flex-col gap-4 py-4">{children}</div>
      </div>
    </figure>
  );
}

// Figma Search(2752:9357)는 shadcn Command 기준: 입력한 검색어에 맞는 항목만 남음(cmdk 내장 필터).
function DrawerSearch() {
  // cmdk가 첫 항목을 자동 선택(하이라이트)하지 않도록 선택값을 비워 둠.
  const [selected, setSelected] = useState("");
  return (
    <Command
      value={selected}
      onValueChange={setSelected}
      className="rounded-none border-t"
    >
      <CommandInput placeholder="캠페인 검색" />
      <CommandList>
        <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
        <CommandGroup>
          {DRAWER_ITEMS.map((item) => (
            <CommandItem key={item} value={item} className="pl-8.5">
              {item}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

function DrawerSection() {
  return (
    <Section title="Drawer (6790:137307)">
      <StaticDrawer title="Type=Search">
        <DrawerSearch />
      </StaticDrawer>
      <StaticDrawer title="Type=Calendar">
        <div className="px-2">
          <Calendar
            className="w-full"
            locale={ko}
            today={DRAWER_CALENDAR_TODAY}
            defaultMonth={DRAWER_CALENDAR_MONTH}
            formatters={{ formatWeekdayName }}
          />
        </div>
      </StaticDrawer>
    </Section>
  );
}

export function FormExtraSection() {
  return (
    <>
      <TextFieldDefaultSection />
      <TextFieldReplySection />
      <TextFieldPriceSection />
      <TextFieldChatbotSection />
      <TextFieldPanelSection />
      <ButtonListSection />
      <ButtonGroupSection />
      <FloatingButtonSection />
      <ContextMenuSection />
      <DrawerSection />
    </>
  );
}
