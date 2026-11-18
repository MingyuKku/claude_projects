import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { toast } from "sonner";

import {
  requestSavedCardSubscription,
  useBillingCards,
  useSetDefaultBillingCard,
} from "@/entities/subscription";
import { ApiError } from "@/shared/api";

import { CheckoutPanel } from "./CheckoutPanel";
import { PaymentCompletedDialog } from "./PaymentCompletedDialog";

import type { SubscriptionPlanCatalog } from "@/entities/subscription";

const CATALOG: SubscriptionPlanCatalog = {
  yearlyDiscountRate: 20,
  plans: [
    {
      type: "recruit",
      isAvailable: true,
      monthlyPrice: 99999,
      yearlyPrice: 959988,
    },
    {
      type: "pick",
      isAvailable: true,
      monthlyPrice: 199999,
      yearlyPrice: 1919988,
    },
    {
      type: "live",
      isAvailable: false,
      monthlyPrice: 199999,
      yearlyPrice: 1919988,
    },
    {
      type: "applicator",
      isAvailable: false,
      monthlyPrice: 199999,
      yearlyPrice: 1919988,
    },
  ],
};

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
vi.mock("@/entities/subscription", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  requestSavedCardSubscription: vi.fn(),
  useBillingCards: vi.fn(),
  useSetDefaultBillingCard: vi.fn(),
}));

const DEFAULT_CARD = {
  id: "32",
  issuer: "BC카드",
  maskedNumber: "1234-56**-****-***7",
  isDefault: true,
};

function mockCards(
  data:
    | (typeof DEFAULT_CARD & { cardKind?: "credit" | "debit" | null })[]
    | undefined,
  { isError = false, mutate = vi.fn() } = {},
) {
  vi.mocked(useBillingCards).mockReturnValue({
    data,
    isLoading: false,
    isError,
    mutate,
  } as unknown as ReturnType<typeof useBillingCards>);
}

function LocationProbe() {
  const { pathname, search } = useLocation();
  return <p data-testid="location">{pathname + search}</p>;
}

// jsdom에는 Radix Select·ScrollArea가 쓰는 포인터 캡처·스크롤·크기 관찰 API가 없음.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
});

const setDefault = vi.fn<(cardId: string) => Promise<void>>();

beforeEach(() => {
  vi.mocked(requestSavedCardSubscription).mockReset();
  vi.mocked(toast.error).mockReset();
  setDefault.mockReset().mockResolvedValue(undefined);
  vi.mocked(useSetDefaultBillingCard).mockReturnValue(setDefault);
  mockCards([DEFAULT_CARD]);
});

function setup(period: "monthly" | "yearly" = "monthly") {
  const onCancel = vi.fn();
  render(
    <MemoryRouter>
      <CheckoutPanel
        catalog={CATALOG}
        type="pick"
        period={period}
        onCancel={onCancel}
      />
      <LocationProbe />
    </MemoryRouter>,
  );
  return { onCancel, user: userEvent.setup() };
}

describe("CheckoutPanel", () => {
  it("선택한 상품과 결제 금액을 보여 준다", () => {
    setup();
    expect(screen.getByText("월 199,999원")).toBeInTheDocument();
    expect(screen.getByText("199,999원")).toBeInTheDocument();
    expect(screen.queryByText("세부 유형")).toBeNull();
  });

  it("월간이면 월 요금과 1개월 단위 문구를 보여 준다", () => {
    setup("monthly");
    expect(screen.getByText("결제 즉시 1개월 이용 시작")).toBeInTheDocument();
    expect(
      screen.getByText(/1개월 단위로 자동 갱신되며, 매월 정기결제/),
    ).toBeInTheDocument();
  });

  it("연간이면 월 단위 문구가 연 단위로 바뀌고 결제 금액은 12개월치다", () => {
    setup("yearly");
    // 서버가 준 연간 결제 총액.
    expect(screen.getAllByText(/1,919,988/)).toHaveLength(2);
    expect(screen.getByText("연 1,919,988원")).toBeInTheDocument();
    expect(screen.getByText("결제 즉시 1년 이용 시작")).toBeInTheDocument();
    expect(
      screen.getByText(/1년 단위로 자동 갱신되며, 매년 정기결제/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/1개월/)).toBeNull();
  });

  it("안내사항에 동의해야 결제 버튼이 켜지고, 누르면 상품·주기로 기본 카드 결제를 요청한다", async () => {
    vi.mocked(requestSavedCardSubscription).mockResolvedValue({
      subscriptionId: "12",
    });
    const { user } = setup("yearly");
    const pay = screen.getByRole("button", { name: "결제" });
    expect(pay).toBeDisabled();

    await user.click(screen.getByRole("checkbox"));
    expect(pay).toBeEnabled();
    await user.click(pay);

    expect(requestSavedCardSubscription).toHaveBeenCalledWith(
      "pick",
      "yearly",
      undefined,
    );
  });

  it("결제 요약에는 결제 상품과 결제 금액만 있고 카드는 결제 수단에서 보여 준다", () => {
    setup("yearly");
    expect(screen.getByText("결제 상품")).toBeInTheDocument();
    expect(screen.getByText("결제 금액")).toBeInTheDocument();
    expect(screen.queryByText("결제 카드")).toBeNull();
    expect(screen.queryByText("BC카드 1234-56**-****-***7")).toBeNull();
  });

  it("결제 수단에 카드 결제(필수)와 등록 카드를 보여 주고 기본 카드가 선택돼 있다", () => {
    mockCards([
      DEFAULT_CARD,
      { ...DEFAULT_CARD, id: "33", issuer: "현대카드", isDefault: false },
    ]);
    setup();

    const method = screen.getByRole("radio", { name: "카드 결제" });
    expect(method).toBeChecked();
    expect(method).toBeDisabled();
    expect(screen.getByText("필수")).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "BC카드 1234-56**-****-***7" }),
    ).toBeChecked();
    expect(
      screen.getByRole("radio", { name: "현대카드 1234-56**-****-***7" }),
    ).not.toBeChecked();
    // 기본 카드 배지는 기본 카드에만 있음.
    expect(screen.getAllByText("기본 카드")).toHaveLength(1);
  });

  it("카드를 읽는 동안에는 카드 타일 자리를 비워 두고 결제 버튼도 켜지지 않는다", () => {
    mockCards(undefined);
    setup();
    expect(
      screen.queryByRole("radio", { name: /1234-56/ }),
    ).not.toBeInTheDocument();
  });

  it("카드를 읽기 전에는 결제 버튼이 켜지지 않는다", async () => {
    mockCards(undefined);
    const { user } = setup();
    await user.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("button", { name: "결제" })).toBeDisabled();
  });

  it("카드 조회가 실패하면 안내와 다시 시도를 보여 주고 결제 버튼은 꺼 둔다", async () => {
    const mutate = vi.fn();
    mockCards(undefined, { isError: true, mutate });
    const { user } = setup();
    expect(
      screen.getByText("카드 정보를 불러오지 못했습니다."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("button", { name: "결제" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it("기본 카드로 결제한 뒤 결과 쿼리로 돌아간다", async () => {
    vi.mocked(requestSavedCardSubscription).mockResolvedValue({
      subscriptionId: "12",
    });
    const { user } = setup("yearly");

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "결제" }));

    expect(requestSavedCardSubscription).toHaveBeenCalledWith(
      "pick",
      "yearly",
      undefined,
    );
    // 결제 응답을 기다린 뒤 이동하고, MemoryRouter 는 주소 변경을 transition 으로 반영해 클릭 직후에는 아직 바뀌지 않았을 수 있음.
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/mypage/subscribe?result=success",
      ),
    );
  });

  it("기본 카드 결제가 실패하면 이유를 토스트로 알리고 화면에 남는다", async () => {
    vi.mocked(requestSavedCardSubscription).mockRejectedValue(
      new ApiError(400, { result: false, reason: "PAYMENT_FAILED" }),
    );
    const { user } = setup();
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "결제" }));

    expect(toast.error).toHaveBeenCalledWith(
      "결제에 실패했습니다. 다시 시도해 주세요.",
    );
    expect(screen.getByTestId("location")).toHaveTextContent("/");
    expect(screen.getByRole("button", { name: "결제" })).toBeEnabled();
  });

  it("결제 실패 응답에 이니시스 거절 사유(pgMessage)가 있으면 토스트 설명으로 함께 보여 준다", async () => {
    vi.mocked(requestSavedCardSubscription).mockRejectedValue(
      new ApiError(400, {
        result: false,
        reason: "PAYMENT_FAILED",
        pgMessage: "잔액부족",
        pgCode: "1254",
      }),
    );
    const { user } = setup();
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "결제" }));

    expect(toast.error).toHaveBeenCalledWith(
      "결제에 실패했습니다. 다시 시도해 주세요.",
      { description: "잔액부족" },
    );
    expect(screen.getByRole("button", { name: "결제" })).toBeEnabled();
  });

  it("거절 사유가 비어 있으면 안내 문구만 보여 준다", async () => {
    vi.mocked(requestSavedCardSubscription).mockRejectedValue(
      new ApiError(400, {
        result: false,
        reason: "PAYMENT_FAILED",
        pgMessage: "",
      }),
    );
    const { user } = setup();
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "결제" }));

    expect(toast.error).toHaveBeenCalledWith(
      "결제에 실패했습니다. 다시 시도해 주세요.",
    );
  });

  it("이미 구독 중인 상품이면 이유를 토스트로 알리고 이동하지 않는다", async () => {
    vi.mocked(requestSavedCardSubscription).mockRejectedValue(
      new ApiError(409, { result: false, reason: "ALREADY_SUBSCRIBED" }),
    );
    const { user } = setup();
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "결제" }));

    expect(toast.error).toHaveBeenCalledWith("이미 구독 중인 상품입니다.");
    expect(screen.getByTestId("location")).toHaveTextContent("/");
    expect(screen.getByRole("button", { name: "결제" })).toBeEnabled();
  });

  it("모르는 에러 코드는 일반 오류 문구로 알린다", async () => {
    vi.mocked(requestSavedCardSubscription).mockRejectedValue(
      new ApiError(400, { result: false, reason: "INVALID_REQUEST" }),
    );
    const { user } = setup();
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "결제" }));

    expect(toast.error).toHaveBeenCalledWith(
      "예상하지 못한 오류가 발생했습니다.",
    );
  });

  it("취소는 onCancel을 부른다", async () => {
    const { user, onCancel } = setup();
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

describe("PaymentCompletedDialog", () => {
  it("'확인'만 있고 누르면 onConfirm을 부른다", async () => {
    const onConfirm = vi.fn();
    render(<PaymentCompletedDialog open onConfirm={onConfirm} />);
    expect(screen.getByText("구독 결제가 완료되었습니다.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "취소" })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "확인" }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });
});

describe("CheckoutPanel 기본 카드 변경", () => {
  const OTHER_CARD = {
    ...DEFAULT_CARD,
    id: "33",
    issuer: "현대카드",
    isDefault: false,
  };

  beforeEach(() => {
    mockCards([DEFAULT_CARD, OTHER_CARD]);
  });

  // 알럿이 열려 있으면 뒤 화면은 접근성 트리에서 빠져 hidden 으로 찾아야 함.
  const hidden = { hidden: true };

  it("다른 카드를 누르면 그 카드가 선택돼 보이고 기본 카드 변경 알럿이 뜬다", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("radio", { name: /현대카드/ }));

    expect(
      await screen.findByRole("alertdialog", { name: "기본 카드 변경" }),
    ).toHaveTextContent(
      "기본 카드로만 결제 가능합니다. 선택하신 카드를 기본 카드로 변경하시겠습니까?",
    );
    expect(
      screen.getByRole("radio", { ...hidden, name: /현대카드/ }),
    ).toBeChecked();
    expect(setDefault).not.toHaveBeenCalled();
  });

  it("취소하면 알럿이 닫히고 선택이 기본 카드로 돌아간다", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("radio", { name: /현대카드/ }));
    await screen.findByRole("alertdialog");

    await user.click(screen.getByRole("button", { name: "취소" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(screen.getByRole("radio", { name: /BC카드/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /현대카드/ })).not.toBeChecked();
    expect(setDefault).not.toHaveBeenCalled();
  });

  it("기본 카드 변경하기를 누르면 그 카드가 기본 카드가 되고 알럿이 닫힌다", async () => {
    setDefault.mockImplementation(async () => {
      mockCards([
        { ...DEFAULT_CARD, isDefault: false },
        { ...OTHER_CARD, isDefault: true },
      ]);
    });
    const { user } = setup();
    await user.click(screen.getByRole("radio", { name: /현대카드/ }));
    await screen.findByRole("alertdialog");

    await user.click(
      screen.getByRole("button", { name: "기본 카드 변경하기" }),
    );

    expect(setDefault).toHaveBeenCalledWith("33");
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(screen.getByRole("radio", { name: /현대카드/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /BC카드/ })).not.toBeChecked();
  });

  it("이미 삭제된 카드면 토스트로 알리고 카드 목록을 다시 읽으며 선택이 돌아간다", async () => {
    const mutate = vi.fn();
    mockCards([DEFAULT_CARD, OTHER_CARD], { mutate });
    setDefault.mockRejectedValue(
      new ApiError(404, { result: false, reason: "BILLING_CARD_NOT_FOUND" }),
    );
    const { user } = setup();
    await user.click(screen.getByRole("radio", { name: /현대카드/ }));
    await user.click(
      await screen.findByRole("button", { name: "기본 카드 변경하기" }),
    );

    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(toast.error).toHaveBeenCalledWith(
      "이미 삭제되었거나 없는 카드입니다.",
    );
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("radio", { name: /BC카드/ })).toBeChecked();
  });

  it("그 밖의 실패는 일반 오류 문구로 알린다", async () => {
    setDefault.mockRejectedValue(new Error("fail"));
    const { user } = setup();
    await user.click(screen.getByRole("radio", { name: /현대카드/ }));
    await user.click(
      await screen.findByRole("button", { name: "기본 카드 변경하기" }),
    );

    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(toast.error).toHaveBeenCalledWith(
      "예상하지 못한 오류가 발생했습니다.",
    );
  });
});

describe("CheckoutPanel 할부", () => {
  const OTHER_CARD = {
    ...DEFAULT_CARD,
    id: "33",
    issuer: "현대카드",
    isDefault: false,
  };

  async function payWith(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "결제" }));
  }

  beforeEach(() => {
    mockCards([DEFAULT_CARD, OTHER_CARD]);
    vi.mocked(requestSavedCardSubscription).mockResolvedValue({
      subscriptionId: "12",
    });
  });

  it("월간 결제는 모든 카드의 할부가 일시불로 잠겨 있다", () => {
    setup("monthly");
    const selects = screen.getAllByRole("combobox");
    expect(selects).toHaveLength(2);
    for (const select of selects) {
      expect(select).toBeDisabled();
      expect(select).toHaveTextContent("일시불");
    }
  });

  it("연간 결제는 결제에 쓰는 기본 카드의 할부만 고를 수 있다", () => {
    setup("yearly");
    expect(screen.getByRole("combobox", { name: /BC카드/ })).toBeEnabled();
    expect(screen.getByRole("combobox", { name: /현대카드/ })).toBeDisabled();
  });

  it("할부 목록은 일시불과 2~12개월이다", async () => {
    const { user } = setup("yearly");
    await user.click(screen.getByRole("combobox", { name: /BC카드/ }));

    const options = (await screen.findAllByRole("option")).map(
      (option) => option.textContent,
    );
    expect(options).toEqual([
      "일시불",
      ...Array.from({ length: 11 }, (_, index) => `${index + 2}개월`),
    ]);
  });

  it("고른 개월 수로 결제를 요청한다", async () => {
    const { user } = setup("yearly");
    await user.click(screen.getByRole("combobox", { name: /BC카드/ }));
    await user.click(await screen.findByRole("option", { name: "6개월" }));
    expect(screen.getByRole("combobox", { name: /BC카드/ })).toHaveTextContent(
      "6개월",
    );

    await payWith(user);

    expect(requestSavedCardSubscription).toHaveBeenCalledWith(
      "pick",
      "yearly",
      6,
    );
  });

  it("일시불이면 개월 수를 보내지 않는다", async () => {
    const { user } = setup("yearly");
    await payWith(user);
    expect(requestSavedCardSubscription).toHaveBeenCalledWith(
      "pick",
      "yearly",
      undefined,
    );
  });

  it("체크카드가 기본 카드면 연간이어도 할부를 고를 수 없다", () => {
    mockCards([{ ...DEFAULT_CARD, cardKind: "debit" }]);
    setup("yearly");
    expect(screen.getByRole("combobox", { name: /BC카드/ })).toBeDisabled();
  });

  it("카드 종류를 모르면(null) 할부를 막지 않는다", () => {
    mockCards([{ ...DEFAULT_CARD, cardKind: null }]);
    setup("yearly");
    expect(screen.getByRole("combobox", { name: /BC카드/ })).toBeEnabled();
  });

  it.each([
    [
      "INVALID_INSTALLMENT",
      "선택한 할부 개월로 결제할 수 없습니다. 다시 선택해 주세요.",
    ],
    [
      "INSTALLMENT_NOT_ALLOWED_CARD",
      "체크카드는 할부 결제를 할 수 없습니다. 일시불로 결제해 주세요.",
    ],
  ])(
    "서버가 %s 로 거절하면 이유를 토스트로 알린다",
    async (reason, message) => {
      vi.mocked(requestSavedCardSubscription).mockRejectedValue(
        new ApiError(400, { result: false, reason }),
      );
      const { user } = setup("yearly");
      await payWith(user);

      expect(toast.error).toHaveBeenCalledWith(message);
      expect(screen.getByRole("button", { name: "결제" })).toBeEnabled();
    },
  );
});
