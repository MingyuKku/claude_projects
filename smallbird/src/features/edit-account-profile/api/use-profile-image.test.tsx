import { renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";

import { serverApiV3 } from "@/shared/api";

import { useProfileImage } from "./use-profile-image";

import type { ProfileImageSource } from "./use-profile-image";
import type * as SharedApi from "@/shared/api";
import type { ReactNode } from "react";

vi.mock("@/shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof SharedApi>()),
  serverApiV3: { get: vi.fn() },
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>
  );
}

function renderProfileImage(source: ProfileImageSource) {
  return renderHook(() => useProfileImage(source), { wrapper });
}

beforeEach(() => {
  vi.mocked(serverApiV3.get)
    .mockReset()
    .mockResolvedValue({ profileUrl: "https://cdn.bigbird.local/master.png" });
});

describe("useProfileImage", () => {
  it("Master는 GET /profile의 이미지를 쓴다", async () => {
    const { result } = renderProfileImage({ accountType: "master" });
    await waitFor(() =>
      expect(result.current.profileUrl).toBe(
        "https://cdn.bigbird.local/master.png",
      ),
    );
  });

  it("Sub는 넘겨받은 본인 이미지를 쓰고 GET /profile(회사 Master 기준)을 부르지 않는다", () => {
    const { result } = renderProfileImage({
      accountType: "sub",
      url: "https://cdn.bigbird.local/sub01.png",
    });
    expect(result.current.profileUrl).toBe(
      "https://cdn.bigbird.local/sub01.png",
    );
    expect(serverApiV3.get).not.toHaveBeenCalled();
  });

  it("Sub 이미지가 없으면 Master 이미지로 채우지 않고 null이다", () => {
    const { result } = renderProfileImage({ accountType: "sub", url: null });
    expect(result.current.profileUrl).toBeNull();
    expect(serverApiV3.get).not.toHaveBeenCalled();
  });
});
