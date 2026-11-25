import { CreatorSheet } from "@/entities/creator";
import { useTranslation } from "@/shared/i18n";

import { ManageFoldersPanel } from "./ManageFoldersPanel";

interface ManageFoldersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onSaveFailed: () => void;
}

export function ManageFoldersSheet({
  isOpen,
  onClose,
  onSaved,
  onSaveFailed,
}: ManageFoldersSheetProps) {
  const { t } = useTranslation("features/manage-folders");

  return (
    <CreatorSheet
      isOpen={isOpen}
      title={t("title")}
      onClose={onClose}
      className="w-104.5"
    >
      <ManageFoldersPanel
        onClose={onClose}
        onSaved={onSaved}
        onSaveFailed={onSaveFailed}
      />
    </CreatorSheet>
  );
}
