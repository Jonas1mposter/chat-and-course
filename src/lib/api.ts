import { getPass, solveChallenge } from "./challenge";

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
  const send = async () => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const tok = getToken();
    if (tok) headers.Authorization = `Bearer ${tok}`;
    const pass = getPass();
    if (pass) headers["x-abuse-pass"] = pass;
    const res = await fetch(`${BASE}${path}`, {
      method: opts.method || "GET",
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const text = await res.text();
    const data = text
      ? (() => {
          try {
            return JSON.parse(text);
          } catch {
            return text;
          }
        })()
      : null;
    return { res, data };
  };

  let { res, data } = await send();
  // 428：命中疑似爬虫阈值，先自动完成人机验证再重试一次
  if (res.status === 428 && data && (data as any).challengeRequired) {
    await solveChallenge(BASE, (data as any).challenge);
    ({ res, data } = await send());
  }
  if (!res.ok) {
    const msg = (data && ((data as any).error || (data as any).message)) || res.statusText;
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
    const pass = getPass();
    if (pass) xhr.setRequestHeader("x-abuse-pass", pass);
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

/**
 * 播放地址规范化：
 * iOS WKWebView 的 ATS 会直接拦截 http:// 媒体资源（表现为播放键打叉），
 * 所以统一升级到 https，并补全相对路径。
 */
export function playableUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const u = url.trim();
  if (!u) return undefined;
  if (u.startsWith("//")) return `https:${u}`;
  if (u.startsWith("http://")) return `https://${u.slice("http://".length)}`;
  if (u.startsWith("https://")) return u;
  if (u.startsWith("/")) return `${BASE}${u}`;
  return u;
}

/**
 * 私有播放地址：向后端换取有时效的签名 URL。
 * 失败或非 COS 资源时回退到普通地址。
 */
const signedCache = new Map<string, { url: string; exp: number }>();
const inflight = new Map<string, Promise<string | undefined>>();
export async function signedPlayUrl(url?: string | null): Promise<string | undefined> {
  const base = playableUrl(url);
  if (!base) return undefined;
  const now = Date.now();
  const hit = signedCache.get(base);
  if (hit && hit.exp > now) return hit.url;
  if (!getToken()) return base;
  // 同一地址并发只请求一次，减少无谓的签名调用
  const pending = inflight.get(base);
  if (pending) return pending;
  const p = (async () => {
    try {
      const res = await api<{ url: string; expiresIn?: number }>("/api/videos/sign-play", {
        method: "POST",
        body: { url: base },
      });
      const signed = playableUrl(res.url) || base;
      // 提前 20% 过期，避免播放中途签名失效
      const ttl = Math.max(60, (res.expiresIn ?? 900) * 0.8) * 1000;
      signedCache.set(base, { url: signed, exp: Date.now() + ttl });
      return signed;
    } catch {
      return base;
    } finally {
      inflight.delete(base);
    }
  })();
  inflight.set(base, p);
  return p;
}