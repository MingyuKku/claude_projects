import { useMasterAccount } from "@/entities/account";
import { EmptyState } from "@/shared/components/empty-state";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import type { MasterAccountViewModel } from "@/entities/account";
import type { ReactNode } from "react";

interface MasterAccountGateProps {
  skeleton: ReactNode;
  children: (master: MasterAccountViewModel, refresh: () => void) => ReactNode;
}

// Master 정보를 읽는 탭이 함께 쓰는 로딩·오류 처리. 같은 SWR 키라 탭을 오가도 한 번만 요청함.
export function MasterAccountGate({
  skeleton,
  children,
}: MasterAccountGateProps) {
  const { t: tCommon } = useTranslation();
  const { master, isLoading, isError, mutate } = useMasterAccount(true);

  if (isLoading) return skeleton;

  if (isError || !master) {
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

  return children(master, () => void mutate());
}
