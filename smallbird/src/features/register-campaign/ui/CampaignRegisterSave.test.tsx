import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";

import {
  createCampaignDraft,
  fetchCampaignDraft,
  type saveCampaignDraft,
} from "@/entities/campaign";
import { ApiError } from "@/shared/api";

import { useCampaignRegisterStore } from "../model/store-context";
import { useCampaignSave } from "../model/use-campaign-save";
import { CampaignRegisterProvider } from "./CampaignRegisterProvider";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
const failure = vi.hoisted(() => ({ error: null as Error | null }));

vi.mock("sonner", () => ({ toast }));
// 저장만 실패시킬 수 있게 감쌈. 평소에는 목 API를 그대로 부름.
vi.mock("@/entities/campaign", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  const save = actual.saveCampaignDraft as typeof saveCampaignDraft;
  return {
    ...actual,
    saveCampaignDraft: (draft: Parameters<typeof saveCampaignDraft>[0]) =>
      failure.error ? Promise.reject(failure.error) : save(draft),
  };
});

beforeEach(() => {
  window.sessionStorage.clear();
  failure.error = null;
  toast.success.mockClear();
  toast.error.mockClear();
});

function Panel() {
  const name = useCampaignRegisterStore(
    (state) => state.draft.campaignInfo.name,
  );
  const patchCampaignInfo = useCampaignRegisterStore(
    (state) => state.patchCampaignInfo,
  );
  const { saveDraft, saveBeforeMove } = useCampaignSave();
  const blockedReason = useCampaignRegisterStore(
    (state) => state.saveBlockedReason,
  );
  return (
    <>
      <p>이름: {name ?? "없음"}</p>
      <button onClick={() => patchCampaignInfo({ name: "봄 체험" })}>
        입력
      </button>
      <button onClick={() => void saveDraft()}>임시저장</button>
      <button onClick={() => void saveBeforeMove()}>이동</button>
      <output data-testid="blocked">{blockedReason ?? "없음"}</output>
    </>
  );
}

async function renderPanel() {
  const { campaignIdx } = await createCampaignDraft({
    serviceType: "PICK",
    productType: "BRAND",
  });
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      <CampaignRegisterProvider campaignId={campaignIdx}>
        <Panel />
      </CampaignRegisterProvider>
    </SWRConfig>,
  );
  await screen.findByText("이름: 없음");
  return { campaignIdx, user: userEvent.setup() };
}

describe("임시저장과 단계 이동 저장", () => {
  it("임시저장을 누르면 서버에 저장하고 성공 토스트를 띄운다", async () => {
    const { campaignIdx, user } = await renderPanel();

    await user.click(screen.getByRole("button", { name: "입력" }));
    await user.click(screen.getByRole("button", { name: "임시저장" }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("임시저장되었습니다."),
    );
    expect((await fetchCampaignDraft(campaignIdx)).campaignInfo.name).toBe(
      "봄 체험",
    );
  });

  it("저장하지 못하면 실패 토스트를 띄운다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    failure.error = new ApiError(500, undefined);
    const { user } = await renderPanel();

    await user.click(screen.getByRole("button", { name: "입력" }));
    await user.click(screen.getByRole("button", { name: "임시저장" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      ),
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("단계 이동 직전 저장이 실패하면 실패 토스트를 띄우고, 성공하면 조용히 넘어간다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { user } = await renderPanel();

    await user.click(screen.getByRole("button", { name: "입력" }));
    await user.click(screen.getByRole("button", { name: "이동" }));
    await waitFor(() => expect(toast.error).not.toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();

    failure.error = new ApiError(500, undefined);
    await user.click(screen.getByRole("button", { name: "입력" }));
    await user.click(screen.getByRole("button", { name: "이동" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
  });

  it.each(["NOT_EDITABLE", "VERSION_CONFLICT"])(
    "저장이 %s로 막히면 전용 알럿이 알리므로 실패 토스트는 띄우지 않는다",
    async (reason) => {
      const { user } = await renderPanel();
      failure.error = new ApiError(409, { result: false, reason });

      await user.click(screen.getByRole("button", { name: "입력" }));
      await user.click(screen.getByRole("button", { name: "이동" }));

      await waitFor(() =>
        expect(screen.getByTestId("blocked")).toHaveTextContent(reason),
      );
      expect(toast.error).not.toHaveBeenCalled();
    },
  );
});
