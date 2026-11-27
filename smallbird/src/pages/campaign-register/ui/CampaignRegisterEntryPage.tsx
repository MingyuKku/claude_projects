import { RegisterComingSoon } from "./RegisterComingSoon";
import { RegisterShell } from "./RegisterShell";

// `/campaign/register?type=recruit`: 모집형은 준비 중. PICK형 생성과 잘못된 주소는 진입 loader가 처리해 여기까지 오지 않음.
export function CampaignRegisterEntryPage() {
  return (
    <RegisterShell>
      <RegisterComingSoon />
    </RegisterShell>
  );
}
