import { FormField } from "@/shared/components/form-field";
import { PriceField } from "@/shared/components/text-field";
import { formatNumber, useTranslation } from "@/shared/i18n";
import { Input } from "@/shared/ui/input";

import { sanitizeContactInput } from "../../../lib/contact-input";
import { parseNumberInput } from "../../../lib/number-input";
import { AddressField } from "../../fields/AddressField";

import type { CampaignAddress } from "@/entities/campaign";

interface PickupFieldsProps {
  labels: {
    address: string;
    fee: string;
    contact: string;
  };
  placeholders: {
    address: string;
    fee: string;
    contact: string;
  };
  address: CampaignAddress | null;
  fee: number | null;
  contact: string | null;
  onChangeAddress: (address: CampaignAddress) => void;
  onChangeFee: (fee: number | null) => void;
  onChangeContact: (contact: string) => void;
}

// 회수 입력 묶음: 회수 택배 주소(+ 상세 주소) · 택배 비용 · 연락처. 반품 회수(회수 있음)와 대여 상품 회수가 같은 모양이고 문구만 다름
// (Figma 7718:363355·7718:358583). 비용과 연락처는 TAB 이상에서 두 칸으로 나란히 놓이고 MO(7816:61339)는 세로로 쌓임.
export function PickupFields({
  labels,
  placeholders,
  address,
  fee,
  contact,
  onChangeAddress,
  onChangeFee,
  onChangeContact,
}: PickupFieldsProps) {
  const { t } = useTranslation("features/register-campaign");

  return (
    <div className="flex flex-col gap-4">
      <AddressField
        label={labels.address}
        isRequired
        placeholder={placeholders.address}
        value={address}
        onChange={onChangeAddress}
      />
      <div className="grid grid-cols-1 gap-4 tablet:grid-cols-2 tablet:gap-3">
        <PriceField
          label={labels.fee}
          isRequired
          unit={t("product.pickup.feeUnit")}
          placeholder={placeholders.fee}
          autoComplete="off"
          value={fee === null ? "" : formatNumber(fee)}
          onChange={(event) =>
            onChangeFee(parseNumberInput(event.target.value))
          }
        />
        <FormField label={labels.contact} isRequired>
          {(control) => (
            <Input
              {...control}
              inputMode="tel"
              autoComplete="off"
              value={contact ?? ""}
              placeholder={placeholders.contact}
              onChange={(event) =>
                onChangeContact(sanitizeContactInput(event.target.value))
              }
            />
          )}
        </FormField>
      </div>
    </div>
  );
}
