const MAX_DEVICE_NAME_LENGTH = 100;
const UNKNOWN_DEVICE_NAME = "Web browser";

// 앞에서부터 처음 맞는 것이 이긴다. Edge·Opera·Chrome은 모두 UA에 "Chrome/"이 들어 있어 더 구체적인 것을 앞에 둠.
const BROWSERS: ReadonlyArray<readonly [name: string, pattern: RegExp]> = [
  ["Edge", /\bEdg(?:e|A|iOS)?\//],
  ["Opera", /\bOPR\//],
  ["Firefox", /\b(?:Firefox|FxiOS)\//],
  ["Samsung Internet", /\bSamsungBrowser\//],
  ["Chrome", /\b(?:Chrome|CriOS)\//],
  ["Safari", /\bSafari\//],
];

// iPhone·iPad의 UA에는 "like Mac OS X"가 들어 있어 macOS보다 앞에 둠.
const SYSTEMS: ReadonlyArray<readonly [name: string, pattern: RegExp]> = [
  ["iOS", /\b(?:iPhone|iPad|iPod)\b/],
  ["Android", /\bAndroid\b/],
  ["Windows", /\bWindows\b/],
  ["macOS", /\bMac OS X\b|\bMacintosh\b/],
  ["Chrome OS", /\bCrOS\b/],
  ["Linux", /\bLinux\b/],
];

interface NavigatorWithUserAgentData extends Navigator {
  userAgentData?: { platform?: string };
}

function matchName(
  table: ReadonlyArray<readonly [name: string, pattern: RegExp]>,
  userAgent: string,
) {
  return table.find(([, pattern]) => pattern.test(userAgent))?.[0];
}

/** 서버에 보낼 기기 이름(예: "Chrome on macOS"). 해석하지 못한 부분은 빼고, 둘 다 못 찾으면 기본 이름을 씀. */
export function createDeviceName(userAgent: string, platform?: string): string {
  const browser = matchName(BROWSERS, userAgent);
  const system = platform?.trim() || matchName(SYSTEMS, userAgent);
  const name =
    browser && system
      ? `${browser} on ${system}`
      : (browser ?? system ?? UNKNOWN_DEVICE_NAME);
  return name.slice(0, MAX_DEVICE_NAME_LENGTH);
}

export function getDeviceName(): string {
  const nav = navigator as NavigatorWithUserAgentData;
  return createDeviceName(nav.userAgent, nav.userAgentData?.platform);
}
