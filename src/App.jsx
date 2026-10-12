import { useEffect, useMemo, useRef, useState } from "react";
import { FONT_FAMILY, standaloneDocument, toHtmlCss } from "./export.js";
import {
  CANVAS_DEFAULT,
  GRID_SIZE,
  MIN_BOX,
  MIN_CANVAS,
  MIN_RADIUS,
  SHAPE_TYPES,
  STORAGE_KEY,
  clampOrigin,
  createShape,
  labelOf,
  loadState,
  nextZ,
  normalizeDocument,
  noteZ,
  resizeShape,
  snapValue,
  uid,
} from "./model.js";

const restored = loadState();
if (restored) noteZ(restored.shapes);

export default function WireframeBuilder() {
  const [canvas, setCanvas] = useState(restored?.canvas ?? { ...CANVAS_DEFAULT });
  const [shapes, setShapes] = useState(restored?.shapes ?? []);
  const [selectedId, setSelectedId] = useState(null);
  const [tool, setTool] = useState("select");
  const [showGrid, setShowGrid] = useState(restored?.showGrid ?? true);
  const [snap, setSnap] = useState(restored?.snap ?? true);
  const [htmlOut, setHtmlOut] = useState("");
  const [cssOut, setCssOut] = useState("");
  const [notice, setNotice] = useState("");

  const svgRef = useRef(null);
  const dragRef = useRef({ state: "idle" });
  const historyRef = useRef({ past: [], future: [] });
  const inspectorSession = useRef(false);
  const canvasRef = useRef(canvas);
  const shapesRef = useRef(shapes);
  const snapRef = useRef(snap);
  const toolRef = useRef(tool);
  const selectedIdRef = useRef(null);
  const apiRef = useRef({});
  canvasRef.current = canvas;
  shapesRef.current = shapes;
  snapRef.current = snap;
  toolRef.current = tool;
  selectedIdRef.current = selectedId;

  const selected = useMemo(
    () => shapes.find((shape) => shape.id === selectedId) || null,
    [shapes, selectedId],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ canvas, shapes, showGrid, snap }));
      } catch {
        // プライベートモードなどで保存できないときは、その場の編集だけ続ける。
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [canvas, shapes, showGrid, snap]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 2000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    function onKey(event) {
      const tag = event.target?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || event.target?.isContentEditable;
      const key = event.key.toLowerCase();
      const command = event.metaKey || event.ctrlKey;
      if (command && key === "z") {
        if (typing) return;
        event.preventDefault();
        if (event.shiftKey) apiRef.current.redo();
        else apiRef.current.undo();
        return;
      }
      if (command && key === "y") {
        if (typing) return;
        event.preventDefault();
        apiRef.current.redo();
        return;
      }
      if (command && key === "d") {
        if (typing) return;
        event.preventDefault();
        apiRef.current.duplicate();
        return;
      }
      if (typing) return;
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        apiRef.current.deleteSelected();
      } else if (event.key === "Escape") {
        setTool("select");
        setSelectedId(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function snapshot() {
    return JSON.stringify({ canvas: canvasRef.current, shapes: shapesRef.current });
  }

  function remember() {
    const history = historyRef.current;
    history.past.push(snapshot());
    if (history.past.length > 100) history.past.shift();
    history.future = [];
  }

  function dropEmptyHistory() {
    const history = historyRef.current;
    if (history.past.length && history.past[history.past.length - 1] === snapshot()) {
      history.past.pop();
    }
  }

  function applyDoc(doc) {
    canvasRef.current = doc.canvas;
    shapesRef.current = doc.shapes;
    noteZ(doc.shapes);
    setCanvas(doc.canvas);
    setShapes(doc.shapes);
    setSelectedId(null);
  }

  function undo() {
    const history = historyRef.current;
    if (!history.past.length) return;
    history.future.push(snapshot());
    applyDoc(JSON.parse(history.past.pop()));
  }

  function redo() {
    const history = historyRef.current;
    if (!history.future.length) return;
    history.past.push(snapshot());
    applyDoc(JSON.parse(history.future.pop()));
  }

  function addShapeAt(type, x, y) {
    const shape = createShape(type, {
      x: snapValue(x, snapRef.current),
      y: snapValue(y, snapRef.current),
    }, canvasRef.current);
    if (!shape) return;
    remember();
    setShapes((prev) => [...prev, shape]);
    setSelectedId(shape.id);
    setTool("select");
  }

  function bringForward(id) {
    remember();
    const z = nextZ();
    setShapes((prev) => prev.map((shape) => (shape.id === id ? { ...shape, z } : shape)));
  }

  function sendBackward(id) {
    remember();
    setShapes((prev) => {
      const minZ = Math.min(...prev.map((shape) => shape.z || 0));
      return prev.map((shape) => (shape.id === id ? { ...shape, z: minZ - 1 } : shape));
    });
  }

  function deleteSelected() {
    const id = selectedIdRef.current;
    if (!id) return;
    remember();
    setShapes((prev) => prev.filter((shape) => shape.id !== id));
    setSelectedId(null);
  }

  function duplicate() {
    const current = shapesRef.current.find((shape) => shape.id === selectedIdRef.current);
    if (!current) return;
    remember();
    const copy = { ...current, id: uid(), x: current.x + GRID_SIZE * 2, y: current.y + GRID_SIZE * 2, z: nextZ() };
    setShapes((prev) => [...prev, copy]);
    setSelectedId(copy.id);
  }

  apiRef.current = { undo, redo, deleteSelected, duplicate };

  function pointFromEvent(event) {
    const svg = svgRef.current;
    const matrix = svg.getScreenCTM();
    if (!matrix) return { x: 0, y: 0 };
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    return { x: local.x, y: local.y };
  }

  function onCanvasPointerDown(event) {
    if (event.button !== 0) return;
    if (toolRef.current !== "select") {
      const point = pointFromEvent(event);
      addShapeAt(toolRef.current, point.x, point.y);
      return;
    }
    setSelectedId(null);
  }

  function startGesture(event, shape, mode, handle) {
    event.stopPropagation();
    event.preventDefault();
    remember();
    setSelectedId(shape.id);
    const point = pointFromEvent(event);
    dragRef.current = {
      state: mode,
      id: shape.id,
      handle,
      startX: point.x,
      startY: point.y,
      orig: { ...shape },
    };
    svgRef.current?.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event) {
    const drag = dragRef.current;
    if (drag.state === "idle") return;
    const point = pointFromEvent(event);
    const dx = point.x - drag.startX;
    const dy = point.y - drag.startY;
    setShapes((prev) => prev.map((shape) => {
      if (shape.id !== drag.id) return shape;
      if (drag.state === "drag") {
        const width = drag.orig.type === "circle" ? drag.orig.r * 2 : drag.orig.w;
        const height = drag.orig.type === "circle" ? drag.orig.r * 2 : drag.orig.h;
        const origin = clampOrigin(
          snapValue(drag.orig.x + dx, snapRef.current),
          snapValue(drag.orig.y + dy, snapRef.current),
          width,
          height,
          canvasRef.current,
        );
        return { ...shape, x: origin.x, y: origin.y };
      }
      return resizeShape(drag.orig, drag.handle, dx, dy, snapRef.current);
    }));
  }

  function endDrag() {
    if (dragRef.current.state !== "idle") dropEmptyHistory();
    dragRef.current = { state: "idle" };
  }

  function handlePropChange(partial) {
    if (!selectedIdRef.current) return;
    setShapes((prev) => prev.map((shape) => (
      shape.id === selectedIdRef.current ? { ...shape, ...partial } : shape
    )));
  }

  function beginInspectorEdit() {
    if (inspectorSession.current) return;
    inspectorSession.current = true;
    remember();
  }

  function endInspectorEdit(event) {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    inspectorSession.current = false;
    dropEmptyHistory();
  }

  function convert() {
    const next = toHtmlCss(canvasRef.current, shapesRef.current);
    setHtmlOut(next.html);
    setCssOut(next.css);
    setNotice("HTMLとCSSを更新しました");
  }

  async function copyText(text) {
    if (!text) {
      setNotice("コピーする内容がありません");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setNotice("コピーしました");
    } catch {
      setNotice("コピーに失敗しました");
    }
  }

  function download(name, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportJSON() {
    download("wireframe.json", JSON.stringify({ canvas, shapes }, null, 2), "application/json");
  }

  function importJSONFromFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      let parsed;
      try {
        parsed = JSON.parse(String(reader.result));
      } catch {
        setNotice("JSONの構文を読めませんでした");
        return;
      }
      const doc = normalizeDocument(parsed);
      if (!doc) {
        setNotice("canvas と shapes があるJSONを選んでください");
        return;
      }
      remember();
      applyDoc(doc);
      setNotice(`図形 ${doc.shapes.length} 件を読み込みました`);
    };
    reader.readAsText(file);
  }

  function clearAll() {
    if (!shapesRef.current.length) return;
    if (!window.confirm("キャンバス上の図形をすべて消します。")) return;
    remember();
    setShapes([]);
    setSelectedId(null);
  }

  const preview = htmlOut ? standaloneDocument(htmlOut, cssOut) : "";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <header className="flex items-baseline justify-between gap-3 px-3 pt-3">
        <h1 className="text-base font-semibold">smart-wireframe</h1>
        <p className="text-xs text-slate-500" role="status">{notice || "編集はブラウザに自動保存されます"}</p>
      </header>
      <div className="grid grid-cols-1 gap-3 p-3 xl:grid-cols-12">
        <div className="flex flex-col gap-3 xl:col-span-5">
          <Panel title="ワイヤーフレーム操作">
            <div className="flex flex-wrap items-center gap-2">
              <ToolButton active={tool === "select"} onClick={() => setTool("select")}>選択</ToolButton>
              {SHAPE_TYPES.map((item) => (
                <ToolButton key={item.key} active={tool === item.key} onClick={() => setTool(item.key)}>
                  {item.label}
                </ToolButton>
              ))}
              <div className="mx-2 hidden h-6 w-px bg-slate-300 sm:block" />
              <label className="text-sm">
                <input type="checkbox" className="mr-1" checked={showGrid} onChange={(event) => setShowGrid(event.target.checked)} />
                グリッド
              </label>
              <label className="text-sm">
                <input type="checkbox" className="mr-1" checked={snap} onChange={(event) => setSnap(event.target.checked)} />
                スナップ
              </label>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button type="button" className="btn" onClick={exportJSON}>エクスポート(JSON)</button>
              <label className="btn">
                インポート(JSON)
                <input
                  className="hidden"
                  type="file"
                  accept="application/json"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) importJSONFromFile(file);
                  }}
                />
              </label>
              <button type="button" className="btn" onClick={clearAll}>全消去</button>
              {selected && (
                <>
                  <button type="button" className="btn" onClick={() => bringForward(selected.id)}>前面へ</button>
                  <button type="button" className="btn" onClick={() => sendBackward(selected.id)}>背面へ</button>
                  <button type="button" className="btn" onClick={duplicate}>複製</button>
                  <button type="button" className="btn-danger" onClick={deleteSelected}>削除</button>
                </>
              )}
            </div>
            <div className="mt-3">
              <div className="mb-1 text-sm font-medium">重なり</div>
              <LayerList shapes={shapes} selectedId={selectedId} onSelect={setSelectedId} />
            </div>
          </Panel>

          <Panel title="キャンバス">
            <div className="mb-2 flex flex-wrap items-center gap-2" onFocus={beginInspectorEdit} onBlur={endInspectorEdit}>
              <label className="text-sm">幅</label>
              <input
                className="inp w-20"
                type="number"
                min={MIN_CANVAS}
                value={canvas.width}
                onChange={(event) => setCanvas((current) => ({
                  ...current,
                  width: Math.max(MIN_CANVAS, Number(event.target.value) || MIN_CANVAS),
                }))}
              />
              <label className="text-sm">高さ</label>
              <input
                className="inp w-20"
                type="number"
                min={MIN_CANVAS}
                value={canvas.height}
                onChange={(event) => setCanvas((current) => ({
                  ...current,
                  height: Math.max(MIN_CANVAS, Number(event.target.value) || MIN_CANVAS),
                }))}
              />
            </div>
            <div className="relative overflow-auto rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-800">
              <svg
                ref={svgRef}
                width={canvas.width}
                height={canvas.height}
                onPointerDown={onCanvasPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className="touch-none select-none rounded-xl border border-slate-300"
                style={{ cursor: tool === "select" ? "default" : "crosshair", backgroundColor: "#fff" }}
              >
                <rect width="100%" height="100%" fill="#ffffff" />
                {showGrid && (
                  <>
                    <defs>
                      <pattern id="wf-grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                        <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="#e5e7eb" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#wf-grid)" />
                  </>
                )}
                {shapes
                  .slice()
                  .sort((a, b) => (a.z || 0) - (b.z || 0))
                  .map((shape) => (
                    <Shape
                      key={shape.id}
                      shape={shape}
                      selected={shape.id === selectedId && tool === "select"}
                      onPointerDown={tool === "select" ? (event) => startGesture(event, shape, "drag") : undefined}
                      onStartResize={(event, handle) => startGesture(event, shape, "resize", handle)}
                    />
                  ))}
              </svg>
            </div>
            <div className="mt-3" onFocus={beginInspectorEdit} onBlur={endInspectorEdit}>
              <ShapeInspector shape={selected} onChange={handlePropChange} onDelete={deleteSelected} />
            </div>
          </Panel>
        </div>

        <div className="flex items-center justify-center xl:col-span-2">
          <div className="flex flex-col gap-3">
            <button type="button" className="btn-primary px-6 py-3 text-lg" onClick={convert}>
              ▶ ワイヤーフレームのHTML/CSS化
            </button>
            <p className="text-xs text-slate-500">右のソースとプレビューを更新します。図形を変えたあとは、もう一度押します。</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:col-span-5">
          <Panel title="プレビュー">
            {preview ? (
              <iframe
                title="生成したワイヤーフレームのプレビュー"
                sandbox=""
                srcDoc={preview}
                className="w-full rounded-xl border border-slate-300 bg-white"
                style={{ height: Math.min(canvas.height + 8, 640) }}
              />
            ) : (
              <p className="text-sm text-slate-500">変換ボタンで生成されます。</p>
            )}
          </Panel>
          <Panel title="ソース(HTML)">
            <div className="mb-2 flex flex-wrap gap-2">
              <button type="button" className="btn" onClick={() => copyText(htmlOut)}>コピー</button>
              <button
                type="button"
                className="btn"
                onClick={() => download("wireframe.html", standaloneDocument(htmlOut, cssOut), "text/html")}
              >
                HTMLをダウンロード
              </button>
            </div>
            <textarea className="codebox" value={htmlOut} onChange={(event) => setHtmlOut(event.target.value)} placeholder="変換ボタンで生成されます" />
          </Panel>
          <Panel title="ソース(CSS)">
            <div className="mb-2 flex flex-wrap gap-2">
              <button type="button" className="btn" onClick={() => copyText(cssOut)}>コピー</button>
              <button type="button" className="btn" onClick={() => download("wireframe.css", cssOut, "text/css")}>CSSをダウンロード</button>
            </div>
            <textarea className="codebox" value={cssOut} onChange={(event) => setCssOut(event.target.value)} placeholder="変換ボタンで生成されます" />
          </Panel>
        </div>
      </div>
      <footer className="px-4 pb-3 text-xs text-slate-500">
        図形ツールを選んでキャンバスをクリックすると、その位置に追加されます。Delete で削除、⌘Z で元に戻します。
      </footer>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function ToolButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`rounded-xl border px-3 py-1 text-sm ${active
        ? "border-slate-900 bg-slate-900 text-white"
        : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-700"}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function LayerList({ shapes, selectedId, onSelect }) {
  const layers = shapes.slice().sort((a, b) => (b.z || 0) - (a.z || 0));
  if (!layers.length) return <p className="text-sm text-slate-500">図形はまだありません。</p>;
  return (
    <ul className="flex max-h-40 flex-col gap-1 overflow-auto">
      {layers.map((shape) => (
        <li key={shape.id}>
          <button
            type="button"
            className={`w-full rounded-lg px-2 py-1 text-left text-sm ${shape.id === selectedId ? "bg-slate-900 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-700"}`}
            onClick={() => onSelect(shape.id)}
          >
            {labelOf(shape.type)}{shape.text ? `「${shape.text}」` : ""}
          </button>
        </li>
      ))}
    </ul>
  );
}

function Shape({ shape, selected, onPointerDown, onStartResize }) {
  if (shape.type === "circle") {
    const radius = shape.r || MIN_RADIUS;
    const cx = shape.x + radius;
    const cy = shape.y + radius;
    return (
      <g onPointerDown={onPointerDown} style={{ cursor: "move" }}>
        <circle cx={cx} cy={cy} r={radius} fill={shape.fill} stroke={shape.stroke || "#0f172a"} />
        {selected && (
          <g>
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#22c55e" strokeDasharray="4 3" />
            <Handle x={cx + radius} y={cy} pos="e" onResize={onStartResize} />
          </g>
        )}
      </g>
    );
  }

  const { x, y, w, h } = shape;
  const rx = shape.rx ?? (shape.type === "button" ? 10 : shape.type === "text" ? 6 : 8);
  return (
    <g onPointerDown={onPointerDown} style={{ cursor: "move" }}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={rx}
        fill={shape.type === "text" ? (shape.background || "#ffffff") : shape.fill}
        stroke={shape.stroke || "#0f172a"}
      />
      {(shape.type === "text" || shape.type === "button") && (
        <foreignObject x={x} y={y} width={w} height={h} style={{ pointerEvents: "none" }}>
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            style={{
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: shape.type === "button" ? "center" : "flex-start",
              width: "100%",
              height: "100%",
              padding: shape.type === "text" ? "4px 6px" : 0,
              overflow: "hidden",
              color: shape.type === "button" ? (shape.color || "#ffffff") : shape.fill,
              fontSize: shape.fontSize || (shape.type === "button" ? 16 : 20),
              fontFamily: FONT_FAMILY,
            }}
          >
            {shape.text || (shape.type === "button" ? "ボタン" : "テキスト")}
          </div>
        </foreignObject>
      )}
      {selected && (
        <g>
          <rect x={x} y={y} width={w} height={h} fill="none" stroke="#22c55e" strokeDasharray="4 3" />
          <Handle x={x} y={y} pos="nw" onResize={onStartResize} />
          <Handle x={x + w / 2} y={y} pos="n" onResize={onStartResize} />
          <Handle x={x + w} y={y} pos="ne" onResize={onStartResize} />
          <Handle x={x + w} y={y + h / 2} pos="e" onResize={onStartResize} />
          <Handle x={x + w} y={y + h} pos="se" onResize={onStartResize} />
          <Handle x={x + w / 2} y={y + h} pos="s" onResize={onStartResize} />
          <Handle x={x} y={y + h} pos="sw" onResize={onStartResize} />
          <Handle x={x} y={y + h / 2} pos="w" onResize={onStartResize} />
        </g>
      )}
    </g>
  );
}

function Handle({ x, y, pos, onResize }) {
  const cursor = {
    n: "ns-resize",
    s: "ns-resize",
    e: "ew-resize",
    w: "ew-resize",
    nw: "nwse-resize",
    se: "nwse-resize",
    ne: "nesw-resize",
    sw: "nesw-resize",
  }[pos];
  return (
    <rect
      x={x - 4}
      y={y - 4}
      width={8}
      height={8}
      rx={2}
      fill="#22c55e"
      stroke="#064e3b"
      style={{ cursor }}
      onPointerDown={(event) => onResize(event, pos)}
    />
  );
}

function ShapeInspector({ shape, onChange, onDelete }) {
  if (!shape) return <p className="text-sm text-slate-500">図形を選択するとプロパティが表示されます。</p>;
  const number = (key, min) => (event) => {
    const value = Number(event.target.value);
    if (!Number.isFinite(value)) return;
    onChange({ [key]: Math.max(min, value) });
  };
  return (
    <div>
      <div className="mb-2 text-sm font-medium">選択中: {labelOf(shape.type)}</div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="X"><input className="inp" type="number" value={shape.x} onChange={(event) => onChange({ x: Number(event.target.value) || 0 })} /></Field>
        <Field label="Y"><input className="inp" type="number" value={shape.y} onChange={(event) => onChange({ y: Number(event.target.value) || 0 })} /></Field>
        {shape.type === "circle" ? (
          <Field label="半径"><input className="inp" type="number" min={MIN_RADIUS} value={shape.r} onChange={number("r", MIN_RADIUS)} /></Field>
        ) : (
          <>
            <Field label="幅"><input className="inp" type="number" min={MIN_BOX} value={shape.w} onChange={number("w", MIN_BOX)} /></Field>
            <Field label="高さ"><input className="inp" type="number" min={MIN_BOX} value={shape.h} onChange={number("h", MIN_BOX)} /></Field>
          </>
        )}
        <Field label={shape.type === "text" ? "文字色" : "塗り"}>
          <input className="inp" type="color" value={shape.fill} onChange={(event) => onChange({ fill: event.target.value })} />
        </Field>
        <Field label="枠線">
          <input className="inp" type="color" value={shape.stroke || "#0f172a"} onChange={(event) => onChange({ stroke: event.target.value })} />
        </Field>
        {shape.type === "text" && (
          <Field label="背景">
            <input className="inp" type="color" value={shape.background || "#ffffff"} onChange={(event) => onChange({ background: event.target.value })} />
          </Field>
        )}
        {shape.type === "button" && (
          <Field label="文字色">
            <input className="inp" type="color" value={shape.color || "#ffffff"} onChange={(event) => onChange({ color: event.target.value })} />
          </Field>
        )}
        {shape.type !== "circle" && (
          <Field label="角丸">
            <input className="inp" type="number" min="0" value={shape.rx || 0} onChange={number("rx", 0)} />
          </Field>
        )}
      </div>
      {(shape.type === "text" || shape.type === "button") && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Field label="テキスト">
            <input className="inp" type="text" value={shape.text || ""} onChange={(event) => onChange({ text: event.target.value })} />
          </Field>
          <Field label="文字サイズ">
            <input className="inp" type="number" min="8" value={shape.fontSize || 16} onChange={number("fontSize", 8)} />
          </Field>
        </div>
      )}
      <div className="mt-3">
        <button type="button" className="btn-danger" onClick={onDelete}>削除</button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <>
      <span className="lbl">{label}</span>
      {children}
    </>
  );
}
