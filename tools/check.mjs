// tools/check.mjs — 项目自带验证工具
//
// 用法：node tools/check.mjs
//
// 它是 DESIGN.md「附：项目专属须知」验收清单与 index.html 逻辑回归的可执行版本。
// 改完 UI 后必须跑，14/14 全通过才算完成。（通用反 AI 味规则见全局 ~/.dsh/AGENTS.md）
//
// 设计原则：只读、不修改任何文件；把文档里的承诺变成可执行的断言，
//           避免「不许有 AI 味」这类约束随时间退化成口号。
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = (html.match(/<style>([\s\S]*)<\/style>/) || [, ""])[1];
const js = (html.match(/<script>([\s\S]*)<\/script>/) || [, ""])[1];
const body = html.replace(/<style>[\s\S]*?<\/style>/, "").replace(/<script>[\s\S]*?<\/script>/, "");

// 允许出现在 JS 里的 canvas 配色（必须与 CSS token 同源 + 最多 3 个自定色）
const TOKEN_COLORS = ["#00FF41", "#FF0080", "#00FFFF", "#FFB000", "#FF3B30"];

const results = [];
const check = (name, pass, detail) => results.push({ name, pass, detail });

/* ---------- CSS 层：反 AI 味红线 ---------- */

/* 1. 圆角只能 0 或圆形几何 */
const radii = css.match(/border-radius\s*:\s*[^;]+/g) || [];
const badRadii = radii.filter(r => !/:\s*(0|0px|50%)\b/.test(r.replace(/\s+/g, " ")) && !/50%/.test(r));
check("圆角仅 0 / 圆形几何", badRadii.length === 0, badRadii.join(" | ") || `共 ${radii.length} 处全部合规`);

/* 2. 美术渐变：非 repeating + 至少两个不同色点才算违规 */
const gradCalls = css.match(/\b(?!repeating-)(?:linear|radial|conic)-gradient\([^)]*\)/g) || [];
const artGrad = gradCalls.filter(c => (c.match(/#[0-9a-f]{6}/gi) || []).length >= 2);
check("无美术渐变", artGrad.length === 0, artGrad.join(" | ") || `${gradCalls.length} 处质感渐变已豁免`);

/* 3. backdrop-filter = 0 */
const bf = css.match(/backdrop-filter/g) || [];
check("backdrop-filter 为 0", bf.length === 0, `${bf.length} 处`);

/* 4. emoji 图标 = 0（用终端字形代替）*/
const emoji = body.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu) || [];
check("无 emoji 图标", emoji.length === 0, [...new Set(emoji)].join("") || "0 个");

/* 5. 无浮起式阴影（大 blur + rgba 模拟卡片浮起）*/
const shadows = css.match(/box-shadow\s*:\s*[^;]+/g) || [];
const floaty = shadows.filter(s => /\b([1-9]\d)px\b/.test(s) && /rgba?\(/.test(s) && !/0 0 0 1px/.test(s));
check("无浮起式阴影", floaty.length === 0, floaty.join(" | ") || `${shadows.length} 处均为描边/霓虹`);

/* 6. CSS 里 :root 之外不得有硬编码色 */
const rootBlock = (css.match(/:root\s*\{[\s\S]*?\}/) || [""])[0];
const strayHex = css.replace(rootBlock, "").match(/#[0-9a-fA-F]{3,8}\b/g) || [];
check("CSS 无 :root 外的硬编码色", strayHex.length === 0, [...new Set(strayHex)].join(" ") || "0 处");

/* 7. canvas 配色与 token 同源 */
const wc = (js.match(/WHEEL_COLORS\s*=\s*\[[^\]]*\]/) || [""])[0];
const wcHex = (wc.match(/#[0-9A-Fa-f]{6}/g) || []).map(s => s.toUpperCase());
const extra = wcHex.filter(h => !TOKEN_COLORS.includes(h));
check("canvas 配色与 token 同源",
  TOKEN_COLORS.every(t => wcHex.includes(t)) && extra.length <= 3,
  `token 全含=${TOKEN_COLORS.every(t => wcHex.includes(t))}, 自定色 ${extra.length} 个: ${extra.join(",") || "无"}`);

/* 8. focus-visible 态 */
check("有 focus-visible 态", /:focus-visible/.test(css), /:focus-visible/.test(css) ? "已定义" : "缺失");

/* 9. prefers-reduced-motion 降级 */
check("有 reduced-motion 降级", /prefers-reduced-motion/.test(css), /prefers-reduced-motion/.test(css) ? "已定义" : "缺失");

/* 10. 零外链资源（离线可用的硬约束）*/
const ext = [...html.matchAll(/(?:src|href)\s*=\s*["'](?:https?:)?\/\//g)];
check("零外链资源", ext.length === 0, ext.length ? `${ext.length} 处` : "0 处");

/* 11. 移动端断点 */
const bps = [...new Set((css.match(/@media[^{]+/g) || []).map(s => s.trim()))];
check("含移动端断点", bps.some(b => /900px/.test(b)), bps.join(" / "));

/* 12. 骨架以 1px 分隔线为主，而非卡片网格 */
const panelish = (css.match(/border(?:-top|-bottom|-left|-right)?\s*:\s*1px solid var\(--line/g) || []).length;
check("骨架以 1px 分隔线为主", panelish >= 12, `${panelish} 处 1px 分隔线`);

/* ---------- JS 层：逻辑回归 ---------- */
const ctx2d = new Proxy({}, { get: (t, p) => (p === "canvas" ? {} : () => {}) });
const mk = () => ({
  style: {}, dataset: {}, classList: { add(){}, remove(){}, toggle(){}, contains(){ return false } },
  children: [], value: "", textContent: "", innerHTML: "", appendChild(c){ return c }, removeChild(){}, remove(){},
  addEventListener(){}, removeEventListener(){}, querySelector(){ return mk() }, querySelectorAll(){ return [] },
  closest(){ return mk() }, focus(){}, select(){}, click(){}, getContext(){ return ctx2d },
  offsetWidth: 100, offsetLeft: 0, width: 900, height: 900,
});
let logic = js.replace(/\nboot\(\);\s*$/, "\n;") + "\nglobalThis.__api={newRoll,buildBrief,drawOne,state};";
const sb = {
  console,
  document: { createElement: mk, querySelector: mk, querySelectorAll: () => [], body: mk(), execCommand(){ return true }, addEventListener(){} },
  window: { addEventListener(){} }, navigator: { clipboard: null },
  localStorage: { getItem(){ return null }, setItem(){}, removeItem(){} },
  performance: { now: () => Date.now() }, requestAnimationFrame(){}, setTimeout(){}, clearTimeout(){},
  setInterval(){ return 0 }, clearInterval(){}, confirm: () => true,
  Blob: class {}, URL: { createObjectURL(){ return "" }, revokeObjectURL(){} },
};
sb.globalThis = sb;
vm.createContext(sb);
vm.runInContext(logic, sb, { filename: "index.html<script>" });

const CARDS = 3000;
let dirty = 0;
const seen = new Set();
for (let i = 0; i < CARDS; i++) {
  const c = sb.__api.newRoll(true);
  const b = sb.__api.buildBrief(c);
  const all = [b.codename, b.pitch, ...b.core, ...b.rules, ...b.mvp, ...b.ext,
               ...b.bonus, ...b.avoid, ...b.success, ...b.questions, ...b.steps, ...b.names];
  if (all.some(t => t === undefined || t === null || String(t).trim() === "" || /undefined|NaN|\[object/.test(String(t)))) dirty++;
  if (new Set(b.names).size !== 3) dirty++;
  if (b.core.length !== 3 || b.mvp.length !== 3 || b.steps.length !== 5) dirty++;
  seen.add(b.pitch);
}
check(`逻辑回归 ${CARDS} 张卡`, dirty === 0, dirty ? `${dirty} 张异常` : `0 异常, 唯一一句话 ${seen.size} 种`);

/* 锁定语义：锁住的格子必须保留 */
let lockFails = 0;
for (let i = 0; i < 200; i++) {
  const a = sb.__api.newRoll(true);
  sb.__api.state.locks = { theme: true, mech: false, form: true, rule: false, aud: false, twist: false, vibe: false, scope: false };
  sb.__api.state.current = a;
  const b = sb.__api.newRoll(false);
  if (b.theme[0] !== a.theme[0] || b.form[0] !== a.form[0]) lockFails++;
}
check("锁定语义正确", lockFails === 0, lockFails ? `${lockFails} 次锁定被破坏` : "锁定格保持不变");

/* ---------- 一致性：工具名不得漂移 ---------- */
const NAME = "狗屎机", OLD = "构思机";
const docs = ["README.md", "DESIGN.md"].map(f => {
  try { return fs.readFileSync(new URL("../" + f, import.meta.url), "utf8"); } catch { return ""; }
}).join("\n");
const nameIssues = [];
if (!html.includes(`<title>${NAME}`)) nameIssues.push("<title> 未用新名");
if (!new RegExp(`<h1>${NAME}`).test(html)) nameIssues.push("<h1> 未用新名");
if (html.includes(OLD)) nameIssues.push("index.html 仍残留旧名");
if (docs.includes(OLD)) nameIssues.push("README/DESIGN 仍残留旧名");
if (!docs.includes(NAME)) nameIssues.push("README/DESIGN 未出现新名");
check("工具名一致（防漂移）", nameIssues.length === 0, nameIssues.join("; ") || `「${NAME}」在 HTML + 文档中一致, 无「${OLD}」残留`);

/* localStorage key 必须保持稳定，改名不得清空用户数据 */
check("localStorage key 稳定", /gousi-machine-v1/.test(js), /gousi-machine-v1/.test(js) ? "仍为 gousi-machine-v1（改名不丢用户数据）" : "被改动，会丢数据");

/* ---------- 输出 ---------- */
console.log("狗屎机 // 验收清单实测\n" + "=".repeat(58));
let failed = 0;
for (const r of results) {
  if (!r.pass) failed++;
  console.log(`  ${r.pass ? "[PASS]" : "[FAIL]"} ${r.name.padEnd(24, " ")} ${r.detail}`);
}
console.log("=".repeat(58));
console.log(failed ? `结果: ${failed}/${results.length} 项未通过 → 未完成，就地修` : `结果: ${results.length}/${results.length} 全部通过`);
process.exit(failed ? 1 : 0);
