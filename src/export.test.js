import assert from "node:assert/strict";
import test from "node:test";
import { standaloneDocument, toHtmlCss } from "./export.js";

const canvas = { width: 900, height: 600 };

test("toHtmlCss keeps inspector values and paints back-to-front", () => {
  const { html, css } = toHtmlCss(canvas, [
    { type: "rect", x: 20, y: 30, w: 200, h: 120, rx: 14, fill: "#94a3b8", stroke: "#111111", z: 2 },
    { type: "circle", x: 40, y: 50, r: 25, fill: "#22c55e", stroke: "#052e16", z: 1 },
    { type: "text", x: 8, y: 9, w: 120, h: 40, rx: 6, fill: "#111827", background: "#fff7ed", stroke: "#9a3412", fontSize: 22, text: "A<B&", z: 3 },
    { type: "button", x: 12, y: 16, w: 160, h: 44, rx: 3, fill: "#fde68a", color: "#1f2937", stroke: "#92400e", fontSize: 18, text: "進む", z: 4 },
  ]);

  const circleAt = html.indexOf("wf-circle");
  const rectAt = html.indexOf("wf-rect");
  const textAt = html.indexOf("wf-text");
  const buttonAt = html.indexOf("wf-button");
  assert.ok(circleAt < rectAt && rectAt < textAt && textAt < buttonAt);

  assert.match(html, /wf-rect"[^>]*border-radius:14px/);
  assert.match(html, /border:1px solid #111111/);
  assert.match(html, /wf-circle"[^>]*width:50px;height:50px/);
  assert.match(html, /border:1px solid #052e16;border-radius:50%/);
  assert.match(html, /wf-text"[^>]*color:#111827;background:#fff7ed/);
  assert.match(html, /A&lt;B&amp;/);
  assert.match(html, /<button type="button" class="wf-abs wf-button"[^>]*color:#1f2937/);
  assert.match(html, /border-radius:3px/);
  assert.match(css, /width:900px/);
  assert.match(css, /height:600px/);
  assert.match(css, /overflow:hidden/);
  assert.doesNotMatch(css, /border-radius:8px/);
  assert.doesNotMatch(css, /border-radius:10px/);
});

test("standaloneDocument is a complete file and keeps a style tag closed", () => {
  const doc = standaloneDocument("<div class=\"wf-container\"></div>", ".x{content:\"</style><script>\";}");
  assert.match(doc, /^<!DOCTYPE html>/);
  assert.match(doc, /<\\\/style><script>/);
  assert.equal(doc.match(/<\/style>/g).length, 1);
  assert.match(doc, /<div class="wf-container"><\/div>/);
});
