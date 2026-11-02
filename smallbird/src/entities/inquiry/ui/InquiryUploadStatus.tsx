import { LoaderCircle } from "lucide-react";

import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Progress } from "@/shared/ui/progress";

import { retryInquiryUploads, useInquiryUploadJob } from "../model/upload-jobs";

/**
 * 이 문의로 올리는 중이거나 실패한 첨부의 진행 줄. 올라간 파일은 모두 끝난 뒤 대화에 한꺼번에 나타남.
 * 빅버드 문의 대화와 구매자 문의 입력창이 같이 씀.
 */
export function InquiryUploadStatus({ threadIdx }: { threadIdx: number }) {
  const { t } = useTranslation();
  const job = useInquiryUploadJob(threadIdx);
  if (!job) return null;

  const progress = t("attachment.upload.progress", {
    sent: job.sentCount,
    total: job.files.length,
  });
  return (
    <div className="flex shrink-0 flex-col gap-2 border-t bg-background px-4 py-3">
      {job.status === "failed" ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-destructive">
            {t("attachment.upload.failed", {
              count: job.files.length - job.sentCount,
            })}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => retryInquiryUploads(threadIdx)}
          >
            {t("attachment.upload.retry")}
          </Button>
        </div>
      ) : (
        <>
          <p
            role="status"
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            {progress}
          </p>
          <Progress
            size="xs"
            value={(job.sentCount / job.files.length) * 100}
            aria-label={progress}
          />
        </>
      )}
    </div>
  );
}
