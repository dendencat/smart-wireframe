import React, { useEffect, useMemo, useRef, useState } from "react";

// シングルファイル React コンポーネント
// 要件:
// - 左: ワイヤーフレーム操作（図形追加/選択/移動/拡大縮小/色変更/削除、JSONエクスポート/インポート）
// - 中央: 変換ボタン（HTML/CSS 化）
// - 右: ソース表示（HTML/CSS、コピー/ダウンロード）
// - 追加: グリッド/スナップ、前面/背面、テキスト編集、キャンバスサイズ変更
// 依存: TailwindCSS 前提（ChatGPT Canvas では不要なimport）

const CANVAS_DEFAULT = { width: 900, height: 600 };
const GRID_SIZE = 10;

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const SHAPE_TYPES = [
  { key: "rect", label: "長方形" },
  { key: "circle", label: "円" },
  { key: "text", label: "テキスト" },
  { key: "button", label: "ボタン" },
];

export default function WireframeBuilder() {
  const [canvas, setCanvas] = useState(CANVAS_DEFAULT);
  const [shapes, setShapes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tool, setTool] = useState("select");
  const [showGrid, setShowGrid] = useState(true);
  const [snap, setSnap] = useState(true);
  const [htmlOut, setHtmlOut] = useState("");
  const [cssOut, setCssOut] = useState("");

  const svgRef = useRef(null);
  const dragRef = useRef({ state: "idle" });

  const selected = useMemo(
    () => shapes.find((s) => s.id === selectedId) || null,
    [shapes, selectedId]
  );

  function addShape(type) {
    const id = uid();
    const base = { id, type, x: 40, y: 40, fill: "#94a3b8", stroke: "#0f172a", z: Date.now() };
    let shape;
    if (type === "rect") shape = { ...base, w: 200, h: 120, rx: 8 };
    if (type === "circle") shape = { ...base, r: 60 };
    if (type === "text") shape = { ...base, w: 240, h: 40, text: "見出し", fontSize: 20, fill: "#111827" };
    if (type === "button") shape = { ...base, w: 160, h: 44, rx: 10, text: "ボタン", fontSize: 16, fill: "#2563eb" };
    setShapes((prev) => [...prev, shape]);
    setSelectedId(id);
    setTool("select");
  }

  function bringForward(id) {
    setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, z: Date.now() } : s)).sort((a, b) => a.z - b.z));
  }
  function sendBackward(id) {
    const minZ = Math.min(...shapes.map((s) => s.z || 0), Date.now());
    setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, z: minZ - 1 } : s)).sort((a, b) => a.z - b.z));
  }

  function deleteSelected() {
    if (!selectedId) return;
    setShapes((prev) => prev.filter((s) => s.id !== selectedId));
    setSelectedId(null);
  }

  function snapVal(v) {
    return snap ? Math.round(v / GRID_SIZE) * GRID_SIZE : v;
  }

  function onSvgMouseDown(e) {
    if (tool !== "select") {
      // キャンバスクリックで新規追加（ドラッグで追加は未実装、簡素化）
      addShape(tool);
      return;
    }
    // 空白クリックで選択解除
    if (e.target === svgRef.current) setSelectedId(null);
  }

  // 形状のドラッグ / リサイズ
  function startDragShape(e, shp) {
    e.stopPropagation();
    setSelectedId(shp.id);
    dragRef.current = {
      state: "drag",
      id: shp.id,
      startX: e.clientX,
      startY: e.clientY,
      orig: { ...shp },
    };
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", stopDrag);
  }

  function startResize(e, shp, handle) {
    e.stopPropagation();
    setSelectedId(shp.id);
    dragRef.current = {
      state: "resize",
      id: shp.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      orig: { ...shp },
    };
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", stopDrag);
  }

  function onDrag(e) {
    const d = dragRef.current;
    if (d.state === "idle") return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    setShapes((prev) => {
      const idx = prev.findIndex((s) => s.id === d.id);
      if (idx < 0) return prev;
      const shp = { ...prev[idx] };

      if (d.state === "drag") {
        if (shp.type === "circle") {
          shp.x = snapVal((d.orig.x ?? 40) + dx);
          shp.y = snapVal((d.orig.y ?? 40) + dy);
        } else {
          shp.x = snapVal((d.orig.x ?? 40) + dx);
          shp.y = snapVal((d.orig.y ?? 40) + dy);
        }
      } else if (d.state === "resize") {
        // rect/button/text: ハンドル毎に w/h/x/y を更新
        if (shp.type === "rect" || shp.type === "button" || shp.type === "text") {
          let { x, y, w, h } = d.orig;
          if (d.handle.includes("e")) w = Math.max(20, snapVal(d.orig.w + dx));
          if (d.handle.includes("s")) h = Math.max(20, snapVal(d.orig.h + dy));
          if (d.handle.includes("w")) {
            const nx = snapVal(d.orig.x + dx);
            w = Math.max(20, d.orig.w - (nx - d.orig.x));
            x = nx;
          }
          if (d.handle.includes("n")) {
            const ny = snapVal(d.orig.y + dy);
            h = Math.max(20, d.orig.h - (ny - d.orig.y));
            y = ny;
          }
          shp.x = x; shp.y = y; shp.w = w; shp.h = h;
        } else if (shp.type === "circle") {
          const r = Math.max(10, snapVal((d.orig.r ?? 40) + Math.max(dx, dy)));
          shp.r = r;
        }
      }

      const next = [...prev];
      next[idx] = shp;
      return next;
    });
  }

  function stopDrag() {
    dragRef.current = { state: "idle" };
    window.removeEventListener("mousemove", onDrag);
    window.removeEventListener("mouseup", stopDrag);
  }

  function handlePropChange(partial) {
    if (!selected) return;
    setShapes((prev) => prev.map((s) => (s.id === selected.id ? { ...s, ...partial } : s)));
  }

  // 変換: ワイヤーフレームを HTML/CSS に落とす
  function toHtmlCss() {
    const containerClass = "wf-container";
    const html = [
      `<div class="${containerClass}">`,
      ...shapes
        .sort((a, b) => (a.z || 0) - (b.z || 0))
        .map((s) => shapeToHtml(s))
        .flat(),
      `</div>`,
    ].join("\n");

    const css = `/* 生成 CSS: 必要最低限。サイズはコンテナに合わせ固定 */\n.${containerClass}{\n  position:relative;\n  width:${canvas.width}px;\n  height:${canvas.height}px;\n  background:#ffffff;\n  border:1px solid #e5e7eb;\n}\n.wf-abs{position:absolute; box-sizing:border-box;}\n.wf-rect{border:1px solid #0f172a; border-radius:8px;}\n.wf-button{display:flex; align-items:center; justify-content:center; border-radius:10px; font-family:system-ui, -apple-system, Segoe UI, Roboto, Noto Sans JP, sans-serif; color:#fff;}\n.wf-text{font-family:system-ui, -apple-system, Segoe UI, Roboto, Noto Sans JP, sans-serif; display:flex; align-items:center; padding:4px 6px;}\n`;

    setHtmlOut(html);
    setCssOut(css);
  }

  function shapeToHtml(s) {
    if (s.type === "rect") {
      return `<div class="wf-abs wf-rect" style="left:${s.x}px;top:${s.y}px;width:${s.w}px;height:${s.h}px;background:${s.fill}"></div>`;
    }
    if (s.type === "button") {
      return `<div class="wf-abs wf-button" style="left:${s.x}px;top:${s.y}px;width:${s.w}px;height:${s.h}px;background:${s.fill};font-size:${s.fontSize || 16}px">${escapeHtml(s.text || "ボタン")}</div>`;
    }
    if (s.type === "text") {
      return `<div class="wf-abs wf-text" style="left:${s.x}px;top:${s.y}px;width:${s.w}px;height:${s.h}px;color:${s.fill};font-size:${s.fontSize || 18}px">${escapeHtml(s.text || "テキスト")}</div>`;
    }
    if (s.type === "circle") {
      // CSSで丸: width/height=2r, border-radius:50%
      const d = (s.r || 40) * 2;
      return `<div class="wf-abs" style="left:${s.x}px;top:${s.y}px;width:${d}px;height:${d}px;background:${s.fill};border:1px solid #0f172a;border-radius:50%"></div>`;
    }
    return "";
  }

  // ユーティリティ: クリップボード/ダウンロード/JSON
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); alert("コピーしました"); } catch (e) { alert("コピーに失敗しました"); }
  }
  function download(name, content) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }
  function exportJSON() {
    const data = { canvas, shapes };
    download("wireframe.json", JSON.stringify(data, null, 2));
  }
  function importJSONFromFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result);
        if (obj.canvas && obj.shapes) {
          setCanvas(obj.canvas);
          setShapes(Array.isArray(obj.shapes) ? obj.shapes : []);
          setSelectedId(null);
        } else alert("不正なJSONです");
      } catch (e) { alert("読み込みに失敗しました"); }
    };
    reader.readAsText(file);
  }

  // レンダリング: 左(エディタ) 中央(変換) 右(ソース)
  return (
    <div className="w-full h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="h-full grid grid-cols-12 gap-3 p-3">
        {/* 左: ワイヤーフレーム操作 */}
        <div className="col-span-5 flex flex-col gap-3">
          <Panel title="ワイヤーフレーム操作">
            <div className="flex flex-wrap items-center gap-2">
              <ToolButton active={tool === "select"} onClick={() => setTool("select")}>
                選択
              </ToolButton>
              {SHAPE_TYPES.map((t) => (
                <ToolButton key={t.key} active={tool === t.key} onClick={() => setTool(t.key)}>
                  {t.label}
                </ToolButton>
              ))}
              <div className="mx-2 h-6 w-px bg-slate-300" />
              <label className="text-sm mr-2">グリッド</label>
              <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
              <label className="text-sm ml-3 mr-2">スナップ</label>
              <input type="checkbox" checked={snap} onChange={(e) => setSnap(e.target.checked)} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button className="btn" onClick={() => exportJSON()}>エクスポート(JSON)</button>
              <label className="btn">
                インポート(JSON)
                <input className="hidden" type="file" accept="application/json" onChange={(e) => e.target.files?.[0] && importJSONFromFile(e.target.files[0])} />
              </label>
              <button className="btn" onClick={() => { setShapes([]); setSelectedId(null); }}>全消去</button>
              {selected && (
                <>
                  <button className="btn" onClick={() => bringForward(selected.id)}>前面へ</button>
                  <button className="btn" onClick={() => sendBackward(selected.id)}>背面へ</button>
                  <button className="btn-danger" onClick={deleteSelected}>削除</button>
                </>
              )}
            </div>
          </Panel>

          <Panel title="キャンバス">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <label className="text-sm">幅</label>
              <input className="inp w-20" type="number" value={canvas.width}
                     onChange={(e) => setCanvas((c) => ({ ...c, width: Math.max(200, +e.target.value || 200) }))} />
              <label className="text-sm">高さ</label>
              <input className="inp w-20" type="number" value={canvas.height}
                     onChange={(e) => setCanvas((c) => ({ ...c, height: Math.max(200, +e.target.value || 200) }))} />
            </div>

            <div className="relative overflow-auto rounded-2xl shadow-sm bg-white dark:bg-slate-800 p-3">
              <svg
                ref={svgRef}
                width={canvas.width}
                height={canvas.height}
                onMouseDown={onSvgMouseDown}
                className="border border-slate-300 rounded-xl select-none touch-none"
                style={{ backgroundImage: showGrid ? gridBg(GRID_SIZE) : "none", backgroundColor: "#fff" }}
              >
                {shapes
                  .slice()
                  .sort((a, b) => (a.z || 0) - (b.z || 0))
                  .map((s) => (
                    <Shape key={s.id} s={s} selected={s.id === selectedId}
                      onMouseDown={(e) => startDragShape(e, s)}
                      onStartResize={startResize}
                    />
                  ))}
              </svg>
            </div>

            <div className="mt-3">
              <ShapeInspector shape={selected} onChange={handlePropChange} onDelete={deleteSelected} />
            </div>
          </Panel>
        </div>

        {/* 中央: 変換ボタン */}
        <div className="col-span-2 flex items-center justify-center">
          <div className="flex flex-col gap-3">
            <button className="btn-primary text-lg py-3 px-6" onClick={toHtmlCss}>▶ ワイヤーフレームのHTML/CSS化</button>
            <div className="text-xs text-slate-500">
              右ペインにHTML/CSSが生成されます。
            </div>
          </div>
        </div>

        {/* 右: ソース表示 */}
        <div className="col-span-5 flex flex-col gap-3">
          <Panel title="ソース(HTML)">
            <div className="flex gap-2 mb-2">
              <button className="btn" onClick={() => copyText(htmlOut)}>コピー</button>
              <button className="btn" onClick={() => download("wireframe.html", htmlOut)}>ダウンロード</button>
            </div>
            <textarea className="codebox" value={htmlOut} onChange={(e) => setHtmlOut(e.target.value)} placeholder="変換ボタンで生成されます" />
          </Panel>
          <Panel title="ソース(CSS)">
            <div className="flex gap-2 mb-2">
              <button className="btn" onClick={() => copyText(cssOut)}>コピー</button>
              <button className="btn" onClick={() => download("wireframe.css", cssOut)}>ダウンロード</button>
            </div>
            <textarea className="codebox" value={cssOut} onChange={(e) => setCssOut(e.target.value)} placeholder="変換ボタンで生成されます" />
          </Panel>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-3 text-xs text-slate-500 flex gap-3">
        <span>ヒント: キャンバスで図形をドラッグして移動。角ハンドルでサイズ変更。テキスト/ボタンはインスペクタで編集。</span>
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-sm">
      <div className="text-sm font-semibold mb-2">{title}</div>
      {children}
    </div>
  );
}

function ToolButton({ active, onClick, children }) {
  return (
    <button
      className={"px-3 py-1 rounded-xl border text-sm " +
        (active
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600")}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function gridBg(size) {
  const s = size;
  const c = encodeURIComponent(`#f1f5f9 1px, transparent 1px`);
  const url = `linear-gradient(90deg, ${decodeURIComponent(c)})`; // dummy
  // 実際は2本のグラデで格子にする
  return `linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)`;
}

function Shape({ s, selected, onMouseDown, onStartResize }) {
  const handleSize = 8;
  const handle = (x, y, pos) => (
    <rect x={x - handleSize / 2} y={y - handleSize / 2} width={handleSize} height={handleSize}
      fill="#22c55e" stroke="#064e3b" rx={2} className="cursor-nwse-resize"
      onMouseDown={(e) => onStartResize(e, s, pos)} />
  );

  if (s.type === "rect" || s.type === "button" || s.type === "text") {
    const { x, y, w, h } = s;
    const isButton = s.type === "button";
    const isText = s.type === "text";
    const rx = s.rx || (isButton ? 10 : 8);

    return (
      <g onMouseDown={onMouseDown} style={{ cursor: "move" }}>
        {/* shape */}
        {!isText ? (
          <rect x={x} y={y} width={w} height={h} rx={rx}
            fill={s.fill || "#94a3b8"} stroke="#0f172a" />
        ) : (
          <g>
            <rect x={x} y={y} width={w} height={h} rx={6} fill="#ffffff" stroke="#0f172a" />
            <text x={x + 8} y={y + h / 2 + (s.fontSize ? s.fontSize / 3 : 6)}
              fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Noto Sans JP, sans-serif"
              fontSize={s.fontSize || 20} fill={s.fill || "#111827"}>
              {s.text || "テキスト"}
            </text>
          </g>
        )}
        {isButton && (
          <text x={x + w / 2} y={y + h / 2 + (s.fontSize ? s.fontSize / 3 : 6)}
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Noto Sans JP, sans-serif"
            fontSize={s.fontSize || 16} fill="#ffffff">
            {s.text || "ボタン"}
          </text>
        )}
        {selected && (
          <g>
            <rect x={x} y={y} width={w} height={h} fill="none" stroke="#22c55e" strokeDasharray="4 3" />
            {/* 8 handles */}
            {handle(x, y, "nw")}
            {handle(x + w, y, "ne")}
            {handle(x, y + h, "sw")}
            {handle(x + w, y + h, "se")}
          </g>
        )}
      </g>
    );
  }

  if (s.type === "circle") {
    const d = (s.r || 40) * 2;
    const x = s.x + (s.r || 40);
    const y = s.y + (s.r || 40);
    return (
      <g onMouseDown={onMouseDown} style={{ cursor: "move" }}>
        <circle cx={x} cy={y} r={s.r || 40} fill={s.fill || "#94a3b8"} stroke="#0f172a" />
        {selected && (
          <g>
            <circle cx={x} cy={y} r={s.r || 40} fill="none" stroke="#22c55e" strokeDasharray="4 3" />
            {/* 半径リサイズ用ハンドル（東側） */}
            <rect x={x + (s.r || 40) - 4} y={y - 4} width={8} height={8} fill="#22c55e" stroke="#064e3b"
              className="cursor-ew-resize" onMouseDown={(e) => onStartResize(e, s, "e")} />
          </g>
        )}
      </g>
    );
  }

  return null;
}

function ShapeInspector({ shape, onChange, onDelete }) {
  if (!shape) return (
    <div className="text-sm text-slate-500">図形を選択するとプロパティが表示されます。</div>
  );

  const common = (
    <div className="grid grid-cols-2 gap-2">
      <label className="lbl">X</label>
      <input className="inp" type="number" value={shape.x || 0} onChange={(e) => onChange({ x: +e.target.value })} />
      <label className="lbl">Y</label>
      <input className="inp" type="number" value={shape.y || 0} onChange={(e) => onChange({ y: +e.target.value })} />
      {shape.type !== "circle" && (
        <>
          <label className="lbl">幅</label>
          <input className="inp" type="number" value={shape.w || 0} onChange={(e) => onChange({ w: Math.max(10, +e.target.value) })} />
          <label className="lbl">高さ</label>
          <input className="inp" type="number" value={shape.h || 0} onChange={(e) => onChange({ h: Math.max(10, +e.target.value) })} />
        </>
      )}
      {shape.type === "circle" && (
        <>
          <label className="lbl">半径</label>
          <input className="inp" type="number" value={shape.r || 40} onChange={(e) => onChange({ r: Math.max(10, +e.target.value) })} />
        </>
      )}
      <label className="lbl">色</label>
      <input className="inp" type="color" value={shape.fill || "#94a3b8"} onChange={(e) => onChange({ fill: e.target.value })} />
      {(shape.type === "rect" || shape.type === "button") && (
        <>
          <label className="lbl">角丸</label>
          <input className="inp" type="number" value={shape.rx || 8} onChange={(e) => onChange({ rx: Math.max(0, +e.target.value) })} />
        </>
      )}
    </div>
  );

  const textish = (shape.type === "text" || shape.type === "button") && (
    <div className="grid grid-cols-2 gap-2 mt-2">
      <label className="lbl">テキスト</label>
      <input className="inp col-span-1" type="text" value={shape.text || ""} onChange={(e) => onChange({ text: e.target.value })} />
      <label className="lbl">文字サイズ</label>
      <input className="inp" type="number" value={shape.fontSize || 16} onChange={(e) => onChange({ fontSize: Math.max(8, +e.target.value) })} />
    </div>
  );

  return (
    <div>
      <div className="mb-2 text-sm font-medium">選択中: {labelOf(shape.type)}</div>
      {common}
      {textish}
      <div className="mt-3 flex gap-2">
        <button className="btn" onClick={() => onChange({})}>適用</button>
        <button className="btn-danger" onClick={onDelete}>削除</button>
      </div>
    </div>
  );
}

function labelOf(type) {
  const m = { rect: "長方形", circle: "円", text: "テキスト", button: "ボタン" };
  return m[type] || type;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// 共通スタイル（Tailwindに加えて最低限のユーティリティ）
const style = document.createElement("style");
style.innerHTML = `
  .btn{ @apply px-3 py-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-sm; }
  .btn-primary{ @apply px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-black; }
  .btn-danger{ @apply px-3 py-1 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800; }
  .inp{ @apply px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm; }
  .lbl{ @apply text-sm self-center; }
  .codebox{ @apply w-full h-56 p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 font-mono text-xs; }
`;
if (typeof document !== "undefined") {
  try { document.head.appendChild(style); } catch {}
}
