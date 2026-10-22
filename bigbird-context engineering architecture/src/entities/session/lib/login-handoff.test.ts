import {
  clearLoginCredential,
  readLoginCredential,
  stashLoginCredential,
} from "./login-handoff";

describe("login handoff", () => {
  afterEach(() => clearLoginCredential());

  it("returns null before anything is stashed", () => {
    expect(readLoginCredential()).toBeNull();
  });

  it("returns the stashed credential", () => {
    stashLoginCredential({ id: "user_1", password: "pw" });
    expect(readLoginCredential()).toEqual({ id: "user_1", password: "pw" });
  });

  it("forgets the credential once cleared", () => {
    stashLoginCredential({ id: "user_1", password: "pw" });
    clearLoginCredential();
    expect(readLoginCredential()).toBeNull();
  });
});
