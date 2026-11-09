import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { SWRConfig } from "swr";

import { createCampaignDraft } from "@/entities/campaign";

import { useCampaignRegisterStore } from "../../model/store-context";
import { CampaignRegisterProvider } from "../CampaignRegisterProvider";
import { IntroStep } from "./IntroStep";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

beforeEach(() => {
  window.sessionStorage.clear();
  vi.mocked(toast.error).mockClear();
});

function Probe() {
  const intro = useCampaignRegisterStore((state) => state.draft.intro);
  return <output data-testid="intro">{JSON.stringify(intro)}</output>;
}

const intro = () =>
  JSON.parse(screen.getByTestId("intro").textContent ?? "{}") as {
    mode: string | null;
    media: { fileId: string }[];
    hashtags: string[];
    description: string | null;
  };

async function renderStep() {
  const draft = await createCampaignDraft({
    serviceType: "PICK",
    productType: "BRAND",
  });
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      <CampaignRegisterProvider campaignId={draft.campaignIdx}>
        <IntroStep />
        <Probe />
      </CampaignRegisterProvider>
    </SWRConfig>,
  );
  await screen.findByRole("radiogroup", { name: "작성 방식" });
  return userEvent.setup();
}

const png = (name: string) => new File(["x"], name, { type: "image/png" });

describe("5단계 캠페인 소개서 직접 작성", () => {
  it("직접 작성을 고르면 입력 필드가 나오고 AI로 바꿔도 입력값은 남는다", async () => {
    const user = await renderStep();
    expect(screen.queryByText("캠페인 설명")).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /직접 작성하기/ }));
    await user.type(screen.getByPlaceholderText(/캠페인 소개와/), "설명");
    await user.click(screen.getByRole("radio", { name: /AI 캠페인 소개서/ }));

    expect(intro().mode).toBe("AI");
    expect(intro().description).toBe("설명");
  });

  it("해시태그는 Enter로 추가하고 같은 값은 넣지 않으며 ×로 지운다", async () => {
    const user = await renderStep();
    await user.click(screen.getByRole("radio", { name: /직접 작성하기/ }));
    const input = screen.getByPlaceholderText(/키워드 입력 후 Enter/);

    await user.type(input, "여름{Enter}");
    await user.type(input, "#여름{Enter}");
    await user.type(input, "세일{Enter}");
    expect(intro().hashtags).toEqual(["여름", "세일"]);

    await user.click(screen.getByRole("button", { name: "여름 삭제" }));
    expect(intro().hashtags).toEqual(["세일"]);
  });

  it("상세 미디어는 5개까지만 올라가고 ×로 지울 수 있다", async () => {
    const user = await renderStep();
    await user.click(screen.getByRole("radio", { name: /직접 작성하기/ }));
    const input = document.querySelector<HTMLInputElement>(
      'input[type="file"][multiple]',
    );

    await user.upload(
      input!,
      Array.from({ length: 7 }, (_, i) => png(`${i}.png`)),
    );
    await screen.findAllByRole("button", { name: "삭제" });
    expect(intro().media).toHaveLength(5);
    expect(toast.error).toHaveBeenCalledWith("최대 5개까지 올릴 수 있습니다.");

    const [firstRemove] = screen.getAllByRole("button", { name: "삭제" });
    await user.click(firstRemove!);
    expect(intro().media).toHaveLength(4);
  });

  it("상세 미디어 업로드 중 일부가 실패해도 먼저 올라간 파일은 남는다", async () => {
    const user = await renderStep();
    await user.click(screen.getByRole("radio", { name: /직접 작성하기/ }));
    const input = document.querySelector<HTMLInputElement>(
      'input[type="file"][multiple]',
    );

    fireEvent.change(input!, {
      target: {
        files: [
          png("a.png"),
          new File(["x"], "b.pdf", { type: "application/pdf" }),
        ],
      },
    });

    await screen.findAllByRole("button", { name: "삭제" });
    expect(intro().media).toHaveLength(1);
    expect(toast.error).toHaveBeenCalled();
  });

  it("썸네일을 끌어 놓으면 순서가 바뀐다", async () => {
    const user = await renderStep();
    await user.click(screen.getByRole("radio", { name: /직접 작성하기/ }));
    const input = document.querySelector<HTMLInputElement>(
      'input[type="file"][multiple]',
    );
    await user.upload(input!, [png("a.png"), png("b.png")]);
    await screen.findAllByRole("button", { name: "삭제" });
    const [first, second] = intro().media.map((m) => m.fileId);

    const [dragged, target] = screen.getAllByRole("listitem");
    fireEvent.dragStart(dragged!);
    fireEvent.drop(target!);

    expect(intro().media.map((m) => m.fileId)).toEqual([second, first]);
  });

  it("썸네일 위에 파일을 놓아도 브라우저가 열지 않고 업로드한다", async () => {
    const user = await renderStep();
    await user.click(screen.getByRole("radio", { name: /직접 작성하기/ }));
    const input = document.querySelector<HTMLInputElement>(
      'input[type="file"][multiple]',
    );
    await user.upload(input!, [png("a.png")]);
    await screen.findAllByRole("button", { name: "삭제" });

    const [thumbnail] = screen.getAllByRole("listitem");
    const isNotPrevented = fireEvent.drop(thumbnail!, {
      dataTransfer: { files: [png("b.png")] },
    });

    expect(isNotPrevented).toBe(false);
    await vi.waitFor(() => expect(intro().media).toHaveLength(2));
  });
});
