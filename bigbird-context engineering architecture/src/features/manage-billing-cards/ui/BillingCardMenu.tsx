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

// Figma 여분 카드 ⋮ 메뉴(7430:163829): (trash) 카드 삭제 · (credit-card) 결제 카드로 등록. 기본 카드에는 메뉴가 없음.
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
        <DropdownMenuItem onSelect={() => onSelectChange(card)}>
          <CreditCard />
          {t("menu.setDefault")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
