import { Ellipsis } from "lucide-react";

import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

interface LoginMoreMenuProps {
  onSelectPrivacy: () => void;
  onSelectTerms: () => void;
}

/** 모바일 상단 "…" 메뉴. 태블릿 이상은 화면 아래 약관 버튼을 씀. */
export function LoginMoreMenu({
  onSelectPrivacy,
  onSelectTerms,
}: LoginMoreMenuProps) {
  const { t } = useTranslation("pages/login");
  const { t: tCommon } = useTranslation();

  return (
    <div className="flex h-13 items-center justify-end px-1.5 py-1 tablet:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost-foreground"
            size="icon"
            aria-label={t("moreLabel")}
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-43.5">
          <DropdownMenuItem className="h-9" onSelect={onSelectPrivacy}>
            {tCommon("link.privacy")}
          </DropdownMenuItem>
          <DropdownMenuItem className="h-9" onSelect={onSelectTerms}>
            {tCommon("link.terms")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
