import { ApiError } from "@/shared/api";

import {
  registerCompanyInfo,
  updateCompanyInfo,
  uploadBusinessRegistration,
  uploadMailorderReport,
} from "../api/company-api";
import { EMPTY_FILES, toCompanyFormValues } from "./company-form";
import { saveCompanyInfo } from "./save-company-info";

vi.mock("../api/company-api");

const values = {
  ...toCompanyFormValues(null),
  companyName: "빅버드",
  contact: "010",
  businessNumber: "123",
  mailorderNumber: "2024-1",
};
const pdf = new File(["x"], "a.pdf");

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(registerCompanyInfo).mockResolvedValue({ result: true });
  vi.mocked(updateCompanyInfo).mockResolvedValue({ result: true });
  vi.mocked(uploadBusinessRegistration).mockResolvedValue({ result: true });
  vi.mocked(uploadMailorderReport).mockResolvedValue({ result: true });
});

describe("saveCompanyInfo", () => {
  it("처음이면 등록(POST), 이미 있으면 수정(PUT)을 부른다", async () => {
    await saveCompanyInfo({ isRegistered: false, values, files: EMPTY_FILES });
    expect(registerCompanyInfo).toHaveBeenCalledTimes(1);
    expect(updateCompanyInfo).not.toHaveBeenCalled();

    await saveCompanyInfo({ isRegistered: true, values, files: EMPTY_FILES });
    expect(updateCompanyInfo).toHaveBeenCalledTimes(1);
  });

  it("회사정보를 먼저 저장한 뒤 고른 서류만 올린다", async () => {
    const order: string[] = [];
    vi.mocked(updateCompanyInfo).mockImplementation(async () => {
      order.push("info");
      return { result: true };
    });
    vi.mocked(uploadBusinessRegistration).mockImplementation(async () => {
      order.push("registration");
      return { result: true };
    });
    const result = await saveCompanyInfo({
      isRegistered: true,
      values,
      files: { ...EMPTY_FILES, businessRegistration: pdf },
    });
    expect(order).toEqual(["info", "registration"]);
    expect(uploadMailorderReport).not.toHaveBeenCalled();
    expect(result).toEqual({
      hasSavedInfo: true,
      failedStep: null,
      reason: "",
    });
  });

  it("회사정보 저장이 실패하면 서류를 올리지 않는다", async () => {
    vi.mocked(updateCompanyInfo).mockRejectedValue(
      new ApiError(400, { result: false, reason: "param is null" }),
    );
    const result = await saveCompanyInfo({
      isRegistered: true,
      values,
      files: { ...EMPTY_FILES, businessRegistration: pdf },
    });
    expect(result).toEqual({
      hasSavedInfo: false,
      failedStep: "info",
      reason: "param is null",
    });
    expect(uploadBusinessRegistration).not.toHaveBeenCalled();
  });

  it("업로드가 HTTP 200에 result false로 거부하면 그 사유와 함께 실패로 본다", async () => {
    vi.mocked(uploadBusinessRegistration).mockResolvedValue({
      result: false,
      reason: "fail image upload",
    });
    const result = await saveCompanyInfo({
      isRegistered: true,
      values,
      files: { businessRegistration: pdf, mailorderReport: pdf },
    });
    expect(result).toEqual({
      hasSavedInfo: true,
      failedStep: "businessRegistration",
      reason: "fail image upload",
    });
    expect(uploadMailorderReport).not.toHaveBeenCalled();
  });
});
