import COS from "cos-nodejs-sdk-v5";

const {
  COS_SECRET_ID,
  COS_SECRET_KEY,
  COS_BUCKET,
  COS_REGION,
  COS_CDN_BASE, // 可选：自定义域名/CDN 加速域名（不带末尾斜杠）
} = process.env;

let cos = null;
export function getCOS() {
  if (!COS_SECRET_ID || !COS_SECRET_KEY || !COS_BUCKET || !COS_REGION) {
    throw new Error(
      "COS 未配置：请在 server/.env 设置 COS_SECRET_ID / COS_SECRET_KEY / COS_BUCKET / COS_REGION",
    );
  }
  if (!cos) cos = new COS({ SecretId: COS_SECRET_ID, SecretKey: COS_SECRET_KEY });
  return cos;
}

export function isConfigured() {
  return !!(COS_SECRET_ID && COS_SECRET_KEY && COS_BUCKET && COS_REGION);
}

// 生成一个 PUT 预签名 URL，前端可直接 PUT 上传到 COS
export function presignPutUrl(key, expiresSec = 600) {
  const c = getCOS();
  return new Promise((resolve, reject) => {
    c.getObjectUrl(
      {
        Bucket: COS_BUCKET,
        Region: COS_REGION,
        Key: key,
        Method: "PUT",
        Sign: true,
        Expires: expiresSec,
      },
      (err, data) => (err ? reject(err) : resolve(data.Url)),
    );
  });
}

export function publicUrlFor(key) {
  if (COS_CDN_BASE) return `${COS_CDN_BASE.replace(/\/$/, "")}/${key}`;
  return `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com/${key}`;
}

/** 从完整 URL 反推出 COS object key（兼容 CDN 自定义域名与默认 cos 域名） */
export function keyFromUrl(url) {
  if (!url) return null;
  const u = String(url).trim();
  if (!/^https?:\/\//i.test(u)) return u.replace(/^\/+/, "");
  try {
    const parsed = new URL(u);
    const host = parsed.hostname;
    const cosHost = `${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com`;
    const cdnHost = COS_CDN_BASE ? new URL(COS_CDN_BASE).hostname : null;
    if (host !== cosHost && host !== cdnHost) return null; // 非 COS 资源
    return decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  } catch {
    return null;
  }
}

/** 生成带签名的临时播放地址（默认 15 分钟有效，强制 inline 播放，禁止另存下载） */
export function presignGetUrl(key, expiresSec = 900) {
  const c = getCOS();
  return new Promise((resolve, reject) => {
    c.getObjectUrl(
      {
        Bucket: COS_BUCKET,
        Region: COS_REGION,
        Key: key,
        Method: "GET",
        Sign: true,
        Expires: expiresSec,
        Query: {
          "response-content-disposition": "inline",
          "response-cache-control": "private, max-age=600",
        },
      },
      (err, data) => (err ? reject(err) : resolve(data.Url)),
    );
  });
}
