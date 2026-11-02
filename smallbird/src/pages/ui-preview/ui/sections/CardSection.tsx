import {
  Bookmark,
  ChevronRight,
  EllipsisVertical,
  Mail,
  Plus,
  Wallet,
} from "lucide-react";
import { useState } from "react";

import samplePost from "@/shared/assets/img/sns/sample-post.jpg";
import {
  CountCard,
  InfoCard,
  InputCard,
  MainCard,
  PayCard,
  PayCardAddButton,
  PlanCard,
  ProfileTableCard,
  SnsIcon,
  SnsPostCard,
  SummaryCard,
  SummaryCardAvatars,
} from "@/shared/components/cards";
import { EmptyIllustration, EmptyState } from "@/shared/components/empty-state";
import { Inform } from "@/shared/components/inform";
import { Stepper } from "@/shared/components/stepper";
import { ToggleTab } from "@/shared/components/toggle-tab";
import { Avatar, AvatarPlaceholder } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Toggle } from "@/shared/ui/toggle";

import { PreviewMatrix, previewStateProps } from "../PreviewMatrix";
import { Section } from "../Section";

import type { PlanCardType, SnsPlatform } from "@/shared/components/cards";
import type { EmptyIllustrationType } from "@/shared/components/empty-state";
import type { StepperStep } from "@/shared/components/stepper";

const toStateProps = (row: string) =>
  row === "hover" || row === "focus" ? previewStateProps(row) : {};

const BADGE_TYPES = ["blue", "green", "gray", "red", "yellow"] as const;
const INFORM_ITEMS = [
  { id: "1", text: "Text" },
  { id: "2", text: "Text" },
];
const PLAN_FEATURES = [
  { id: "1", text: "Text" },
  { id: "2", text: "Text" },
  { id: "3", text: "Text" },
];
const STEPS: StepperStep[] = ["1", "2", "3", "4", "5"].map((id) => ({
  id,
  label: "Text",
}));
const ILLUSTRATION_TYPES: EmptyIllustrationType[] = [
  "no-list",
  "no-message",
  "no-search",
  "construction",
  "folder",
  "alarm",
];
const EMPTY_TYPES: EmptyIllustrationType[] = [
  "no-list",
  "no-message",
  "no-search",
  "folder",
  "alarm",
];
const PLAN_COLUMNS = {
  Default: "default",
  Subscribe: "subscribed",
  Disabled: "disabled",
} as const satisfies Record<string, PlanCardType>;
// ToggleTab의 Hover는 선택된 항목에 걸리므로, 미리보기에서는 같은 색을 그 항목에 고정함.
const SELECTED_HOVER_CLASS =
  "[&_[aria-checked=true]]:bg-[color-mix(in_srgb,var(--color-accent)_50%,var(--color-background))]";
const PAYMENT_OPTIONS = [
  { value: "monthly", label: "월간 결제" },
  { value: "yearly", label: "연간 결제", description: "00%할인" },
];

const COUNT_USAGE = {
  percent: 50,
  items: [
    { id: "used", label: "사용", value: "50,000 건" },
    { id: "left", label: "잔여", value: "100,000 건" },
  ],
};
const AVATAR_IDS = ["1", "2", "3"];
const TABLE_ROWS = [
  {
    id: "platform",
    label: "플랫폼",
    value: <SnsIcon platform="youtube" alt="Youtube" />,
  },
  { id: "category", label: "카테고리", value: "가전•인테리어" },
  { id: "followers", label: "팔로워 수", value: "9999K" },
  { id: "brand", label: "브랜드 지수", value: "99.9" },
  { id: "group-buy", label: "공구 지수", value: "99.9" },
  { id: "commenters", label: "평균 댓글 작성자 수", value: "99999" },
  { id: "cost", label: "예상 비용", value: "약 9999만 원" },
];
const SNS_TEXT =
  "요즘 정말 잘 쓰고 있는 인생 세럼💕 피부가 한결 촉촉해진 느낌이에요!";
const SNS_LONG_TEXT = `${SNS_TEXT} ${SNS_TEXT}`;
const SNS_TITLE = "봄 환절기 수부지 피부 관리법 5가지🩵";
// Figma 프레임 배치(2열): Instagram·Naver / Youtube·X / Tiktok
const SNS_SAMPLES: {
  platform: SnsPlatform;
  title?: string;
  text?: string;
  metrics: {
    views?: string;
    likes?: string;
    comments?: string;
    reposts?: string;
  };
}[] = [
  {
    platform: "instagram",
    text: SNS_TEXT,
    metrics: { likes: "4521", comments: "233" },
  },
  {
    platform: "naver",
    title: SNS_TITLE,
    text: SNS_LONG_TEXT,
    metrics: { likes: "4521", comments: "233" },
  },
  {
    platform: "youtube",
    title: SNS_TITLE,
    metrics: { views: "4521", likes: "4521", comments: "233" },
  },
  {
    platform: "x",
    text: SNS_LONG_TEXT,
    metrics: { likes: "4521", comments: "233", reposts: "89" },
  },
  {
    platform: "tiktok",
    text: SNS_TEXT,
    metrics: { views: "4521", likes: "4521", comments: "233" },
  },
];

function CountCardSample({
  column,
  row,
}: {
  column: "Default" | "Button" | "Progress";
  row: "default" | "hover" | "focus";
}) {
  return (
    <CountCard
      title="Title"
      icon={<Wallet />}
      value="999,999"
      unit="개"
      action={
        column === "Button" && (
          <Button className="flex-1">
            충전하기
            <ChevronRight />
          </Button>
        )
      }
      usage={column === "Progress" ? COUNT_USAGE : undefined}
      className="w-[376px]"
      {...toStateProps(row)}
    />
  );
}

function PlanCardSample({
  type,
  row,
}: {
  type: PlanCardType;
  row: "default" | "hover" | "focus" | "more";
}) {
  const isDisabled = type === "disabled";
  const isMore = row === "more";
  return (
    <PlanCard
      type={type}
      title="Label"
      price="월 99,999원"
      badges={
        isDisabled ? (
          <>
            <Badge variant="gray">라이브커머스형</Badge>
            <Badge variant="gray">라이브클래스형</Badge>
          </>
        ) : (
          <>
            <Badge variant="blue">브랜드형</Badge>
            <Badge variant="green">공구형</Badge>
          </>
        )
      }
      features={PLAN_FEATURES}
      comingSoonText={
        <p>
          추후 제공 예정이에요.
          <br />곧 만나요!
        </p>
      }
      isExpanded={isMore}
      detail={
        <>
          <Inform size="sm" title="Label" items={INFORM_ITEMS} hasLineTop />
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-none font-semibold">Label</p>
            <Stepper steps={STEPS} />
          </div>
          <Inform size="sm" title="Label" items={INFORM_ITEMS} />
          <Inform size="sm" title="Label" items={INFORM_ITEMS} />
        </>
      }
      detailLabel="상세보기"
      actionLabel={
        { default: "구독하기", subscribed: "구독 중", disabled: "준비중" }[type]
      }
      className={planCardSizeClass(isMore, isDisabled)}
      {...toStateProps(row)}
    />
  );
}

// Figma 프레임 크기(278 × 364, Disabled 350)를 미리보기에서만 맞춤.
function planCardSizeClass(isMore: boolean, isDisabled: boolean) {
  if (isMore) return "w-[278px]";
  return isDisabled ? "h-[350px] w-[278px]" : "h-[364px] w-[278px]";
}

export function CardSection() {
  const [payment, setPayment] = useState("yearly");

  return (
    <>
      <Section title="Card / Main (5058:82913, 6881:34632)">
        <PreviewMatrix
          rows={["default", "hover"] as const}
          columns={["Main", "Main / Mobile"] as const}
          renderCell={(row, column) => (
            <MainCard
              title="타이틀"
              description="Subscript Here"
              size={column === "Main" ? "default" : "mobile"}
              className={column === "Main" ? "w-[222px]" : undefined}
              {...toStateProps(row)}
            />
          )}
        />
      </Section>

      <Section title="Card / Toggle (5198:114474)">
        <PreviewMatrix
          rows={["default", "hover", "focus"] as const}
          columns={["Card"] as const}
          renderCell={(row) => (
            <InfoCard
              title="카드 타이틀"
              className="w-[361.5px]"
              {...toStateProps(row)}
            >
              <p>Subscript Here</p>
            </InfoCard>
          )}
        />
      </Section>

      <Section title="Card / Button (6897:43929)">
        <PreviewMatrix
          rows={["default", "hover", "focus", "more"] as const}
          columns={["Default", "Subscribe", "Disabled"] as const}
          renderCell={(row, column) => (
            <PlanCardSample type={PLAN_COLUMNS[column]} row={row} />
          )}
        />
      </Section>

      <Section title="Card / Count (6934:86666)">
        <PreviewMatrix
          rows={["default", "hover", "focus"] as const}
          columns={["Default", "Button", "Progress"] as const}
          renderCell={(row, column) => (
            <CountCardSample row={row} column={column} />
          )}
        />
      </Section>

      <Section title="Card / Input (6984:98717)">
        <InputCard
          title="Label"
          inputProps={{
            placeholder: "폴더명을 입력하세요",
            "aria-label": "폴더명",
          }}
          actionLabel="생성"
          className="w-[376px]"
          {...previewStateProps("focus")}
        />
      </Section>

      <Section title="Card / Avatar (6987:112262)">
        <PreviewMatrix
          rows={["default", "hover", "focus"] as const}
          columns={["Card"] as const}
          renderCell={(row) => (
            <SummaryCard
              title="Title"
              icon={<Wallet />}
              aside="50명"
              className="w-[376px]"
              {...toStateProps(row)}
            >
              <SummaryCardAvatars>
                {AVATAR_IDS.map((id) => (
                  <Avatar key={id} size="sm">
                    <AvatarPlaceholder />
                  </Avatar>
                ))}
              </SummaryCardAvatars>
            </SummaryCard>
          )}
        />
      </Section>

      <Section title="Card / Badge (6987:112408)">
        <PreviewMatrix
          rows={["default", "hover", "focus"] as const}
          columns={["Card"] as const}
          renderCell={(row) => (
            <SummaryCard
              title="Label"
              className="w-[376px]"
              {...toStateProps(row)}
            >
              <Badge size="sm">공구형</Badge>
            </SummaryCard>
          )}
        />
      </Section>

      <Section title="Card / Pay (7064:181566)">
        <PreviewMatrix
          rows={["default", "hover", "focus"] as const}
          columns={["Default", "Add"] as const}
          renderCell={(row, column) =>
            column === "Add" ? (
              <PayCardAddButton label="카드 추가" {...toStateProps(row)} />
            ) : (
              <PayCard
                tabIndex={0}
                name="하나카드"
                number="1234-5678-****-2567"
                badge={row === "focus" && <Badge size="sm">기본 카드</Badge>}
                menu={
                  row !== "focus" && (
                    <button
                      type="button"
                      aria-label="카드 메뉴"
                      className="flex rounded-md p-0.5"
                    >
                      <EllipsisVertical aria-hidden className="size-4" />
                    </button>
                  )
                }
                {...toStateProps(row)}
              />
            )
          }
        />
      </Section>

      <Section title="Card / Table / Mobile (7119:139040)">
        <PreviewMatrix
          rows={["default"] as const}
          columns={["Check: False", "Check: True"] as const}
          renderCell={(_, column) => (
            <ProfileTableCard
              checkboxLabel="선택"
              isChecked={column === "Check: True"}
              avatar={
                <Avatar size="md">
                  <AvatarPlaceholder />
                </Avatar>
              }
              name="Name"
              description="Text"
              actions={
                <>
                  <Toggle variant="outline" size="sm" aria-label="북마크">
                    <Bookmark />
                  </Toggle>
                  <Toggle variant="outline" size="sm" aria-label="메일">
                    <Mail />
                  </Toggle>
                </>
              }
              rows={TABLE_ROWS}
              className="w-[328px]"
            />
          )}
        />
      </Section>

      <Section title="Card / SNS (7301:113481)">
        <div className="grid grid-cols-2 gap-5">
          {SNS_SAMPLES.map((sample) => (
            <SnsPostCard
              key={sample.platform}
              {...sample}
              author="beauty_jina"
              imageSrc={samplePost}
              imageAlt="세럼 제품 후기 셀카"
              date="2024. 05. 12"
              menuLabel={sample.platform === "instagram" ? "더보기" : undefined}
            />
          ))}
        </div>
      </Section>

      <Section title="Badge (5198:98237)">
        <PreviewMatrix
          rows={["md", "sm"] as const}
          columns={BADGE_TYPES}
          rowLabel={(row) => row}
          renderCell={(size, variant) => (
            <Badge variant={variant} size={size}>
              Badge
            </Badge>
          )}
        />
      </Section>

      <Section title="Inform (6925:65640)">
        <PreviewMatrix
          rows={["md", "sm"] as const}
          columns={["line", "filled"] as const}
          rowLabel={(row) => row}
          renderCell={(size, variant) => (
            <Inform
              variant={variant}
              size={size}
              title="Label"
              items={INFORM_ITEMS}
              className={size === "md" ? "w-[700px]" : "w-[500px]"}
            />
          )}
        />
      </Section>

      <Section title="Empty (6782:96547)">
        <div className="flex flex-col gap-8">
          <div className="flex gap-6">
            {ILLUSTRATION_TYPES.map((type) => (
              <EmptyIllustration key={type} type={type} />
            ))}
          </div>
          <div className="flex items-start gap-9">
            {EMPTY_TYPES.map((type) => (
              <EmptyState
                key={type}
                type={type}
                title="Title"
                description="Description"
              />
            ))}
            <EmptyState
              type="no-list"
              title="Title"
              description="Description"
              action={
                <Button variant="outline">
                  <Plus />
                  Text
                </Button>
              }
            />
          </div>
        </div>
      </Section>

      <Section title="Stepper (7225:139726)">
        <PreviewMatrix
          rows={["sm", "lg"] as const}
          columns={["Default", "Active 2"] as const}
          rowLabel={(row) => row}
          renderCell={(size, column) => (
            <Stepper
              steps={STEPS}
              size={size}
              activeCount={column === "Default" ? 0 : 2}
              className={size === "sm" ? "w-[296px]" : "w-[408px]"}
            />
          )}
        />
      </Section>

      <Section title="Toggle / Tab (7185:129153)">
        <PreviewMatrix
          rows={["Selected", "Hover"] as const}
          columns={["Left / Right: True", "Left / Right: False"] as const}
          rowLabel={(row) => row}
          renderCell={(row, column) => {
            const value = column.endsWith("True") ? "yearly" : "monthly";
            return (
              <ToggleTab
                aria-label="결제 주기"
                options={PAYMENT_OPTIONS}
                value={value}
                onValueChange={() => undefined}
                className={row === "Hover" ? SELECTED_HOVER_CLASS : undefined}
              />
            );
          }}
        />
        <ToggleTab
          aria-label="결제 주기"
          options={PAYMENT_OPTIONS}
          value={payment}
          onValueChange={setPayment}
        />
      </Section>
    </>
  );
}
