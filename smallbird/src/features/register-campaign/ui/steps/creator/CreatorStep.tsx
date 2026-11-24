import { useEffect } from "react";
import { toast } from "sonner";

import {
  CREATOR_AGE_GROUPS,
  CREATOR_GENDERS,
  usePostingTopics,
} from "@/entities/campaign";
import { PlatformIcon } from "@/shared/components/platform-icon";
import { useTranslation } from "@/shared/i18n";
import { Card } from "@/shared/ui/card";

import { applyAllOptionRule } from "../../../model/all-option";
import {
  BRAND_PLATFORMS,
  getPlatformLabelKey,
  GROUP_BUY_PLATFORMS,
  PLATFORM_ICON_NAMES,
} from "../../../model/platform";
import { needsTitleHashtags } from "../../../model/step-completion";
import { getTopicLabelKey } from "../../../model/topics";
import { useRegisterWizardStore } from "../../../model/wizard-context";
import { ChoiceField } from "../../fields/ChoiceField";
import { MultiChoiceField } from "../../fields/MultiChoiceField";

import type { CampaignPlatform, CreatorAgeGroup } from "@/entities/campaign";

const ALL_AGE_GROUP: CreatorAgeGroup = "ALL";

// 3단계 크리에이터 조건. 플랫폼·성별은 하나, 연령대·주제는 여러 개.
// 숏츠·릴스는 공구형 시안에만 있어 공구형에서만 보임. 주제는 서버가 받는 9개(브랜드형 시안과 다름, P-25).
// 플랫폼은 5단계 필수 해시태그 칸을 정해서, 제목 칸이 없는 플랫폼으로 바꾸면 입력해 둔 제목 해시태그를 지움(P-22 ② 답 전 처리).
export function CreatorStep() {
  const { t } = useTranslation("features/register-campaign");
  const creator = useRegisterWizardStore((state) => state.draft.creator);
  const productType = useRegisterWizardStore((state) => state.productType);
  const { topics: topicOptions, error } = usePostingTopics();
  const patchStepDraft = useRegisterWizardStore(
    (state) => state.patchStepDraft,
  );

  const isGroupBuy = productType === "GROUP_BUY";

  useEffect(() => {
    if (error) toast(t("toast.requestFailed"));
  }, [error, t]);

  // 서버 목록에 없는 주제(예전에 저장된 값)는 저장하면 400이라 목록이 오면 선택에서 뺌.
  useEffect(() => {
    if (!topicOptions) return;
    const available = creator.topics.filter((topic) =>
      topicOptions.includes(topic),
    );
    if (available.length !== creator.topics.length) {
      patchStepDraft("creator", { topics: available });
    }
  }, [topicOptions, creator.topics, patchStepDraft]);

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
        options={(isGroupBuy ? GROUP_BUY_PLATFORMS : BRAND_PLATFORMS).map(
          (platform) => ({
            value: platform,
            label: t(getPlatformLabelKey(platform, productType)),
            icon: (
              <PlatformIcon
                platform={PLATFORM_ICON_NAMES[platform]}
                className="size-4"
              />
            ),
          }),
        )}
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
        onChangeValue={(ageGroups) =>
          patchStepDraft("creator", {
            ageGroups: applyAllOptionRule(
              creator.ageGroups,
              ageGroups,
              ALL_AGE_GROUP,
            ),
          })
        }
      />
      <MultiChoiceField
        label={t("creator.topic.label")}
        value={creator.topics}
        options={(topicOptions ?? []).map((topic) => ({
          value: topic,
          label: t(getTopicLabelKey(topic, productType)),
        }))}
        onChangeValue={(topics) =>
          patchStepDraft("creator", {
            topics: applyAllOptionRule(creator.topics, topics, "All"),
          })
        }
      />
    </Card>
  );
}
