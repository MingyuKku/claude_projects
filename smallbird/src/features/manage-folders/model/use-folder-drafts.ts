import { useState } from "react";

import { useBookmarkFolders } from "@/entities/creator";

import { hasDraftChanges, toFolderDrafts } from "./folder-draft";

import type { FolderDraft } from "./folder-draft";

/** 저장을 누르기 전까지 화면에만 두는 폴더 목록. */
export function useFolderDrafts() {
  const { folders, isLoading, isError, reload } = useBookmarkFolders();
  // 고치기 시작할 때의 서버 목록. 그 사이 목록이 다시 읽혀도 바뀐 점을 이것과 비교함.
  const [edited, setEdited] = useState<{
    original: FolderDraft[];
    drafts: FolderDraft[];
  } | null>(null);
  const [newCount, setNewCount] = useState(0);

  const serverDrafts = toFolderDrafts(folders);
  const { original, drafts } = edited ?? {
    original: serverDrafts,
    drafts: serverDrafts,
  };

  function change(next: FolderDraft[]) {
    setEdited({ original, drafts: next });
  }

  return {
    allFolder: folders.find((folder) => folder.folderIdx === null),
    original,
    drafts,
    isLoading,
    isError: isError && folders.length === 0,
    reload,
    hasChanges: hasDraftChanges(original, drafts),
    add: (name: string) => {
      change([
        ...drafts,
        { id: `new-${newCount}`, folderIdx: null, name, count: 0 },
      ]);
      setNewCount(newCount + 1);
    },
    rename: (id: string, name: string) =>
      change(drafts.map((item) => (item.id === id ? { ...item, name } : item))),
    remove: (id: string) => change(drafts.filter((item) => item.id !== id)),
    move: (fromIndex: number, toIndex: number) => {
      const next = [...drafts];
      next.splice(toIndex, 0, ...next.splice(fromIndex, 1));
      change(next);
    },
    reset: () => setEdited(null),
  };
}
