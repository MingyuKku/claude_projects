import { ApiError } from "@/shared/api";

import {
  changeMasterEmail,
  changeMasterPassword,
  changeSubEmail,
  changeSubPassword,
  uploadProfileImage,
  uploadSubProfileImage,
} from "../api/profile-api";
import { saveAccountProfile } from "./save-account-profile";

vi.mock("../api/profile-api");

const image = new File(["x"], "me.png", { type: "image/png" });
const base = {
  password: "Wq!9a2k7xZ",
  email: "new@bigbird.com",
  certIdx: 87,
  imageFile: image,
  hasExistingImage: false,
};
const everything = {
  hasPasswordChange: true,
  hasEmailChange: true,
  hasImageChange: true,
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(uploadProfileImage).mockResolvedValue({ result: true });
  vi.mocked(changeMasterEmail).mockResolvedValue({ result: true });
  vi.mocked(changeMasterPassword).mockResolvedValue({ result: true });
  vi.mocked(uploadSubProfileImage).mockResolvedValue({ result: true });
  vi.mocked(changeSubEmail).mockResolvedValue({ result: true });
  vi.mocked(changeSubPassword).mockResolvedValue({ result: true });
});

describe("saveAccountProfile", () => {
  it("바꾼 항목만 이미지 → 이메일 → 비밀번호 순으로 저장한다", async () => {
    const result = await saveAccountProfile({ ...base, plan: everything });
    expect(result).toEqual({
      completed: ["image", "email", "password"],
      failure: null,
    });
    expect(changeMasterEmail).toHaveBeenCalledWith({
      certIdx: 87,
      email: "new@bigbird.com",
    });
    expect(uploadProfileImage).toHaveBeenCalledWith(image, false);
  });

  it("바꾸지 않은 항목은 호출하지 않는다", async () => {
    await saveAccountProfile({
      ...base,
      plan: { ...everything, hasPasswordChange: false, hasImageChange: false },
    });
    expect(changeMasterPassword).not.toHaveBeenCalled();
    expect(uploadProfileImage).not.toHaveBeenCalled();
    expect(changeMasterEmail).toHaveBeenCalledTimes(1);
  });

  it("첫 실패에서 멈추고 앞 단계만 완료로 알린다", async () => {
    vi.mocked(changeMasterEmail).mockRejectedValue(new ApiError(400, {}));
    const result = await saveAccountProfile({ ...base, plan: everything });
    expect(result).toEqual({ completed: ["image"], failure: "generic" });
    expect(changeMasterPassword).not.toHaveBeenCalled();
  });

  it("비밀번호 429는 tooManyRequests, 개인정보 포함은 personalInfo다", async () => {
    vi.mocked(changeMasterPassword).mockRejectedValueOnce(
      new ApiError(429, { result: false, reason: "wait" }),
    );
    expect(
      (await saveAccountProfile({ ...base, plan: everything })).failure,
    ).toBe("tooManyRequests");

    vi.mocked(changeMasterPassword).mockRejectedValueOnce(
      new ApiError(400, { result: false, reason: "contains personal info" }),
    );
    expect(
      (await saveAccountProfile({ ...base, plan: everything })).failure,
    ).toBe("personalInfo");
  });

  it("200이어도 result가 false면 실패다", async () => {
    vi.mocked(uploadProfileImage).mockResolvedValue({ result: false });
    const result = await saveAccountProfile({ ...base, plan: everything });
    expect(result).toEqual({ completed: [], failure: "generic" });
  });

  it("본인인증이 없으면 이메일을 보내지 않고 실패로 본다", async () => {
    const result = await saveAccountProfile({
      ...base,
      certIdx: null,
      plan: { ...everything, hasImageChange: false, hasPasswordChange: false },
    });
    expect(result.failure).toBe("generic");
    expect(changeMasterEmail).not.toHaveBeenCalled();
  });

  describe("Sub ID", () => {
    it("Sub 경로로 저장하고 이메일은 본인인증 없이 값만 보낸다", async () => {
      const result = await saveAccountProfile({
        ...base,
        role: "sub",
        certIdx: null,
        plan: everything,
      });
      expect(result).toEqual({
        completed: ["image", "email", "password"],
        failure: null,
      });
      expect(uploadSubProfileImage).toHaveBeenCalledWith(image, false);
      expect(changeSubEmail).toHaveBeenCalledWith("new@bigbird.com");
      expect(changeSubPassword).toHaveBeenCalledWith("Wq!9a2k7xZ");
      expect(uploadProfileImage).not.toHaveBeenCalled();
      expect(changeMasterEmail).not.toHaveBeenCalled();
      expect(changeMasterPassword).not.toHaveBeenCalled();
    });
  });
});
