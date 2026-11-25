import { Bookmark, ChevronRight } from "lucide-react";
import { tryit } from "radash";
import { useState } from "react";
import { toast } from "sonner";

import {
  CreatorPanel,
  saveBookmarks,
  SelectedCreatorSection,
  useCheckedTargets,
  useRefreshBookmarkFolders,
  useCreatorTerms,
} from "@/entities/creator";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import { FolderSelectSection } from "./FolderSelectSection";

import type { CreatorViewModel } from "@/entities/creator";

type MobileStep = "creators" | "folders";

interface SaveBookmarkPanelProps {
  /** 저장 창을 연 크리에이터. 처음엔 모두 체크됨. */
  targets: CreatorViewModel[];
  /** TAB부터는 두 열 한 화면, MO는 크리에이터 → 폴더 두 단계. */
  isTabletUp: boolean;
  onClose: () => void;
  /** 저장에 성공한 뒤. 보고 있는 목록을 다시 읽는 일은 부르는 쪽이 함. */
  onSaved: () => void;
  /** 여러 묶음 중 일부만 저장됐을 수 있어 목록을 다시 읽게 함. */
  onSaveFailed: () => void;
}

// 폴더와 크리에이터를 하나 이상 골라야 저장할 수 있음.
export function SaveBookmarkPanel({
  targets,
  isTabletUp,
  onClose,
  onSaved,
  onSaveFailed,
}: SaveBookmarkPanelProps) {
  const { term } = useCreatorTerms();
  const { t: tCommon } = useTranslation();
  const refreshFolders = useRefreshBookmarkFolders();
  const { checkedKeys, checkedTargets, changeChecked } =
    useCheckedTargets(targets);
  const [folderIdxs, setFolderIdxs] = useState<number[]>([]);
  const [mobileStep, setMobileStep] = useState<MobileStep>("creators");
  const [isSaving, setIsSaving] = useState(false);

  const isCreatorStepVisible = isTabletUp || mobileStep === "creators";
  const isFolderStepVisible = isTabletUp || mobileStep === "folders";
  const canSave =
    checkedTargets.length > 0 && folderIdxs.length > 0 && !isSaving;

  async function handleClickSave() {
    setIsSaving(true);
    const [error] = await tryit(saveBookmarks)(checkedTargets, folderIdxs);
    setIsSaving(false);

    void refreshFolders();
    if (error) {
      onSaveFailed();
      toast.error(tCommon("error.unexpected"));
      return;
    }
    onSaved();
  }

  return (
    <CreatorPanel title={term("saveBookmark")} onClose={onClose}>
      <div className="flex min-h-0 flex-1 ds-gap-5 ds-px-5 ds-pt-5">
        {isCreatorStepVisible && (
          <SelectedCreatorSection
            targets={targets}
            checkedKeys={checkedKeys}
            onChangeChecked={changeChecked}
          />
        )}
        {isFolderStepVisible && (
          <FolderSelectSection
            selectedFolderIdxs={folderIdxs}
            onChangeSelectedFolderIdxs={setFolderIdxs}
          />
        )}
      </div>
      <div className="grid shrink-0 ds-gap-5 ds-p-5 desktop:grid-cols-2">
        {/* PC는 저장 버튼이 오른쪽 열 폭만 차지함. */}
        <span aria-hidden className="hidden desktop:block" />
        {isFolderStepVisible ? (
          <Button disabled={!canSave} onClick={() => void handleClickSave()}>
            <Bookmark />
            {term("saveBookmark")}
          </Button>
        ) : (
          <Button
            variant="outline"
            disabled={checkedTargets.length === 0}
            onClick={() => setMobileStep("folders")}
          >
            {term("nextStep")}
            <ChevronRight />
          </Button>
        )}
      </div>
    </CreatorPanel>
  );
}
