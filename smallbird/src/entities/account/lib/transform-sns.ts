import { SOCIAL_PROVIDERS } from "../model/mypage-schema";

import type {
  AccountSnsList,
  SocialLinkViewModel,
  SocialProvider,
} from "../model/mypage-schema";

/** 응답에 없거나 모르는 플랫폼은 연동 안 됨으로 둠. 화면은 항상 4개를 그림. */
export function transformSnsListToLinks(list: AccountSnsList) {
  const links = {} as Record<SocialProvider, SocialLinkViewModel>;
  for (const provider of SOCIAL_PROVIDERS) {
    const item = list.items.find((entry) => entry.platform === provider);
    links[provider] = {
      isLinked: item?.linked ?? false,
      email: item?.email || null,
    };
  }
  return links;
}
