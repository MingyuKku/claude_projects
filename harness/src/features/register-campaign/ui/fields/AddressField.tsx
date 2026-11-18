import { tryit } from "radash";
import { toast } from "sonner";

import { FormField } from "@/shared/components/form-field";
import { useTranslation } from "@/shared/i18n";
import { openPostcodeSearch } from "@/shared/lib";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import type { CampaignAddress } from "@/entities/campaign";

interface AddressFieldProps {
  label: string;
  placeholder: string;
  value: CampaignAddress | null;
  onChangeValue: (value: CampaignAddress | null) => void;
}

// 주소 칸: 읽기 전용 주소 + "주소 검색"(Daum 우편번호 팝업) + 상세 주소 직접 입력(스펙 §3 2단계).
// 스크립트를 불러오지 못하면 실패 토스트.
export function AddressField({
  label,
  placeholder,
  value,
  onChangeValue,
}: AddressFieldProps) {
  const { t } = useTranslation("features/register-campaign");

  async function handleClickSearch() {
    const [error, result] = await tryit(openPostcodeSearch)();
    if (error) {
      toast.error(t("toast.addressSearchFailed"));
      return;
    }
    if (result) onChangeValue({ ...result, detail: value?.detail ?? "" });
  }

  function handleChangeDetail(detail: string) {
    onChangeValue({
      zonecode: value?.zonecode ?? "",
      address: value?.address ?? "",
      detail,
    });
  }

  return (
    <FormField label={label} isRequired>
      {(control) => (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              {...control}
              readOnly
              value={value?.address ?? ""}
              placeholder={placeholder}
              className="min-w-0 flex-1"
              onClick={() => void handleClickSearch()}
            />
            <Button variant="outline" onClick={() => void handleClickSearch()}>
              {t("address.search")}
            </Button>
          </div>
          <Input
            aria-label={t("address.detail")}
            value={value?.detail ?? ""}
            placeholder={t("address.detail")}
            onChange={(event) => handleChangeDetail(event.target.value)}
          />
        </div>
      )}
    </FormField>
  );
}
