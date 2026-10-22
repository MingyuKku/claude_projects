import {
  CornerDownRight,
  Pencil,
  Plus,
  Settings2,
  Trash,
  X,
} from "lucide-react";
import { useState } from "react";

import noMessageIcon from "@/shared/assets/img/empty/no-message.svg";
import { ChatListItem, ChatListPanel } from "@/shared/components/chat-list";
import {
  ChatCodeCard,
  ChatDivider,
  ChatMessage,
  ChatSuggestionCard,
  MessageAlert,
  MessageBubble,
  MessageEditor,
} from "@/shared/components/chat-message";
import { ClipboardButton } from "@/shared/components/clipboard-button";
import { FileItem, FileThumbnail } from "@/shared/components/file-list";
import { SearchInput } from "@/shared/components/search-input";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { PreviewMatrix, previewStateProps } from "../PreviewMatrix";
import { Section } from "../Section";

import type { ChatListBadge } from "@/shared/components/chat-list";
import type {
  MessageSide,
  MessageSize,
} from "@/shared/components/chat-message";

// 샘플 썸네일은 회색 박스로 대체함(실제 사진 에셋을 저장소에 두지 않기 위해).
const SAMPLE_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='1' height='1' fill='%23cbd5e1'/%3E%3C/svg%3E";

const STATUS_BADGE = {
  "상담 중": { label: "상담 중", variant: "green" },
  "답변 대기": { label: "답변 대기", variant: "blue" },
  "답변 완료": { label: "답변 완료", variant: "gray" },
} as const satisfies Record<string, ChatListBadge>;
const STATUS_TYPES = ["상담 중", "답변 대기", "답변 완료"] as const;
const BUYER_BADGES: Record<(typeof STATUS_TYPES)[number], ChatListBadge[]> = {
  "상담 중": [
    { label: "재문의", variant: "green" },
    { label: "구매자 문의", variant: "gray" },
  ],
  "답변 대기": [
    { label: "답변 대기", variant: "blue" },
    { label: "상품 Q&A", variant: "gray" },
  ],
  "답변 완료": [
    { label: "답변 완료", variant: "gray" },
    { label: "상품 Q&A", variant: "gray" },
  ],
};
const PREVIEW_TEXT =
  "주문했는데 배송 시작이 늦어지는 것 같아서 다시 한 번 연락드립니다";
const HIGHLIGHT_TEXT =
  "공동구매 상품을 김하루 이름으로 주문했는데 배송 시작이 늦어지는 것 같아서 다시 한 번 확인부탁드립니다";
const ADVERTISER_ITEMS = [
  { id: 1, status: "상담 중", title: "여름 신상 스킨케어 체험단 문의" },
  { id: 2, status: "상담 중", title: "여름 신상 스킨케어 체험단 문의" },
  { id: 3, status: "답변 대기", title: "여름 신상 스킨케어 체험단 문의" },
  { id: 4, status: "답변 완료", title: "기타 문의", date: "10월 8일" },
  { id: 5, status: "상담 중", title: "기타 문의" },
  { id: 6, status: "답변 대기", title: "여름 신상 스킨케어 체험단 문의" },
  { id: 7, status: "답변 대기", title: "여름 신상 스킨케어 체험단 문의" },
] as const;
const BUYER_ITEMS = [
  { id: 1, status: "상담 중", hasAlert: true },
  { id: 2, status: "답변 대기", hasAlert: false },
  { id: 3, status: "상담 중", hasAlert: true },
  { id: 4, status: "답변 완료", hasAlert: false },
  { id: 5, status: "상담 중", hasAlert: false },
  { id: 6, status: "상담 중", hasAlert: false },
] as const;
const MESSAGE_SIZES = ["lg", "md", "sm"] as const;
const TOOLBAR_ACTIONS = [
  { label: "답장", icon: CornerDownRight },
  { label: "수정", icon: Pencil },
  { label: "삭제", icon: Trash },
];

function ChatTabs({ labels }: { labels: readonly string[] }) {
  return (
    <Tabs defaultValue={labels[0]}>
      <TabsList className="w-full">
        {labels.map((label) => (
          <TabsTrigger key={label} value={label}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function SearchBar() {
  return (
    <>
      <SearchInput
        variant="filled"
        placeholder="원하는 조건을 입력해 보세요."
        className="flex-1"
      />
      <Button variant="outline">
        <Settings2 />
        필터
      </Button>
    </>
  );
}

function EmptyMessage({ description }: { description?: string }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <img src={noMessageIcon} alt="" className="size-12.5" />
      <div className="flex flex-col items-center gap-0.5 text-center">
        <p className="text-sm leading-5 font-medium text-muted-foreground">
          문의사항이 존재하지 않습니다.
        </p>
        {description && (
          <p className="text-xs leading-4 text-slate-400">{description}</p>
        )}
      </div>
    </div>
  );
}

function ChatListPanels() {
  const newButton = (
    <Button size="sm">
      <Plus />새 문의
    </Button>
  );
  const panelClass = "h-[716px] w-94";

  return (
    <div className="flex items-start gap-4">
      <ChatListPanel
        className={panelClass}
        title="문의 목록"
        refreshLabel="새로고침"
        action={newButton}
        tabs={
          <ChatTabs labels={["전체", "답변 대기", "상담 중", "답변 완료"]} />
        }
      >
        {ADVERTISER_ITEMS.map((item) => (
          <ChatListItem
            key={item.id}
            badges={[STATUS_BADGE[item.status]]}
            date={"date" in item ? item.date : "9월 17일"}
            time="13:00"
            title={item.title}
          />
        ))}
      </ChatListPanel>
      <ChatListPanel
        className={panelClass}
        title="문의 목록"
        refreshLabel="새로고침"
        search={<SearchBar />}
        tabs={
          <ChatTabs labels={["전체", "답변 대기", "재문의", "답변 완료"]} />
        }
      >
        {BUYER_ITEMS.map((item) => (
          <ChatListItem
            key={item.id}
            badges={BUYER_BADGES[item.status]}
            date="0월 0일"
            time="00:00"
            user={{ name: "김하루" }}
            preview={PREVIEW_TEXT}
            hasAlert={item.hasAlert}
            alertLabel="새 메시지"
          />
        ))}
      </ChatListPanel>
      <ChatListPanel
        className={panelClass}
        title="문의 목록"
        refreshLabel="새로고침"
        action={newButton}
        tabs={
          <ChatTabs labels={["전체", "답변 대기", "상담 중", "답변 완료"]} />
        }
        isEmpty
        empty={<EmptyMessage description="새 문의를 등록해 주세요." />}
      />
      <ChatListPanel
        className={panelClass}
        title="문의 목록"
        refreshLabel="새로고침"
        search={<SearchBar />}
        filters={
          <>
            {["빅버드 스킨케어 캠페인", "김빅버드"].map((label) => (
              <Button key={label} variant="secondary" size="xs">
                {label}
                <X />
              </Button>
            ))}
          </>
        }
        tabs={
          <ChatTabs labels={["전체", "답변 대기", "재문의", "답변 완료"]} />
        }
        isEmpty
        empty={<EmptyMessage />}
      />
    </div>
  );
}

function ChatListItemMatrix({ isBuyer }: { isBuyer: boolean }) {
  const rows = isBuyer
    ? (["default", "hover", "focus", "highlighted"] as const)
    : (["default", "hover", "focus"] as const);

  // 개발 전용 미리보기라 ul > div(격자) > li 구조를 허용함. 실제 목록은 ChatListPanel 의 ul > li.
  return (
    <ul>
      <PreviewMatrix
        rows={rows}
        columns={STATUS_TYPES}
        renderCell={(row, status) => {
          const isHighlighted = row === "highlighted";
          const shared = {
            className: "w-94",
            date: "0월 0일",
            time: "00:00",
            isSelected: row === "focus",
            deleteLabel: "삭제",
            onClickDelete: () => undefined,
            ...(row === "hover" ? previewStateProps("hover") : {}),
          };
          if (!isBuyer) {
            return (
              <ChatListItem
                {...shared}
                badges={[STATUS_BADGE[status]]}
                title="카드 타이틀"
              />
            );
          }
          return (
            <ChatListItem
              {...shared}
              badges={BUYER_BADGES[status]}
              user={{ name: "김하루" }}
              preview={isHighlighted ? HIGHLIGHT_TEXT : PREVIEW_TEXT}
              highlight={isHighlighted ? "김하루" : undefined}
            />
          );
        }}
      />
    </ul>
  );
}

function SampleThumbnails({ size = "md" }: { size?: "md" | "sm" }) {
  const count = size === "sm" ? 4 : 3;
  return (
    <div className={size === "sm" ? "flex w-62 gap-1" : "flex gap-1"}>
      {Array.from({ length: count }, (_, index) => (
        <FileThumbnail
          key={index}
          src={SAMPLE_IMAGE}
          alt=""
          size={size}
          type={index === 0 ? "video" : "image"}
        />
      ))}
    </div>
  );
}

function SampleCodeCard({ size }: { size: "md" | "sm" }) {
  return (
    <ChatCodeCard
      size={size}
      thumbnailSrc={SAMPLE_IMAGE}
      title="빅버드 스킨케어 캠페인"
      description="PICK형"
      period="2026.01.01 ~ 2029.01.01"
      codeLabel="캠페인 코드"
      code="Q-123412341234"
      copyLabel="캠페인 코드 복사"
    />
  );
}

const ROW_COLUMNS = [
  "Other",
  "Me",
  "Other · Card · Thumbnail",
  "Me · Card · Thumbnail",
  "Other · Thumbnail",
  "Me · Thumbnail",
  "Other · Card",
  "Me · Card",
] as const;

function MessageRowMatrix() {
  return (
    <PreviewMatrix
      rows={MESSAGE_SIZES}
      columns={ROW_COLUMNS}
      rowLabel={(row) => row}
      renderCell={(size: MessageSize, column) => {
        const side: MessageSide = column.startsWith("Me") ? "me" : "other";
        const hasCard = column.includes("Card");
        const hasThumbnail = column.includes("Thumbnail");
        return (
          <ChatMessage
            side={side}
            size={size}
            name="Name Value"
            message="Message Text"
            time="00:00"
            card={
              hasCard && <SampleCodeCard size={size === "sm" ? "sm" : "md"} />
            }
            attachments={
              hasThumbnail && (
                <SampleThumbnails size={size === "sm" ? "sm" : "md"} />
              )
            }
          />
        );
      }}
    />
  );
}

function MessageBubbleMatrix() {
  const columns = [
    "Other",
    "Me",
    "Other · Time",
    "Me · Time",
    "Other · Edited",
    "Me · Edited",
  ] as const;
  return (
    <PreviewMatrix
      rows={MESSAGE_SIZES}
      columns={columns}
      rowLabel={(row) => row}
      renderCell={(size, column) => (
        <MessageBubble
          message="Message Text"
          size={size}
          side={column.startsWith("Me") ? "me" : "other"}
          time={column.includes("·") ? "00:00" : undefined}
          editedLabel={column.includes("Edited") ? "편집됨" : undefined}
        />
      )}
    />
  );
}

function MessageEditorSample({
  size,
  hasThumbnail,
}: {
  size: "md" | "sm";
  hasThumbnail: boolean;
}) {
  const [value, setValue] = useState("Message Text");
  return (
    <MessageEditor
      size={size}
      name="Name Value"
      value={value}
      onChangeValue={setValue}
      maxLength={3000}
      inputLabel="메시지 수정"
      attachments={hasThumbnail && <SampleThumbnails />}
      attachLabel="첨부"
      cancelLabel="취소"
      submitLabel="완료"
    />
  );
}

const SUGGESTION_TYPES = ["Suggest", "Re-Suggest", "Accept", "Reject"] as const;
const SUGGESTION_BADGE = {
  Suggest: "blue",
  "Re-Suggest": "red",
  Accept: "green",
  Reject: "gray",
} as const;

function SuggestionCardSample({
  type,
  size,
}: {
  type: (typeof SUGGESTION_TYPES)[number];
  size: "md" | "sm";
}) {
  const buttonSize = size === "md" ? "default" : "sm";
  const buttonClass = size === "md" ? undefined : "flex-1";
  const notice = {
    Suggest: undefined,
    "Re-Suggest": undefined,
    Accept: { status: "accepted", text: "제안이 수락되었습니다." },
    Reject: { status: "rejected", text: "제안이 거절되었습니다." },
  } as const;
  const actions = {
    Suggest: undefined,
    "Re-Suggest": (
      <>
        <Button
          variant="outline-foreground"
          size={buttonSize}
          className={buttonClass}
        >
          거절
        </Button>
        <Button variant="outline" size={buttonSize} className={buttonClass}>
          다시 제안
        </Button>
        <Button size={buttonSize} className={buttonClass}>
          수락
        </Button>
      </>
    ),
    Accept: size === "md" ? <Button>결제</Button> : undefined,
    Reject: undefined,
  };

  return (
    <ChatSuggestionCard
      size={size}
      badge={{ label: "Badge", variant: SUGGESTION_BADGE[type] }}
      title="Label"
      notice={notice[type]}
      amountLabel="제안 금액"
      amount="999,999원"
      amountCaption={
        <>
          수수료 <span className="font-semibold text-foreground">N</span> %
        </>
      }
      details={[
        { label: "진행 내용", value: "Text" },
        { label: "희망 업로드 일정", value: "0000.00.00 ~ 0000.00.00" },
      ]}
      actions={actions[type]}
    />
  );
}

export function ChatSection() {
  return (
    <>
      <Section title="Chat List Base / Card · 광고주 문의 (5198:100096)">
        <ChatListItemMatrix isBuyer={false} />
      </Section>

      <Section title="Chat List Base / Card · 구매자 문의 (5198:113027)">
        <ChatListItemMatrix isBuyer />
      </Section>

      <Section title="Chat List (5198:113612)">
        <ChatListPanels />
      </Section>

      <Section title="Chat Base / Message Bubble (6756:29608)">
        <MessageBubbleMatrix />
      </Section>

      <Section title="Chat Base / Message Row (5198:102410)">
        <div className="rounded-lg bg-muted p-6">
          <MessageRowMatrix />
        </div>
      </Section>

      <Section title="Message toolbar · hover (Tooltip variant=toolbar)">
        <div className="rounded-lg bg-muted p-6 pt-16">
          <ChatMessage
            name="빅버드 담당자"
            message="말풍선에 마우스를 올리면 답장·수정·삭제 툴바가 뜹니다."
            time="00:00"
            toolbar={TOOLBAR_ACTIONS.map(({ label, icon: Icon }) => (
              <Button
                key={label}
                variant="ghost-foreground"
                size="icon"
                aria-label={label}
              >
                <Icon />
              </Button>
            ))}
          />
        </div>
      </Section>

      <Section title="Chat Base / Message Bubble Edit (6790:116227)">
        <div className="flex flex-wrap gap-6 rounded-lg bg-muted p-6">
          <MessageEditorSample size="md" hasThumbnail={false} />
          <MessageEditorSample size="md" hasThumbnail />
          <MessageEditorSample size="sm" hasThumbnail={false} />
          <MessageEditorSample size="sm" hasThumbnail />
        </div>
      </Section>

      <Section title="Chat Base / Message Alert (5219:129953)">
        <div className="flex w-[739px] flex-col gap-6">
          <MessageAlert
            status="loading"
            title="상담 요청 중"
            description="운영자가 접속하면 실시간 상담이 시작됩니다."
            caption="상담원 연결은 고객 문의 상황에 따라 최대 5분이 소요될 수 있습니다."
          />
          <MessageAlert
            status="error"
            title="상담 요청 실패"
            description="문의를 남겨주시면 확인 후 순차적으로 답변드립니다."
            caption="문의 메시지 답변은 고객 문의 상황에 따라 지연될 수 있습니다."
            actions={
              <>
                <Button variant="outline-foreground">재시도</Button>
                <Button>문의 메시지로 남기기</Button>
              </>
            }
          />
          <MessageAlert
            status="completed"
            title="완료된 상담"
            description="이미 완료된 상담입니다. 새로운 문의가 있으신 경우 새 문의를 등록해 주세요."
            caption="문의 메시지를 남겨주시면 확인 후 순차적으로 답변드립니다."
          />
        </div>
      </Section>

      <Section title="Chat Base / Chat Devider (6790:120136)">
        <ChatDivider>00.0.0 월</ChatDivider>
        <ChatDivider>메시지가 삭제되었습니다.</ChatDivider>
      </Section>

      <Section title="Chat Base / Card (5198:110783)">
        <PreviewMatrix
          rows={["md", "sm"] as const}
          columns={["Codebox", ...SUGGESTION_TYPES] as const}
          rowLabel={(row) => (row === "md" ? "Medium" : "Small")}
          renderCell={(size, column) =>
            column === "Codebox" ? (
              <SampleCodeCard size={size} />
            ) : (
              <SuggestionCardSample type={column} size={size} />
            )
          }
        />
      </Section>

      <Section title="Button / Clip Board (6766:45668)">
        <PreviewMatrix
          rows={["default", "hover"] as const}
          columns={["Clip Board"] as const}
          renderCell={(state) => (
            <ClipboardButton
              className="w-[243px]"
              label="Label"
              value="000000000000"
              {...previewStateProps(state)}
            />
          )}
        />
      </Section>

      <Section title="File List Base / Thumbnail (5219:126850)">
        <PreviewMatrix
          rows={["default", "hover"] as const}
          columns={["Image", "Movie", "File"] as const}
          renderCell={(state, column) =>
            column === "File" ? (
              <FileItem
                name="Label"
                sizeLabel="2.5MB"
                downloadLabel="다운로드"
                {...previewStateProps(state)}
              />
            ) : (
              <FileThumbnail
                src={SAMPLE_IMAGE}
                alt=""
                type={column === "Movie" ? "video" : "image"}
                removeLabel="삭제"
                onClickRemove={() => undefined}
                {...previewStateProps(state)}
              />
            )
          }
        />
      </Section>

      <Section title="File List / Thumbnail (6977:45435)">
        <PreviewMatrix
          rows={["Thumbnail_md", "Thumbnail_sm", "File"] as const}
          columns={["File List"] as const}
          rowLabel={(row) => row}
          renderCell={(row) => {
            if (row === "File") {
              return (
                <FileItem
                  name="Label"
                  sizeLabel="2.5MB"
                  downloadLabel="다운로드"
                />
              );
            }
            return (
              <SampleThumbnails size={row === "Thumbnail_sm" ? "sm" : "md"} />
            );
          }}
        />
      </Section>
    </>
  );
}
