import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { toast } from "sonner";

import {
  requestSavedCardSubscription,
  requestSubscriptionIssuance,
  submitIssuanceForm,
  useBillingCards,
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
  requestSubscriptionIssuance: vi.fn(),
  requestSavedCardSubscription: vi.fn(),
  submitIssuanceForm: vi.fn(),
  useBillingCards: vi.fn(),
}));

const DEFAULT_CARD = {
  id: "32",
  issuer: "BC카드",
  maskedNumber: "1234-56**-****-***7",
  isDefault: true,
};

function mockCards(
  data: (typeof DEFAULT_CARD)[] | undefined,
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

const ISSUANCE_FORM = {
  action: "https://pay.example/issue",
  fields: { a: "1" },
};

beforeEach(() => {
  vi.mocked(requestSubscriptionIssuance).mockReset();
  vi.mocked(submitIssuanceForm).mockReset();
  vi.mocked(requestSavedCardSubscription).mockReset();
  vi.mocked(toast.error).mockReset();
  mockCards([]);
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

  it("안내사항에 동의해야 결제 버튼이 켜지고, 누르면 상품·주기로 결제창 값을 받아 이동한다", async () => {
    vi.mocked(requestSubscriptionIssuance).mockResolvedValue(ISSUANCE_FORM);
    const { user } = setup("yearly");
    const pay = screen.getByRole("button", { name: "결제" });
    expect(pay).toBeDisabled();

    await user.click(screen.getByRole("checkbox"));
    expect(pay).toBeEnabled();
    await user.click(pay);

    expect(requestSubscriptionIssuance).toHaveBeenCalledWith("pick", "yearly", {
      redirectUri: "/mypage/subscribe",
    });
    expect(submitIssuanceForm).toHaveBeenCalledWith(ISSUANCE_FORM);
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

  it("기본 카드가 있으면 결제 카드를 보여 주고, 결제창 없이 그 카드로 결제한 뒤 결과 쿼리로 돌아간다", async () => {
    mockCards([DEFAULT_CARD]);
    vi.mocked(requestSavedCardSubscription).mockResolvedValue({
      subscriptionId: "12",
    });
    const { user } = setup("yearly");
    expect(screen.getByText("BC카드 1234-56**-****-***7")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "결제" }));

    expect(requestSavedCardSubscription).toHaveBeenCalledWith("pick", "yearly");
    expect(requestSubscriptionIssuance).not.toHaveBeenCalled();
    expect(submitIssuanceForm).not.toHaveBeenCalled();
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/mypage/subscribe?result=success",
    );
  });

  it("기본 카드 결제가 실패하면 이유를 토스트로 알리고 화면에 남는다", async () => {
    mockCards([DEFAULT_CARD]);
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

  it("결제창 값을 받지 못하면 이유를 토스트로 알리고 이동하지 않는다", async () => {
    vi.mocked(requestSubscriptionIssuance).mockRejectedValue(
      new ApiError(409, { result: false, reason: "ALREADY_SUBSCRIBED" }),
    );
    const { user } = setup();
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "결제" }));

    expect(toast.error).toHaveBeenCalledWith("이미 구독 중인 상품입니다.");
    expect(submitIssuanceForm).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "결제" })).toBeEnabled();
  });

  it("모르는 에러 코드는 일반 오류 문구로 알린다", async () => {
    vi.mocked(requestSubscriptionIssuance).mockRejectedValue(
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
