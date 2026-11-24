import { z } from "zod";

import { list } from "./schema-helpers";

// 포스팅 주제 목록(A-5.3-1). 이름 없이 키만 화면 순서대로 오고, 이름은 프론트가 키로 번역함.

export const postingTopicListSchema = z.object({
  list: list(z.string()),
});
export type PostingTopicListResponse = z.infer<typeof postingTopicListSchema>;
