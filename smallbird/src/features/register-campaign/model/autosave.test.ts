import { ApiError } from "@/shared/api";

import { createDraftFixture } from "../lib/test-utils";
import { createAutosaveController } from "./autosave";
import {
  AUTOSAVE_DEBOUNCE_MS,
  AUTOSAVE_MAX_WAIT_MS,
  AUTOSAVE_RETRY_MS,
} from "./constants";
import { createCampaignRegisterStore, hasUnsavedChanges } from "./store";

import type { CampaignDraft } from "@/entities/campaign";

const RESULT = { version: 2, updatedAt: "2026-11-06 10:01:00", endDate: null };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup(
  save: (draft: CampaignDraft) => Promise<typeof RESULT> = () =>
    Promise.resolve(RESULT),
) {
  const store = createCampaignRegisterStore(createDraftFixture());
  const saveMock = vi.fn(save);
  const onSaved = vi.fn();
  const controller = createAutosaveController({
    store,
    save: saveMock,
    onSaved,
  });
  const stop = controller.start();
  const type = (name: string) => store.getState().patchCampaignInfo({ name });
  return { store, saveMock, onSaved, controller, stop, type };
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("자동 저장 시점", () => {
  it("바뀐 내용이 없으면 저장하지 않는다", async () => {
    const { saveMock } = setup();

    await vi.advanceTimersByTimeAsync(AUTOSAVE_MAX_WAIT_MS * 2);

    expect(saveMock).not.toHaveBeenCalled();
  });

  it("마지막 입력 3초 뒤에 저장한다", async () => {
    const { saveMock, type, store } = setup();

    type("봄");
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS - 1);
    expect(saveMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(saveMock.mock.calls[0]?.[0].campaignInfo.name).toBe("봄");
    expect(hasUnsavedChanges(store.getState())).toBe(false);
  });

  it("입력이 계속되면 3초 기다림이 뒤로 밀린다", async () => {
    const { saveMock, type } = setup();

    type("봄");
    await vi.advanceTimersByTimeAsync(2_000);
    type("봄 체험");
    await vi.advanceTimersByTimeAsync(2_000);
    expect(saveMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1_000);

    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(saveMock.mock.calls[0]?.[0].campaignInfo.name).toBe("봄 체험");
  });

  it("2초마다 계속 입력해도 처음 바뀐 때부터 30초가 되면 저장한다", async () => {
    const { saveMock, type } = setup();

    for (let elapsed = 0; elapsed < AUTOSAVE_MAX_WAIT_MS; elapsed += 2_000) {
      type(`입력 ${elapsed}`);
      await vi.advanceTimersByTimeAsync(2_000);
    }

    expect(saveMock).toHaveBeenCalledTimes(1);
  });

  it("저장 응답의 버전 등을 store에 반영하고 onSaved를 부른다", async () => {
    const { store, onSaved, type } = setup();

    type("봄");
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);

    expect(store.getState().draft.version).toBe(2);
    expect(onSaved).toHaveBeenCalledWith(
      expect.objectContaining({ version: 1 }),
      RESULT,
    );
  });
});

describe("저장 직후 캐시 맞추기", () => {
  it("onSaved가 Promise를 돌려주면 그것이 끝난 뒤에 flush가 끝난다", async () => {
    // 저장 직후 화면을 옮기는 쪽이 캐시를 맞추는 중에 새 화면의 조회를 시작하면 SWR이 그 조회를 버려 로딩에 멈추기 때문.
    const cacheUpdate = deferred<void>();
    const { onSaved, controller, type } = setup();
    onSaved.mockReturnValue(cacheUpdate.promise);

    type("봄");
    let isFlushed = false;
    const flushed = controller.flush().then(() => {
      isFlushed = true;
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(isFlushed).toBe(false);

    cacheUpdate.resolve();
    await flushed;
    expect(isFlushed).toBe(true);
  });

  it("onSaved가 실패해도 저장 실패로 보지 않는다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { onSaved, controller, type, saveMock } = setup();
    onSaved.mockRejectedValue(new Error("cache"));

    type("봄");

    await expect(controller.flush()).resolves.toBe(true);
    expect(saveMock).toHaveBeenCalledTimes(1);
  });
});

describe("한 번에 하나만 보낸다", () => {
  it("보내는 동안 생긴 변경은 끝난 뒤 이어서 보낸다", async () => {
    const first = deferred<typeof RESULT>();
    const { saveMock, type, store } = setup();
    saveMock.mockImplementationOnce(() => first.promise);

    type("봄");
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);
    expect(saveMock).toHaveBeenCalledTimes(1);

    // 첫 저장이 끝나지 않은 채 3초가 더 지나도 두 번째를 동시에 보내지 않는다.
    type("봄 체험");
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);
    expect(saveMock).toHaveBeenCalledTimes(1);

    first.resolve(RESULT);
    await vi.advanceTimersByTimeAsync(0);

    expect(saveMock).toHaveBeenCalledTimes(2);
    expect(saveMock.mock.calls[1]?.[0].campaignInfo.name).toBe("봄 체험");
    expect(hasUnsavedChanges(store.getState())).toBe(false);
  });
});

describe("flush(단계 이동·임시저장)", () => {
  it("기다리지 않고 바로 저장하고 true를 돌려준다", async () => {
    const { controller, saveMock, type } = setup();
    type("봄");

    await expect(controller.flush()).resolves.toBe(true);

    expect(saveMock).toHaveBeenCalledTimes(1);
    // 예약돼 있던 자동 저장은 다시 보내지 않는다.
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MAX_WAIT_MS);
    expect(saveMock).toHaveBeenCalledTimes(1);
  });

  it("저장할 변경이 없으면 보내지 않고 true다", async () => {
    const { controller, saveMock } = setup();

    await expect(controller.flush()).resolves.toBe(true);

    expect(saveMock).not.toHaveBeenCalled();
  });

  it("보내는 중에 부르면 끝나기를 기다린 뒤 그사이 변경까지 저장한다", async () => {
    const first = deferred<typeof RESULT>();
    const { controller, saveMock, type, store } = setup();
    saveMock.mockImplementationOnce(() => first.promise);
    type("봄");
    const firstFlush = controller.flush();
    type("봄 체험");

    const secondFlush = controller.flush();
    first.resolve(RESULT);

    await expect(firstFlush).resolves.toBe(true);
    await expect(secondFlush).resolves.toBe(true);
    expect(saveMock).toHaveBeenCalledTimes(2);
    expect(hasUnsavedChanges(store.getState())).toBe(false);
  });

  it("저장에 실패하면 false를 돌려주고 변경은 저장 안 된 채로 남는다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { controller, store, type } = setup(() =>
      Promise.reject(new ApiError(500, undefined)),
    );
    type("봄");

    await expect(controller.flush()).resolves.toBe(false);

    expect(hasUnsavedChanges(store.getState())).toBe(true);
  });
});

describe("실패", () => {
  it("저장은 됐는데 onSaved가 던져도 저장 실패로 보지 않고 다시 보내지 않는다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { saveMock, onSaved, controller, type, store } = setup();
    onSaved.mockImplementation(() => {
      throw new Error("cache failed");
    });
    type("봄");

    await expect(controller.flush()).resolves.toBe(true);
    await vi.advanceTimersByTimeAsync(AUTOSAVE_RETRY_MS * 2);

    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(hasUnsavedChanges(store.getState())).toBe(false);
  });

  it("자동 저장이 실패하면 조용히 다음 주기에 다시 보낸다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { saveMock, type, store } = setup();
    saveMock.mockRejectedValueOnce(new ApiError(500, undefined));

    type("봄");
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(hasUnsavedChanges(store.getState())).toBe(true);

    await vi.advanceTimersByTimeAsync(AUTOSAVE_RETRY_MS);

    expect(saveMock).toHaveBeenCalledTimes(2);
    expect(hasUnsavedChanges(store.getState())).toBe(false);
  });

  it.each(["VERSION_CONFLICT", "NOT_EDITABLE"] as const)(
    "%s이면 저장을 멈추고 이유를 남긴다",
    async (reason) => {
      const { controller, saveMock, store, type } = setup(() =>
        Promise.reject(new ApiError(409, { result: false, reason })),
      );

      type("봄");
      await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);

      expect(store.getState().saveBlockedReason).toBe(reason);
      // 더 입력해도 다시 보내지 않는다.
      type("봄 체험");
      await vi.advanceTimersByTimeAsync(AUTOSAVE_MAX_WAIT_MS * 2);
      expect(saveMock).toHaveBeenCalledTimes(1);
      await expect(controller.flush()).resolves.toBe(false);
    },
  );
});

describe("멈출 때", () => {
  it("저장하지 못한 변경이 있으면 마지막으로 한 번 보낸다", async () => {
    const { saveMock, stop, type } = setup();
    type("봄");

    stop();
    await vi.advanceTimersByTimeAsync(0);

    expect(saveMock).toHaveBeenCalledTimes(1);
  });

  it("멈춘 뒤에는 입력해도 자동으로 보내지 않는다", async () => {
    const { saveMock, stop, type } = setup();
    stop();

    type("봄");
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MAX_WAIT_MS);

    expect(saveMock).not.toHaveBeenCalled();
  });

  it("멈춘 뒤 마지막 저장이 실패해도 다시 보내지 않는다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { saveMock, stop, type } = setup(() =>
      Promise.reject(new Error("network")),
    );
    type("봄");

    stop();
    await vi.advanceTimersByTimeAsync(AUTOSAVE_MAX_WAIT_MS * 2);

    expect(saveMock).toHaveBeenCalledTimes(1);
  });

  it("멈췄다가 다시 시작하면(개발 모드 재마운트) 자동 저장이 이어진다", async () => {
    const { controller, saveMock, stop, type } = setup();
    stop();
    controller.start();

    type("봄");
    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);

    expect(saveMock).toHaveBeenCalledTimes(1);
  });
});
