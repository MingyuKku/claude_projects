import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import {
  requestCardIssuance,
  submitIssuanceForm,
} from "@/entities/subscription";

import { RegisterCardDialog } from "./RegisterCardDialog";

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));
vi.mock("@/entities/subscription", () => ({
  requestCardIssuance: vi.fn(),
  submitIssuanceForm: vi.fn(),
}));

const ISSUANCE_FORM = {
  action: "https://pay.example/register",
  fields: { a: "1" },
};

const RETURN_PARAMS_KEY = "billing-card-return-params";

beforeEach(() => {
  sessionStorage.clear();
  vi.mocked(requestCardIssuance).mockReset();
  vi.mocked(submitIssuanceForm).mockReset();
  vi.mocked(toast.error).mockReset();
});

function setup(returnParams?: Record<string, string>) {
  const onCancel = vi.fn();
  render(
    <RegisterCardDialog open onCancel={onCancel} returnParams={returnParams} />,
  );
  return { onCancel, user: userEvent.setup() };
}

describe("RegisterCardDialog", () => {
  it("카드가 없다는 안내와 취소·결제 카드 등록하기 버튼을 보여 준다", () => {
    setup();
    expect(
      screen.getByText(
        "등록된 카드가 없습니다. 구독 결제를 위해 카드를 먼저 등록해주세요.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "취소" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "결제 카드 등록하기" }),
    ).toBeInTheDocument();
  });

  it("결제 카드 등록하기를 누르면 카드 등록 결제창으로 이동하고 안내는 닫히지 않는다", async () => {
    vi.mocked(requestCardIssuance).mockResolvedValue(ISSUANCE_FORM);
    const { user, onCancel } = setup();

    await user.click(
      screen.getByRole("button", { name: "결제 카드 등록하기" }),
    );

    expect(requestCardIssuance).toHaveBeenCalledWith({
      redirectUri: "/mypage/subscribe",
    });
    expect(submitIssuanceForm).toHaveBeenCalledWith(ISSUANCE_FORM);
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("결제창 값을 받지 못하면 토스트로 알리고 다시 누를 수 있다", async () => {
    vi.mocked(requestCardIssuance).mockRejectedValue(new Error("fail"));
    const { user } = setup();

    await user.click(
      screen.getByRole("button", { name: "결제 카드 등록하기" }),
    );

    expect(toast.error).toHaveBeenCalledWith(
      "카드를 등록하지 못했습니다. 다시 시도해 주세요.",
    );
    expect(submitIssuanceForm).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "결제 카드 등록하기" }),
    ).toBeEnabled();
  });

  it("돌아올 쿼리를 받으면 이니시스로 떠나기 전에 남긴다", async () => {
    vi.mocked(requestCardIssuance).mockResolvedValue(ISSUANCE_FORM);
    const { user } = setup({ panel: "checkout", plan: "pick" });

    await user.click(
      screen.getByRole("button", { name: "결제 카드 등록하기" }),
    );

    expect(JSON.parse(sessionStorage.getItem(RETURN_PARAMS_KEY) ?? "")).toEqual(
      { panel: "checkout", plan: "pick" },
    );
  });

  it("결제창 값을 받지 못하면 남긴 쿼리를 지운다", async () => {
    vi.mocked(requestCardIssuance).mockRejectedValue(new Error("fail"));
    const { user } = setup({ panel: "checkout", plan: "pick" });

    await user.click(
      screen.getByRole("button", { name: "결제 카드 등록하기" }),
    );

    expect(sessionStorage.getItem(RETURN_PARAMS_KEY)).toBeNull();
  });

  it("취소는 onCancel을 부른다", async () => {
    const { user, onCancel } = setup();
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
