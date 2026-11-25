import type { BookmarkFolder } from "@/entities/creator";

export interface FolderDraft {
  /** 목록 key. */
  id: string;
  /** 아직 서버에 없는 새 폴더면 null. */
  folderIdx: number | null;
  name: string;
  count: number;
}

/** 서버 폴더 중 `전체`는 고칠 수 없어 뺌. */
export function toFolderDrafts(folders: BookmarkFolder[]): FolderDraft[] {
  return folders.flatMap(({ folderIdx, name, count }) =>
    folderIdx === null
      ? []
      : [{ id: String(folderIdx), folderIdx, name, count }],
  );
}

export function hasDraftChanges(
  original: FolderDraft[],
  drafts: FolderDraft[],
) {
  return (
    original.length !== drafts.length ||
    drafts.some(
      ({ id, name }, index) =>
        id !== original[index]?.id || name !== original[index].name,
    )
  );
}

/** 저장할 최종 목록. 내가 바꾸지 않은 이름은 최신 이름을 쓰고, 고치는 동안 다른 곳에서 생긴 폴더는 맨 뒤에 남김. */
export function toSyncFolders(
  original: FolderDraft[],
  drafts: FolderDraft[],
  latest: FolderDraft[],
) {
  const originalById = new Map(original.map((item) => [item.id, item]));
  const latestById = new Map(latest.map((item) => [item.id, item]));
  const folders = drafts.map(({ id, folderIdx, name }) => ({
    folderIdx,
    name:
      originalById.get(id)?.name === name
        ? (latestById.get(id)?.name ?? name)
        : name,
  }));
  const added = latest
    .filter(({ id }) => !originalById.has(id))
    .map(({ folderIdx, name }) => ({ folderIdx, name }));
  return [...folders, ...added];
}
