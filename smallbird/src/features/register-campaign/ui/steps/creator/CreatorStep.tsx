import {
  CAMPAIGN_PLATFORMS,
  CREATOR_AGE_GROUPS,
  CREATOR_GENDERS,
  getPostingTopics,
} from "@/entities/campaign";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { useTranslation } from "@/shared/i18n";
import { Card } from "@/shared/ui/card";

import {
  getPlatformLabelKey,
  GROUP_BUY_PLATFORMS,
  PLATFORM_ICON_NAMES,
} from "../../../model/platform";
import { needsTitleHashtags } from "../../../model/step-completion";
import { applyTopicRule, getTopicLabelKey } from "../../../model/topics";
import { useRegisterWizardStore } from "../../../model/wizard-context";
import { ChoiceField } from "../../fields/ChoiceField";
import { MultiChoiceField } from "../../fields/MultiChoiceField";

import type { CampaignPlatform } from "@/entities/campaign";

// 3단계 크리에이터 조건. 플랫폼·성별은 하나, 연령대·주제는 여러 개.
// 브랜드형 주제는 서버 코드 21개(시안과 다름, P-25)라 토글이 줄바꿈되고, 공구형은 시안의 9개만 보임.
// 플랫폼은 5단계 필수 해시태그 칸을 정해서, 제목 칸이 없는 플랫폼으로 바꾸면 입력해 둔 제목 해시태그를 지움(P-22 ② 답 전 처리).
export function CreatorStep() {
  const { t } = useTranslation("features/register-campaign");
  const creator = useRegisterWizardStore((state) => state.draft.creator);
  const productType = useRegisterWizardStore((state) => state.productType);
  const patchStepDraft = useRegisterWizardStore(
    (state) => state.patchStepDraft,
  );

  function handleChangePlatform(platform: CampaignPlatform) {
    patchStepDraft("creator", { platform });
    if (!needsTitleHashtags(platform)) {
      patchStepDraft("intro", { titleHashtags: [] });
    }
  }

  return (
    <Card className="ds-gap-4 ds-p-6">
      <ChoiceField
        label={t("creator.platform")}
        value={creator.platform}
        options={(productType === "GROUP_BUY"
          ? GROUP_BUY_PLATFORMS
          : CAMPAIGN_PLATFORMS
        ).map((platform) => ({
          value: platform,
          label: t(getPlatformLabelKey(platform, productType)),
          icon: (
            <PlatformIcon
              platform={PLATFORM_ICON_NAMES[platform]}
              className="size-4"
            />
          ),
        }))}
        onChangeValue={handleChangePlatform}
      />
      <ChoiceField
        label={t("creator.gender.label")}
        value={creator.gender}
        options={CREATOR_GENDERS.map((gender) => ({
          value: gender,
          label: t(`creator.gender.${gender}`),
        }))}
        onChangeValue={(gender) => patchStepDraft("creator", { gender })}
      />
      <MultiChoiceField
        label={t("creator.ageGroup.label")}
        value={creator.ageGroups}
        options={CREATOR_AGE_GROUPS.map((ageGroup) => ({
          value: ageGroup,
          label: t(`creator.ageGroup.${ageGroup}`),
        }))}
        onChangeValue={(ageGroups) => patchStepDraft("creator", { ageGroups })}
      />
      <MultiChoiceField
        label={t("creator.topic.label")}
        value={creator.topics}
        options={getPostingTopics(productType).map((topic) => ({
          value: topic,
          label: t(getTopicLabelKey(topic, productType)),
        }))}
        onChangeValue={(topics) =>
          patchStepDraft("creator", {
            topics: applyTopicRule(creator.topics, topics),
          })
        }
      />
    </Card>
  );
}
