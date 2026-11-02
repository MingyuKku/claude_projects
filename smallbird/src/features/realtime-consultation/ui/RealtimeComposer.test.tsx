import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RealtimeComposer } from "./RealtimeComposer";

const box = () => screen.getByRole("textbox");

describe("RealtimeComposer", () => {
  it("Enter로 보내면 입력을 바로 비운다", async () => {
    const onSend = vi.fn().mockResolvedValue(true);
    render(<RealtimeComposer canSend onSend={onSend} onSendFiles={vi.fn()} />);
    fireEvent.change(box(), { target: { value: "안녕하세요" } });
    fireEvent.keyDown(box(), { key: "Enter" });
    await vi.waitFor(() => expect(onSend).toHaveBeenCalledWith("안녕하세요"));
    await vi.waitFor(() => expect(box()).toHaveValue(""));
  });

  it("Shift+Enter는 보내지 않고, 보내기에 실패하면 입력을 되돌린다", async () => {
    const onSend = vi.fn().mockResolvedValue(false);
    render(<RealtimeComposer canSend onSend={onSend} onSendFiles={vi.fn()} />);
    fireEvent.change(box(), { target: { value: "내용" } });
    fireEvent.keyDown(box(), { key: "Enter", shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.keyDown(box(), { key: "Enter" });
    await vi.waitFor(() => expect(onSend).toHaveBeenCalledOnce());
    await vi.waitFor(() => expect(box()).toHaveValue("내용"));
  });

  it("전송이 끝나기 전에 쓴 다음 글은 지워지지 않고 바로 보낼 수 있다", async () => {
    const resolvers: ((ok: boolean) => void)[] = [];
    const onSend = vi.fn<(body: string) => Promise<boolean>>(
      () => new Promise((resolve) => resolvers.push(resolve)),
    );
    render(<RealtimeComposer canSend onSend={onSend} onSendFiles={vi.fn()} />);
    fireEvent.change(box(), { target: { value: "첫째" } });
    fireEvent.keyDown(box(), { key: "Enter" });
    expect(box()).toHaveValue("");
    // 첫 전송이 아직 끝나지 않은 상태에서 다음 글을 쓴다.
    fireEvent.change(box(), { target: { value: "둘째" } });
    fireEvent.keyDown(box(), { key: "Enter" });
    expect(onSend.mock.calls.map(([body]) => body)).toEqual(["첫째", "둘째"]);
    resolvers.forEach((resolve) => resolve(true));
    await vi.waitFor(() => expect(box()).toHaveValue(""));
  });

  it("실패했을 때 그 사이 새로 쓴 글이 있으면 덮어쓰지 않는다", async () => {
    let fail: (ok: boolean) => void = () => {};
    const onSend = vi.fn<(body: string) => Promise<boolean>>(
      () => new Promise((resolve) => (fail = resolve)),
    );
    render(<RealtimeComposer canSend onSend={onSend} onSendFiles={vi.fn()} />);
    fireEvent.change(box(), { target: { value: "첫째" } });
    fireEvent.keyDown(box(), { key: "Enter" });
    fireEvent.change(box(), { target: { value: "새로 쓰는 중" } });
    fail(false);
    await vi.waitFor(() => expect(onSend).toHaveBeenCalledOnce());
    expect(box()).toHaveValue("새로 쓰는 중");
  });

  it("락을 잃었거나 요청이 실패·종료되면 입력할 수 없다", () => {
    render(
      <RealtimeComposer
        canSend={false}
        onSend={vi.fn()}
        onSendFiles={vi.fn()}
      />,
    );
    expect(box()).toBeDisabled();
  });

  describe("첨부", () => {
    beforeEach(() => {
      URL.createObjectURL = vi.fn(() => "blob:preview");
      URL.revokeObjectURL = vi.fn();
    });
    const fileInput = () =>
      document.querySelector<HTMLInputElement>("input[type=file]")!;

    it("본문 없이 파일만 있어도 한 번에 보내고, 끝나면 입력창에서 비운다", async () => {
      const user = userEvent.setup();
      const onSendFiles = vi.fn().mockResolvedValue(true);
      render(
        <RealtimeComposer canSend onSend={vi.fn()} onSendFiles={onSendFiles} />,
      );
      const files = [new File(["1"], "1.png"), new File(["2"], "2.png")];
      await user.upload(fileInput(), files);
      await user.click(screen.getByRole("button", { name: "전송" }));
      await vi.waitFor(() => expect(onSendFiles).toHaveBeenCalledWith(files));
      expect(onSendFiles).toHaveBeenCalledOnce();
      await vi.waitFor(() =>
        expect(screen.queryByRole("img", { name: "1.png" })).toBeNull(),
      );
    });

    it("올리는 동안 로딩을 보여 주고 다시 전송하지 못하게 하며, 실패하면 파일을 그대로 둔다", async () => {
      const user = userEvent.setup();
      let finish!: (ok: boolean) => void;
      const onSendFiles = vi.fn(
        () => new Promise<boolean>((resolve) => (finish = resolve)),
      );
      render(
        <RealtimeComposer canSend onSend={vi.fn()} onSendFiles={onSendFiles} />,
      );
      await user.upload(fileInput(), new File(["1"], "1.png"));
      await user.click(screen.getByRole("button", { name: "전송" }));
      expect(await screen.findByRole("status")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /전송/ })).toBeDisabled();
      finish(false);
      await vi.waitFor(() => expect(screen.queryByRole("status")).toBeNull());
      expect(screen.getByRole("img", { name: "1.png" })).toBeInTheDocument();
    });

    it("본문 전송이 실패하면 파일은 보내지 않는다", async () => {
      const user = userEvent.setup();
      const onSendFiles = vi.fn();
      render(
        <RealtimeComposer
          canSend
          onSend={vi.fn().mockResolvedValue(false)}
          onSendFiles={onSendFiles}
        />,
      );
      await user.type(box(), "내용");
      await user.upload(fileInput(), new File(["x"], "a.png"));
      await user.click(screen.getByRole("button", { name: "전송" }));
      await vi.waitFor(() => expect(box()).toHaveValue("내용"));
      expect(onSendFiles).not.toHaveBeenCalled();
    });
  });
});
