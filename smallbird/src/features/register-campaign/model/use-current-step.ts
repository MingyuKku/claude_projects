import { useState } from "react";
import { useSearchParams } from "react-router";

import {
  findFirstIncompleteStep,
  getCampaignStepModels,
} from "./step-definitions";
import { isStepSlug } from "./steps";
import { useCampaignRegisterStore } from "./store-context";

import type { StepSlug } from "./steps";

/** 주소의 단계 이름 쿼리(`?step=`). */
export const STEP_PARAM = "step";

/**
 * 지금 단계. 주소의 `step`이 올바르면 그 단계이고, 없거나 잘못됐으면 "아직 완료하지 않은 첫 단계"(모두 마쳤으면 첫 단계)임.
 * 이 대체 값은 처음 한 번만 정해서 입력하는 동안 단계가 바뀌지 않음(주소를 바로잡는 일은 페이지가 함).
 */
export function useCurrentStep() {
  const [searchParams, setSearchParams] = useSearchParams();
  const draft = useCampaignRegisterStore((state) => state.draft);
  const steps = getCampaignStepModels(draft.serviceType);
  const [fallbackSlug] = useState<StepSlug>(
    () =>
      findFirstIncompleteStep(draft)?.slug ?? steps[0]?.slug ?? "campaign-info",
  );

  const param = searchParams.get(STEP_PARAM);
  const slug = isStepSlug(param) ? param : fallbackSlug;
  const index = Math.max(
    0,
    steps.findIndex((step) => step.slug === slug),
  );

  /** 다른 단계로 이동함(하위 화면 쿼리는 닫음). 저장은 부르는 쪽이 먼저 함. */
  function goToStep(target: StepSlug) {
    setSearchParams(new URLSearchParams({ [STEP_PARAM]: target }));
  }

  return { slug, index, step: steps[index], steps, goToStep };
}
