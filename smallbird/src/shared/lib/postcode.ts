// Daum(카카오) 우편번호 서비스 래퍼(캠페인 등록 스펙 §3 2단계, v2와 같은 서비스). 처음 열 때 스크립트를 불러오고
// (index.html·npm 패키지 없음), 팝업에서 고른 주소를 돌려줌. 화면은 이 함수만 쓰고 테스트는 이 모듈을 모킹함.

// 카카오 공지: t1.daumcdn.net 도메인은 2026-11-30에 끝나 t1.kakaocdn.net으로 옮김(같은 스크립트, 2026-11-16 확인).
const POSTCODE_SCRIPT_URL =
  "https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

export interface PostcodeResult {
  /** 우편번호 5자리. */
  zonecode: string;
  /** 사용자가 고른 도로명 또는 지번 주소. */
  address: string;
}

interface DaumPostcodeData {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  /** "R" 도로명, "J" 지번. */
  userSelectedType: "R" | "J";
}

interface DaumPostcodeOptions {
  oncomplete: (data: DaumPostcodeData) => void;
  onclose: (state: "FORCE_CLOSE" | "COMPLETE_CLOSE") => void;
}

interface DaumGlobal {
  Postcode: new (options: DaumPostcodeOptions) => { open: () => void };
}

declare global {
  interface Window {
    daum?: DaumGlobal;
  }
}

let scriptPromise: Promise<DaumGlobal> | null = null;

function loadPostcodeScript(): Promise<DaumGlobal> {
  if (window.daum?.Postcode) return Promise.resolve(window.daum);
  scriptPromise ??= new Promise<DaumGlobal>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = POSTCODE_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      if (window.daum?.Postcode) resolve(window.daum);
      else reject(new Error("Daum postcode is not available."));
    };
    script.onerror = () => reject(new Error("Failed to load Daum postcode."));
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    // 실패하면 다음에 열 때 다시 불러옴.
    scriptPromise = null;
    throw error;
  });
  return scriptPromise;
}

/**
 * 우편번호 검색 팝업을 열고 고른 주소를 돌려줌. 고르지 않고 닫으면 null.
 * 스크립트를 불러오지 못하면 reject하고 호출한 쪽이 실패 안내를 띄움.
 */
export async function openPostcodeSearch(): Promise<PostcodeResult | null> {
  const daum = await loadPostcodeScript();
  return new Promise((resolve) => {
    new daum.Postcode({
      oncomplete: (data) =>
        resolve({
          zonecode: data.zonecode,
          address:
            data.userSelectedType === "J"
              ? data.jibunAddress
              : data.roadAddress,
        }),
      onclose: (state) => {
        if (state === "FORCE_CLOSE") resolve(null);
      },
    }).open();
  });
}
