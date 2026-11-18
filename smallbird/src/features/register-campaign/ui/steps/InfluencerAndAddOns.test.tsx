import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { createEmptyDraft } from "@/entities/campaign";

import { useRegisterWizardStore } from "../../model/wizard-context";
import { RegisterWizardProvider } from "../RegisterWizardProvider";
import { AddOnsStep } from "./add-ons/AddOnsStep";
import { InfluencerStep } from "./influencer/InfluencerStep";

import type { CampaignDetail, CampaignDraft } from "@/entities/campaign";

function createDetail(patch?: (draft: CampaignDraft) => void): CampaignDetail {
  const draft = createEmptyDraft();
  patch?.(draft);
  return {
    campaignIdx: 15,
    campaignCode: "PB-00000000000015",
    serviceType: "PICK",
    productType: "BRAND",
    stage: "DRAFT",
    rawStatus: "DRAFT",
    isDemo: false,
    isDemoCompleted: false,
    rejectReason: null,
    brand: null,
    rawCampaignType: null,
    endDate: null,
    draft,
    payment: null,
  };
}

function TitleHashtagProbe() {
  const titleHashtags = useRegisterWizardStore(
    (state) => state.draft.intro.titleHashtags,
  );
  return (
    <output aria-label="제목 해시태그 값">{titleHashtags.join(",")}</output>
  );
}

describe("InfluencerStep", () => {
  it("플랫폼 6개를 시안 순서로 보이고 하나만 고른다", async () => {
    const user = userEvent.setup();
    render(
      <RegisterWizardProvider detail={createDetail()}>
        <InfluencerStep />
      </RegisterWizardProvider>,
    );
    const group = screen.getByRole("radiogroup", { name: "플랫폼 선택" });

    expect(
      Array.from(
        group.querySelectorAll("[role=radio]"),
        (item) => item.textContent,
      ),
    ).toEqual(["인스타그램", "블로그", "페이스북", "유튜브", "틱톡", "엑스"]);

    await user.click(screen.getByRole("radio", { name: "블로그" }));
    await user.click(screen.getByRole("radio", { name: "유튜브" }));

    expect(screen.getByRole("radio", { name: "블로그" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("연령대는 여러 개 고르고, 포스팅 주제는 서버 코드 21개다", async () => {
    const user = userEvent.setup();
    render(
      <RegisterWizardProvider detail={createDetail()}>
        <InfluencerStep />
      </RegisterWizardProvider>,
    );

    await user.click(screen.getByRole("button", { name: "20대" }));
    await user.click(screen.getByRole("button", { name: "30대" }));

    expect(screen.getByRole("button", { name: "20대" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "30대" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen
        .getByRole("toolbar", { name: "포스팅 주제(복수선택 가능)" })
        .querySelectorAll("button"),
    ).toHaveLength(21);
  });

  it("서버에 값이 없으면 시안의 기본 선택(인스타그램·여성·10대·뷰티)으로 보인다", () => {
    render(
      <RegisterWizardProvider detail={createDetail()}>
        <InfluencerStep />
      </RegisterWizardProvider>,
    );

    expect(screen.getByRole("radio", { name: "인스타그램" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "여성" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("button", { name: "10대" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "뷰티" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("서버에 저장된 값이 있으면 기본 선택 대신 그 값으로 보인다", () => {
    render(
      <RegisterWizardProvider
        detail={createDetail((draft) => {
          draft.influencer = {
            platform: "TIKTOK",
            gender: "MALE",
            ageGroups: ["AGE_40S"],
            topics: ["Pet"],
          };
        })}
      >
        <InfluencerStep />
      </RegisterWizardProvider>,
    );

    expect(screen.getByRole("radio", { name: "틱톡" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "남성" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("button", { name: "10대" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "40대" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("연령대·포스팅 주제는 마지막 하나를 해제할 수 없다", async () => {
    const user = userEvent.setup();
    render(
      <RegisterWizardProvider detail={createDetail()}>
        <InfluencerStep />
      </RegisterWizardProvider>,
    );

    await user.click(screen.getByRole("button", { name: "10대" }));
    await user.click(screen.getByRole("button", { name: "뷰티" }));

    expect(screen.getByRole("button", { name: "10대" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "뷰티" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "20대" }));
    await user.click(screen.getByRole("button", { name: "10대" }));
    expect(screen.getByRole("button", { name: "10대" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("제목 해시태그 칸이 없는 플랫폼으로 바꾸면 입력해 둔 제목 해시태그를 지운다", async () => {
    const user = userEvent.setup();
    render(
      <RegisterWizardProvider
        detail={createDetail((draft) => {
          draft.influencer.platform = "NAVER_BLOG";
          draft.intro.titleHashtags = ["봄신상"];
        })}
      >
        <InfluencerStep />
        <TitleHashtagProbe />
      </RegisterWizardProvider>,
    );

    await user.click(screen.getByRole("radio", { name: "유튜브" }));
    expect(
      screen.getByRole("status", { name: "제목 해시태그 값" }),
    ).toHaveTextContent("봄신상");

    await user.click(screen.getByRole("radio", { name: "인스타그램" }));
    expect(
      screen.getByRole("status", { name: "제목 해시태그 값" }),
    ).toBeEmptyDOMElement();
  });
});

describe("AddOnsStep", () => {
  it("카드 2장을 누를 때마다 켜고 끈다", async () => {
    const user = userEvent.setup();
    render(
      <RegisterWizardProvider detail={createDetail()}>
        <AddOnsStep />
      </RegisterWizardProvider>,
    );
    const guide = screen.getByRole("checkbox", { name: /AI 포스팅 가이드/ });
    const confirm = screen.getByRole("checkbox", { name: /원고컨펌/ });

    await user.click(guide);
    await user.click(confirm);
    expect(guide).toHaveAttribute("aria-checked", "true");
    expect(confirm).toHaveAttribute("aria-checked", "true");

    await user.click(guide);
    expect(guide).toHaveAttribute("aria-checked", "false");
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  });
});
