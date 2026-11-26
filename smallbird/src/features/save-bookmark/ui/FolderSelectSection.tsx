import { Plus } from "lucide-react";
import { useState } from "react";

import {
  LoadError,
  NewFolderCard,
  SelectableCard,
  useBookmarkFolders,
  useCreatorTerms,
} from "@/entities/creator";
import { SummaryCardAvatars } from "@/shared/components/cards";
import { ScrollPanel } from "@/shared/components/scroll-panel";
import { SkeletonGroup } from "@/shared/components/skeleton-presets";
import { formatNumber, useTranslation } from "@/shared/i18n";
import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import type { Dispatch, SetStateAction } from "react";

const SKELETON_COUNT = 3;

interface FolderSelectSectionProps {
  selectedFolderIdxs: number[];
  onChangeSelectedFolderIdxs: Dispatch<SetStateAction<number[]>>;
}

// 폴더는 여러 개 고를 수 있고, 새로 만든 폴더는 고른 상태로 둠. `전체`는 저장 대상이 아니라 뺌.
export function FolderSelectSection({
  selectedFolderIdxs,
  onChangeSelectedFolderIdxs,
}: FolderSelectSectionProps) {
  const { t } = useTranslation("features/save-bookmark");
  const { term } = useCreatorTerms();
  const { folders, isLoading, isError, reload } = useBookmarkFolders();
  const [isCreating, setIsCreating] = useState(false);

  const userFolders = folders.flatMap(({ folderIdx, ...folder }) =>
    folderIdx === null ? [] : [{ ...folder, folderIdx }],
  );

  function toggleFolder(folderIdx: number) {
    onChangeSelectedFolderIdxs((current) =>
      current.includes(folderIdx)
        ? current.filter((idx) => idx !== folderIdx)
        : [...current, folderIdx],
    );
  }

  function handleCreated(folderIdx: number) {
    onChangeSelectedFolderIdxs((current) => [...current, folderIdx]);
    setIsCreating(false);
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
      <h3 className="ds-text-sm-none-semibold text-foreground">
        {t("folders.title")}
      </h3>
      <Button
        variant="outline"
        className="w-full"
        disabled={isLoading || isError}
        onClick={() => setIsCreating(true)}
      >
        <Plus />
        {term("newFolder")}
      </Button>
      {/* 고른 카드의 바깥 링이 스크롤 영역에 잘리지 않게 링 폭만큼 여백을 둠. */}
      <ScrollPanel
        className="-m-1 flex-1"
        contentClassName="flex flex-col gap-3 p-1"
      >
        {isCreating && <NewFolderCard onCreated={handleCreated} />}
        {isError && <LoadError onClickRetry={() => void reload()} />}
        {isLoading && (
          <SkeletonGroup className="flex flex-col gap-3">
            {Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </SkeletonGroup>
        )}
        {userFolders.map((folder) => {
          const isSelected = selectedFolderIdxs.includes(folder.folderIdx);
          return (
            <SelectableCard
              key={folder.folderIdx}
              role="checkbox"
              isSelected={isSelected}
              className="shrink-0"
              title={folder.name}
              aside={t("folders.member", {
                count: folder.count,
                value: formatNumber(folder.count),
              })}
              onSelect={() => toggleFolder(folder.folderIdx)}
            >
              <SummaryCardAvatars className="h-8">
                {folder.avatarUrls.map((url, index) => (
                  <Avatar key={`${index}-${url}`} size="sm">
                    <AvatarImage src={url} alt="" />
                    <AvatarPlaceholder />
                  </Avatar>
                ))}
              </SummaryCardAvatars>
            </SelectableCard>
          );
        })}
      </ScrollPanel>
    </section>
  );
}
