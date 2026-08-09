import { useEffect, useState } from "react";
import { playableUrl, signedPlayUrl } from "@/lib/api";

/** 返回带签名的临时播放地址；加载中先用普通地址兜底 */
export function useSignedMedia(url?: string | null): string | undefined {
  const fallback = playableUrl(url);
  const [src, setSrc] = useState<string | undefined>(fallback);

  useEffect(() => {
    let alive = true;
    setSrc(fallback);
    if (!url) return;
    signedPlayUrl(url).then((u) => {
      if (alive && u) setSrc(u);
    });
    return () => {
      alive = false;
    };
  }, [url]);

  return src;
}
