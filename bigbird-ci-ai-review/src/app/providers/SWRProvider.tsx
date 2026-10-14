import { SWRConfig } from "swr";

import type { ReactNode } from "react";

interface SWRProviderProps {
  children: ReactNode;
}

// 전역 SWR 기본값. 포커스 때마다 재검증하면 폼 입력 중 화면이 흔들릴 수 있어 끈다.
// 개별 훅에서 필요하면 옵션으로 다시 켠다.
export function SWRProvider({ children }: SWRProviderProps) {
  return <SWRConfig value={{ revalidateOnFocus: false }}>{children}</SWRConfig>;
}
