// tools/check-spec.mjs — 导出规范的可执行验证
//
// 用法：node tools/check-spec.mjs          只跑断言
//       node tools/check-spec.mjs --show   先打印两份样例输出，再跑断言
//
// 导出有两种形态，服务于不同的读者，必须分别保证质量：
//   briefToMd()       → 人看版：叙事式，讲清「为什么这么做」
//   briefToAgentMd()  → agent 执行版：规范式，YAML frontmatter + 祈使句 + 可核对验收标准
//
// 核心断言：agent 版必须真能被程序解析（frontmatter 合法、引号配平、数组元素带引号），
// 否则「给 agent 看」这个卖点就是空话。
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
let code = (html.match(/<script>([\s\S]*)<\/script>/) || [, ""])[1].replace(/\nboot\(\);\s*$/, "\n;");
code += "\nglobalThis.__api={newRoll,buildBrief,briefToMd,briefToAgentMd};";

const ctx2d = new Proxy({}, { get: (t, p) => (p === "canvas" ? {} : () => {}) });
const mk = () => ({
  style: {}, dataset: {}, classList: { add(){}, remove(){}, toggle(){}, contains(){ return false } },
  children: [], value: "", textContent: "", innerHTML: "", appendChild(c){ return c },
  removeChild(){}, remove(){}, addEventListener(){}, removeEventListener(){},
  querySelector(){ return mk() }, querySelectorAll(){ return [] }, closest(){ return mk() },
  focus(){}, select(){}, click(){}, getContext(){ return ctx2d },
  offsetWidth: 100, offsetLeft: 0, width: 900, height: 900,
});
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
vm.runInContext(code, sb, { filename: "index.html<script>" });
const { newRoll, buildBrief, briefToMd, briefToAgentMd } = sb.__api;

let fails = 0;
const bad = m => { fails++; console.log("  [FAIL] " + m); };

/* ---------- 固定用例：输出可复现 ---------- */
const FIXED = {
  theme: ["天气", "把天气变成可交易、可收集、可预测的东西"],
  mech: ["配对", "每轮翻两张，看你能不能记住它们的关系"],
  form: ["浏览器插件", "寄居在别人网页上，做那一点点更好用的事"],
  rule: ["不许有账号", "没有注册、没有登录、没有云端"],
  aud: ["通勤一小时的打工人", ""],
  twist: ["但规则每天都变一点", ""],
  vibe: ["极简性冷淡", ""],
  scope: ["一个周末的 MVP", ""],
};
const b0 = buildBrief(FIXED);
if (process.argv.includes("--show")) {
  console.log("\n================ 人看版 briefToMd ================\n");
  console.log(briefToMd(b0));
  console.log("\n================ agent 执行版 briefToAgentMd ================\n");
  console.log(briefToAgentMd(b0));
  console.log("");
}

const WANT_KEYS = ["spec:", "spec_version:", "codename:", "theme:", "mechanic:", "format:",
  "tone:", "scope:", "target_user:", "hard_constraints:", "deliverable:",
  "must_not:", "out_of_scope:"];
const REQUIRED_SECTIONS = ["## 0 · 任务", "## 1 · 执行规则", "## 2 · 硬约束", "## 3 · 交付步骤",
  "## 4 · 核心动作与产出", "## 5 · 验收标准", "## 6 · 明令禁止", "## 7 · 遇到不确定时"];

console.log("导出规范验证\n" + "=".repeat(58));

const human = briefToMd(b0);
const agent = briefToAgentMd(b0);

if (!agent.startsWith("---\n")) bad("agent 版未以 YAML frontmatter 开头");
const fmEnd = agent.indexOf("\n---\n", 4);
if (fmEnd < 0) bad("frontmatter 未闭合");
const fm = agent.slice(4, fmEnd);
WANT_KEYS.forEach(k => { if (!fm.includes(k)) bad("frontmatter 缺 key: " + k); });
REQUIRED_SECTIONS.forEach(s => { if (!agent.includes(s)) bad("缺章节: " + s); });

let fmBad = 0;
fm.split("\n").filter(Boolean).forEach(line => {
  if (!/^[a-z_]+:\s+.+$/.test(line)) { fmBad++; bad("frontmatter 行格式异常: " + line); }
});

const q = (fm.match(/"/g) || []).length;
if (q % 2 !== 0) bad("frontmatter 双引号不配平: " + q + " 个");

const arrOk = ["hard_constraints", "must_not", "out_of_scope"].every(k => {
  const m = fm.match(new RegExp("^" + k + ":\\s*(\\[.*\\])$", "m"));
  if (!m) return false;
  return m[1].slice(1, -1).split(", ").every(s => s.startsWith('"') && s.endsWith('"'));
});
if (!arrOk) bad("数组字段存在未加引号的元素");

const boxes = (agent.match(/^- \[ \]/gm) || []).length;
if (boxes < 5) bad("验收标准 checkbox 过少: " + boxes);
if (!/实际跑一遍/.test(agent)) bad("验收标准缺少「必须实际运行」的要求");
if (!/不要向我提问|不要停下来提问/.test(agent)) bad("缺少「不许提问」指令");
if (!/OUT OF SCOPE/.test(agent)) bad("缺少 OUT OF SCOPE 声明");

[["agent", agent], ["human", human]].forEach(([n, t]) => {
  if (/<[a-z][^>]*>/i.test(t)) bad(n + " 版泄漏 HTML 标签");
  if (/undefined|NaN|\[object/.test(t)) bad(n + " 版含脏字段");
});

/* 两种形态必须真的不同 */
if (human.startsWith("---")) bad("人看版不该有 frontmatter");
if (!human.includes("## 开工顺序")) bad("人看版缺「开工顺序」");
if (!human.includes("## 核心动作与产出")) bad("人看版缺核心章节");
if (!agent.includes("你是一个执行 agent")) bad("agent 版缺少角色声明");

/* 文案质量：模板拼接不得产生叠字 */
["把把", "的的", "了了", "是是", "在在"].forEach(w => {
  if (human.includes(w)) bad("人看版叠字 bug: " + w);
  if (agent.includes(w)) bad("agent 版叠字 bug: " + w);
});

const cn = (fm.match(/^codename:\s*(.+)$/m) || [, ""])[1];
if (/[「」]/.test(cn)) bad("codename 残留中文引号: " + cn);

/* 语义同源 */
["不许有账号"].forEach(r => {
  if (!human.includes(r)) bad("人看版丢约束: " + r);
  if (!agent.includes(r)) bad("agent 版丢约束: " + r);
});

console.log(`  frontmatter ${fm.split("\n").filter(Boolean).length} 行 / 格式异常 ${fmBad} / 双引号 ${q} 个`);
console.log(`  codename = ${cn}  ·  验收 checkbox ${boxes} 条`);

/* ---------- 批量 ---------- */
const BULK = 300;
let bulkBad = 0;
for (let i = 0; i < BULK; i++) {
  const bb = buildBrief(newRoll(true));
  const a = briefToAgentMd(bb);
  const h = briefToMd(bb);
  if (!a.startsWith("---\n") || a.indexOf("\n---\n", 4) < 0) bulkBad++;
  if (/undefined|NaN|\[object|把把/.test(a)) bulkBad++;
  if (/undefined|NaN|\[object|把把/.test(h)) bulkBad++;
  const f = a.slice(4, a.indexOf("\n---\n", 4));
  if (!WANT_KEYS.every(k => f.includes(k))) bulkBad++;
  if (!REQUIRED_SECTIONS.every(s => a.includes(s))) bulkBad++;
}
console.log(`  批量 ${BULK} 份随机卡：异常 ${bulkBad}`);
if (bulkBad) bad(`批量生成存在 ${bulkBad} 处异常`);

/* ---------- 导出按钮接线 ---------- */
["mdHumanBtn", "mdAgentBtn"].forEach(id => {
  if (!html.includes(`id="${id}"`)) bad("导出按钮缺失: " + id);
  if (!html.includes(`$("#${id}")`)) bad("导出按钮未接线: " + id);
});
if (html.includes('id="mdBriefBtn"')) bad("旧的单按钮 mdBriefBtn 未清理");
if (!html.includes("briefToAgentMd")) bad("index.html 未实现 briefToAgentMd");

console.log("=".repeat(58));
console.log(fails ? `结果: ${fails} 项未通过` : "结果: 全部通过（双形态 + 批量 + 接线）");
process.exit(fails ? 1 : 0);
