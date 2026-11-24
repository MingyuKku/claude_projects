import { serverApiV3 } from "@/shared/api";

import { uploadCampaignFile } from "./upload-campaign-file";

import type * as SharedApi from "@/shared/api";

// 파일을 multipart `file` 파트로 서버에 올리는지 검증함.
vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApiV3: { post: vi.fn() },
}));

describe("파일 업로드", () => {
  it("파일을 file 파트로 올리고 번호와 주소를 받는다", async () => {
    vi.mocked(serverApiV3.post).mockResolvedValue({
      attachmentIdx: 12,
      url: "https://example.com/a.png",
      mediaType: "IMAGE",
    });
    const file = new File(["x"], "a.png", { type: "image/png" });

    const uploaded = await uploadCampaignFile(file);

    const [path, body] = vi.mocked(serverApiV3.post).mock.calls[0] ?? [];
    expect(path).toBe("/campaign/files");
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("file")).toBeInstanceOf(File);
    expect(uploaded.attachmentIdx).toBe(12);
  });
});
