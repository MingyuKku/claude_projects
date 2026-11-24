import { serverApiV3 } from "@/shared/api";

import { filterKnownCodes, POSTING_TOPICS } from "../model/input-codes";
import { postingTopicListSchema } from "../model/posting-topic-schema";

import type { PostingTopic } from "../model/input-codes";

/**
 * A-5.3-1 `GET /v3/campaign/topics`. 고를 수 있는 주제를 서버 순서대로 읽음.
 * 번역을 가진 코드(`POSTING_TOPICS`)만 남겨, 서버가 새 키를 추가해도 이름 없는 선택지가 생기지 않음.
 */
export async function fetchPostingTopics(): Promise<PostingTopic[]> {
  const { list } = postingTopicListSchema.parse(
    await serverApiV3.get("/campaign/topics"),
  );
  return filterKnownCodes(POSTING_TOPICS, list);
}
