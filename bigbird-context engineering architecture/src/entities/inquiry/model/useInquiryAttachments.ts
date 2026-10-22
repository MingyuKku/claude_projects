import { useEffect, useRef, useState } from "react";

import {
  ATTACHMENT_TOTAL_MAX_COUNT,
  checkAttachments,
  getAttachmentKind,
} from "../lib/attachment-rules";
import { getVideoPoster } from "../lib/video-poster";

import type { AttachmentError } from "../lib/attachment-rules";

export interface InquiryAttachmentItem {
  file: File;
  /** 썸네일용 미리보기 주소. 제거·초기화·화면 이탈 때 해제함. */
  url: string;
  /** 동영상의 첫 장면. 뽑는 동안과 뽑지 못했을 때는 없음. */
  poster?: string;
}

/**
 * 입력창에 담아 둔 첨부 파일. 규칙에 어긋나면 하나도 담지 않고 `error`에 이유를 둠.
 * 업로드는 전송할 때 하므로 여기서는 파일만 들고 있음.
 */
export function useInquiryAttachments() {
  const [items, setItems] = useState<InquiryAttachmentItem[]>([]);
  const [error, setError] = useState<AttachmentError | null>(null);
  const latest = useRef(items);
  useEffect(() => {
    latest.current = items;
  });
  // 화면을 떠날 때 남은 미리보기 주소를 해제함. 담기 전에는 비어 있어 StrictMode의 가짜 언마운트에도 안전함.
  useEffect(
    () => () => latest.current.forEach((item) => URL.revokeObjectURL(item.url)),
    [],
  );

  function add(incoming: File[]) {
    if (incoming.length === 0) return;
    const reason = checkAttachments(
      items.map((item) => item.file),
      incoming,
    );
    if (reason) {
      setError(reason);
      return;
    }
    const added = incoming.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setItems([...items, ...added]);
    for (const { file, url } of added) {
      if (getAttachmentKind(file) !== "video") continue;
      void getVideoPoster(url).then((poster) => {
        if (!poster) return;
        setItems((current) =>
          current.map((item) =>
            item.file === file ? { ...item, poster } : item,
          ),
        );
      });
    }
  }

  function remove(index: number) {
    const target = items[index];
    if (!target) return;
    URL.revokeObjectURL(target.url);
    setItems(items.filter((_, i) => i !== index));
  }

  /** 전송을 마친 파일만 뺌. 비동기 전송 중에 목록이 바뀌어도 다른 파일을 건드리지 않게 파일 자체로 찾음. */
  function removeSent(file: File) {
    const target = latest.current.find((item) => item.file === file);
    if (target) URL.revokeObjectURL(target.url);
    setItems((current) => current.filter((item) => item.file !== file));
  }

  function reset() {
    items.forEach((item) => URL.revokeObjectURL(item.url));
    setItems([]);
  }

  /**
   * 이미 가득 찼으면(10개) 파일 선택창을 열기 전에 개수 초과 안내를 바로 띄우고 true를 돌려줌.
   * 선택창에서 골라도 어차피 담을 수 없는 상태라 사용자가 헛걸음하지 않게 함.
   */
  function rejectIfFull() {
    if (items.length < ATTACHMENT_TOTAL_MAX_COUNT) return false;
    setError("imageCount");
    return true;
  }

  return {
    items,
    files: items.map((item) => item.file),
    error,
    add,
    rejectIfFull,
    remove,
    removeSent,
    reset,
    clearError: () => setError(null),
  };
}

export type InquiryAttachments = ReturnType<typeof useInquiryAttachments>;
