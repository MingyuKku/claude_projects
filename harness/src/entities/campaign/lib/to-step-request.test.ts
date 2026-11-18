import { createEmptyDraft } from "../model/draft";
import { toStepRequest } from "./to-step-request";

const ADDRESS = {
  zonecode: "06236",
  address: "서울 강남구 테헤란로 1",
  detail: "",
};

describe("toStepRequest", () => {
  it("1단계 빈 캠페인명은 null로, 앞뒤 공백은 지워 보낸다", () => {
    const draft = createEmptyDraft();
    draft.info.name = "  ";

    expect(toStepRequest("info", draft).name).toBeNull();

    draft.info.name = " 봄 체험단 ";
    expect(toStepRequest("info", draft).name).toBe("봄 체험단");
  });

  it("제품발송형은 회수·대여를 고르지 않았으면 그 칸을 비워 보낸다", () => {
    const draft = createEmptyDraft();
    draft.info.campaignType = "PRODUCT_DELIVERY";
    draft.product.productName = "앰플";
    draft.product.returnAddress = ADDRESS;
    draft.product.rentalReturnContact = "010-0000-0000";

    const request = toStepRequest("product", draft);

    expect(request.productName).toBe("앰플");
    expect(request.returnAddress).toBeNull();
    expect(request.rentalReturnContact).toBeNull();

    draft.product.returnRequired = true;
    expect(toStepRequest("product", draft).returnAddress).toEqual({
      ...ADDRESS,
      detail: null,
    });
  });

  it("매장방문형은 매장 칸만, 기자단형·유형 미선택은 모든 칸을 null로 보낸다", () => {
    const draft = createEmptyDraft();
    draft.product.productName = "앰플";
    draft.product.storeName = "강남점";

    draft.info.campaignType = "STORE_VISIT";
    const storeVisit = toStepRequest("product", draft);
    expect(storeVisit.storeName).toBe("강남점");
    expect(storeVisit.productName).toBeNull();

    draft.info.campaignType = "PRESS";
    expect(Object.values(toStepRequest("product", draft))).toEqual(
      Object.values(toStepRequest("product", draft)).map(() => null),
    );
  });

  it("소개서는 파일 번호를 보내고 번호 없는 v2 영상 항목은 주소를 보내며 올리기 전 파일은 뺀다", () => {
    const draft = createEmptyDraft();
    draft.intro.mainImage = { attachmentIdx: 1, url: "a", mediaType: "IMAGE" };
    draft.intro.detailMedia = [
      { attachmentIdx: 2, url: "b", mediaType: "VIDEO" },
      { attachmentIdx: null, url: "https://youtu.be/x", mediaType: "VIDEO" },
      {
        attachmentIdx: null,
        url: "blob:http://localhost/pending",
        mediaType: "IMAGE",
        file: new File([""], "a.png"),
      },
    ];

    const request = toStepRequest("intro", draft);

    expect(request.mainImage).toEqual({ attachmentIdx: 1 });
    expect(request.detailMedia).toEqual([
      { attachmentIdx: 2 },
      { url: "https://youtu.be/x" },
    ]);
    expect(request.description).toBeNull();
  });
});
