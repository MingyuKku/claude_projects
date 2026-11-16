import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { deleteCampaign } from "@/entities/campaign";
import { ApiError } from "@/shared/api";

import { DeleteCampaignButton } from "./DeleteCampaignButton";

import type * as EntitiesCampaign from "@/entities/campaign";

const revalidate = vi.fn();

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));
vi.mock("@/entities/campaign", async (importOriginal) => ({
  ...(await importOriginal<typeof EntitiesCampaign>()),
  deleteCampaign: vi.fn(),
  useRevalidateCampaignList: () => revalidate,
}));

async function confirmDelete() {
  const user = userEvent.setup();
  const onDeleted = vi.fn();
  render(<DeleteCampaignButton campaignIdx={3} onDeleted={onDeleted} />);
  await user.click(screen.getByRole("button", { name: "캠페인 삭제" }));
  await user.click(screen.getByRole("button", { name: "삭제" }));
  return { onDeleted };
}

beforeEach(() => vi.clearAllMocks());

describe("DeleteCampaignButton", () => {
  it("휴지통을 누르면 확인 알럿을 띄우고 취소하면 지우지 않는다", async () => {
    const user = userEvent.setup();
    render(<DeleteCampaignButton campaignIdx={3} onDeleted={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "캠페인 삭제" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "정말로 캠페인을 삭제하시겠습니까?",
    );
    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(deleteCampaign).not.toHaveBeenCalled();
  });

  it("삭제에 성공하면 토스트를 띄우고 목록을 다시 읽고 알럿을 닫는다", async () => {
    vi.mocked(deleteCampaign).mockResolvedValue(undefined);
    const { onDeleted } = await confirmDelete();

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
    expect(deleteCampaign).toHaveBeenCalledWith(3);
    expect(toast.success).toHaveBeenCalledWith("캠페인을 삭제했습니다.");
    expect(revalidate).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("지울 수 없는 상태(409)면 안내 토스트 뒤 목록을 다시 읽는다", async () => {
    vi.mocked(deleteCampaign).mockRejectedValue(
      new ApiError(409, { code: "NOT_DELETABLE" }),
    );
    const { onDeleted } = await confirmDelete();

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
    expect(toast.error).toHaveBeenCalledWith(
      "삭제할 수 없는 상태의 캠페인입니다.",
    );
    expect(revalidate).toHaveBeenCalledTimes(1);
  });

  it("그 밖의 오류는 실패 토스트만 띄우고 목록은 건드리지 않는다", async () => {
    vi.mocked(deleteCampaign).mockRejectedValue(new ApiError(500, null));
    const { onDeleted } = await confirmDelete();

    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(toast.error).toHaveBeenCalledWith(
      "삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
    expect(onDeleted).not.toHaveBeenCalled();
    expect(revalidate).not.toHaveBeenCalled();
  });
});
