import { createMockStore } from "./mock-store";

const KEY = "test:mock-store";

afterEach(() => window.sessionStorage.clear());

describe("createMockStore", () => {
  it("처음에는 초기값을 돌려주고, 고친 값은 이어서 읽힌다", () => {
    const store = createMockStore(KEY, () => ({ count: 0 }));

    store.update((value) => {
      value.count += 1;
    });

    expect(store.get()).toEqual({ count: 1 });
  });

  it("읽은 값을 고쳐도 저장된 값은 바뀌지 않는다", () => {
    const store = createMockStore(KEY, () => ({ count: 0 }));

    store.get().count = 99;

    expect(store.get()).toEqual({ count: 0 });
  });

  it("새로고침 뒤에도(저장소를 새로 만들어도) sessionStorage의 값을 이어 쓴다", () => {
    createMockStore(KEY, () => ({ count: 0 })).update((value) => {
      value.count = 5;
    });

    const reloaded = createMockStore(KEY, () => ({ count: 0 }));

    expect(reloaded.get()).toEqual({ count: 5 });
  });

  it("저장된 값이 깨졌으면 초기값으로 시작한다", () => {
    window.sessionStorage.setItem(KEY, "{broken");

    expect(createMockStore(KEY, () => ({ count: 7 })).get()).toEqual({
      count: 7,
    });
  });

  it("reset하면 저장된 값을 버리고 초기값으로 돌아간다", () => {
    const store = createMockStore(KEY, () => ({ count: 0 }));
    store.update((value) => {
      value.count = 3;
    });

    store.reset();

    expect(window.sessionStorage.getItem(KEY)).toBeNull();
    expect(store.get()).toEqual({ count: 0 });
  });

  it("처음 읽을 때 초기값도 저장해 같은 키를 읽는 다른 모듈이 볼 수 있다", () => {
    createMockStore(KEY, () => ({ count: 4 })).get();

    expect(window.sessionStorage.getItem(KEY)).toBe('{"count":4}');
  });

  it("저장소를 비우면 이미 만든 저장소도 처음 상태로 돌아간다", () => {
    const store = createMockStore(KEY, () => ({ count: 0 }));
    store.update((value) => {
      value.count = 9;
    });

    window.sessionStorage.clear();

    expect(store.get()).toEqual({ count: 0 });
  });

  it("저장소를 쓸 수 없으면 메모리에 둔다", () => {
    const spy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const store = createMockStore(KEY, () => ({ count: 0 }));

    store.update((value) => {
      value.count = 4;
    });

    expect(store.get()).toEqual({ count: 4 });
    spy.mockRestore();
    vi.restoreAllMocks();
  });

  it("읽기는 되고 쓰기만 막혀도 고친 값이 이어서 읽힌다", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    const store = createMockStore(KEY, () => ({ count: 0 }));

    store.update((value) => {
      value.count = 4;
    });
    store.update((value) => {
      value.count += 1;
    });

    expect(store.get()).toEqual({ count: 5 });
    vi.restoreAllMocks();
  });

  it("먼저 저장에 성공한 뒤 쓰기가 막혀도 고친 값이 이어서 읽힌다", () => {
    const store = createMockStore(KEY, () => ({ count: 0 }));
    store.update((value) => {
      value.count = 1;
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });

    store.update((value) => {
      value.count = 2;
    });

    expect(store.get()).toEqual({ count: 2 });
    vi.restoreAllMocks();
  });
});
