import { cva } from "class-variance-authority";
import { Maximize2, Minimize2, Search } from "lucide-react";
import { useId, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { TextField } from "@/shared/components/text-field";
import { MEDIA_QUERY } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib/useMediaQuery";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { buildInfluencerSearchUrl } from "../lib/build-search-url";
import {
  DEFAULT_PLATFORM,
  EXPAND_ACTION_MIN_LINES,
  MOBILE_EXPAND_ACTION_MIN_LINES,
} from "../model/constants";
import { useExpandTransition } from "../model/useExpandTransition";
import { useInlineExpand } from "../model/useInlineExpand";
import { useTextareaOverflow } from "../model/useTextareaOverflow";
import { PlatformSelect } from "./PlatformSelect";

import type { InfluencerPlatform } from "@/entities/platform";
import type { CssVariableStyle } from "@/shared/lib";
import type {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from "react";

// 높이를 줄 수(lh = 이 입력의 line-height)로 정해 글자 크기·줄 간격이 바뀌어도 최소 4줄·최대 8줄을 유지함.
// 키보드가 열린 동안은 입력창이 보이는 영역 안에 들어와야 하므로 4줄·8줄도 입력 영역 한도(useInlineExpand)를 넘지 않음.
// 아이콘이 스크롤바 오른쪽에 붙으므로 스크롤바 자리를 미리 잡아 줄 수가 바뀔 때 글 폭이 흔들리지 않게 함.
const textareaVariants = cva("h-auto", {
  variants: {
    isExpanded: {
      true: "min-h-0 max-h-none flex-1",
      false:
        "min-h-[4lh] max-h-[8lh] in-data-[keyboard=open]:min-h-[min(4lh,var(--search-textarea-max-height))] in-data-[keyboard=open]:max-h-[min(8lh,var(--search-textarea-max-height))]",
    },
    hasExpandAction: {
      true: "[scrollbar-gutter:stable]",
      false: "",
    },
  },
});

// 펼친 입력창과 키보드가 열린 태블릿·모바일의 입력창은 자리를 차지하지 않고 아래 끝을 고정해 위로 커지며 카드를 덮음.
// 접는 중(closing)에도 같은 자리에서 아래 끝을 고정한 채 줄어들어야 아래 카드가 움직이지 않으므로 전환이 끝날 때까지 덮은 상태를 유지함.
const fieldVariants = cva("", {
  variants: {
    phase: {
      open: "absolute inset-x-0 bottom-0 z-10 h-(--search-expanded-height)",
      closing: "absolute inset-x-0 bottom-0 z-10",
      closed:
        "in-data-[keyboard=open]:absolute in-data-[keyboard=open]:inset-x-0 in-data-[keyboard=open]:bottom-0 in-data-[keyboard=open]:z-10",
    },
  },
});

// 키보드가 열린 동안 입력창은 자리를 차지하지 않으므로(위 fieldVariants) 기본 높이만큼 자리를 비워 둠.
// 142px = 입력 4줄 80 + 위아래 패딩·테두리 20 + 간격 6 + 버튼 줄 36. 카드 위치가 글 길이에 따라 움직이지 않게 함.
// 보이는 영역이 이보다 낮으면 입력창 한도만큼만 비워 둠.
const KEYBOARD_OPEN_SLOT_CLASS_NAME =
  "in-data-[keyboard=open]:h-[min(--spacing(35.5),var(--search-field-max-height))]";

// 확대·축소 아이콘이 바뀔 때 흐려지며 살짝 커지게 함. 모션 줄이기를 켜면 바로 바뀜.
const ICON_SWAP_CLASS_NAME =
  "animate-in duration-300 fade-in-0 zoom-in-50 motion-reduce:animate-none";

function preventFocusLoss(event: ReactMouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}

interface InfluencerSearchFormProps {
  className?: string;
}

// 광고주가 제품 정보를 문장으로 입력하고 플랫폼을 골라 인플루언서 검색 경로로 이동함 (specs/home.md §3).
export function InfluencerSearchForm({ className }: InfluencerSearchFormProps) {
  const { t } = useTranslation("features/search-influencer");
  const navigate = useNavigate();
  const textareaId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [query, setQuery] = useState("");
  const [platform, setPlatform] =
    useState<InfluencerPlatform>(DEFAULT_PLATFORM);
  const isTouch = useMediaQuery(MEDIA_QUERY.touch);
  const isMobile = useMediaQuery(MEDIA_QUERY.mobile);
  const expand = useInlineExpand({ formRef });

  const { isOverflowing } = useTextareaOverflow({
    textareaRef,
    isExpanded: expand.isExpanded,
    overflowLines: isMobile
      ? MOBILE_EXPAND_ACTION_MIN_LINES
      : EXPAND_ACTION_MIN_LINES,
    query,
  });
  useExpandTransition({
    formRef,
    phase: expand.phase,
    onCollapsed: expand.finishCollapse,
  });
  const canSubmit = query.trim() !== "";
  // 펼쳐도 커질 공간이 없으면 펼치기 버튼을 숨김. 펼친 뒤에는 접을 수 있게 축소 버튼을 둠.
  const canExpand = expand.limit?.canExpand ?? true;
  const shouldShowExpandAction =
    expand.isExpanded || (isOverflowing && canExpand);
  const formStyle: CssVariableStyle = {
    ...(expand.limit && {
      "--search-field-max-height": `${expand.limit.maxFieldHeight}px`,
      "--search-textarea-max-height": `${expand.limit.maxTextareaHeight}px`,
    }),
    ...(expand.metrics && {
      height: expand.metrics.slotHeight,
      "--search-expanded-height": `${expand.metrics.overlayHeight}px`,
    }),
  };

  function submitQuery() {
    if (!canSubmit) return;
    void navigate(buildInfluencerSearchUrl({ query, platform }));
  }

  function handleChangeQuery(event: ChangeEvent<HTMLTextAreaElement>) {
    const { value } = event.target;
    setQuery(value);
    if (value === "") expand.collapse();
  }

  // PC: Enter 제출·Shift+Enter 줄바꿈. 터치 기기: Enter는 줄바꿈이고 제출은 버튼으로만 함.
  // 한글 조합 중 Enter는 조합 확정이므로 제출하지 않음.
  function handleKeyDownQuery(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape" && expand.isExpanded) {
      expand.collapse();
      return;
    }
    if (event.key !== "Enter" || event.shiftKey || isTouch) return;
    if (event.nativeEvent.isComposing) return;
    event.preventDefault();
    submitQuery();
  }

  function handleClickExpand() {
    // 버튼이 mousedown에서 포커스를 가져가지 않으므로, 쓰던 중이었다면 지금도 입력창에 포커스가 있음.
    const wasTyping = document.activeElement === textareaRef.current;
    if (expand.isExpanded) expand.collapse();
    else expand.expand();
    // 버튼을 눌러도 계속 쓰고 Esc가 듣도록 입력창으로 포커스를 돌림. iOS는 탭 이벤트 안에서 동기로 focus해야 키보드가 유지됨.
    // 터치 기기에서 키보드가 내려가 있었으면 포커스를 주지 않아 키보드를 올리지 않음(읽으려고 펼치는 경우, 2026-11-02 사용자 결정).
    if (wasTyping || !isTouch) textareaRef.current?.focus();
  }

  function handleSubmitForm(event: FormEvent) {
    event.preventDefault();
    submitQuery();
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmitForm}
      className={cn("group relative", KEYBOARD_OPEN_SLOT_CLASS_NAME, className)}
      style={formStyle}
    >
      <TextField
        id={textareaId}
        name="q"
        ref={textareaRef}
        isWide
        className={fieldVariants({ phase: expand.phase })}
        textareaClassName={textareaVariants({
          isExpanded: expand.isExpanded,
          hasExpandAction: shouldShowExpandAction,
        })}
        inputAction={
          shouldShowExpandAction && (
            <Button
              type="button"
              variant="ghost-foreground"
              size="icon-xs"
              aria-label={
                expand.isExpanded ? t("expand.close") : t("expand.open")
              }
              // 버튼이 포커스를 가져가면 입력창이 blur되어 모바일 키보드가 내려감. mousedown의 기본 동작(포커스 이동)만 막고 동작은 click에서 함.
              onMouseDown={preventFocusLoss}
              onClick={handleClickExpand}
            >
              {expand.isExpanded ? (
                <Minimize2 key="close" className={ICON_SWAP_CLASS_NAME} />
              ) : (
                <Maximize2 key="open" className={ICON_SWAP_CLASS_NAME} />
              )}
            </Button>
          )
        }
        value={query}
        // Figma에 입력창 라벨이 없어 안내 문구를 접근성 이름으로 함께 씀.
        aria-label={t("query.placeholder")}
        placeholder={t("query.placeholder")}
        onChange={handleChangeQuery}
        onKeyDown={handleKeyDownQuery}
        leading={<PlatformSelect value={platform} onChange={setPlatform} />}
        submit={
          <Button type="submit" size="sm" disabled={!canSubmit}>
            <Search />
            {t("submit")}
          </Button>
        }
      />
    </form>
  );
}
