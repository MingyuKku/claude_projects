const MB = 1024 * 1024;

// 요구명세서 REQ-23-0009·0018과 사용자 결정(2026-10-29·30): 이미지 30MB·10개, 동영상 50MB·5개,
// 문서(기타 파일)는 30MB(REQ-23-0009 파랑).
export const ATTACHMENT_LIMITS = {
  image: {
    extensions: ["jpg", "jpeg", "png", "webp"],
    maxBytes: 30 * MB,
    maxCount: 10,
  },
  video: {
    extensions: ["avi", "mp4", "mov", "mpeg"],
    maxBytes: 50 * MB,
    maxCount: 5,
  },
  file: {
    extensions: ["pdf", "txt", "doc", "docx", "xls", "xlsx", "ppt", "pptx"],
    maxBytes: 30 * MB,
    maxCount: 10,
  },
} as const;

/** 한 번에 담을 수 있는 파일 수(이미지·동영상·문서 합계). 동영상은 그중 `video.maxCount`개까지(사용자 지시 2026-10-20). */
export const ATTACHMENT_TOTAL_MAX_COUNT = 10;

export type AttachmentKind = keyof typeof ATTACHMENT_LIMITS;

/** 오류 Alert 6종 중 하나(공통 "파일당 30MB" 문구는 쓰지 않고 유형별로 안내함). */
export type AttachmentError =
  | "format"
  | "imageSize"
  | "videoSize"
  | "fileSize"
  | "imageCount"
  | "videoCount";

const SIZE_ERROR = {
  image: "imageSize",
  video: "videoSize",
  file: "fileSize",
} as const satisfies Record<AttachmentKind, AttachmentError>;

export function getAttachmentKind(
  file: Pick<File, "name">,
): AttachmentKind | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const kinds = Object.keys(ATTACHMENT_LIMITS) as AttachmentKind[];
  return (
    kinds.find((kind) =>
      (ATTACHMENT_LIMITS[kind].extensions as readonly string[]).includes(
        extension,
      ),
    ) ?? null
  );
}

/**
 * 입력창에 이미 있는 파일(`current`)에 새로 고른 파일(`incoming`)을 더해도 되는지 검사함.
 * 하나라도 걸리면 전부 받지 않고 첫 오류 하나만 돌려줌(일부만 담기면 무엇이 빠졌는지 알기 어려움).
 * 파일 수는 합쳐서 10개까지이고 동영상은 그중 5개까지. 합계가 넘으면 "파일은 최대 10개" 안내(imageCount)를 씀.
 */
export function checkAttachments(
  current: readonly Pick<File, "name" | "size">[],
  incoming: readonly Pick<File, "name" | "size">[],
): AttachmentError | null {
  const counts = { image: 0, video: 0, file: 0 };
  for (const file of current) {
    const kind = getAttachmentKind(file);
    if (kind) counts[kind] += 1;
  }
  for (const file of incoming) {
    const kind = getAttachmentKind(file);
    if (!kind) return "format";
    if (file.size > ATTACHMENT_LIMITS[kind].maxBytes) return SIZE_ERROR[kind];
    counts[kind] += 1;
  }
  if (counts.video > ATTACHMENT_LIMITS.video.maxCount) return "videoCount";
  if (counts.image + counts.video + counts.file > ATTACHMENT_TOTAL_MAX_COUNT)
    return "imageCount";
  return null;
}

/** 파일 카드의 용량 표기(Figma "2.5MB"). 1024 단위, 소수 첫째 자리까지. */
export function formatFileSize(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = unit === 0 ? value : Math.round(value * 10) / 10;
  return `${rounded}${units[unit]}`;
}
