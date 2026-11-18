import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { SWRConfig } from "swr";

import { serverApiV3 } from "@/shared/api";

import { NotificationConsentCards } from "./NotificationConsentCards";

import type * as SharedApi from "@/shared/api";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApiV3: { get: vi.fn(), put: vi.fn() },
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

const CONSENT = {
  alimAdInfoAgree: true,
  alimNightAgree: false,
  pushAdInfoAgree: true,
  pushNightAgree: false,
};

function setup() {
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      <NotificationConsentCards />
    </SWRConfig>,
  );
  return { user: userEvent.setup() };
}

async function findSwitches() {
  await screen.findByRole("heading", { name: "알림톡 알림" });
  return screen.getAllByRole("switch");
}

beforeEach(() => {
  vi.mocked(serverApiV3.get).mockReset().mockResolvedValue(CONSENT);
  vi.mocked(serverApiV3.put).mockReset();
  vi.mocked(toast).mockReset();
  vi.mocked(toast.error).mockReset();
});

describe("NotificationConsentCards", () => {
  it("조회한 동의 상태로 알림톡·푸시 스위치와 필수 알림 안내를 보인다", async () => {
    setup();
    const switches = await findSwitches();
    expect(switches.map((item) => item.getAttribute("aria-checked"))).toEqual([
      "true",
      "false",
      "true",
      "false",
    ]);
    expect(
      screen.getByRole("heading", { name: "푸시 알림" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "서비스 운영 및 중요 안내 등 필수 알림은 동의 여부와 관계없이 발송됩니다.",
      ),
    ).toBeInTheDocument();
  });

  it("푸시 야간 설명은 알림톡이 아니라 푸시 알림으로 쓴다", async () => {
    setup();
    expect(
      await screen.findByText(
        "야간(오후 9시~오전 8시)에 광고성 푸시 알림을 받을 수 있습니다.",
      ),
    ).toBeInTheDocument();
  });

  it("스위치를 켜면 바꾼 필드만 저장하고 동의 토스트를 띄운다", async () => {
    vi.mocked(serverApiV3.put).mockResolvedValue({
      ...CONSENT,
      alimNightAgree: true,
    });
    const { user } = setup();
    const [, alimNight] = await findSwitches();

    await user.click(alimNight!);

    expect(serverApiV3.put).toHaveBeenCalledWith("/mypage/account/agreement", {
      alimNightAgree: true,
    });
    expect(alimNight).toHaveAttribute("aria-checked", "true");
    expect(toast).toHaveBeenCalledWith(
      expect.stringMatching(/수신 동의되었습니다\.$/),
    );
  });

  it("스위치를 끄면 철회 토스트를 띄운다", async () => {
    vi.mocked(serverApiV3.put).mockResolvedValue({
      ...CONSENT,
      pushAdInfoAgree: false,
    });
    const { user } = setup();
    const [, , pushMarketing] = await findSwitches();

    await user.click(pushMarketing!);

    expect(serverApiV3.put).toHaveBeenCalledWith("/mypage/account/agreement", {
      pushAdInfoAgree: false,
    });
    expect(toast).toHaveBeenCalledWith(
      expect.stringMatching(/수신 동의가 철회되었습니다\.$/),
    );
  });

  it("저장에 실패하면 원래 값으로 되돌리고 오류 토스트를 띄운다", async () => {
    vi.mocked(serverApiV3.put).mockRejectedValue(new Error("agreement"));
    const { user } = setup();
    const [alimMarketing] = await findSwitches();

    await user.click(alimMarketing!);

    expect(toast.error).toHaveBeenCalledWith(
      "저장하지 못했습니다. 다시 시도해 주세요.",
    );
    expect(alimMarketing).toHaveAttribute("aria-checked", "true");
  });

  it("조회에 실패하면 다시 시도로 다시 읽는다", async () => {
    vi.mocked(serverApiV3.get).mockRejectedValueOnce(new Error("agreement"));
    const { user } = setup();

    await user.click(await screen.findByRole("button", { name: "다시 시도" }));

    expect(await findSwitches()).toHaveLength(4);
  });
});
