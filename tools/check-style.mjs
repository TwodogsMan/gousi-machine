// tools/check-style.mjs — 赌场风格视觉的接线验证
//
// 用法：node tools/check-style.mjs
//
// 存在的理由：改 CSS 常量很容易「看起来改了」而渲染结果没变。
// 本工具断言材料层（毡布/桌沿/卡纸）、骰子点阵、花色语义、轮盘配色
// 真的落到了 DOM 与 canvas 上，并复查反 AI 味底线未被这轮换风格破掉。
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = (html.match(/<style>([\s\S]*)<\/style>/) || [, ""])[1];

let fails = 0;
const bad = m => { fails++; console.log("  [FAIL] " + m); };
const ok = m => console.log("  [PASS] " + m);

console.log("赌场风格接线验证\n" + "=".repeat(56));

/* ---------- 1. 材质层：毡布 / 桌沿 / 卡纸 ---------- */
const felt = /repeating-linear-gradient\(58deg/.test(css) && /repeating-linear-gradient\(-58deg/.test(css);
felt ? ok("毡布织纹：两层错位重复纹") : bad("毡布织纹缺失");

const rail = /box-shadow:inset 0 0 0 10px var\(--rail-blk\),inset 0 0 0 12px var\(--rail-red\)/.test(css);
rail ? ok("桌沿：红黑双线皮革护垫（inset 描边，非浮起阴影）") : bad("桌沿缺失");

const railPad = /main\.grid::after/.test(css) && /repeating-linear-gradient\(90deg/.test(css);
railPad ? ok("桌框：皮革压纹包边") : bad("桌框皮革压纹缺失");

const cardFace = /\.brief\{padding:0;background:var\(--card\);color:var\(--black\)\}/.test(css);
cardFace ? ok("构思卡：卡纸底 + 黑墨字（浅底反转）") : bad("卡纸面未实现");

/* ---------- 2. 骰子点阵：9 点 + data-face 规则必须齐 ---------- */
const pipRules = (css.match(/\.die\[data-face="[1-6]"\]/g) || []).length;
pipRules > 0 ? ok(`骰子点阵规则：${pipRules} 条 data-face 选择器`) : bad("骰子点阵规则缺失");
const gridArea = (css.match(/\.die i:nth-child\(\d\)\{grid-area:/g) || []).length;
gridArea === 9 ? ok("骰子 9 点全部定位（3×3 网格）") : bad(`骰子点位不完整：${gridArea}/9`);

/* ---------- 3. 扑克花色作为功能标识 ---------- */
const suits = ["♠", "♦", "◆", "×", "✓"];
suits.forEach(s => {
  if (!html.includes(s)) bad("缺少花色/符号标识: " + s);
});
if (html.includes("♠") && html.includes("♦") && css.includes('content:"◆"')) {
  ok("花色语义：♠ 洗牌 · ♦ 压注 · ◆ 分区 · × 雷区 · ✓ 成立");
}

/* ---------- 4. 渲染函数真的输出了骰子 DOM ---------- */
let code = (html.match(/<script>([\s\S]*)<\/script>/) || [, ""])[1].replace(/\nboot\(\);\s*$/, "\n;");
code += "\nglobalThis.__api={renderSlots,SLOT_DEFS};";
const ctx2d = new Proxy({}, { get: (t, p) => (p === "canvas" ? {} : () => {}) });
const store = { slots: "" };
const mk = (id) => ({
  style: {}, dataset: {}, classList: { add(){}, remove(){}, toggle(){}, contains(){ return false } },
  children: [], value: "", textContent: "", appendChild(c){ return c }, removeChild(){}, remove(){},
  addEventListener(){}, removeEventListener(){}, querySelector(){ return mk() }, querySelectorAll(){ return [] },
  closest(){ return mk() }, focus(){}, select(){}, click(){}, getContext(){ return ctx2d },
  offsetWidth: 100, offsetLeft: 0, width: 900, height: 900,
  set innerHTML(v){ if (this.__id === "#slots") store.slots = v; }, get innerHTML(){ return ""; },
});
const sb = {
  console,
  document: {
    createElement: () => mk(),
    querySelector: (sel) => { const e = mk(); e.__id = sel; return e; },
    querySelectorAll: () => [], body: mk(), execCommand(){ return true }, addEventListener(){},
  },
  window: { addEventListener(){} }, navigator: { clipboard: null },
  localStorage: { getItem(){ return null }, setItem(){}, removeItem(){} },
  performance: { now: () => Date.now() }, requestAnimationFrame(){}, setTimeout(){}, clearTimeout(){},
  setInterval(){ return 0 }, clearInterval(){}, confirm: () => true,
  Blob: class {}, URL: { createObjectURL(){ return "" }, revokeObjectURL(){} },
};
sb.globalThis = sb;
vm.createContext(sb);
vm.runInContext(code, sb, { filename: "x.js" });
sb.__api.renderSlots();

const diceCount = (store.slots.match(/class="die"/g) || []).length;
diceCount === 8 ? ok("renderSlots 输出 8 个骰子") : bad(`骰子数量异常：${diceCount}/8`);
const pipCount = (store.slots.match(/<i><\/i>/g) || []).length;
pipCount === 72 ? ok("共 72 个骰点（8×9）") : bad(`骰点数量异常：${pipCount}/72`);
const faces = [...store.slots.matchAll(/data-face="(\d)"/g)].map(m => m[1]);
const facesOk = faces.length === 8 && faces.every(f => +f >= 1 && +f <= 6) && new Set(faces).size >= 6;
facesOk ? ok(`骰面分布：${faces.join(",")}（1-6 全覆盖）`) : bad("骰面分布异常: " + faces.join(","));
const oldLabels = /data-act="one"[^>]*>R</.test(store.slots) || /data-act="lock"[^>]*>L</.test(store.slots);
!oldLabels ? ok("旧 R/L 字母按钮已换成花色 ♠/♦") : bad("旧 R/L 按钮残留");

/* ---------- 5. 轮盘配色必须来自常量（canvas 无法用 CSS 变量）---------- */
const wheelConsts = [...(html.match(/const WHEEL_[A-Z]+\s*=\s*"#[0-9A-Fa-f]{6}"/g) || [])];
wheelConsts.length >= 5 ? ok(`轮盘配色常量化：${wheelConsts.length} 个 WHEEL_*`) : bad("轮盘配色未常量化");
const rouletteRed = /WHEEL_RED\s*=\s*"#C8102E"/.test(html) && /fillStyle = i%2 \? WHEEL_RED : WHEEL_BLACK/.test(html);
rouletteRed ? ok("轮盘红黑格：i%2 交替填充") : bad("轮盘红黑格未实现");
const brassRing = /ctx\.arc\(cx,cy,R-10,0,Math\.PI\*2\); ctx\.stroke\(\)/.test(css.replace(/\s+/g," ")) || /WHEEL_BRASS/.test(html);
brassRing ? ok("轮盘黄铜外圈") : bad("黄铜外圈缺失");

/* ---------- 6. 反 AI 味底线仍守住 ---------- */
const radius = (css.match(/border-radius\s*:\s*(?!0\b|50%)\d+px/g) || []);
radius.length === 0 ? ok("圆角仍为 0（赌场风格没有偷偷加圆角）") : bad("出现非 0 圆角: " + radius.join(","));
const artGrad = (css.match(/\b(?!repeating-)(?:linear|radial|conic)-gradient\([^)]*\)/g) || [])
  .filter(c => (c.match(/#[0-9a-f]{6}/gi) || []).length >= 2);
artGrad.length === 0 ? ok("无美术渐变（金渐变是赌场风格最容易翻车处，未使用）") : bad("美术渐变: " + artGrad.join(" | "));

console.log("=".repeat(56));
console.log(fails ? `结果: ${fails} 项未通过` : "结果: 全部通过（材料层 / 骰子 / 花色 / 轮盘 / 底线）");
process.exit(fails ? 1 : 0);
