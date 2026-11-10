import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { TextField } from "./index";
import { clampToMaxLength } from "./useTextLength";

function Controlled({ maxLength }: { maxLength: number }) {
  const [text, setText] = useState("");
  return (
    <TextField
      variant="count"
      aria-label="입력"
      maxLength={maxLength}
      value={text}
      onChange={(event) => setText(event.target.value)}
    />
  );
}

// 브라우저의 maxLength가 건너뛰는 입력(한글 조합 확정, 자동 교정 등)을 fireEvent로 흉내 냄.
describe("TextField 최대 글자 수", () => {
  it("최대 글자 수를 넘겨 들어온 입력은 잘라서 받는다", () => {
    render(<Controlled maxLength={5} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "abcdefghij" },
    });
    expect(screen.getByRole("textbox")).toHaveValue("abcde");
    // 카운터는 현재 글자 수와 최대 글자 수가 모두 5이고 10은 보이지 않음.
    expect(screen.getAllByText("5")).toHaveLength(2);
    expect(screen.queryByText("10")).not.toBeInTheDocument();
  });

  it("이미 가득 찬 입력에 더 들어와도 값이 늘지 않는다", () => {
    render(<Controlled maxLength={5} />);
    const box = screen.getByRole("textbox");
    fireEvent.change(box, { target: { value: "abcde" } });
    fireEvent.change(box, { target: { value: "abcde12345" } });
    expect(box).toHaveValue("abcde");
  });

  it("한글 조합 중에는 그대로 두고 조합이 끝나면 잘라서 받는다", () => {
    render(<Controlled maxLength={5} />);
    const box = screen.getByRole("textbox");
    fireEvent.compositionStart(box);
    fireEvent.input(box, {
      target: { value: "가나다라마바사" },
      isComposing: true,
    });
    expect(box).toHaveValue("가나다라마바사");
    fireEvent.compositionEnd(box);
    expect(box).toHaveValue("가나다라마");
  });

  it("최대 글자 수가 없으면 자르지 않는다", () => {
    render(<TextField aria-label="입력" defaultValue="" onChange={() => {}} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "a".repeat(5000) },
    });
    expect(screen.getByRole("textbox")).toHaveValue("a".repeat(5000));
  });
});

describe("clampToMaxLength", () => {
  it("넘지 않으면 그대로 돌려준다", () => {
    expect(clampToMaxLength("abc", 3)).toBe("abc");
  });

  it("이모지 같은 짝 글자의 앞 절반만 남기지 않는다", () => {
    // "ab😀"는 4칸이라 3칸으로 자르면 짝 글자의 앞 절반이 남으므로 한 칸 더 줄임.
    expect(clampToMaxLength("ab😀", 3)).toBe("ab");
    expect(clampToMaxLength("ab😀", 4)).toBe("ab😀");
  });
});
