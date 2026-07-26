const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") || "";

const TOKEN_KEY = "chaonao.token";

export const getToken = () =>
  typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) => {
  if (typeof window === "undefined") return;
  if (t) window.localStorage.setItem(TOKEN_KEY, t);
  else window.localStorage.removeItem(TOKEN_KEY);
};

export class ApiError extends Error {
  status: number;
  constructor(msg: string, status: number) {
    super(msg);
    this.status = status;
  }
}

export async function api<T = any>(
  path: string,
  opts: { method?: string; body?: any; auth?: boolean } = {},
): Promise<T> {
  if (!BASE) {
    throw new ApiError(
      "尚未配置后端地址。请在项目根目录创建 .env 并设置 VITE_API_BASE_URL=https://你的后端域名",
      0,
    );
  }
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const tok = getToken();
  if (tok) headers.Authorization = `Bearer ${tok}`;
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || res.statusText;
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

export const isApiConfigured = () => !!BASE;

/** multipart 上传文件，返回 { key, publicUrl, sizeBytes }，支持进度回调 */
export function uploadFile<T = { key: string; publicUrl: string; sizeBytes: number }>(
  path: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<T> {
  if (!BASE) {
    return Promise.reject(
      new ApiError(
        "尚未配置后端地址。请在项目根目录创建 .env 并设置 VITE_API_BASE_URL=https://你的后端域名",
        0,
      ),
    );
  }
  const form = new FormData();
  form.append("file", file);
  const tok = getToken();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}${path}`);
    if (tok) xhr.setRequestHeader("Authorization", `Bearer ${tok}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        let msg = `上传失败 ${xhr.status}`;
        try {
          const d = JSON.parse(xhr.responseText);
          if (d.error || d.message) msg = d.error || d.message;
        } catch {}
        return reject(new ApiError(msg, xhr.status));
      }
      try {
        resolve(JSON.parse(xhr.responseText));
      } catch {
        resolve(xhr.responseText as T);
      }
    };
    xhr.onerror = () => reject(new ApiError("网络错误，请检查后端连接", 0));
    xhr.onabort = () => reject(new ApiError("上传已取消", 0));
    xhr.send(form);
  });
}

/** 把返回的 key / publicUrl 转成可用的播放 URL */
export function mediaUrl(result: { key: string; publicUrl: string }): string {
  if (result.publicUrl.startsWith("http://") || result.publicUrl.startsWith("https://")) {
    return result.publicUrl;
  }
  // 相对 key 时拼上后端地址
  return `${BASE}/uploads/${result.publicUrl}`;
}