import {
  CompanyInfoForm,
  CompanyInfoFormSkeleton,
} from "@/features/edit-company-info";
import { SkeletonGroup } from "@/shared/components/skeleton-presets";

import { MasterAccountGate } from "./MasterAccountGate";

export function CompanyInfoTab() {
  return (
    <MasterAccountGate
      skeleton={
        <SkeletonGroup>
          <CompanyInfoFormSkeleton />
        </SkeletonGroup>
      }
    >
      {(master, refresh) => (
        <CompanyInfoForm company={master.company} onSaved={refresh} />
      )}
    </MasterAccountGate>
  );
}
