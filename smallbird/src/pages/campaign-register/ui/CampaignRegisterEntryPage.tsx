import { useSearchParams } from "react-router";

import { NotFoundError } from "@/shared/lib";

import { parseRegisterEntry } from "../model/entry";
import { useCreateCampaignOnEntry } from "../model/use-create-campaign-on-entry";
import { RegisterComingSoon } from "./RegisterComingSoon";
import { RegisterShell } from "./RegisterShell";

// `/campaign/register?type=pick|recruit`: PICK형은 캠페인을 만들고(공구형은 `&product=group-buy`, 데모는 `&demo=true`)
// 작성 경로로 바꿈. 모집형은 준비 중, 그 밖의 `type`·`product`는 not-found(스펙 §3 경로).
export function CampaignRegisterEntryPage() {
  const [searchParams] = useSearchParams();
  const entry = parseRegisterEntry(searchParams);
  const { error } = useCreateCampaignOnEntry({
    isEnabled: entry.kind === "create",
    isDemo: entry.kind === "create" && entry.isDemo,
    productType: entry.kind === "create" ? entry.productType : "BRAND",
  });

  if (entry.kind === "invalid") throw new NotFoundError();
  if (error) throw error;

  return (
    <RegisterShell>
      {entry.kind === "comingSoon" && <RegisterComingSoon />}
    </RegisterShell>
  );
}
