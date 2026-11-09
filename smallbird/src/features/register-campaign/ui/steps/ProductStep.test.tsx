import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";

import { createCampaignDraft } from "@/entities/campaign";

import { useCampaignRegisterStore } from "../../model/store-context";
import { CampaignRegisterProvider } from "../CampaignRegisterProvider";
import { ProductPressNotice } from "./product/ProductPressFields";
import { ProductStep } from "./ProductStep";

import type { CampaignType } from "@/entities/campaign";

const postcode = vi.hoisted(() => ({
  openPostcodeSearch: vi.fn(),
}));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));

vi.mock("sonner", () => ({ toast }));
// 우편번호 팝업은 외부 스크립트라 모킹함.
vi.mock("@/shared/lib", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  openPostcodeSearch: postcode.openPostcodeSearch,
}));

beforeEach(() => {
  window.sessionStorage.clear();
  postcode.openPostcodeSearch.mockReset();
  toast.error.mockClear();
});

// 1단계에서 유형을 골랐다고 보고 store에 넣고, 입력한 값을 화면 밖에서 읽는 도구.
function Probe({ type }: { type: CampaignType | null }) {
  const change = useCampaignRegisterStore((state) => state.changeCampaignType);
  const product = useCampaignRegisterStore((state) => state.draft.product);
  return (
    <>
      <button onClick={() => type && change(type)}>유형 고르기</button>
      <output data-testid="product">
        {JSON.stringify({
          name: product.productName,
          quantity: product.quantityPerInfluencer,
          price: product.productPrice,
          returnRequired: product.returnRequired,
          rental: product.rental,
          returnAddress: product.returnAddress,
          returnFee: product.returnShippingFee,
          returnContact: product.returnContact,
          rentalAddress: product.rentalReturnAddress,
          rentalFee: product.rentalReturnShippingFee,
          rentalContact: product.rentalReturnContact,
          storeName: product.storeName,
          storeAddress: product.storeAddress,
          coupon: product.visitCouponCode,
          benefit: product.visitBenefit,
          purchaseUrl: product.purchaseUrl,
          purchaseVerified: product.purchaseUrlVerified,
          purchasePrice: product.purchasePrice,
          purchaseGuide: product.purchaseGuide,
        })}
      </output>
    </>
  );
}

const product = () =>
  JSON.parse(screen.getByTestId("product").textContent ?? "{}") as Record<
    string,
    unknown
  >;

async function renderStep(
  type: CampaignType | null = "PRODUCT_DELIVERY",
  serviceType: "PICK" | "RECRUIT" = "PICK",
) {
  const draft = await createCampaignDraft({
    serviceType,
    productType: "BRAND",
  });
  render(
    <SWRConfig value={{ provider: () => new Map(), shouldRetryOnError: false }}>
      <CampaignRegisterProvider campaignId={draft.campaignIdx}>
        <ProductPressNotice />
        <ProductStep />
        <Probe type={type} />
      </CampaignRegisterProvider>
    </SWRConfig>,
  );
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "유형 고르기" }));
  return user;
}

describe("2단계 공통: 캠페인 유형", () => {
  it("1단계에서 고른 유형만 눌린 모양이고 나머지는 비활성이다", async () => {
    await renderStep("PRODUCT_DELIVERY");
    const group = screen.getByRole("group", { name: /캠페인 유형/ });

    expect(
      within(group).getByRole("radio", { name: "제품발송형" }),
    ).toBeChecked();
    for (const name of ["기자단형", "매장방문형", "구매리뷰형"]) {
      expect(within(group).getByRole("radio", { name })).toBeDisabled();
    }
  });

  it("고른 유형을 눌러도 바뀌지 않는다(바꾸려면 1단계로 돌아감)", async () => {
    const user = await renderStep("PRODUCT_DELIVERY");
    const selected = screen.getByRole("radio", { name: "제품발송형" });

    await user.click(selected);

    expect(selected).toBeChecked();
  });
});

describe("2단계 제품발송형", () => {
  it("협찬제품명을 입력한다", async () => {
    const user = await renderStep();

    await user.type(
      screen.getByRole("textbox", { name: /협찬제품명 및 수량/ }),
      "봄 세트",
    );

    expect(product().name).toBe("봄 세트");
  });

  it("수량과 금액은 숫자만 받고 천 단위로 보인다", async () => {
    const user = await renderStep();
    const quantity = screen.getByRole("textbox", { name: "1인당 제공 수량" });
    const price = screen.getByRole("textbox", { name: /협찬제품 금액/ });

    await user.type(quantity, "1a2");
    await user.type(price, "45000원");

    expect(quantity).toHaveValue("12");
    expect(price).toHaveValue("45,000");
    expect(product()).toMatchObject({ quantity: 12, price: 45000 });
  });

  it("지우면 입력 없음(null)이 된다", async () => {
    const user = await renderStep();
    const price = screen.getByRole("textbox", { name: /협찬제품 금액/ });
    await user.type(price, "100");

    await user.clear(price);

    expect(product().price).toBeNull();
  });

  it("반품 회수 여부는 기본이 회수 안함이고 회수 있음을 고를 수 있다", async () => {
    const user = await renderStep();
    expect(screen.getByRole("radio", { name: "회수 안함" })).toBeChecked();
    expect(
      screen.getByText(
        "최종선정된 크리에이터가 캠페인을 취소할 경우, 협찬 제품 회수 반품 택배 주소를 입력해주세요.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "회수 있음" }));

    expect(screen.getByRole("radio", { name: "회수 있음" })).toBeChecked();
    expect(product().returnRequired).toBe(true);
  });

  it("대여 상품은 협찬제품 금액이 100만원 이상일 때만 고를 수 있다", async () => {
    const user = await renderStep();
    const price = screen.getByRole("textbox", { name: /협찬제품 금액/ });
    const rental = () => screen.getByRole("radio", { name: "대여 상품" });
    expect(screen.getByRole("radio", { name: "일반 상품" })).toBeChecked();
    expect(rental()).toBeDisabled();

    await user.type(price, "999999");
    expect(rental()).toBeDisabled();

    await user.clear(price);
    await user.type(price, "1000000");
    expect(rental()).toBeEnabled();
    await user.click(rental());
    expect(product().rental).toBe(true);
  });

  it("금액을 100만원 미만으로 내리면 일반 상품으로 되돌아간다", async () => {
    const user = await renderStep();
    const price = screen.getByRole("textbox", { name: /협찬제품 금액/ });
    await user.type(price, "1000000");
    await user.click(screen.getByRole("radio", { name: "대여 상품" }));

    await user.clear(price);
    await user.type(price, "500000");

    expect(screen.getByRole("radio", { name: "일반 상품" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "대여 상품" })).toBeDisabled();
    expect(product().rental).toBe(false);
  });

  it("대여 상품 안내 두 줄을 보인다", async () => {
    await renderStep();

    expect(
      screen.getByText(
        "협찬제품 금액이 100만원 이상의 고가 협찬제품은 대여 상품으로 캠페인 진행이 가능해요.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("단, 상품 회수는 광고주가 직접 진행해야해요."),
    ).toBeInTheDocument();
  });

  it("키보드 이동 순서가 화면 순서(유형 → 제품명·수량 → 금액 → 반품 회수 → 대여 상품)와 같다", async () => {
    await renderStep();

    const focusable = screen
      .getAllByRole("textbox")
      .map((element) => element.getAttribute("placeholder"));

    expect(focusable).toEqual([
      "협찬제품명을 입력해주세요.",
      "1인당 제공 수량을 입력해주세요.",
      "제품 1개당 금액을 입력해주세요.",
    ]);
    const labels = screen
      .getAllByRole("group")
      .map((group) => group.getAttribute("aria-labelledby"))
      .map((id) => document.getElementById(id ?? "")?.textContent);
    expect(labels).toEqual([
      "캠페인 유형*",
      "반품 회수 여부(선택)",
      "대여 상품 여부*",
    ]);
  });
});

describe("2단계 제품발송형 회수 입력", () => {
  const SEOUL = { zonecode: "06236", address: "서울 강남구 테헤란로 1" };

  it("회수 안함이면 회수 입력이 없고, 회수 있음을 고르면 주소·비용·연락처가 나타난다", async () => {
    const user = await renderStep();
    expect(screen.queryByText("협찬제품 반품 회수 택배 주소")).toBeNull();

    await user.click(screen.getByRole("radio", { name: "회수 있음" }));

    expect(
      screen.getByText("협찬제품 반품 회수 택배 주소"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "상세 주소 입력" }),
    ).toBeInTheDocument();
    expect(screen.getByText("반품 회수 택배 비용")).toBeInTheDocument();
    expect(screen.getByText("반품 회수 연락처")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "주소 검색" })).toHaveLength(
      1,
    );
  });

  it("주소 검색에서 고른 주소와 우편번호가 읽기 전용 칸에 들어가고 상세 주소는 직접 입력한다", async () => {
    postcode.openPostcodeSearch.mockResolvedValue(SEOUL);
    const user = await renderStep();
    await user.click(screen.getByRole("radio", { name: "회수 있음" }));

    await user.click(screen.getByRole("button", { name: "주소 검색" }));
    await user.type(
      screen.getByRole("textbox", { name: "상세 주소 입력" }),
      "빅 빌딩 3층",
    );

    const address = screen.getByRole("textbox", {
      name: "협찬제품 반품 회수 택배 주소",
    });
    expect(address).toHaveValue("서울 강남구 테헤란로 1");
    expect(address).toHaveAttribute("readonly");
    expect(product().returnAddress).toEqual({
      ...SEOUL,
      detail: "빅 빌딩 3층",
    });
  });

  it("주소를 다시 검색해도 입력한 상세 주소는 남고, 고르지 않고 닫으면 바뀌지 않는다", async () => {
    postcode.openPostcodeSearch.mockResolvedValueOnce(SEOUL);
    const user = await renderStep();
    await user.click(screen.getByRole("radio", { name: "회수 있음" }));
    await user.click(screen.getByRole("button", { name: "주소 검색" }));
    await user.type(
      screen.getByRole("textbox", { name: "상세 주소 입력" }),
      "3층",
    );

    postcode.openPostcodeSearch.mockResolvedValueOnce({
      zonecode: "04524",
      address: "서울 중구 세종대로 110",
    });
    await user.click(screen.getByRole("button", { name: "주소 검색" }));
    expect(product().returnAddress).toEqual({
      zonecode: "04524",
      address: "서울 중구 세종대로 110",
      detail: "3층",
    });

    postcode.openPostcodeSearch.mockResolvedValueOnce(undefined);
    await user.click(screen.getByRole("button", { name: "주소 검색" }));
    expect(product().returnAddress).toMatchObject({ zonecode: "04524" });
  });

  it("주소 검색을 불러오지 못하면 실패 토스트를 띄운다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    postcode.openPostcodeSearch.mockRejectedValue(new Error("script"));
    const user = await renderStep();
    await user.click(screen.getByRole("radio", { name: "회수 있음" }));

    await user.click(screen.getByRole("button", { name: "주소 검색" }));

    expect(toast.error).toHaveBeenCalledWith(
      "주소 검색을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
    expect(product().returnAddress).toBeNull();
  });

  it("택배 비용은 숫자만, 연락처는 숫자와 하이픈만 받는다", async () => {
    const user = await renderStep();
    await user.click(screen.getByRole("radio", { name: "회수 있음" }));

    await user.type(
      screen.getByRole("textbox", { name: /반품 회수 택배 비용/ }),
      "3500원",
    );
    await user.type(
      screen.getByRole("textbox", { name: /반품 회수 연락처/ }),
      "010-12ab34",
    );

    expect(
      screen.getByRole("textbox", { name: /반품 회수 택배 비용/ }),
    ).toHaveValue("3,500");
    expect(product()).toMatchObject({
      returnFee: 3500,
      returnContact: "010-1234",
    });
  });

  it("회수 안함으로 돌려도 입력한 값은 남아 다시 고르면 이어 쓴다", async () => {
    const user = await renderStep();
    await user.click(screen.getByRole("radio", { name: "회수 있음" }));
    await user.type(
      screen.getByRole("textbox", { name: /반품 회수 연락처/ }),
      "01012345678",
    );

    await user.click(screen.getByRole("radio", { name: "회수 안함" }));
    expect(screen.queryByText("반품 회수 연락처")).toBeNull();
    await user.click(screen.getByRole("radio", { name: "회수 있음" }));

    expect(
      screen.getByRole("textbox", { name: /반품 회수 연락처/ }),
    ).toHaveValue("01012345678");
  });
});

describe("2단계 제품발송형 대여 상품 회수 입력", () => {
  it("대여 상품을 고르면 대여 회수 주소·비용·연락처가 나타나고 반품 회수와 따로 저장된다", async () => {
    postcode.openPostcodeSearch.mockResolvedValue({
      zonecode: "06236",
      address: "서울 강남구 테헤란로 1",
    });
    const user = await renderStep();
    await user.type(
      screen.getByRole("textbox", { name: /협찬제품 금액/ }),
      "1500000",
    );
    expect(screen.queryByText("대여 상품 회수 택배 주소")).toBeNull();

    await user.click(screen.getByRole("radio", { name: "대여 상품" }));
    expect(screen.getByText("대여 상품 회수 택배 주소")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "주소 검색" }));
    await user.type(
      screen.getByRole("textbox", { name: /상품 회수 택배 비용/ }),
      "5000",
    );
    await user.type(
      screen.getByRole("textbox", { name: /상품 회수 연락처/ }),
      "02-123-4567",
    );

    expect(product()).toMatchObject({
      rentalAddress: { zonecode: "06236" },
      rentalFee: 5000,
      rentalContact: "02-123-4567",
      returnAddress: null,
    });
  });

  it("금액을 100만원 미만으로 내리면 대여 회수 입력이 사라진다", async () => {
    const user = await renderStep();
    const price = screen.getByRole("textbox", { name: /협찬제품 금액/ });
    await user.type(price, "1000000");
    await user.click(screen.getByRole("radio", { name: "대여 상품" }));
    expect(screen.getByText("대여 상품 회수 택배 주소")).toBeInTheDocument();

    await user.clear(price);
    await user.type(price, "10000");

    expect(screen.queryByText("대여 상품 회수 택배 주소")).toBeNull();
  });

  it("반품 회수와 대여 회수를 함께 쓰면 주소 검색 버튼이 둘이다", async () => {
    const user = await renderStep();
    await user.type(
      screen.getByRole("textbox", { name: /협찬제품 금액/ }),
      "1000000",
    );
    await user.click(screen.getByRole("radio", { name: "대여 상품" }));
    await user.click(screen.getByRole("radio", { name: "회수 있음" }));

    expect(screen.getAllByRole("button", { name: "주소 검색" })).toHaveLength(
      2,
    );
  });
});

describe("2단계 기자단형", () => {
  it("입력 칸 없이 빈 상태 문구만 보이고 5단계 이름으로 안내한다", async () => {
    await renderStep("PRESS");

    expect(
      screen.getByText("기자단형은 별도의 협찬 정보 입력이 없습니다."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/다음 단계인 '캠페인 소개서'에서 입력해주세요/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("카드 위 안내 박스에 5단계 이름이 들어간다", async () => {
    await renderStep("PRESS");

    expect(screen.getByText("다음 단계에서 입력해주세요.")).toBeInTheDocument();
    expect(
      screen.getByText(/'캠페인 소개서' 단계에서 자세히 안내/),
    ).toBeInTheDocument();
  });

  it("다른 유형에서는 안내 박스가 없다", async () => {
    await renderStep("STORE_VISIT");

    expect(screen.queryByText("다음 단계에서 입력해주세요.")).toBeNull();
  });
});

describe("2단계 매장방문형", () => {
  it("방문 매장명·쿠폰 인증번호·혜택을 입력한다", async () => {
    const user = await renderStep("STORE_VISIT");

    await user.type(
      screen.getByRole("textbox", { name: /방문 매장명/ }),
      "빅버드 카페",
    );
    await user.type(
      screen.getByRole("textbox", { name: /방문 쿠폰 인증번호/ }),
      "ABC-123",
    );
    await user.type(
      screen.getByRole("textbox", { name: /방문 시 제공 혜택 및 수량/ }),
      "음료 1잔",
    );

    expect(product()).toMatchObject({
      storeName: "빅버드 카페",
      coupon: "ABC-123",
      benefit: "음료 1잔",
    });
  });

  it("혜택은 300자까지만 받고 글자 수를 보인다", async () => {
    const user = await renderStep("STORE_VISIT");
    const benefit = screen.getByRole("textbox", {
      name: /방문 시 제공 혜택 및 수량/,
    });

    await user.click(benefit);
    await user.paste("가".repeat(305));

    expect(benefit).toHaveValue("가".repeat(300));
    expect(benefit.parentElement).toHaveTextContent(/300\/300$/);
  });

  it("매장 주소는 검색으로 고르고 상세 주소 칸이 없다", async () => {
    postcode.openPostcodeSearch.mockResolvedValue({
      zonecode: "06236",
      address: "서울 강남구 테헤란로 1",
    });
    const user = await renderStep("STORE_VISIT");

    await user.click(screen.getByRole("button", { name: "주소 검색" }));

    expect(screen.getByRole("textbox", { name: /매장 주소/ })).toHaveValue(
      "서울 강남구 테헤란로 1",
    );
    expect(screen.queryByPlaceholderText("상세 주소 입력")).toBeNull();
    expect(product().storeAddress).toMatchObject({ zonecode: "06236" });
  });
});

describe("2단계 구매리뷰형", () => {
  it("구매제품명과 구매 관련 안내(300자)를 입력한다", async () => {
    const user = await renderStep("PURCHASE_REVIEW");

    await user.type(
      screen.getByRole("textbox", { name: /구매제품명/ }),
      "봄 세트",
    );
    const guide = screen.getByRole("textbox", { name: /구매 관련 안내/ });
    await user.click(guide);
    await user.paste("가".repeat(305));

    expect(guide).toHaveValue("가".repeat(300));
    expect(product()).toMatchObject({ name: "봄 세트" });
  });

  it("URL 확인을 통과하면 유효 문구를 보이고 정리된 주소로 확인 결과를 남긴다", async () => {
    const user = await renderStep("PURCHASE_REVIEW");

    await user.type(
      screen.getByRole("textbox", { name: /구매처 링크/ }),
      " https://shop.example.com/p/1 ",
    );
    await user.click(screen.getByRole("button", { name: "URL 확인" }));

    expect(await screen.findByText("유효한 URL입니다.")).toBeInTheDocument();
    expect(product()).toMatchObject({
      purchaseUrl: "https://shop.example.com/p/1",
      purchaseVerified: true,
    });
  });

  it("형식이 틀리면 오류 문구를 보이고 확인 결과는 남지 않는다", async () => {
    const user = await renderStep("PURCHASE_REVIEW");
    const url = screen.getByRole("textbox", { name: /구매처 링크/ });

    await user.type(url, "shop.example.com");
    await user.click(screen.getByRole("button", { name: "URL 확인" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "유효하지 않은 URL입니다.",
    );
    expect(url).toBeInvalid();
    expect(product().purchaseVerified).toBeNull();
  });

  it("링크를 고치면 확인 결과와 오류 문구가 사라진다", async () => {
    const user = await renderStep("PURCHASE_REVIEW");
    const url = screen.getByRole("textbox", { name: /구매처 링크/ });
    await user.type(url, "https://shop.example.com");
    await user.click(screen.getByRole("button", { name: "URL 확인" }));
    await screen.findByText("유효한 URL입니다.");

    await user.type(url, "/2");

    expect(screen.queryByText("유효한 URL입니다.")).toBeNull();
    expect(product().purchaseVerified).toBeNull();
  });

  it("링크가 비어 있으면 URL 확인을 누를 수 없다", async () => {
    await renderStep("PURCHASE_REVIEW");

    expect(screen.getByRole("button", { name: "URL 확인" })).toBeDisabled();
  });

  it("구매제품 금액은 모집형에만 있다", async () => {
    const user = await renderStep("PURCHASE_REVIEW", "RECRUIT");
    const price = screen.getByRole("textbox", { name: /구매제품 금액/ });

    await user.type(price, "25000");

    expect(price).toHaveValue("25,000");
    expect(product().purchasePrice).toBe(25000);
  });

  it("PICK형에는 구매제품 금액이 없다", async () => {
    await renderStep("PURCHASE_REVIEW", "PICK");

    expect(screen.queryByRole("textbox", { name: /구매제품 금액/ })).toBeNull();
  });
});
