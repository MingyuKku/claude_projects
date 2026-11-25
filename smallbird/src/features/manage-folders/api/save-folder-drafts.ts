import { fetchBookmarkFolders, syncBookmarkFolders } from "@/entities/creator";

import { toFolderDrafts, toSyncFolders } from "../model/folder-draft";

import type { FolderDraft } from "../model/folder-draft";

/**
 * 서버는 보낸 목록에 없는 폴더를 즐겨찾기까지 지움. 저장 직전 목록을 다시 읽어 다른 곳에서 생긴 폴더를 지키고, 못 읽으면 보내지 않음.
 * ponytail: 다시 읽기와 저장 사이에 생긴 폴더는 막지 못함. 서버가 삭제할 폴더를 따로 받으면 없앰.
 */
export async function saveFolderDrafts(
  original: FolderDraft[],
  drafts: FolderDraft[],
) {
  const latest = toFolderDrafts(await fetchBookmarkFolders());
  await syncBookmarkFolders(toSyncFolders(original, drafts, latest));
}
