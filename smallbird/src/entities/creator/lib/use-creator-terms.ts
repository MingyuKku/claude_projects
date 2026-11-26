import { useTranslation } from "@/shared/i18n";

/** 매칭 화면들이 같이 쓰는 용어. 여러 슬라이스가 같은 뜻으로 쓰면 여기에 한 벌만 둠. */
export type CreatorTerm =
  | "platform"
  | "category"
  | "profile"
  | "followerCount"
  | "subscriberCount"
  | "avgViewCount"
  | "avgLikeCount"
  | "avgCommentCount"
  | "avgShareRatio"
  | "avgCommentWriterCount"
  | "expectedCost"
  | "desiredCost"
  | "brandInfluenceIndex"
  | "groupBuyInfluenceIndex"
  | "detailFilter"
  | "propose"
  | "saveBookmark"
  | "removeBookmark"
  | "moveGroup"
  | "newFolder"
  | "won"
  | "nextStep"
  | "hopeProducts";

export function useCreatorTerms() {
  const { t } = useTranslation("entities/creator");

  return {
    term: (key: CreatorTerm) => t(`term.${key}`),
    bookmarkLabel: (name: string) => t("term.bookmark", { name }),
  };
}
