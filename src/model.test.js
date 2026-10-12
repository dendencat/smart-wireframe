import assert from "node:assert/strict";
import test from "node:test";
import {
  CANVAS_DEFAULT,
  clampOrigin,
  createShape,
  normalizeDocument,
  parseStored,
  resizeShape,
  snapValue,
} from "./model.js";

test("snapValue rounds to the 10px grid only when snap is on", () => {
  assert.equal(snapValue(14, true), 10);
  assert.equal(snapValue(15, true), 20);
  assert.equal(snapValue(14.4, false), 14.4);
  assert.equal(snapValue("nope", true), 0);
});

test("createShape places a rectangle at the click and keeps a circle centered on it", () => {
  const rect = createShape("rect", { x: 100, y: 80 }, CANVAS_DEFAULT);
  assert.equal(rect.x, 100);
  assert.equal(rect.y, 80);
  assert.equal(rect.w, 200);

  const circle = createShape("circle", { x: 100, y: 80 }, CANVAS_DEFAULT);
  assert.equal(circle.x, 40);
  assert.equal(circle.y, 20);
  assert.equal(circle.r, 60);
});

test("createShape keeps new shapes inside the canvas", () => {
  const rect = createShape("rect", { x: 880, y: 580 }, CANVAS_DEFAULT);
  assert.equal(rect.x, 700);
  assert.equal(rect.y, 480);
  assert.equal(clampOrigin(-20, 10, 100, 40, CANVAS_DEFAULT).x, 0);
});

test("resizeShape shrinks a circle from the east handle and refuses to invert a box", () => {
  const circle = { type: "circle", r: 60, x: 0, y: 0 };
  assert.equal(resizeShape(circle, "e", -25, 0, false).r, 35);
  assert.equal(resizeShape(circle, "e", -100, 40, false).r, 10);

  const box = { type: "rect", x: 40, y: 50, w: 100, h: 80, text: "keep" };
  const shrunk = resizeShape(box, "w", 30, 0, false);
  assert.deepEqual({ x: shrunk.x, w: shrunk.w, text: shrunk.text }, { x: 70, w: 70, text: "keep" });
  const blocked = resizeShape(box, "w", 90, 0, false);
  assert.equal(blocked.x, 40);
  assert.equal(blocked.w, 100);

  const corner = resizeShape(box, "se", 15, -70, false);
  assert.equal(corner.w, 115);
  assert.equal(corner.h, 20);
});

test("normalizeDocument drops invalid shapes and fills defaults for older files", () => {
  assert.equal(normalizeDocument({ shapes: [] }), null);
  const doc = normalizeDocument({
    canvas: { width: 10, height: 800 },
    shapes: [
      { type: "image", x: 0, y: 0 },
      { type: "text", x: 12, y: 14, w: 80, h: 30, fill: "#112233", text: "A<B" },
      { type: "button", x: 1, y: 2, w: 50, h: 40, rx: 4 },
    ],
  });
  assert.equal(doc.canvas.width, 200);
  assert.equal(doc.canvas.height, 800);
  assert.equal(doc.shapes.length, 2);
  assert.equal(doc.shapes[0].background, "#ffffff");
  assert.equal(doc.shapes[0].text, "A<B");
  assert.equal(doc.shapes[1].color, "#ffffff");
  assert.equal(doc.shapes[1].rx, 4);
});

test("parseStored rejects broken JSON and keeps grid preferences", () => {
  assert.equal(parseStored("{"), null);
  assert.equal(parseStored(""), null);
  const stored = parseStored(JSON.stringify({
    canvas: { width: 640, height: 480 },
    shapes: [],
    showGrid: false,
    snap: true,
  }));
  assert.equal(stored.showGrid, false);
  assert.equal(stored.snap, true);
  assert.equal(stored.canvas.width, 640);
});
