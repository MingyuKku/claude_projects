import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import { TermsPage } from "./TermsPage";

function renderAt(url: string) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <TermsPage />
    </MemoryRouter>,
  );
}

describe("TermsPage", () => {
  it("shows the terms of service by default", () => {
    renderAt("/terms");
    expect(
      screen.getAllByRole("heading", { name: "이용약관" })[0],
    ).toBeInTheDocument();
  });

  it("shows the privacy policy for ?type=privacy", () => {
    renderAt("/terms?type=privacy");
    expect(
      screen.getAllByRole("heading", { name: "개인정보처리방침" })[0],
    ).toBeInTheDocument();
  });

  it("falls back to the terms of service for unknown types", () => {
    renderAt("/terms?type=other");
    expect(
      screen.getAllByRole("heading", { name: "이용약관" })[0],
    ).toBeInTheDocument();
  });
});
