// API가 나오기 전 개발 서버(`import.meta.env.DEV`)에서 쓰는 목 저장소. `sessionStorage`에 두어 새로고침해도 이어 쓸 수 있음.
// 읽기는 복사본을 돌려줘서 호출한 쪽이 고쳐도 저장된 값이 바뀌지 않음. 처음 읽을 때 초기값도 저장해서 같은 키를 읽는 다른 모듈이 볼 수 있음.
// `sessionStorage`를 못 쓰면 메모리만 씀.

export interface MockStore<T> {
  /** 저장된 값의 복사본. */
  get: () => T;
  /** 복사본을 `mutate`로 고쳐 저장함. */
  update: (mutate: (value: T) => void) => void;
  /** 저장된 값을 버리고 처음 상태로 돌림(테스트용). */
  reset: () => void;
}

export function createMockStore<T>(
  key: string,
  createInitial: () => T,
): MockStore<T> {
  // `sessionStorage`를 쓸 수 없을 때만 메모리 값을 원본으로 씀.
  let memory: T | undefined;
  // 읽기는 되는데 쓰기만 막힌 경우(용량 초과 등): 저장소가 비어 보여도 메모리 값을 써야 고친 값이 사라지지 않음.
  let isPersistFailed = false;

  function persist(value: T) {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
      isPersistFailed = false;
    } catch {
      isPersistFailed = true;
    }
  }

  // 원본은 `sessionStorage`임. 읽을 때마다 거기서 읽어서 같은 키를 읽는 다른 모듈과 어긋나지 않고, 저장소를 비우면 처음 상태로 돌아감.
  function read(): T {
    let raw: string | null;
    try {
      raw = window.sessionStorage.getItem(key);
    } catch {
      memory ??= createInitial();
      return memory;
    }
    if (isPersistFailed && memory !== undefined) return memory;
    if (raw !== null) {
      try {
        return JSON.parse(raw) as T;
      } catch {
        // 값이 깨졌으면 처음 상태로 시작함.
      }
    }
    const initial = createInitial();
    persist(initial);
    if (isPersistFailed) memory = initial;
    return initial;
  }

  return {
    get: () => structuredClone(read()),
    update: (mutate) => {
      const next = structuredClone(read());
      mutate(next);
      memory = next;
      persist(next);
    },
    reset: () => {
      memory = undefined;
      isPersistFailed = false;
      try {
        window.sessionStorage.removeItem(key);
      } catch {
        // 무시함.
      }
    },
  };
}
