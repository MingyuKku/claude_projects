import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";

import { createCampaignDraft } from "@/entities/campaign";

import { useCampaignRegisterStore } from "../../model/store-context";
import { CampaignRegisterProvider } from "../CampaignRegisterProvider";
import { PolicyStep } from "./PolicyStep";

beforeEach(() => window.sessionStorage.clear());

function Probe() {
  const agreements = useCampaignRegisterStore(
    (state) => state.draft.policy.agreements,
  );
  return <output data-testid="agreements">{JSON.stringify(agreements)}</output>;
}

const agreements = () =>
  JSON.parse(screen.getByTestId("agreements").textContent ?? "{}") as Record<
    "service" | "privacy" | "operation" | "reward",
    boolean
  >;

async function renderStep() {
  const draft = await createCampaignDraft({
    serviceType: "PICK",
    productType: "BRAND",
  });
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      <CampaignRegisterProvider campaignId={draft.campaignIdx}>
        <PolicyStep />
        <Probe />
      </CampaignRegisterProvider>
    </SWRConfig>,
  );
  await screen.findByRole("checkbox", { name: "약관 전체 동의" });
  return userEvent.setup();
}

describe("7단계 캠페인 정책 동의", () => {
  it("전체 동의는 4개를 한꺼번에 켜고 끈다", async () => {
    const user = await renderStep();
    const all = screen.getByRole("checkbox", { name: "약관 전체 동의" });

    await user.click(all);
    expect(Object.values(agreements())).toEqual([true, true, true, true]);
    expect(all).toBeChecked();

    await user.click(all);
    expect(Object.values(agreements())).toEqual([false, false, false, false]);
  });

  it("일부만 켜면 전체는 부분 선택이고 4개가 모두 켜지면 전체도 켜진다", async () => {
    const user = await renderStep();
    const all = screen.getByRole("checkbox", { name: "약관 전체 동의" });

    await user.click(
      screen.getByRole("checkbox", { name: /서비스 이용약관 동의/ }),
    );
    expect(all).toHaveAttribute("aria-checked", "mixed");

    await user.click(
      screen.getByRole("checkbox", { name: /개인정보 처리방침 동의/ }),
    );
    await user.click(
      screen.getByRole("checkbox", { name: /캠페인 운영 정책 동의/ }),
    );
    await user.click(
      screen.getByRole("checkbox", { name: /리워드 및 결제 관련 정책 동의/ }),
    );
    expect(all).toBeChecked();
  });

  it("전문이 있는 두 항목만 약관 보기 버튼이 있다", async () => {
    await renderStep();

    expect(
      screen.getByRole("button", { name: "서비스 이용약관 전문 보기" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "개인정보 처리방침 전문 보기" }),
    ).toBeVisible();
    expect(screen.getAllByRole("button", { name: /전문 보기/ })).toHaveLength(
      2,
    );
  });

  it("약관 전문의 동의하기는 그 항목을 켜고 닫고, 취소는 닫기만 한다", async () => {
    const user = await renderStep();

    await user.click(
      screen.getByRole("button", { name: "서비스 이용약관 전문 보기" }),
    );
    let dialog = await screen.findByRole("dialog", { name: "서비스 이용약관" });
    await user.click(within(dialog).getByRole("button", { name: "취소" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(agreements().service).toBe(false);

    await user.click(
      screen.getByRole("button", { name: "서비스 이용약관 전문 보기" }),
    );
    dialog = await screen.findByRole("dialog", { name: "서비스 이용약관" });
    await user.click(within(dialog).getByRole("button", { name: "동의하기" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(agreements().service).toBe(true);
    expect(agreements().privacy).toBe(false);
  });
});
