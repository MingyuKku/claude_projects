import {
  CAMPAIGN_AGE_GROUPS,
  CAMPAIGN_GENDERS,
  CAMPAIGN_PLATFORMS,
  CAMPAIGN_TOPICS,
  useCampaignLabels,
} from "@/entities/campaign";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { useTranslation } from "@/shared/i18n";

import { useCampaignRegisterStore } from "../../model/store-context";
import {
  ChoiceToggleGroup,
  MultiChoiceToggleGroup,
} from "../fields/ChoiceToggleGroup";

import type { CampaignPlatform } from "@/entities/campaign";
import type { PlatformIconName } from "@/shared/components/platform-icon";

// 블로그는 네이버 로고를 씀.
const PLATFORM_ICONS: Record<CampaignPlatform, PlatformIconName> = {
  INSTAGRAM: "instagram",
  NAVER_BLOG: "naver",
  FACEBOOK: "facebook",
  YOUTUBE: "youtube",
  TIKTOK: "tiktok",
  X: "x",
};

// 3단계 인플루언서 조건 설정(Figma 7555:335976): 플랫폼·성별은 하나, 연령대·포스팅 주제는 하나 이상 고름.
export function InfluencerStep() {
  const { t } = useTranslation("features/register-campaign");
  const labels = useCampaignLabels();
  const influencer = useCampaignRegisterStore(
    (state) => state.draft.influencer,
  );
  const patchInfluencer = useCampaignRegisterStore(
    (state) => state.patchInfluencer,
  );

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 tablet:p-5 desktop:p-6">
      <ChoiceToggleGroup
        label={t("influencer.platform.label")}
        isRequired
        options={CAMPAIGN_PLATFORMS.map((platform) => ({
          value: platform,
          label: labels.platform(platform),
          icon: (
            <PlatformIcon
              platform={PLATFORM_ICONS[platform]}
              className="size-4"
            />
          ),
        }))}
        value={influencer.platform}
        onChangeValue={(platform) => patchInfluencer({ platform })}
      />
      <ChoiceToggleGroup
        label={t("influencer.gender.label")}
        isRequired
        options={CAMPAIGN_GENDERS.map((gender) => ({
          value: gender,
          label: labels.gender(gender),
        }))}
        value={influencer.gender}
        onChangeValue={(gender) => patchInfluencer({ gender })}
      />
      <MultiChoiceToggleGroup
        label={t("influencer.ageGroup.label")}
        isRequired
        options={CAMPAIGN_AGE_GROUPS.map((ageGroup) => ({
          value: ageGroup,
          label: labels.ageGroup(ageGroup),
        }))}
        value={influencer.ageGroups}
        onChangeValue={(ageGroups) => patchInfluencer({ ageGroups })}
      />
      <MultiChoiceToggleGroup
        label={t("influencer.topic.label")}
        isRequired
        options={CAMPAIGN_TOPICS.map((topic) => ({
          value: topic,
          label: labels.topic(topic),
        }))}
        value={influencer.topics}
        onChangeValue={(topics) => patchInfluencer({ topics })}
      />
    </div>
  );
}
