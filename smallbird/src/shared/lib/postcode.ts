// Daum(카카오) 우편번호 서비스 래퍼. 스크립트는 처음 열 때 불러오고(`index.html`·npm 패키지 없음), 팝업에서 고른 주소를 Promise로 돌려줌.
// 스크립트를 불러오지 못하면 거절하므로 쓰는 쪽이 실패 안내를 띄움. 테스트는 이 모듈의 `openPostcodeSearch`를 모킹함.

const POSTCODE_SCRIPT_URL =
  "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

/** Daum 우편번호 `oncomplete` 데이터 중 쓰는 필드(키 이름은 Daum 계약). */
interface DaumPostcodeData {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  /** 사용자가 고른 주소 종류. R은 도로명, J는 지번. */
  userSelectedType: "R" | "J";
}

interface DaumPostcodeOptions {
  oncomplete: (data: DaumPostcodeData) => void;
  onclose?: () => void;
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: DaumPostcodeOptions) => { open: () => void };
    };
  }
}

export interface PostcodeResult {
  /** 우편번호(새 5자리). */
  zonecode: string;
  /** 사용자가 고른 도로명 또는 지번 주소. */
  address: string;
}

let scriptPromise: Promise<void> | undefined;

function loadPostcodeScript() {
  if (window.daum?.Postcode) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = POSTCODE_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // 다음에 다시 열 때 처음부터 불러오도록 비움.
      scriptPromise = undefined;
      script.remove();
      reject(new Error("Failed to load Daum postcode script"));
    };
    document.head.append(script);
  });
  return scriptPromise;
}

/**
 * 우편번호 검색 팝업을 열고 사용자가 고른 주소를 돌려줌. 고르지 않고 닫으면 `undefined`.
 * 스크립트를 불러오지 못하면 거절함.
 */
export async function openPostcodeSearch(): Promise<
  PostcodeResult | undefined
> {
  await loadPostcodeScript();
  const Postcode = window.daum?.Postcode;
  if (!Postcode) throw new Error("Daum postcode is unavailable");

  return new Promise((resolve) => {
    new Postcode({
      oncomplete: (data) =>
        resolve({
          zonecode: data.zonecode,
          address:
            data.userSelectedType === "R"
              ? data.roadAddress
              : data.jibunAddress,
        }),
      // 고르고 닫을 때도 불리지만 이미 resolve된 뒤라 무시됨.
      onclose: () => resolve(undefined),
    }).open();
  });
}
