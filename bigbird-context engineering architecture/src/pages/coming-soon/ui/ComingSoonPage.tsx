import { EmptyState } from "@/shared/components/empty-state";
import { useTranslation } from "@/shared/i18n";
import { SessionAppShell } from "@/widgets/app-shell";

// 정식 디자인이 나오기 전까지 쓰는 임시 "준비 중" 화면. 셸 안에 표시하고, 디자인이 나오면 교체함.
export function ComingSoonPage() {
  const { t } = useTranslation("pages/coming-soon");

  return (
    <>
      <title>{t("title")}</title>
      {/* 인플루언서 검색 화면은 Figma 시안이 없어 헤더 제목과 LNB 활성 항목을 "인플루언서"로 임시 처리함. */}
      <SessionAppShell activeNavId="influencerMatching">
        <div className="flex min-h-full items-center justify-center">
          <EmptyState type="construction" title={t("title")} />
        </div>
      </SessionAppShell>
    </>
  );
}
