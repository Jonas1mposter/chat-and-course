import { existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import multer from "multer";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = resolve(__dirname, "../../uploads");

export function ensureUploadsDir() {
  if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

/** multer diskStorage 工厂，按子目录存放 */
export function storageFor(subfolder) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = resolve(UPLOADS_DIR, subfolder);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      const name = `${Date.now()}-${randomUUID().slice(0, 8)}-${safe}`;
      cb(null, name);
    },
  });
}

/** 返回完整可访问 URL；未配置 UPLOADS_BASE_URL 时返回 key 让前端自行拼接 */
export function publicUrlFor(key) {
  const base = process.env.UPLOADS_BASE_URL || process.env.API_BASE_URL || "";
  if (base) {
    return `${base.replace(/\/$/, "")}/uploads/${key}`;
  }
  return key;
}

/**  multer 实例工厂：限制单文件最大 2 GB */
export function uploaderFor(subfolder) {
  return multer({
    storage: storageFor(subfolder),
    limits: {
      fileSize: Number(process.env.MAX_UPLOAD_BYTES || 2 * 1024 * 1024 * 1024),
      files: 1,
    },
  });
}
