import { useEffect, useRef } from "react";

/**
 * 안 읽은 문의(`hasUnread`)를 열어 대화를 받으면 서버가 그 문의를 읽음 처리하지만, 목록은 다른 변경 신호가 오기 전까지
 * 다시 받지 않아 파란 점이 새로고침 전까지 남음. 대화를 받은 뒤(읽음 처리가 끝난 뒤)에 목록을 다시 받게 함.
 * 대화와 목록을 같이 받으면 읽기 전 값이 남으므로 반드시 대화를 받은 뒤에 부름(`refreshAll` 주석 참고).
 * 안 읽음 상태마다 한 번만 부름: 서버가 읽음으로 바꾸지 않아도 같은 요청을 되풀이하지 않고, 읽힌 뒤 다시 안 읽음이 되면 다시 부름.
 */
export function useRefreshListOnRead(
  inquiryKey: string,
  hasUnread: boolean,
  isLoaded: boolean,
  onRead?: () => void,
) {
  const refreshedKey = useRef<string | null>(null);
  const onReadRef = useRef(onRead);
  useEffect(() => {
    onReadRef.current = onRead;
  });
  useEffect(() => {
    if (!hasUnread) {
      // 읽힌 뒤 같은 문의에 새 메시지가 와 다시 안 읽음이 되면 한 번 더 부르도록 되돌림.
      refreshedKey.current = null;
      return;
    }
    if (!isLoaded || refreshedKey.current === inquiryKey) return;
    refreshedKey.current = inquiryKey;
    onReadRef.current?.();
  }, [inquiryKey, hasUnread, isLoaded]);
}
