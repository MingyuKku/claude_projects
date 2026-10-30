import { parseContentDispositionFileName } from "./content-disposition";

export interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/** Thrown for any non-2xx response. `data` is the parsed body when the server sent one. */
export class ApiError extends Error {
  readonly status: number;
  readonly data: unknown;

  constructor(status: number, data: unknown) {
    super(`Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** 파일 응답. `fileName`은 서버가 `Content-Disposition`으로 준 이름이고 없으면 null. */
export interface DownloadedFile {
  blob: Blob;
  fileName: string | null;
}

export interface HttpClient {
  get<T>(path: string, options?: RequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  delete<T>(path: string, options?: RequestOptions): Promise<T>;
  /** 파일(이진 응답)을 받음. 본문을 글자로 읽는 다른 메서드와 달리 이진 데이터를 그대로 보존함. */
  download(path: string, options?: RequestOptions): Promise<DownloadedFile>;
}

function buildUrl(
  baseUrl: string,
  path: string,
  params: RequestOptions["params"],
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) query.set(key, String(value));
  }
  const queryString = query.toString();
  return `${baseUrl}${path}${queryString ? `?${queryString}` : ""}`;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// FormData must not get a JSON content type: the browser has to add the multipart
// boundary itself, and the Bigbird login endpoint only accepts multipart.
function buildBody(body: unknown): {
  payload: BodyInit | undefined;
  headers: Record<string, string>;
} {
  if (body === undefined) return { payload: undefined, headers: {} };
  if (body instanceof FormData) return { payload: body, headers: {} };
  return {
    payload: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  };
}

/**
 * The session is cookie based, so every request sends credentials and the
 * client never stores or reads a token.
 */
export function createHttpClient(
  baseUrl: string,
  { credentials = "include" }: { credentials?: RequestCredentials } = {},
): HttpClient {
  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    const { payload, headers } = buildBody(body);
    const response = await fetch(buildUrl(baseUrl, path, options.params), {
      method,
      credentials,
      headers: { ...headers, ...options.headers },
      body: payload,
      signal: options.signal,
    });
    const data = await parseBody(response);
    if (!response.ok) throw new ApiError(response.status, data);
    return data as T;
  }

  async function download(path: string, options: RequestOptions = {}) {
    const response = await fetch(buildUrl(baseUrl, path, options.params), {
      method: "GET",
      credentials,
      headers: options.headers,
      signal: options.signal,
    });
    if (!response.ok)
      throw new ApiError(response.status, await parseBody(response));
    return {
      blob: await response.blob(),
      fileName: parseContentDispositionFileName(
        response.headers.get("Content-Disposition"),
      ),
    };
  }

  return {
    download,
    get: (path, options) => request("GET", path, undefined, options),
    post: (path, body, options) => request("POST", path, body, options),
    put: (path, body, options) => request("PUT", path, body, options),
    patch: (path, body, options) => request("PATCH", path, body, options),
    delete: (path, options) => request("DELETE", path, undefined, options),
  };
}
