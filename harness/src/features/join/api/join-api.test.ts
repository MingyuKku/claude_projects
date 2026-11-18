import { memberApi } from "@/shared/api";

import {
  joinSubmit,
  uploadCompanyRegistration,
  validPassword,
} from "./join-api";

import type * as SharedApi from "@/shared/api";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  memberApi: { get: vi.fn(), post: vi.fn() },
}));

const post = vi.mocked(memberApi.post);

describe("join api", () => {
  beforeEach(() => post.mockReset());

  it("posts the join payload to the service endpoint and parses the result", async () => {
    post.mockResolvedValue({ result: "success", userIdx: 3 });
    const payload = {
      id: "tester01",
      pw: "abcd1234",
      certIdx: 1,
      email: "a@b.co",
      termsAgreed: true,
      personalInformationCollectionAgreed: true,
      companyName: "Acme",
      contact: "010",
      companyRegistrationNumber: "1",
      mailorderBusinessNumber: null,
      classification: null,
      companyUrl: null,
    };

    await expect(joinSubmit(payload)).resolves.toEqual({
      result: "success",
      userIdx: 3,
    });
    expect(post).toHaveBeenCalledWith("/join/1", payload);
  });

  it("rejects a response that is not the expected shape", async () => {
    post.mockResolvedValue({ unexpected: true });
    await expect(validPassword("id", "pw", 1)).rejects.toThrow();
  });

  it("uploads files as multipart form data under multipartFile", async () => {
    post.mockResolvedValue(undefined);
    const file = new File(["x"], "a.png", { type: "image/png" });

    await uploadCompanyRegistration(file);

    const [path, body] = post.mock.calls[0] ?? [];
    expect(path).toBe("/file/upload/companyRegistration");
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("multipartFile")).toBe(file);
  });
});
