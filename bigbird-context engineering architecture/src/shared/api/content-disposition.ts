const LATIN1_MAX_CODE = 0xff;

/**
 * 서버가 `filename="한글"`처럼 UTF-8 바이트를 그대로 넣으면 fetch가 헤더를 Latin-1로 읽어 `á` 같은 깨진 글자가 됨.
 * 모든 글자가 1바이트 범위이고 그 바이트열이 올바른 UTF-8이면 UTF-8로 다시 읽음. 아니면 그대로 둠.
 */
function recoverUtf8FromLatin1(name: string) {
  const codes = Array.from(name, (char) => char.charCodeAt(0));
  const isOneByteOnly = codes.every((code) => code <= LATIN1_MAX_CODE);
  const hasHighByte = codes.some((code) => code >= 0x80);
  if (!isOneByteOnly || !hasHighByte) return name;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(codes),
    );
  } catch {
    return name;
  }
}

/**
 * `Content-Disposition` 헤더에서 파일 이름을 꺼냄. 한글 이름은 `filename*=UTF-8''…`(RFC 5987)로, 영문은 `filename="…"`으로 옴.
 * 둘 다 있으면 인코딩된 쪽이 우선. 없거나 해석할 수 없으면 null. 결과는 NFC로 맞춤(macOS에서 만든 한글은 자모가 풀린 NFD로 올 수 있음).
 */
export function parseContentDispositionFileName(header: string | null) {
  if (!header) return null;

  const encoded = /filename\*\s*=\s*([^']*)'[^']*'([^;]+)/i.exec(header);
  if (encoded?.[2]) {
    try {
      return decodeURIComponent(encoded[2].trim()).normalize("NFC");
    } catch {
      // 잘못된 인코딩은 일반 filename으로 넘어감.
    }
  }

  const plain = /filename\s*=\s*(?:"([^"]*)"|([^;]+))/i.exec(header);
  const name = (plain?.[1] ?? plain?.[2])?.trim();
  return name ? recoverUtf8FromLatin1(name).normalize("NFC") : null;
}
