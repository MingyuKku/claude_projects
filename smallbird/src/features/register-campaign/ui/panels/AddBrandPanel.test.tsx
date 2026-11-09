import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { SWRConfig } from "swr";

import { createCampaignDraft } from "@/entities/campaign";

import { CampaignRegisterProvider } from "../CampaignRegisterProvider";
import { CampaignRegisterWizard } from "../CampaignRegisterWizard";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

// jsdom에는 Radix·cmdk가 쓰는 브라우저 API와 matchMedia가 없음. TAB 폭(768 이상, 1440 미만)을 흉내 냄: 콤보박스는 팝오버, 하위 화면은 서브 화면.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  URL.createObjectURL = vi.fn(() => "blob:brand-image");
});

beforeEach(() => {
  window.sessionStorage.clear();
  toast.success.mockClear();
  toast.error.mockClear();
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: query === "(min-width: 768px)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});
afterEach(() => vi.unstubAllGlobals());

function Search() {
  const { search } = useLocation();
  return <p data-testid="search">{search}</p>;
}

async function renderWizard() {
  const draft = await createCampaignDraft({
    serviceType: "PICK",
    productType: "BRAND",
  });
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      <MemoryRouter initialEntries={["/?step=campaign-info"]}>
        <CampaignRegisterProvider campaignId={draft.campaignIdx}>
          <CampaignRegisterWizard />
          <Search />
        </CampaignRegisterProvider>
      </MemoryRouter>
    </SWRConfig>,
  );
  await screen.findByRole("heading", { level: 2, name: "캠페인 정보 입력" });
  // 형식 검사는 화면 코드가 하므로 파일 선택창의 accept 필터는 끔(GIF도 올려 보려고).
  return userEvent.setup({ applyAccept: false });
}

async function openAddBrandPanel(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("combobox", { name: /브랜드명/ }));
  await user.click(await screen.findByRole("button", { name: "브랜드 추가" }));
  return screen.findByRole("button", { name: "저장" });
}

const nameKo = () => screen.getByRole("textbox", { name: /브랜드명\(국문\)/ });
const nameEn = () => screen.getByRole("textbox", { name: /브랜드명\(영문\)/ });

describe("브랜드 추가", () => {
  it("브랜드 메뉴 맨 위의 + 브랜드 추가로 하위 화면을 열고, 닫으면 1단계로 돌아온다", async () => {
    const user = await renderWizard();

    await openAddBrandPanel(user);

    expect(screen.getByTestId("search")).toHaveTextContent("panel=add-brand");
    expect(
      screen.getByRole("heading", { name: "브랜드 추가" }),
    ).toBeInTheDocument();
    // TAB·MO는 하위 화면이 본문을 대체해 1단계 입력칸과 하단 버튼이 보이지 않는다.
    expect(screen.queryByRole("textbox", { name: /캠페인명/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "다음" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "닫기" }));

    await waitFor(() =>
      expect(screen.getByTestId("search")).not.toHaveTextContent("panel="),
    );
    expect(
      await screen.findByRole("textbox", { name: /캠페인명/ }),
    ).toBeInTheDocument();
  });

  it("국문·영문이 모두 입력돼야 저장할 수 있다", async () => {
    const user = await renderWizard();
    const save = await openAddBrandPanel(user);
    expect(save).toBeDisabled();

    await user.type(nameKo(), "새 브랜드");
    expect(save).toBeDisabled();
    await user.type(nameEn(), "   ");
    expect(save).toBeDisabled();
    await user.type(nameEn(), "New Brand");

    expect(save).toBeEnabled();
  });

  it("저장하면 목록에 더하고 새 브랜드를 선택한 채 닫는다", async () => {
    const user = await renderWizard();
    const save = await openAddBrandPanel(user);

    await user.type(nameKo(), "새 브랜드");
    await user.type(nameEn(), "New Brand");
    await user.click(save);

    await waitFor(() =>
      expect(
        screen.getByRole("combobox", { name: /브랜드명/ }),
      ).toHaveTextContent("새 브랜드"),
    );
    expect(screen.getByTestId("search")).not.toHaveTextContent("panel=");
    await user.click(screen.getByRole("combobox", { name: /브랜드명/ }));
    expect(
      await screen.findByRole("option", { name: "새 브랜드" }),
    ).toBeInTheDocument();
  });

  it("이미지는 JPG·PNG 10MB 이하만 올릴 수 있고, 올리면 미리보기가 보이며 삭제할 수 있다", async () => {
    const user = await renderWizard();
    await openAddBrandPanel(user);
    const input = document.querySelector(
      "input[type=file]",
    ) as HTMLInputElement;

    await user.upload(input, new File(["x"], "a.gif", { type: "image/gif" }));
    expect(toast.error).toHaveBeenCalledWith(
      "JPG, PNG 파일만 올릴 수 있습니다.",
    );

    await user.upload(
      input,
      new File([new Uint8Array(10 * 1024 * 1024 + 1)], "big.png", {
        type: "image/png",
      }),
    );
    expect(toast.error).toHaveBeenCalledWith(
      "10MB 이하 파일만 올릴 수 있습니다.",
    );

    await user.upload(input, new File(["x"], "ok.png", { type: "image/png" }));
    await waitFor(() =>
      expect(document.querySelector("img")).toHaveAttribute(
        "src",
        "blob:brand-image",
      ),
    );
    await user.click(screen.getByRole("button", { name: "첨부 삭제" }));
    await waitFor(() => expect(document.querySelector("img")).toBeNull());
    expect(
      within(screen.getByRole("button", { name: "브랜드 이미지" })).getByText(
        "브랜드 이미지를 업로드해 주세요.",
      ),
    ).toBeInTheDocument();
  });
});
