import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * 检测当前环境能否真正渲染某个字形。
 * 部分 iOS WebView / 低版本系统缺少对应字体时，会画成 "?" 或豆腐块。
 * 做法：用 canvas 分别绘制目标字符和一个必定缺字形的私有区码点，
 * 若两者渲染结果完全一致，说明目标字符也走了 .notdef，判定为不支持。
 */
const TOFU = "\uFFFF";
const cache = new Map<string, boolean>();

function canRender(glyph: string): boolean {
  if (!glyph) return false;
  if (cache.has(glyph)) return cache.get(glyph)!;
  if (typeof document === "undefined") return true; // SSR：先乐观渲染

  let ok = true;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (!ctx) return true;
    ctx.font = '24px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    ctx.textBaseline = "top";

    const draw = (text: string) => {
      ctx.clearRect(0, 0, 32, 32);
      ctx.fillText(text, 0, 0);
      return ctx.getImageData(0, 0, 32, 32).data.join(",");
    };

    const target = draw(glyph);
    const tofu = draw(TOFU);
    const blank = draw(" ");
    ok = target !== tofu && target !== blank;
  } catch {
    ok = true;
  }
  cache.set(glyph, ok);
  return ok;
}

function initialOf(label?: string) {
  const t = (label ?? "").trim();
  return t ? t.slice(0, 1) : "课";
}

/**
 * 课程封面字符。字体/图标资源加载失败时退化成课程标题首字，
 * 永远不会在 iOS WebView 里出现 "?" 方块。
 */
export function CourseEmoji({
  emoji,
  label,
  className,
}: {
  emoji?: string | null;
  label?: string;
  className?: string;
}) {
  const glyph = (emoji ?? "").trim();
  const [supported, setSupported] = React.useState(true);

  React.useEffect(() => {
    setSupported(canRender(glyph));
  }, [glyph]);

  const showFallback = !glyph || !supported;

  return (
    <span
      aria-hidden="true"
      className={cn("emoji-glyph select-none leading-none", showFallback && "font-semibold", className)}
    >
      {showFallback ? initialOf(label) : glyph}
    </span>
  );
}
