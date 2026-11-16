import {
  CAMPAIGN_PLATFORMS,
  INFLUENCER_AGE_GROUPS,
  INFLUENCER_GENDERS,
  POSTING_TOPICS,
} from "@/entities/campaign";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { useTranslation } from "@/shared/i18n";
import { Card } from "@/shared/ui/card";

import {
  PLATFORM_ICON_NAMES,
  PLATFORM_LABEL_KEYS,
} from "../../../model/platform";
import { needsTitleHashtags } from "../../../model/step-completion";
import { applyTopicRule } from "../../../model/topics";
import { useRegisterWizardStore } from "../../../model/wizard-context";
import { ChoiceField } from "../../fields/ChoiceField";
import { MultiChoiceField } from "../../fields/MultiChoiceField";

import type { CampaignPlatform } from "@/entities/campaign";

// 3단계 인플루언서 조건(시안 13320:117989). 플랫폼·성별은 하나, 연령대·주제는 여러 개.
// 주제는 서버 코드 21개(시안 8개와 다름, P-25)라 토글이 줄바꿈됨. 플랫폼은 5단계 필수 해시태그 칸을 정해서,
// 제목 칸이 없는 플랫폼으로 바꾸면 입력해 둔 제목 해시태그를 지움(P-22 ② 답 전 처리).
export function InfluencerStep() {
  const { t } = useTranslation("features/register-campaign");
  const influencer = useRegisterWizardStore((state) => state.draft.influencer);
  const patchStepDraft = useRegisterWizardStore(
    (state) => state.patchStepDraft,
  );

  function handleChangePlatform(platform: CampaignPlatform) {
    patchStepDraft("influencer", { platform });
    if (!needsTitleHashtags(platform)) {
      patchStepDraft("intro", { titleHashtags: [] });
    }
  }

  return (
    <Card className="ds-gap-4 ds-p-6">
      <ChoiceField
        label={t("influencer.platform")}
        value={influencer.platform}
        options={CAMPAIGN_PLATFORMS.map((platform) => ({
          value: platform,
          label: t(PLATFORM_LABEL_KEYS[platform]),
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
        label={t("influencer.gender.label")}
        value={influencer.gender}
        options={INFLUENCER_GENDERS.map((gender) => ({
          value: gender,
          label: t(`influencer.gender.${gender}`),
        }))}
        onChangeValue={(gender) => patchStepDraft("influencer", { gender })}
      />
      <MultiChoiceField
        label={t("influencer.ageGroup.label")}
        value={influencer.ageGroups}
        options={INFLUENCER_AGE_GROUPS.map((ageGroup) => ({
          value: ageGroup,
          label: t(`influencer.ageGroup.${ageGroup}`),
        }))}
        onChangeValue={(ageGroups) =>
          patchStepDraft("influencer", { ageGroups })
        }
      />
      <MultiChoiceField
        label={t("influencer.topic.label")}
        value={influencer.topics}
        options={POSTING_TOPICS.map((topic) => ({
          value: topic,
          label: t(`influencer.topic.${topic}`),
        }))}
        onChangeValue={(topics) =>
          patchStepDraft("influencer", {
            topics: applyTopicRule(influencer.topics, topics),
          })
        }
      />
    </Card>
  );
}
