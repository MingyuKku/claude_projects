import { useId } from "react";
import { toast } from "sonner";

import { useTranslation } from "@/shared/i18n";
import { openPostcodeSearch } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import type { CampaignAddress } from "@/entities/campaign";

interface AddressFieldProps {
  label: string;
  isRequired?: boolean;
  placeholder: string;
  /** 상세 주소 칸을 둘지. 매장 주소는 시안에 상세 칸이 없음. */
  hasDetail?: boolean;
  value: CampaignAddress | null;
  onChange: (next: CampaignAddress) => void;
  className?: string;
}

const EMPTY_ADDRESS: CampaignAddress = {
  zonecode: "",
  address: "",
  detail: "",
};

// 주소 입력(Figma 7718:363355): 읽기 전용 주소 칸 + "주소 검색" 버튼(Daum 우편번호 팝업에서 고름, 사용자가 고른 도로명 또는 지번)과
// 직접 입력하는 상세 주소 칸. 우편번호도 함께 저장함. 스크립트를 불러오지 못하면 실패 토스트를 띄움.
export function AddressField({
  label,
  isRequired = false,
  placeholder,
  hasDetail = true,
  value,
  onChange,
  className,
}: AddressFieldProps) {
  const { t } = useTranslation("features/register-campaign");
  const labelId = useId();
  const address = value ?? EMPTY_ADDRESS;

  async function handleClickSearch() {
    try {
      const result = await openPostcodeSearch();
      // 고르지 않고 닫았으면 바꾸지 않음. 고르면 상세 주소는 그대로 둠.
      if (result) {
        onChange({
          zonecode: result.zonecode,
          address: result.address,
          detail: address.detail,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error(t("addressSearch.failed"));
    }
  }

  return (
    <div className={className}>
      <div className="flex flex-col gap-2">
        <Label id={labelId} className="gap-0.5">
          {label}
          {isRequired && (
            <span aria-hidden="true" className="font-semibold text-primary">
              *
            </span>
          )}
        </Label>
        <div className="flex items-center gap-2">
          <Input
            readOnly
            aria-labelledby={labelId}
            value={address.address}
            placeholder={placeholder}
          />
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            onClick={() => void handleClickSearch()}
          >
            {t("addressSearch.button")}
          </Button>
        </div>
        {hasDetail && (
          <Input
            aria-label={t("addressSearch.detailPlaceholder")}
            autoComplete="off"
            value={address.detail}
            placeholder={t("addressSearch.detailPlaceholder")}
            onChange={(event) =>
              onChange({ ...address, detail: event.target.value })
            }
          />
        )}
      </div>
    </div>
  );
}
