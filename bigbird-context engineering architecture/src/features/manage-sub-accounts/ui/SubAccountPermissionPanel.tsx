import { ChevronLeft, X } from "lucide-react";
import { tryit } from "radash";
import { toast } from "sonner";

import { SubHeader } from "@/shared/components/app-header";
import { EmptyState } from "@/shared/components/empty-state";
import {
  SkeletonGroup,
  TableSkeleton,
} from "@/shared/components/skeleton-presets";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import {
  useCampaignAssignments,
  useSubAccountPermissions,
  useUpdateSubAccountPermission,
} from "../api/use-sub-account-permissions";
import { useCodeLabel } from "../lib/use-code-label";
import { CampaignAssignmentCards } from "./CampaignAssignmentCards";
import { PermissionSwitchList } from "./PermissionSwitchList";

import type {
  SubAccountPermission,
  SubAccountPermissionChange,
} from "../model/types";

interface SubAccountPermissionPanelProps {
  /** 권한을 다루는 Sub ID. 대상이 바뀌면 호출하는 쪽이 `key`로 새로 그려 이전 Sub ID의 상태가 남지 않게 함. */
  accountIdx: number;
  onClose: () => void;
  /** 있으면 제목 왼쪽에 뒤로 버튼을 그림(TAB의 본문 전체 카드). */
  onBack?: () => void;
  /** 카드 안에서 한 줄에 놓을 캠페인 카드 수 등 본문 배치. TAB은 2열. */
  campaignClassName?: string;
  className?: string;
}

// Figma Sub ID 권한부여(10724:186486 PC 패널·10724:186508·10724:187263 TAB·10724:187964 MO): 서브헤더(제목 + X) 아래 "서비스 권한 | 캠페인 할당" 탭.
// 서비스 권한은 스위치를 바꿀 때마다 바로 저장함(저장 버튼 없음). 캠페인 할당은 진행 상태 기준이 정해지기 전(docs/mypage-api.md §4-5)이라
// 개발 서버에서만 목으로 그리고 스위치는 "준비 중" 안내만 함.
export function SubAccountPermissionPanel({
  accountIdx,
  onClose,
  onBack,
  campaignClassName,
  className,
}: SubAccountPermissionPanelProps) {
  const { t } = useTranslation("features/manage-sub-accounts");
  const { t: tCommon } = useTranslation();

  return (
    <div
      className={cn("flex min-h-0 flex-1 flex-col bg-background", className)}
    >
      <SubHeader
        // TAB은 제목줄을 위에 고정(생성·수정 화면과 같음). MO는 탭 줄이 이미 고정돼 있어 뒤로 보내 겹치지 않게 하고, PC는 패널 안 고정 높이라 그대로 둠.
        className="sticky top-0 z-0 tablet:z-10 desktop:static"
        title={
          <>
            {onBack && (
              <Button
                type="button"
                variant="outline-foreground"
                size="icon-sm"
                aria-label={tCommon("action.back")}
                onClick={onBack}
              >
                <ChevronLeft />
              </Button>
            )}
            {t("access.permission.title")}
          </>
        }
        actions={
          <Button
            type="button"
            variant="ghost-foreground"
            size="icon"
            aria-label={tCommon("action.close")}
            onClick={onClose}
          >
            <X />
          </Button>
        }
      />
      <Tabs
        defaultValue="service"
        className="gap-4 p-4 tablet:p-5 desktop:min-h-0 desktop:flex-1 desktop:overflow-y-auto"
      >
        <TabsList className="w-full">
          <TabsTrigger value="service" className="flex-1">
            {t("access.tab.service")}
          </TabsTrigger>
          <TabsTrigger value="campaign" className="flex-1">
            {t("access.tab.campaign")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="service">
          <ServicePermissions accountIdx={accountIdx} />
        </TabsContent>
        <TabsContent value="campaign">
          <CampaignAssignments className={campaignClassName} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** 서비스 권한. 스위치를 바꾸면 화면에 바로 반영하고, 실패하면 이전 값으로 되돌린 뒤 오류 토스트. */
function ServicePermissions({ accountIdx }: { accountIdx: number }) {
  const { t } = useTranslation("features/manage-sub-accounts");
  const { t: tCommon } = useTranslation();
  const label = useCodeLabel();
  const { permissions, isLoading, isError, mutate } =
    useSubAccountPermissions(accountIdx);
  const updatePermission = useUpdateSubAccountPermission(accountIdx);

  async function handleChange(
    current: SubAccountPermission[],
    change: SubAccountPermissionChange,
  ) {
    const [error] = await tryit(updatePermission)(current, change);
    if (error) {
      toast.error(tCommon("feedback.saveFailed"));
      return;
    }
    const name = label.permission(change.key);
    toast(
      t(
        change.isGranted
          ? "access.permission.toast.granted"
          : "access.permission.toast.revoked",
        { name },
      ),
    );
  }

  if (isLoading) {
    return (
      <SkeletonGroup>
        <TableSkeleton columnClassNames={["w-20", "w-9"]} rowCount={1} />
      </SkeletonGroup>
    );
  }

  if (isError || !permissions) {
    return (
      <EmptyState
        type="alarm"
        title={tCommon("error.unexpected")}
        className="py-20"
        action={
          <Button variant="outline" onClick={() => void mutate()}>
            {tCommon("action.retry")}
          </Button>
        }
      />
    );
  }

  return (
    <PermissionSwitchList
      permissions={permissions}
      onChangePermission={(key, isGranted) =>
        void handleChange(permissions, { key, isGranted })
      }
    />
  );
}

/** 캠페인 할당. 빌드(stage·prod)에서는 목 대신 "준비 중"(스펙 §1). */
function CampaignAssignments({ className }: { className?: string }) {
  const { t } = useTranslation("features/manage-sub-accounts");
  const { t: tCommon } = useTranslation();
  const { campaigns } = useCampaignAssignments();

  if (!import.meta.env.DEV) {
    return (
      <EmptyState
        type="construction"
        title={tCommon("status.comingSoon")}
        className="py-20"
      />
    );
  }

  if (campaigns.length === 0) {
    return (
      <EmptyState
        type="no-list"
        title={t("access.campaign.empty")}
        className="py-20"
      />
    );
  }

  return (
    <CampaignAssignmentCards
      campaigns={campaigns}
      className={className}
      onChangeAssignment={() => toast(tCommon("status.comingSoon"))}
    />
  );
}
