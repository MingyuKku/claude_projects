import { isCompanyInfoComplete } from "@/entities/account";
import {
  BankAccountFormSkeleton,
  BankAccountSection,
} from "@/features/edit-bank-account";
import { SkeletonGroup } from "@/shared/components/skeleton-presets";
import { useTranslation } from "@/shared/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

import { MasterAccountGate } from "./MasterAccountGate";

interface BankAccountTabProps {
  /** "확인": 회사정보 탭으로 이동 */
  onGoCompany: () => void;
  /** "취소"·닫기: 계좌정보를 열지 않고 기본 탭으로 돌아감 */
  onLeave: () => void;
}

// 계좌정보는 회사정보 필수 항목이 모두 등록된 Master만 다룰 수 있음. 아니면 Figma 얼럿(10061:240624)으로 안내함.
// 회사정보를 읽는 Master 조회와 같은 SWR 키라 회사정보 탭에서 저장하면 여기도 바로 갱신됨.
export function BankAccountTab({ onGoCompany, onLeave }: BankAccountTabProps) {
  const { t } = useTranslation("pages/mypage-account");
  const { t: tCommon } = useTranslation();

  return (
    <MasterAccountGate
      skeleton={
        <SkeletonGroup>
          <BankAccountFormSkeleton />
        </SkeletonGroup>
      }
    >
      {(master) =>
        isCompanyInfoComplete(master.company) ? (
          <BankAccountSection />
        ) : (
          <AlertDialog
            open
            onOpenChange={(open) => {
              if (!open) onLeave();
            }}
          >
            <AlertDialogContent className="p-6">
              <AlertDialogHeader>
                <AlertDialogTitle>{t("bankGuard.title")}</AlertDialogTitle>
                <AlertDialogDescription className="leading-6">
                  {t("bankGuard.description")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel variant="outline-foreground">
                  {tCommon("action.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(event) => {
                    // 기본 닫힘 동작을 막음(닫힘이 onLeave로 이어져 기본 탭으로 덮어쓰이는 것 방지).
                    event.preventDefault();
                    onGoCompany();
                  }}
                >
                  {tCommon("action.confirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      }
    </MasterAccountGate>
  );
}
