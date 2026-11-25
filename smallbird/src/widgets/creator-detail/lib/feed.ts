import { formatDate, formatNumber } from "@/shared/i18n";

import type { SnsPostMetrics } from "@/shared/components/cards";

const TRAILING_HASHTAGS = /(?:\s*#[^\s#]+)+\s*$/u;

/** 본문 끝의 해시태그 묶음을 떼어 냄. 문장 중간의 해시태그는 본문에 남김. */
export function splitHashtags(content: string) {
  const [trailing = ""] = TRAILING_HASHTAGS.exec(content) ?? [];
  return {
    text: content.slice(0, content.length - trailing.length).trim(),
    hashtags: trailing.match(/#[^\s#]+/gu) ?? [],
  };
}

interface PostCounts {
  viewCount?: number | null;
  likeCount?: number | null;
  commentCount?: number | null;
  shareCount?: number | null;
}

function formatCount(value: number | null | undefined) {
  return value == null ? undefined : formatNumber(value);
}

export function getPostMetrics(counts: PostCounts): SnsPostMetrics {
  return {
    views: formatCount(counts.viewCount),
    likes: formatCount(counts.likeCount),
    comments: formatCount(counts.commentCount),
    reposts: formatCount(counts.shareCount),
  };
}

export function formatPostDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  // 한국어 표기 끝의 마침표는 시안에 없음.
  return formatDate(date, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\.$/, "");
}
