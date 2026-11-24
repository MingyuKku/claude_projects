import { MEDIA_QUERY } from "@/shared/config";
import { useMediaQuery } from "@/shared/lib";

import type { ReactNode } from "react";

interface ColumnFieldsProps {
  /** PC 왼쪽 열 */
  left: ReactNode;
  /** PC 오른쪽 열 */
  right: ReactNode;
  /** TAB·MO 1열 */
  stacked: ReactNode;
}

// PC 2열과 TAB·MO 1열의 필드 순서가 달라 기기별로 DOM을 따로 그림. CSS order로 바꾸면 키보드 이동 순서가 화면 순서와 어긋남.
export function ColumnFields({ left, right, stacked }: ColumnFieldsProps) {
  const isDesktop = useMediaQuery(MEDIA_QUERY.desktop);

  if (!isDesktop) {
    return <div className="flex flex-col ds-gap-4">{stacked}</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="flex min-w-0 flex-col ds-gap-4">{left}</div>
      <div className="flex min-w-0 flex-col ds-gap-4">{right}</div>
    </div>
  );
}
