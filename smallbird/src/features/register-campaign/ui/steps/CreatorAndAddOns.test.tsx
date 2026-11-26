import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { createEmptyDraft } from "@/entities/campaign";

import { useRegisterWizardStore } from "../../model/wizard-context";
import { RegisterWizardProvider } from "../RegisterWizardProvider";
import { AddOnsStep } from "./add-ons/AddOnsStep";
import { CreatorStep } from "./creator/CreatorStep";

import type {
  CampaignDetail,
  CampaignDraft,
  CampaignProductType,
} from "@/entities/campaign";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

// 포스팅 주제 목록은 서버 API(A-5.3-1)에서 받으므로 시안 순서의 9개를 돌려줌.
const ALL_TOPICS = [
  "All",
  "Beauty",
  "LivingHealth",
  "PregnancyParenting",
  "Food",
  "DigitalAppliances",
  "FurnitureInterior",
  "Fashion",
  "TravelCulture",
];
const serverTopics = vi.hoisted(() => ({ list: [] as string[] }));

vi.mock("@/entities/campaign", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  usePostingTopics: () => ({
    topics: serverTopics.list,
    error: undefined,
    isLoading: false,
  }),
}));

beforeEach(() => {
  serverTopics.list = ALL_TOPICS;
});

function createDetail(
  patch?: (draft: CampaignDraft) => void,
  productType: CampaignProductType = "BRAND",
): CampaignDetail {
  const draft = createEmptyDraft();
  patch?.(draft);
  return {
    campaignIdx: 15,
    campaignCode: "PB-00000000000015",
    serviceType: "PICK",
    productType,
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

/** "무관"은 연령대·주제에 모두 있어 토글 묶음을 먼저 고름. */
function getGroup(name: string) {
  return within(screen.getByRole("toolbar", { name }));
}

function TopicsProbe() {
  const topics = useRegisterWizardStore((state) => state.draft.creator.topics);
  return <output aria-label="주제 값">{topics.join(",")}</output>;
}

function AgeGroupsProbe() {
  const ageGroups = useRegisterWizardStore(
    (state) => state.draft.creator.ageGroups,
  );
  return <output aria-label="연령대 값">{ageGroups.join(",")}</output>;
}

describe("CreatorStep", () => {
  it("플랫폼 8개(숏츠·릴스는 뒤)를 보이고 하나만 고른다", async () => {
    const user = userEvent.setup();
    render(
      <RegisterWizardProvider detail={createDetail()}>
        <CreatorStep />
      </RegisterWizardProvider>,
    );
    const group = screen.getByRole("radiogroup", { name: "플랫폼 선택" });

    expect(
      Array.from(
        group.querySelectorAll("[role=radio]"),
        (item) => item.textContent,
      ),
    ).toEqual([
      "인스타그램",
      "블로그",
      "페이스북",
      "유튜브",
      "틱톡",
      "엑스",
      "숏츠",
      "릴스",
    ]);

    await user.click(screen.getByRole("radio", { name: "블로그" }));
    await user.click(screen.getByRole("radio", { name: "유튜브" }));

    expect(screen.getByRole("radio", { name: "블로그" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("공구형은 플랫폼(숏츠·릴스 포함)을 브랜드형과 같은 순서에 '네이버 블로그'로, 연령대는 '무관' 포함, 포스팅 주제는 9개가 보인다", () => {
    render(
      <RegisterWizardProvider detail={createDetail(undefined, "GROUP_BUY")}>
        <CreatorStep />
      </RegisterWizardProvider>,
    );

    expect(
      Array.from(
        screen
          .getByRole("radiogroup", { name: "플랫폼 선택" })
          .querySelectorAll("[role=radio]"),
        (item) => item.textContent,
      ),
    ).toEqual([
      "인스타그램",
      "네이버 블로그",
      "페이스북",
      "유튜브",
      "틱톡",
      "엑스",
      "숏츠",
      "릴스",
    ]);
    expect(
      Array.from(
        screen
          .getByRole("toolbar", { name: "선호 연령대(복수선택 가능)" })
          .querySelectorAll("button"),
        (item) => item.textContent,
      ),
    ).toEqual(["무관", "10대", "20대", "30대", "40대", "50대 이상"]);
    expect(
      Array.from(
        screen
          .getByRole("toolbar", { name: "포스팅 주제(복수선택 가능)" })
          .querySelectorAll("button"),
        (item) => item.textContent,
      ),
    ).toEqual([
      "무관",
      "뷰티",
      "생활/건강",
      "출산/육아",
      "식품",
      "디지털/가전",
      "가구/인테리어",
      "패션",
      "여행/문화",
    ]);
  });

  it("공구형도 '무관'을 고르면 다른 주제를 풀고, 다른 주제를 고르면 '무관'을 푼다", async () => {
    const user = userEvent.setup();
    render(
      <RegisterWizardProvider detail={createDetail(undefined, "GROUP_BUY")}>
        <CreatorStep />
      </RegisterWizardProvider>,
    );

    await user.click(
      getGroup("포스팅 주제(복수선택 가능)").getByRole("button", {
        name: "무관",
      }),
    );
    expect(
      getGroup("포스팅 주제(복수선택 가능)").getByRole("button", {
        name: "무관",
      }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      getGroup("포스팅 주제(복수선택 가능)").getByRole("button", {
        name: "뷰티",
      }),
    ).toHaveAttribute("aria-pressed", "false");

    await user.click(
      getGroup("포스팅 주제(복수선택 가능)").getByRole("button", {
        name: "패션",
      }),
    );
    expect(
      getGroup("포스팅 주제(복수선택 가능)").getByRole("button", {
        name: "무관",
      }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("공구형은 연령대 '무관'을 고르면 다른 연령대를 풀고, 다른 연령대를 고르면 '무관'을 푼다", async () => {
    const user = userEvent.setup();
    render(
      <RegisterWizardProvider detail={createDetail(undefined, "GROUP_BUY")}>
        <CreatorStep />
        <AgeGroupsProbe />
      </RegisterWizardProvider>,
    );

    await user.click(screen.getByRole("button", { name: "20대" }));
    await user.click(
      getGroup("선호 연령대(복수선택 가능)").getByRole("button", {
        name: "무관",
      }),
    );
    expect(screen.getByLabelText("연령대 값")).toHaveTextContent("ALL");

    await user.click(screen.getByRole("button", { name: "30대" }));
    expect(screen.getByLabelText("연령대 값")).toHaveTextContent("AGE_30S");
  });

  it("브랜드형은 연령대·포스팅 주제에 '무관'이 있으며 주제는 서버 코드 9개다", async () => {
    const user = userEvent.setup();
    render(
      <RegisterWizardProvider detail={createDetail()}>
        <CreatorStep />
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
    ).toHaveLength(9);
    expect(
      getGroup("선호 연령대(복수선택 가능)").getByRole("button", {
        name: "무관",
      }),
    ).toBeInTheDocument();
  });

  it("서버에 값이 없으면 기본 선택(인스타그램·여성·연령대 무관·주제 무관)으로 보인다", () => {
    render(
      <RegisterWizardProvider detail={createDetail()}>
        <CreatorStep />
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
    for (const name of [
      "선호 연령대(복수선택 가능)",
      "포스팅 주제(복수선택 가능)",
    ]) {
      expect(
        getGroup(name).getByRole("button", { name: "무관" }),
      ).toHaveAttribute("aria-pressed", "true");
    }
    expect(screen.getByRole("button", { name: "10대" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: "뷰티" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("공구형도 서버에 값이 없으면 연령대·주제 기본 선택이 '무관'이다", () => {
    render(
      <RegisterWizardProvider detail={createDetail(undefined, "GROUP_BUY")}>
        <CreatorStep />
      </RegisterWizardProvider>,
    );

    for (const name of [
      "선호 연령대(복수선택 가능)",
      "포스팅 주제(복수선택 가능)",
    ]) {
      expect(
        getGroup(name).getByRole("button", { name: "무관" }),
      ).toHaveAttribute("aria-pressed", "true");
    }
    expect(
      getGroup("선호 연령대(복수선택 가능)").getByRole("button", {
        name: "10대",
      }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("서버에 저장된 값이 있으면 기본 선택 대신 그 값으로 보인다", () => {
    render(
      <RegisterWizardProvider
        detail={createDetail((draft) => {
          draft.creator = {
            platform: "TIKTOK",
            gender: "MALE",
            ageGroups: ["AGE_40S"],
            topics: ["Fashion"],
          };
        })}
      >
        <CreatorStep />
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

  it("서버 주제 목록에 없는 저장된 주제는 선택에서 뺀다", () => {
    serverTopics.list = ["All", "Beauty"];
    render(
      <RegisterWizardProvider
        detail={createDetail((draft) => {
          draft.creator.topics = ["Fashion", "Beauty"];
        })}
      >
        <CreatorStep />
        <TopicsProbe />
      </RegisterWizardProvider>,
    );

    expect(screen.getByLabelText("주제 값")).toHaveTextContent(/^Beauty$/);
    expect(
      getGroup("포스팅 주제(복수선택 가능)").queryByRole("button", {
        name: "패션",
      }),
    ).toBeNull();
  });

  it("연령대·포스팅 주제는 마지막 하나를 해제할 수 없다", async () => {
    const user = userEvent.setup();
    render(
      <RegisterWizardProvider detail={createDetail()}>
        <CreatorStep />
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
          draft.creator.platform = "NAVER_BLOG";
          draft.intro.titleHashtags = ["봄신상"];
        })}
      >
        <CreatorStep />
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
