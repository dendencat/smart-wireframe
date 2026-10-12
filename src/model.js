export const CANVAS_DEFAULT = { width: 900, height: 600 };
export const GRID_SIZE = 10;
export const MIN_BOX = 20;
export const MIN_RADIUS = 10;
export const MIN_CANVAS = 200;
export const STORAGE_KEY = "smart-wireframe:v1";

export const SHAPE_TYPES = [
  { key: "rect", label: "長方形" },
  { key: "circle", label: "円" },
  { key: "text", label: "テキスト" },
  { key: "button", label: "ボタン" },
];

const TYPE_KEYS = new Set(SHAPE_TYPES.map((t) => t.key));

let zClock = Date.now();

export function nextZ() {
  zClock = Math.max(Date.now(), zClock + 1);
  return zClock;
}

export function noteZ(shapes) {
  for (const shape of shapes) zClock = Math.max(zClock, Number(shape?.z) || 0);
}

export function uid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

export function snapValue(value, enabled, grid = GRID_SIZE) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (!enabled) return n;
  return Math.round(n / grid) * grid;
}

export function clampOrigin(x, y, w, h, canvas) {
  const maxX = Math.max(0, canvas.width - w);
  const maxY = Math.max(0, canvas.height - h);
  return {
    x: Math.min(Math.max(0, x), maxX),
    y: Math.min(Math.max(0, y), maxY),
  };
}

function finite(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function color(value, fallback) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : fallback;
}

export function createShape(type, point, canvas = CANVAS_DEFAULT) {
  if (!TYPE_KEYS.has(type)) return null;
  const id = uid();
  const z = nextZ();
  const stroke = "#0f172a";
  if (type === "rect") {
    const w = 200;
    const h = 120;
    const origin = clampOrigin(point.x, point.y, w, h, canvas);
    return { id, type, x: origin.x, y: origin.y, w, h, rx: 8, fill: "#94a3b8", stroke, z };
  }
  if (type === "circle") {
    const r = 60;
    const origin = clampOrigin(point.x - r, point.y - r, r * 2, r * 2, canvas);
    return { id, type, x: origin.x, y: origin.y, r, fill: "#94a3b8", stroke, z };
  }
  if (type === "text") {
    const w = 240;
    const h = 40;
    const origin = clampOrigin(point.x, point.y, w, h, canvas);
    return {
      id, type, x: origin.x, y: origin.y, w, h, rx: 6,
      text: "見出し", fontSize: 20, fill: "#111827", background: "#ffffff", stroke, z,
    };
  }
  const w = 160;
  const h = 44;
  const origin = clampOrigin(point.x, point.y, w, h, canvas);
  return {
    id, type: "button", x: origin.x, y: origin.y, w, h, rx: 10,
    text: "ボタン", fontSize: 16, fill: "#2563eb", color: "#ffffff", stroke, z,
  };
}

export function resizeShape(shape, handle, dx, dy, snap) {
  const snapTo = (value) => snapValue(value, snap);
  if (shape.type === "circle") {
    return { ...shape, r: Math.max(MIN_RADIUS, snapTo((shape.r ?? MIN_RADIUS) + dx)) };
  }
  let { x, y, w, h } = shape;
  if (handle.includes("e")) w = Math.max(MIN_BOX, snapTo(w + dx));
  if (handle.includes("s")) h = Math.max(MIN_BOX, snapTo(h + dy));
  if (handle.includes("w")) {
    const nx = snapTo(x + dx);
    const nw = w - (nx - x);
    if (nw >= MIN_BOX) {
      x = nx;
      w = nw;
    }
  }
  if (handle.includes("n")) {
    const ny = snapTo(y + dy);
    const nh = h - (ny - y);
    if (nh >= MIN_BOX) {
      y = ny;
      h = nh;
    }
  }
  return { ...shape, x, y, w, h };
}

export function normalizeShape(input) {
  if (!input || typeof input !== "object" || !TYPE_KEYS.has(input.type)) return null;
  const type = input.type;
  const base = {
    id: typeof input.id === "string" && input.id ? input.id : uid(),
    type,
    x: finite(input.x, 40),
    y: finite(input.y, 40),
    fill: color(input.fill, type === "text" ? "#111827" : type === "button" ? "#2563eb" : "#94a3b8"),
    stroke: color(input.stroke, "#0f172a"),
    z: finite(input.z, 0),
  };
  if (type === "circle") {
    return { ...base, r: Math.max(MIN_RADIUS, finite(input.r, 60)) };
  }
  const box = {
    ...base,
    w: Math.max(MIN_BOX, finite(input.w, 100)),
    h: Math.max(MIN_BOX, finite(input.h, 40)),
  };
  if (type === "rect") return { ...box, rx: Math.max(0, finite(input.rx, 8)) };
  if (type === "text") {
    return {
      ...box,
      rx: Math.max(0, finite(input.rx, 6)),
      text: typeof input.text === "string" ? input.text : "見出し",
      fontSize: Math.max(8, finite(input.fontSize, 20)),
      background: color(input.background, "#ffffff"),
    };
  }
  return {
    ...box,
    rx: Math.max(0, finite(input.rx, 10)),
    text: typeof input.text === "string" ? input.text : "ボタン",
    fontSize: Math.max(8, finite(input.fontSize, 16)),
    color: color(input.color, "#ffffff"),
  };
}

export function normalizeDocument(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  if (!input.canvas || typeof input.canvas !== "object" || Array.isArray(input.canvas)) return null;
  if (!Array.isArray(input.shapes)) return null;
  return {
    canvas: {
      width: Math.max(MIN_CANVAS, finite(input.canvas.width, CANVAS_DEFAULT.width)),
      height: Math.max(MIN_CANVAS, finite(input.canvas.height, CANVAS_DEFAULT.height)),
    },
    shapes: input.shapes.map(normalizeShape).filter(Boolean),
  };
}

export function parseStored(raw) {
  if (typeof raw !== "string" || !raw) return null;
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  const doc = normalizeDocument(data);
  if (!doc) return null;
  return {
    canvas: doc.canvas,
    shapes: doc.shapes,
    showGrid: data.showGrid !== false,
    snap: data.snap !== false,
  };
}

export function loadState() {
  if (typeof localStorage === "undefined") return null;
  try {
    return parseStored(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function labelOf(type) {
  return SHAPE_TYPES.find((t) => t.key === type)?.label || type;
}
