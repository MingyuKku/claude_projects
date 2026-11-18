import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { MessageEditor } from "./MessageEditor";

function Editor({ maxLength }: { maxLength: number }) {
  const [value, setValue] = useState("");
  return (
    <MessageEditor
      name="광고주"
      value={value}
      onChangeValue={setValue}
      maxLength={maxLength}
      inputLabel="메시지 수정"
      cancelLabel="취소"
      submitLabel="완료"
    />
  );
}

// 브라우저의 maxLength가 건너뛰는 입력(한글 조합 확정, 자동 교정 등)을 fireEvent로 흉내 냄.
describe("MessageEditor 최대 글자 수", () => {
  it("최대 글자 수를 넘겨 들어온 입력은 잘라서 받는다", () => {
    render(<Editor maxLength={5} />);
    fireEvent.change(screen.getByRole("textbox", { name: "메시지 수정" }), {
      target: { value: "abcdefghij" },
    });
    expect(screen.getByRole("textbox", { name: "메시지 수정" })).toHaveValue(
      "abcde",
    );
  });

  it("한글 조합 중에는 그대로 두고 조합이 끝나면 잘라서 받는다", () => {
    render(<Editor maxLength={5} />);
    const box = screen.getByRole("textbox", { name: "메시지 수정" });
    fireEvent.compositionStart(box);
    fireEvent.input(box, {
      target: { value: "가나다라마바사" },
      isComposing: true,
    });
    expect(box).toHaveValue("가나다라마바사");
    fireEvent.compositionEnd(box);
    expect(box).toHaveValue("가나다라마");
  });
});
