export const FONT_FAMILY = 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans JP", sans-serif';

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function cssNum(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return String(Math.round(n * 100) / 100);
}

function px(value) {
  return `${cssNum(value)}px`;
}

function shapeToHtml(shape) {
  const stroke = shape.stroke || "#0f172a";
  if (shape.type === "rect") {
    return `<div class="wf-abs wf-rect" style="left:${px(shape.x)};top:${px(shape.y)};width:${px(shape.w)};height:${px(shape.h)};background:${shape.fill};border:1px solid ${stroke};border-radius:${px(shape.rx ?? 8)}"></div>`;
  }
  if (shape.type === "button") {
    return `<button type="button" class="wf-abs wf-button" style="left:${px(shape.x)};top:${px(shape.y)};width:${px(shape.w)};height:${px(shape.h)};background:${shape.fill};color:${shape.color || "#ffffff"};border:1px solid ${stroke};border-radius:${px(shape.rx ?? 10)};font-size:${px(shape.fontSize || 16)}">${escapeHtml(shape.text || "ボタン")}</button>`;
  }
  if (shape.type === "text") {
    return `<div class="wf-abs wf-text" style="left:${px(shape.x)};top:${px(shape.y)};width:${px(shape.w)};height:${px(shape.h)};color:${shape.fill};background:${shape.background || "#ffffff"};border:1px solid ${stroke};border-radius:${px(shape.rx ?? 6)};font-size:${px(shape.fontSize || 18)}">${escapeHtml(shape.text || "テキスト")}</div>`;
  }
  if (shape.type === "circle") {
    const d = (shape.r || 40) * 2;
    return `<div class="wf-abs wf-circle" style="left:${px(shape.x)};top:${px(shape.y)};width:${px(d)};height:${px(d)};background:${shape.fill};border:1px solid ${stroke};border-radius:50%"></div>`;
  }
  return "";
}

export function toHtmlCss(canvas, shapes) {
  const html = [
    `<div class="wf-container">`,
    ...[...shapes]
      .filter((shape) => shapeToHtml(shape))
      .sort((a, b) => (a.z || 0) - (b.z || 0))
      .map(shapeToHtml),
    `</div>`,
  ].join("\n");

  const css = [
    `.wf-container{position:relative;width:${px(canvas.width)};height:${px(canvas.height)};background:#ffffff;border:1px solid #e5e7eb;overflow:hidden;}`,
    `.wf-abs{position:absolute;box-sizing:border-box;}`,
    `.wf-button{display:flex;align-items:center;justify-content:center;margin:0;padding:0;font-family:${FONT_FAMILY};cursor:default;}`,
    `.wf-text{display:flex;align-items:center;padding:4px 6px;overflow:hidden;font-family:${FONT_FAMILY};}`,
  ].join("\n");

  return { html, css };
}

export function standaloneDocument(html, css) {
  const safeCss = String(css).replaceAll("</", "<\\/");
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>wireframe</title>
<style>
${safeCss}
</style>
</head>
<body>
${html}
</body>
</html>
`;
}
