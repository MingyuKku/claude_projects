import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { SWRConfig } from "swr";

import { createCampaignDraft } from "@/entities/campaign";

import * as registerApi from "../../api/register-api";
import { useCampaignRegisterStore } from "../../model/store-context";
import { useIntroGenerationWatcher } from "../../model/use-intro-generation";
import { CampaignRegisterProvider } from "../CampaignRegisterProvider";
import { IntroStep } from "./IntroStep";

import type { StepSlug } from "../../model/steps";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const file = (fileId: string) => ({
  fileId,
  url: `blob:${fileId}`,
  mediaType: "IMAGE" as const,
  durationSec: null,
  thumbnailUrl: null,
});

beforeEach(() => {
  window.sessionStorage.clear();
  vi.restoreAllMocks();
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.success).mockClear();
  vi.spyOn(registerApi, "startIntroGeneration").mockResolvedValue({
    jobId: "job-1",
  });
});

// 실제 화면에서는 마법사가 감시 훅을 쓰므로 같은 구성으로 맞춤.
function Harness({ slug = "intro" }: { slug?: StepSlug }) {
  useIntroGenerationWatcher(slug);
  const intro = useCampaignRegisterStore((state) => state.draft.intro);
  return (
    <>
      <IntroStep />
      <output data-testid="intro">{JSON.stringify(intro)}</output>
    </>
  );
}

const intro = () =>
  JSON.parse(screen.getByTestId("intro").textContent ?? "{}") as {
    sourceUrl: string | null;
    aiJob: { jobId: string; status: string } | null;
    description: string | null;
    hashtags: string[];
  };

async function renderStep(slug?: StepSlug) {
  const draft = await createCampaignDraft({
    serviceType: "PICK",
    productType: "BRAND",
  });
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      <CampaignRegisterProvider campaignId={draft.campaignIdx}>
        <Harness slug={slug} />
      </CampaignRegisterProvider>
    </SWRConfig>,
  );
  await screen.findByRole("radiogroup", { name: "작성 방식" });
  const user = userEvent.setup();
  await user.click(screen.getByRole("radio", { name: /AI 캠페인 소개서/ }));
  return user;
}

describe("5단계 AI 캠페인 소개서", () => {
  it("URL이 비어 있으면 AI 생성을 누를 수 없다", async () => {
    await renderStep();
    expect(screen.getByRole("button", { name: "AI 생성" })).toBeDisabled();
  });

  it("생성을 시작하면 안내를 띄우고 5단계 입력칸을 잠근다", async () => {
    vi.spyOn(registerApi, "fetchIntroGeneration").mockResolvedValue({
      status: "PENDING",
      result: null,
      failReason: null,
    });
    const user = await renderStep();

    await user.type(screen.getByRole("textbox"), "https://shop.test/p/1");
    await user.click(screen.getByRole("button", { name: "AI 생성" }));

    expect(await screen.findByText("AI 캠페인 소개서 생성 중")).toBeVisible();
    expect(intro().aiJob).toEqual({ jobId: "job-1", status: "PENDING" });
    expect(screen.getByRole("textbox").closest("[inert]")).not.toBeNull();
  });

  it("생성이 끝나면 결과 카드에 값을 채우고 다시 생성할 수 있다", async () => {
    vi.spyOn(registerApi, "fetchIntroGeneration").mockResolvedValue({
      status: "DONE",
      result: {
        mainImage: file("main"),
        media: [file("m1")],
        description: "AI 설명",
        notice: "AI 유의사항",
        hashtags: ["여름"],
      },
      failReason: null,
    });
    const user = await renderStep();

    await user.type(screen.getByRole("textbox"), "https://shop.test/p/1");
    await user.click(screen.getByRole("button", { name: "AI 생성" }));

    expect(
      await screen.findByRole("button", { name: "다시 생성하기" }),
    ).toBeEnabled();
    expect(screen.getByRole("heading", { name: "AI 생성" })).toBeVisible();
    expect(intro().aiJob).toEqual({ jobId: "job-1", status: "DONE" });
    expect(intro().description).toBe("AI 설명");
    expect(intro().hashtags).toEqual(["여름"]);
    expect(
      screen.queryByText("AI 캠페인 소개서 생성 중"),
    ).not.toBeInTheDocument();
  });

  it("생성에 실패하면 토스트를 띄우고 작업을 비우며 입력한 URL은 남긴다", async () => {
    vi.spyOn(registerApi, "fetchIntroGeneration").mockResolvedValue({
      status: "FAILED",
      result: null,
      failReason: "GENERATION_FAILED",
    });
    const user = await renderStep();

    await user.type(screen.getByRole("textbox"), "https://shop.test/fail");
    await user.click(screen.getByRole("button", { name: "AI 생성" }));

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(intro().aiJob).toBeNull();
    expect(intro().sourceUrl).toBe("https://shop.test/fail");
    expect(screen.getByRole("button", { name: "AI 생성" })).toBeEnabled();
  });

  it("5단계에 있으면 완료 토스트를 띄우지 않고, 다른 단계에 있으면 띄운다", async () => {
    const done = {
      status: "DONE" as const,
      result: {
        mainImage: file("main"),
        media: [file("m1")],
        description: "AI 설명",
        notice: "AI 유의사항",
        hashtags: ["여름"],
      },
      failReason: null,
    };
    vi.spyOn(registerApi, "fetchIntroGeneration").mockResolvedValue(done);

    // 5단계: 결과 카드가 바로 보이므로 토스트 없음.
    const user = await renderStep("intro");
    await user.type(screen.getByRole("textbox"), "https://shop.test/p/1");
    await user.click(screen.getByRole("button", { name: "AI 생성" }));
    await screen.findByRole("button", { name: "다시 생성하기" });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("다른 단계에서 생성이 끝나면 완료 토스트를 띄운다", async () => {
    vi.spyOn(registerApi, "fetchIntroGeneration").mockResolvedValue({
      status: "DONE",
      result: {
        mainImage: file("main"),
        media: [file("m1")],
        description: "AI 설명",
        notice: "AI 유의사항",
        hashtags: ["여름"],
      },
      failReason: null,
    });
    const user = await renderStep("add-ons");
    await user.type(screen.getByRole("textbox"), "https://shop.test/p/1");
    await user.click(screen.getByRole("button", { name: "AI 생성" }));

    await vi.waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("AI 생성이 완료되었습니다."),
    );
  });
});
