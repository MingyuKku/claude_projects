import { cva } from "class-variance-authority";
import { Maximize2, Minimize2, Search } from "lucide-react";
import { useId, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { TextField } from "@/shared/components/text-field";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib/useMediaQuery";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { buildInfluencerSearchUrl } from "../lib/build-search-url";
import { focusTextareaAtEnd } from "../lib/focus-textarea-at-end";
import {
  DESKTOP_MEDIA_QUERY,
  MAX_QUERY_LENGTH,
  MOBILE_MEDIA_QUERY,
  TOUCH_MEDIA_QUERY,
} from "../model/constants";
import { useExpandedQueryDialog } from "../model/useExpandedQueryDialog";
import { useTextareaOverflow } from "../model/useTextareaOverflow";
import { ExpandedQueryDialog } from "./ExpandedQueryDialog";
import { PlatformSelect } from "./PlatformSelect";

import type { InfluencerPlatform } from "@/entities/platform";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";

// 높이를 줄 수(lh = 이 입력의 line-height)로 정해 글자 크기·줄 간격이 바뀌어도 최소 2줄·최대 3줄을 유지함.
// 아이콘이 스크롤바 오른쪽에 붙으므로 스크롤바 자리를 미리 잡아 줄 수가 바뀔 때 글 폭이 흔들리지 않게 함.
const wideTextareaVariants = cva("", {
  variants: {
    height: {
      fixed: "h-[min(50dvh,24rem)] min-h-[2lh] max-h-none",
      auto: "h-auto min-h-[2lh] max-h-[3lh]",
    },
    hasExpandAction: {
      true: "[scrollbar-gutter:stable]",
      false: "",
    },
  },
});

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
  const [platform, setPlatform] = useState<InfluencerPlatform>();
  // 문구가 한 줄을 넘으면 wide가 되고, 문구를 모두 지웠을 때만 한 줄로 돌아감. 플랫폼을 골라도 한 줄 그대로.
  const [isExpanded, setIsExpanded] = useState(false);
  // PC(1440 이상)에서는 모달 없이 입력창 높이만 키움.
  const [isInlineExpanded, setIsInlineExpanded] = useState(false);
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY);
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY);
  const isTouch = useMediaQuery(TOUCH_MEDIA_QUERY);
  const dialog = useExpandedQueryDialog({
    isDesktop,
    onCloseFocus: () => focusTextareaAtEnd(textareaRef.current),
  });

  const isWide = isMobile || isExpanded;
  const isInlineExpandedNow = isDesktop && isInlineExpanded;
  const { isOverflowing } = useTextareaOverflow({
    textareaRef,
    isWide,
    isInlineExpanded: isInlineExpandedNow,
    query,
  });
  const canSubmit = query.trim() !== "";
  const shouldShowExpandAction = isOverflowing || isInlineExpandedNow;
  const wideTextareaClassName = wideTextareaVariants({
    height: isInlineExpandedNow ? "fixed" : "auto",
    hasExpandAction: shouldShowExpandAction,
  });

  function submitQuery() {
    if (!canSubmit) return;
    const { shouldReplace } = dialog.closeForNavigation();
    void navigate(buildInfluencerSearchUrl({ query, platform }), {
      replace: shouldReplace,
    });
  }

  function handleChangeQuery(event: ChangeEvent<HTMLTextAreaElement>) {
    const { value, scrollHeight, clientHeight } = event.target;
    setQuery(value);
    if (value === "") {
      setIsExpanded(false);
      setIsInlineExpanded(false);
    } else if (scrollHeight > clientHeight) setIsExpanded(true);
  }

  // PC: Enter 제출·Shift+Enter 줄바꿈. 터치 기기: Enter는 줄바꿈이고 제출은 버튼으로만 함.
  // 한글 조합 중 Enter는 조합 확정이므로 제출하지 않음.
  function handleKeyDownQuery(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || isTouch) return;
    if (event.nativeEvent.isComposing) return;
    event.preventDefault();
    submitQuery();
  }

  function handleChangePlatform(next: InfluencerPlatform) {
    setPlatform(next);
  }

  function handleClickExpand() {
    if (isDesktop) setIsInlineExpanded(!isInlineExpanded);
    else dialog.open();
  }

  function handleSubmitForm(event: FormEvent) {
    event.preventDefault();
    submitQuery();
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmitForm}
      className={cn("group", className)}
    >
      <TextField
        id={textareaId}
        name="q"
        ref={textareaRef}
        isWide={isWide}
        textareaClassName={isWide ? wideTextareaClassName : undefined}
        inputAction={
          shouldShowExpandAction && (
            <Button
              type="button"
              variant="ghost-foreground"
              size="icon-xs"
              aria-label={
                isInlineExpandedNow ? t("expand.close") : t("expand.open")
              }
              onClick={handleClickExpand}
            >
              {isInlineExpandedNow ? <Minimize2 /> : <Maximize2 />}
            </Button>
          )
        }
        value={query}
        maxLength={MAX_QUERY_LENGTH}
        // Figma에 입력창 라벨이 없어 안내 문구를 접근성 이름으로 함께 씀.
        aria-label={t("query.placeholder")}
        placeholder={t("query.placeholder")}
        onChange={handleChangeQuery}
        onKeyDown={handleKeyDownQuery}
        leading={
          <PlatformSelect value={platform} onChange={handleChangePlatform} />
        }
        submit={
          isWide ? (
            <Button type="submit" size="sm" disabled={!canSubmit}>
              <Search />
              {t("submit")}
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon-sm"
              aria-label={t("submit")}
              disabled={!canSubmit}
            >
              <Search />
            </Button>
          )
        }
      />
      <ExpandedQueryDialog
        anchorRef={formRef}
        open={dialog.isOpen}
        query={query}
        maxLength={MAX_QUERY_LENGTH}
        platform={platform}
        canSubmit={canSubmit}
        onChangeQuery={handleChangeQuery}
        onKeyDownQuery={handleKeyDownQuery}
        onChangePlatform={handleChangePlatform}
        onSubmitQuery={submitQuery}
        onCloseDialog={dialog.closeByUser}
        onFocusQueryOnClose={() => focusTextareaAtEnd(textareaRef.current)}
      />
    </form>
  );
}
