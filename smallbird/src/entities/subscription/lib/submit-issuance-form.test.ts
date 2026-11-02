import { submitIssuanceForm } from "./submit-issuance-form";

describe("submitIssuanceForm", () => {
  it("값을 숨은 input으로 담은 form을 결제창 주소로 POST한다", () => {
    const submit = vi
      .spyOn(HTMLFormElement.prototype, "submit")
      .mockImplementation(() => {});

    submitIssuanceForm({
      action: "https://pay.example/issue",
      fields: { mid: "m1", hashData: "abc" },
    });

    const form = document.querySelector("form");
    expect(form?.method).toBe("post");
    expect(form?.action).toBe("https://pay.example/issue");
    expect(form?.querySelector<HTMLInputElement>("[name=mid]")?.value).toBe(
      "m1",
    );
    expect(form?.querySelector<HTMLInputElement>("[name=hashData]")?.type).toBe(
      "hidden",
    );
    expect(submit).toHaveBeenCalledOnce();

    submit.mockRestore();
    form?.remove();
  });
});
