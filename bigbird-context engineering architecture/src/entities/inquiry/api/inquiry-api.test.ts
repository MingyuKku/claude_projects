import { ApiError, isApiError, serverApiV3 } from "@/shared/api";

import {
  closeBigbirdInquiry,
  createBigbirdInquiry,
  createQnaReply,
  deleteQnaReply,
  editQnaReply,
  fetchBigbirdInquiries,
  fetchBuyerInquiryDetail,
  fetchPurchaserConversation,
  fetchQnaDetail,
  fetchBuyerInquiryPage,
  fetchBuyerProduct,
  fetchInquiryUserImage,
  sendInquiryMessage,
  uploadInquiryAttachment,
} from "./inquiry-api";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    serverApiV3: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

const thread = {
  threadIdx: 101,
  sequence: 7,
  viewing: null,
  toUserIdx: 1,
  fmUserIdx: 5971,
  campaignIdx: null,
  finishTime: null,
  created: "2026-10-01T10:00:00",
  messages: [],
  boardType: true,
  status: "WAITING",
};

describe("fetchBigbirdInquiries", () => {
  it("세션의 threadUserIdx로 조회해 뷰모델로 바꾼다", async () => {
    vi.mocked(serverApiV3.get).mockResolvedValue({
      result: true,
      data: [thread],
    });
    const inquiries = await fetchBigbirdInquiries(5971);
    expect(serverApiV3.get).toHaveBeenCalledWith("/help/thread", {
      params: { threadUserIdx: 5971, status: "ALL" },
    });
    expect(inquiries.map((item) => item.threadIdx)).toEqual([101]);
  });

  it("서버 상태 필터로 상담 중 문의만 조회한다", async () => {
    vi.mocked(serverApiV3.get).mockResolvedValue({
      result: true,
      data: [{ ...thread, status: "IN_PROGRESS" }],
    });
    const inquiries = await fetchBigbirdInquiries(5971, "IN_PROGRESS");
    expect(serverApiV3.get).toHaveBeenCalledWith("/help/thread", {
      params: { threadUserIdx: 5971, status: "IN_PROGRESS" },
    });
    expect(inquiries[0]?.status).toBe("consulting");
  });

  it("404(대화 내역 없음)는 빈 목록이다", async () => {
    vi.mocked(serverApiV3.get).mockRejectedValue(new ApiError(404, undefined));
    await expect(fetchBigbirdInquiries(5971)).resolves.toEqual([]);
  });

  it("다른 오류는 빈 목록으로 바꾸지 않는다", async () => {
    vi.mocked(serverApiV3.get).mockRejectedValue(new ApiError(500, undefined));
    await expect(fetchBigbirdInquiries(5971)).rejects.toThrow();
  });

  it("200이어도 result가 false면 실패다", async () => {
    vi.mocked(serverApiV3.get).mockResolvedValue({ result: false, data: [] });
    const error: unknown = await fetchBigbirdInquiries(5971).catch((e) => e);
    expect(isApiError(error) && error.status).toBe(200);
  });
});

describe("문의 생성·전송·종료", () => {
  it("문의 남기기로 생성한다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValue({
      result: true,
      data: { sequence: 7, threadIdx: 101 },
    });
    await expect(createBigbirdInquiry(null)).resolves.toEqual({
      sequence: 7,
      threadIdx: 101,
    });
    expect(serverApiV3.post).toHaveBeenCalledWith("/help/thread", {
      isBoardType: true,
      campaignIdx: null,
    });
  });

  it("전송 결과로 실제 저장된 threadIdx를 돌려준다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValue({
      result: true,
      threadIdx: 202,
    });
    await expect(
      sendInquiryMessage({ threadIdx: 101, body: "추가 문의" }),
    ).resolves.toBe(202);
  });

  it("종료가 result false면 실패다", async () => {
    vi.mocked(serverApiV3.put).mockResolvedValue({ result: false });
    await expect(closeBigbirdInquiry(101)).rejects.toThrow();
  });
});

describe("uploadInquiryAttachment", () => {
  it("파일 종류를 경로에 넣어 multipart로 올리고 attachmentIdx·url을 돌려준다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValue({
      result: true,
      url: "https://cdn/a.png",
      attachmentIdx: 9,
      fileName: "a.png",
      fileSize: 3,
    });
    const file = new File(["abc"], "a.PNG", { type: "image/png" });
    await expect(uploadInquiryAttachment(file)).resolves.toEqual({
      url: "https://cdn/a.png",
      attachmentIdx: 9,
      fileName: "a.png",
      fileSize: 3,
    });
    const [path, body] = vi.mocked(serverApiV3.post).mock.calls.at(-1)!;
    expect(path).toBe("/help/message/image/help");
    expect((body as FormData).get("file")).toBe(file);
  });

  it("허용하지 않는 형식은 요청하지 않고, result false는 실패다", async () => {
    vi.mocked(serverApiV3.post).mockClear();
    await expect(
      uploadInquiryAttachment(new File(["x"], "a.gif")),
    ).rejects.toThrow();
    expect(serverApiV3.post).not.toHaveBeenCalled();

    vi.mocked(serverApiV3.post).mockResolvedValue({
      result: false,
      url: "",
      attachmentIdx: 0,
      fileName: "",
      fileSize: 0,
    });
    await expect(
      uploadInquiryAttachment(new File(["x"], "a.mp4")),
    ).rejects.toThrow();
  });

  it("첨부 메시지는 attachmentIdx를 함께 보낸다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValue({
      result: true,
      threadIdx: 101,
    });
    await sendInquiryMessage({
      threadIdx: 101,
      body: "https://cdn/a.png",
      attachmentIdx: 9,
    });
    expect(vi.mocked(serverApiV3.post).mock.calls.at(-1)![1]).toMatchObject({
      attachmentIdx: 9,
    });
  });
});

describe("fetchBuyerInquiryPage", () => {
  const item = {
    inquiryIdx: 501,
    sourceType: "PURCHASER_QUESTION",
    status: "WAITING",
    campaignIdx: null,
    orderNumber: null,
    writerName: "김하루",
    body: "문의",
    writeTime: "2026-10-01 10:00",
    threadUserIdx: 77,
    userIdx: null,
  };

  it("탭을 서버 상태값으로 바꿔 쪽 단위로 조회한다", async () => {
    vi.mocked(serverApiV3.get).mockResolvedValue({
      result: true,
      list: [item],
      pagingInfo: { page: 2, size: 20, totalCount: 41, totalPage: 3 },
    });
    const page = await fetchBuyerInquiryPage("done", 2);
    expect(serverApiV3.get).toHaveBeenCalledWith("/help/inquiry", {
      params: { status: "ANSWERED", sourceType: "ALL", page: 2, entrySize: 20 },
    });
    expect(page).toMatchObject({ page: 2, totalPage: 3, totalCount: 41 });
    expect(page.inquiries.map((inquiry) => inquiry.key)).toEqual([
      "purchaser-501",
    ]);
  });

  it.each([
    ["김하루", "name"],
    ["20261001-0001", "orderNumber"],
    ["1234567", "orderNumber"],
    ["하루2", "name"],
  ])("검색어 %s는 searchType=%s로 전달한다", async (keyword, searchType) => {
    vi.mocked(serverApiV3.get).mockResolvedValue({
      result: true,
      list: [],
      pagingInfo: { page: 1, size: 20, totalCount: 0, totalPage: 0 },
    });
    await fetchBuyerInquiryPage("all", 1, { sourceType: "ALL", keyword });
    expect(serverApiV3.get).toHaveBeenCalledWith("/help/inquiry", {
      params: {
        status: "ALL",
        sourceType: "ALL",
        searchType,
        keyword,
        page: 1,
        entrySize: 20,
      },
    });
  });

  it("선택한 문의 유형·캠페인·인플루언서를 서버 필터로 전달한다", async () => {
    vi.mocked(serverApiV3.get).mockResolvedValue({
      result: true,
      list: [],
      pagingInfo: { page: 1, size: 20, totalCount: 0, totalPage: 0 },
    });
    await fetchBuyerInquiryPage("all", 1, {
      sourceType: "PRODUCT_QNA",
      campaignIdx: 10,
      influencerThreadUserIdx: 50,
    });
    expect(serverApiV3.get).toHaveBeenCalledWith("/help/inquiry", {
      params: {
        status: "ALL",
        sourceType: "PRODUCT_QNA",
        campaignIdx: 10,
        influencerThreadUserIdx: 50,
        page: 1,
        entrySize: 20,
      },
    });
  });

  it("result:false(HTTP 200)는 실패로 다룬다", async () => {
    vi.mocked(serverApiV3.get).mockResolvedValue({
      result: false,
      list: [],
      pagingInfo: { page: 1, size: 20, totalCount: 0, totalPage: 0 },
    });
    await expect(fetchBuyerInquiryPage("all", 1)).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});

describe("구매자 문의 상세·대화·Q&A", () => {
  it("상세 패널은 문의 상세 API를 sourceType과 함께 부른다", async () => {
    vi.mocked(serverApiV3.get).mockResolvedValue({
      result: true,
      writerName: "김하루",
      email: null,
      phoneNumber: null,
      orderNumber: null,
      orderDate: null,
      paymentAmount: null,
      campaignType: null,
      campaignCode: null,
      shopCode: null,
      progressStatus: null,
      progressStartDate: null,
      progressEndDate: null,
      influencerPlatform: null,
      influencerAccountLink: null,
    });
    const detail = await fetchBuyerInquiryDetail(501, "PRODUCT_QNA");
    expect(serverApiV3.get).toHaveBeenCalledWith("/help/inquiry/501", {
      params: { sourceType: "PRODUCT_QNA" },
    });
    expect(detail.writerName).toBe("김하루");
  });

  it("구매자 대화는 type=client로 조회하고 404는 빈 대화로 본다", async () => {
    vi.mocked(serverApiV3.get).mockRejectedValue(new ApiError(404, null));
    await expect(fetchPurchaserConversation(77, null)).resolves.toEqual({
      threads: [],
      messages: [],
      latestThreadIdx: null,
    });
    expect(serverApiV3.get).toHaveBeenCalledWith("/help/thread", {
      params: { threadUserIdx: 77, type: "client" },
    });
    vi.mocked(serverApiV3.get).mockRejectedValue(new ApiError(500, null));
    await expect(fetchPurchaserConversation(77, 10)).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it("상품 Q&A는 답변이 비어 있으면 null, 읽힌 답변은 isRead, 지운 답변은 null이다", async () => {
    const inquiryInfo = (idx: number) => ({
      inquiryIdx: idx,
      body: `질문${idx}`,
      writeTime: "2026-10-01 10:00",
      modifyTime: null,
      inquiryType: null,
      deleteTime: null,
      deleteId: null,
    });
    const campaignInfo = {
      productName: "상품",
      mainImageUrl: null,
      optionName: null,
    };
    vi.mocked(serverApiV3.post).mockResolvedValue({
      result: true,
      list: [
        { campaignInfo, inquiryInfo: inquiryInfo(1), replyInfo: {} },
        {
          campaignInfo,
          inquiryInfo: inquiryInfo(2),
          replyInfo: {
            replyIdx: 5,
            body: "답변",
            readTime: "2026-10-01 12:00",
            writeTime: "2026-10-01 11:00",
          },
        },
        {
          campaignInfo,
          inquiryInfo: inquiryInfo(3),
          replyInfo: {
            replyIdx: 6,
            body: "지운 답변",
            deleteTime: "2026-10-01 13:00",
          },
        },
      ],
    });
    const items = await fetchQnaDetail(9, 10);
    expect(serverApiV3.post).toHaveBeenCalledWith("/help/qna", {
      userIdx: 9,
      campaignIdx: 10,
    });
    expect(items.map((item) => item.reply)).toEqual([
      null,
      {
        replyIdx: 5,
        body: "답변",
        writtenAt: new Date("2026-10-01T11:00"),
        isRead: true,
      },
      null,
    ]);
  });

  it("답변 등록·수정·삭제는 각 경로로 보내고 result false는 실패다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValue({
      result: true,
      status: "ok",
    });
    await createQnaReply(501, "답변");
    expect(serverApiV3.post).toHaveBeenCalledWith("/help/reply", {
      inquiryIdx: 501,
      body: "답변",
    });
    vi.mocked(serverApiV3.put).mockResolvedValue({ result: true });
    await editQnaReply(5, "수정");
    expect(serverApiV3.put).toHaveBeenCalledWith("/help/reply", {
      replyIdx: 5,
      body: "수정",
    });
    vi.mocked(serverApiV3.delete).mockResolvedValue({ result: true });
    await deleteQnaReply(5);
    expect(serverApiV3.delete).toHaveBeenCalledWith("/help/reply/5");
    vi.mocked(serverApiV3.delete).mockResolvedValue({ result: false });
    await expect(deleteQnaReply(5)).rejects.toThrow();
  });

  it("구매자 대화는 가장 최근에 만들어진 스레드를 답장 대상으로 돌려준다", async () => {
    const thread = (threadIdx: number, created: string) => ({
      threadIdx,
      sequence: 1,
      viewing: null,
      toUserIdx: 1,
      fmUserIdx: 77,
      campaignIdx: 10,
      finishTime: null,
      created,
      boardType: true,
      status: "WAITING",
      messages: [],
    });
    vi.mocked(serverApiV3.get).mockResolvedValue({
      result: true,
      data: [
        thread(1, "2026-10-01T09:00:00"),
        thread(2, "2026-10-02T09:00:00"),
      ],
    });
    await expect(fetchPurchaserConversation(77, 10)).resolves.toMatchObject({
      latestThreadIdx: 2,
    });
  });
});

describe("fetchInquiryUserImage", () => {
  it("문의자 번호로 프로필 이미지 주소를 받는다", async () => {
    vi.mocked(serverApiV3.get).mockResolvedValue({
      result: true,
      data: {
        nickname: "김하루",
        id: "haru",
        profileImage: "https://img/p.png",
      },
    });
    await expect(fetchInquiryUserImage(77)).resolves.toBe("https://img/p.png");
    expect(serverApiV3.get).toHaveBeenCalledWith("/help/user/77");
  });

  it("비회원이나 이미지가 없으면 null이라 기본 아바타를 쓴다", async () => {
    vi.mocked(serverApiV3.get).mockResolvedValue({
      result: true,
      data: { nickname: "손님", id: null, profileImage: null },
    });
    await expect(fetchInquiryUserImage(78)).resolves.toBeNull();
  });
});

describe("fetchBuyerProduct", () => {
  it("주문번호로 상품 이름(v2 표기)과 썸네일 주소를 받는다", async () => {
    vi.mocked(serverApiV3.get).mockResolvedValue({
      result: true,
      list: {
        orderNumber: "20261001-0001",
        orderState: "배송중",
        newOrderState: "배송중",
        deliveryStatus: null,
        mainImageUrl: null,
        shopCode: "S-9",
        campaignCode: "C-100",
        campaignServiceName: null,
        brandName: "빅버드",
        productName: "여섯별 스킨케어 세트",
      },
    });
    await expect(fetchBuyerProduct("20261001-0001")).resolves.toEqual({
      name: "[빅버드]여섯별 스킨케어 세트",
      imageUrl: null,
    });
    expect(serverApiV3.get).toHaveBeenCalledWith(
      "/help/c-purchaser-questionInfo/20261001-0001",
    );
  });
});
