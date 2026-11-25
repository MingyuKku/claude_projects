import { createHttpClient } from "./http-client";

describe("delete", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(() =>
      Promise.resolve(new Response("{}", { status: 200 })),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  function getRequest() {
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    return { url: String(url), init, headers: new Headers(init.headers) };
  }

  it("본문을 넘기면 JSON으로 보낸다", async () => {
    await createHttpClient("https://api.test").delete("/items", {
      body: { ids: [1] },
    });

    const { init, headers } = getRequest();
    expect(init.method).toBe("DELETE");
    expect(init.body).toBe(JSON.stringify({ ids: [1] }));
    expect(headers.get("Content-Type")).toContain("application/json");
  });

  it("본문 없이 쿼리만 넘기면 쿼리만 붙인다", async () => {
    await createHttpClient("https://api.test").delete("/items", {
      params: { id: 1 },
    });

    const { url, init } = getRequest();
    expect(url).toContain("/items?id=1");
    expect(init.body).toBeUndefined();
  });
});
