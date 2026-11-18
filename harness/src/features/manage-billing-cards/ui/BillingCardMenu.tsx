import { CreditCard, EllipsisVertical, Trash2 } from "lucide-react";

import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import type { BillingCard } from "@/entities/subscription";

interface BillingCardMenuProps {
  card: BillingCard;
  onSelectDelete: (card: BillingCard) => void;
  onSelectChange: (card: BillingCard) => void;
}

// 기본 카드는 이미 결제 카드라 "카드 삭제"만 있음. 기본 카드 메뉴는 시안에 없으나 구독이 없을 때 마지막 카드까지
// 지울 수 있어야 해서 canDeleteCard가 허락할 때만 추가함(결제 중인 구독이 있으면 서버가 거절).
export function BillingCardMenu({
  card,
  onSelectDelete,
  onSelectChange,
}: BillingCardMenuProps) {
  const { t } = useTranslation("features/manage-billing-cards");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xss"
          className="shrink-0 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
          aria-label={t("menu.label", {
            issuer: card.issuer,
            number: card.maskedNumber,
          })}
        >
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-32">
        <DropdownMenuItem onSelect={() => onSelectDelete(card)}>
          <Trash2 />
          {t("menu.delete")}
        </DropdownMenuItem>
        {!card.isDefault && (
          <DropdownMenuItem onSelect={() => onSelectChange(card)}>
            <CreditCard />
            {t("menu.setDefault")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
