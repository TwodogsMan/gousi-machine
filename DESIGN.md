# DESIGN.md · 狗屎机 // GX-01

> 设计规范文档。规范来源：[KAOPU-XiaoPu/web-design](https://github.com/KAOPU-XiaoPu/web-design) 的 10 套 style-seeds 中选定 **#7 赛博朋克（Cyberpunk）**，并按 [anthropics/skills · frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) 的 anti-slop 约束与 [awesome-design-skills](https://github.com/bergside/awesome-design-skills) 的组件状态要求落地。

---

## 1. Visual Theme & Atmosphere

**一句话定调**：一台离线的构思抽取终端，机箱里的老 CRT，屏幕上跑着绿色数据流。

**氛围关键词**：故障 · 网格 · 刺眼 · 地下 · 数据流

**设计意图**：这个工具做的事是"从抽屉里抽一张命运卡"，所以界面不该像 SaaS 控制台，该像一台老机器。所有装饰都被当作"机器输出"来解释——扫描线是显示器、闪烁光标是待机、故障抖动是读取失败、直角边框是机箱面板。

**风格归属**：赛博朋克 × 终端工具。刻意保留粗糙感，不做精致化。

## 2. Color Palette & Roles

所有颜色都是 CSS 变量，**零硬编码 hex**（除 canvas 内部配色，见 §8）。

| Token | 值 | 角色 |
|---|---|---|
| `--bg` | `#0A0A0A` | 机身底色 |
| `--surface` | `#111111` | 面板 / hover 底 |
| `--surface-2` | `#161616` | 按钮 hover 底 |
| `--line` | `#232323` | 常规分隔线 |
| `--line-2` | `#333333` | 结构边框（外框、tab） |
| `--dim` | `#4A4A4A` | 禁用 / 极弱文字 |
| `--ink` | `#D8D8D8` | 正文 |
| `--ink-dim` | `#888888` | 次要正文、说明 |
| `--ink-lo` | `#5E5E5E` | 标签、元信息 |
| `--green` | `#00FF41` | **主信息色**：系统状态、命中、成功、主 CTA 文字 |
| `--magenta` | `#FF0080` | **主强调色**：主要动作、当前选中、警告性强调 |
| `--cyan` | `#00FFFF` | 次强调：区块标题、名字候选、链接 |
| `--amber` | `#FFB000` | 约束 / 需要注意的规则 |
| `--red` | `#FF3B30` | 雷区 / 危险 / 删除 |

**配色纪律**：
- 品红是**唯一**的"动作色"，一屏内出现不超过 3 处，超了就贬值。
- 绿色承载信息，不承载品牌感，避免变成"绿油油一片"。
- 大色块反白（品红底 + 黑字）只用于激活态和当前选中项，制造刺眼的终端反白感。
- **禁止**：紫色、蓝紫渐变、任何在深色底上做柔光泛光的"梦幻"配色。

## 3. Typography Rules

```
--mono: "Cascadia Mono","Consolas","JetBrains Mono","DejaVu Sans Mono","Noto Sans Mono CJK SC","Microsoft YaHei Mono",monospace
--cjk:  "SimSun","宋体","Noto Sans Mono CJK SC","Microsoft YaHei",sans-serif
```

**全部使用系统字体栈，零网络请求**——这是本工具的硬约束（离线可用），不接受 Google Fonts 依赖。

| 用途 | 字号 | 字重 | 字距 | 字体 |
|---|---|---|---|---|
| 主标题 H1 | 30px | 700 | -0.5px | mono（RGB 错位阴影） |
| 构思卡标题 | 25px | 700 | -0.5px | mono（RGB 错位阴影） |
| 区块标题 | 10.5px | 400 | 2px | mono，大写 |
| 卡片数值 | 14.5px | 400 | 0 | mono |
| 命题 / 长文 | 16px | 400 | 0.02em | cjk，行高 1.9 |
| 正文说明 | 12.5–14.5px | 400 | 0.02em | cjk，行高 1.8 |
| 元信息 / 标签 | 10–11.5px | 400 | 1–2px | mono |

**中文排版要求**（来自 style-seed「中文优雅」，本方案沿用）：
- 中文正文行高 ≥ 1.7，本方案取 1.8–1.95（终端风需要更松的呼吸）
- 中文用 `letter-spacing: 0.02em`，英文标签用 1–2px 拉开
- 中文正文 ≥ 15px，长文阅读 ≥ 16px
- 中英混排时中文字族在前（`--cjk`），等宽字族作为数据与标签的主字族

**禁止字体**：Inter、Roboto、Arial、Space Grotesk、以及任何几何无衬线"科技感"字体（这些是 AI 默认脸）。

## 4. Component Stylings

**统一规则：`--r: 0px`，全项目禁止任何圆角**（唯一例外：转盘中心圆钮与 canvas 圆形，属几何必需）。

### 按钮 `.c`
- default：透明底 + `1px solid var(--line-2)` + `--ink` 文字
- hover：边框与文字转 `--green`
- active：`transform: translate(1px,1px)`（物理下沉 1px，不用缩放）
- disabled：文字与边框降到 `--ink-lo` / `--line`，`cursor: not-allowed`
- primary：`--magenta` 边框与文字 + `text-shadow` 霓虹描边；hover 时反白为品红底黑字
- focus-visible：`1px solid var(--green)` + `outline-offset: 2px`（全局）

### 老虎机行 `.slot`
- 三列定宽网格：`44px` 序号 | 自适应内容 | `38px` 工具列
- 行间仅 1px 分隔线，**不使用卡片容器、不用阴影、不用圆角**
- 锁定态：底色 `#001a08`（极暗绿）+ 序号转绿
- 滚动中：数值转绿 + `text-shadow` 发光，说明文字降到 25% 透明
- 命中：`steps(2,end)` 阶跃闪烁一次（不做平滑淡入）

### 构思卡 `.brief`
- 顶部：标题 + 品红/青 RGB 错位阴影，右上角 `DOSSIER` 水印标签
- 标签 `.badge`：`margin: 0 -1px -1px 0` 形成**紧凑拼接网格**，四种语义色（g/m/c/a）
- 正文区：`auto-fit minmax(290px,1fr)` 自适应网格，区块之间用 1px 线分隔（无间隙、无卡片感）
- 约束区块 `.rule`：琥珀色 + 极暗黄底，序号前用 `!`
- 雷区 `.no`：红色 + `×`
- 成立判据 `.ok`：绿色 + `+`
- 开工步骤：`01`–`05` 编号，等宽字 + 描边方块

### 转盘 `.hub` / `.chips` / `.item`
- 中心钮为唯一允许的圆形，`104px`，1px 边框，hover 时 `box-shadow` 描边 + 绿色泛光
- 中心文字 `SPIN` 后跟闪烁下划线光标
- 分组切换 = 无缝紧贴的 tab（`border-right` 分隔），激活态品红底黑字
- 元素行：`26px` 序号列 + 内容 + 工具列，命中行 `inset 3px 0 0 var(--magenta)` 左侧品红标

### 输入
- 单行：透明底 + 下/右边框，focus 时底色 `#001a08`
- 多行：`1px solid var(--line-2)`，focus 转绿
- 无圆角、无阴影、无浮动标签

## 5. Layout Principles

- 容器 `max-width: 1240px`，左右 `20px`，**非居中英雄式布局**
- 主栅格：`340px | 1fr`，两列共用外边框（`border` + `border-top: 0`），形成"一整块机箱面板"
- ≤900px：单列堆叠，左边框换底边框
- 间距梯度：4 / 7 / 11 / 14 / 18 / 22 px（紧凑，终端密度）
- **不使用卡片网格铺满页面**，页面骨架是"面板 + 分隔线"，不是"一堆圆角卡片"

## 6. Depth & Elevation

**没有阴影体系**。层次靠三样东西建立：
1. 边框明度差（`--line` → `--line-2` → `--dim`）
2. 底色差（`--bg` → `--surface` → `--surface-2`，以及暗绿/暗黄/暗红的功能底色）
3. 霓虹发光（**仅用于文字**，`text-shadow: 0 0 Npx`，且只给关键状态：主标题、卡片标题、命中值、primary 按钮）

`box-shadow` 全项目只出现两次，都是描边式（`0 0 0 1px`）或绿色泛光，不用来模拟"卡片浮起"。

## 7. Animation & Interaction

**动效档位：L2–L3**，但强制性能红线：

| 动效 | 实现 | 说明 |
|---|---|---|
| 标题 RGB 错位 | 静态 `text-shadow` | 零成本 |
| 卡片标题故障 | `steps(3,end)` 关键帧抖动 ×2 | 一次性，0.8s 内结束 |
| 数值读取 | `requestAnimationFrame` 字符替换（`▓▒░#@%&$*`） | 180ms，只在该格重抽时 |
| 老虎机滚动 | `setInterval` 音效 + 绿色文字态 | 420ms |
| 转盘 | `easeOutQuart` 5–7 圈，3.3s，逐帧重绘 canvas | 单次，结束即停止 rAF |
| 光标闪烁 | `steps(1)` 1s 无限 | 用户可 `prefers-reduced-motion` 关闭 |
| 扫描线 / 网格底纹 | 固定定位伪元素，`mix-blend-mode: multiply` | 静态层，不参与滚动重绘 |

**性能红线（不可破）**：
- 移动元素上**禁止** `filter: blur()`；全项目 `backdrop-filter` 使用量为 **0**
- **禁止**在滚动区域使用大面积 fixed 重绘层；底纹层为静态
- 转盘结束后必须停止 `requestAnimationFrame`（已满足）
- `prefers-reduced-motion: reduce` 时：全部动画与过渡归零、扫描线移除、标题错位阴影移除

## 8. Do's and Don'ts

**Do**
1. 用 1px 边框和底色差建立层次，不用阴影
2. 把每个装饰都解释成"机器输出"（扫描线=显示器、光标=待机、故障=读取失败）
3. 品红留给动作，绿色留给信息，一屏品红不超过 3 处
4. 中文正文行高 1.8+、字距 0.02em、字号 ≥15px
5. 所有可交互元素必须有 hover + focus-visible 态
6. 数据用等宽字，叙述用中文字族，两者切换本身就是信息分层
7. canvas 配色与 CSS token 保持一致（`WHEEL_COLORS` 与 `--green/--magenta/--cyan/--amber/--red` 同源）
8. 保持零网络请求：系统字体栈 + 无外部资源

**Don'ts**
1. ❌ 任何非 0 圆角（除转盘圆形几何）
2. ❌ 任何美术渐变填充——`linear-gradient` 只允许用在 1px 网格细线与 `repeating` 扫描线上
3. ❌ 紫色 / 蓝紫渐变 / 柔和泛光的"梦幻科技感"配色
4. ❌ `backdrop-filter` 毛玻璃、半透明玻璃卡片
5. ❌ 居中一切 + 统一圆角卡片网格 + 居中大标题 hero
6. ❌ emoji 当图标（本方案用 `▶ ↻ ▣ ▤ ↓ × R L 01` 等终端字形）
7. ❌ Inter / Roboto / Arial / 系统默认无衬线当主字族
8. ❌ 用 `box-shadow` 模拟卡片浮起
9. ❌ 平滑缓动的"呼吸感"动效堆砌；本方案用阶跃（`steps`）与瞬时反白
10. ❌ 让动效影响布局（避免 `width/height/top/left` 参与动画）

## 9. Responsive Behavior

| 断点 | 行为 |
|---|---|
| >900px | 双列 `340px \| 1fr`，构思卡内部 `auto-fit minmax(290px,1fr)` 多列 |
| ≤900px | 主栅格单列堆叠；左列底边框替代右边框；构思卡内部自动降为单列 |
| ≤600px | 命令按钮自动换行；转盘 `min(400px,80vw)` 自适应；无横向溢出 |
| ≤320px | 标签 `.badge` 紧凑拼接仍不溢出；卡片正文 `word-break: break-word` |

**触摸目标**：命令按钮 padding 11px 15px（≥44×44px）；行内工具按钮 38×38px；元素行工具 32px 宽（配合行高 ≥40px）。移动端无 hover 依赖，所有 hover 态都有等价的激活/选中态。

## 10. 质量自检结果

已通过项目自带的验证工具自动校验。**复验命令：`node tools/check.mjs`（16 项，必须全过）**：

```
狗屎机 // 验收清单实测
==========================================================
  [PASS] 圆角仅 0 / 圆形几何             共 1 处全部合规
  [PASS] 无美术渐变                    5 处质感渐变已豁免
  [PASS] backdrop-filter 为 0      0 处
  [PASS] 无 emoji 图标               0 个
  [PASS] 无浮起式阴影                   4 处均为描边/霓虹
  [PASS] CSS 无 :root 外的硬编码色       0 处
  [PASS] canvas 配色与 token 同源      token 全含=true, 自定色 3 个
  [PASS] 有 focus-visible 态        已定义
  [PASS] 有 reduced-motion 降级      已定义
  [PASS] 零外链资源                    0 处
  [PASS] 含移动端断点                   @media (max-width:900px) / (prefers-reduced-motion: reduce)
  [PASS] 骨架以 1px 分隔线为主            37 处 1px 分隔线
  [PASS] 逻辑回归 3000 张卡             0 异常, 唯一一句话 3000 种
  [PASS] 锁定语义正确                   锁定格保持不变
  [PASS] 工具名一致（防漂移）               「狗屎机」在 HTML + 文档中一致, 无旧名残留
  [PASS] localStorage key 稳定      仍为 gousi-machine-v1（改名不丢用户数据）
==========================================================
结果: 16/16 全部通过
```

- [x] 9+1 个区块都有实质内容，非模板占位
- [x] 所有颜色经 CSS 变量引用，`:root` 之外零硬编码 hex；canvas 配色与 token 同源
- [x] 每个可交互元素含 default / hover / active / focus-visible / disabled 态
- [x] 动效档位明确（L2–L3），含 `prefers-reduced-motion` 完整降级
- [x] 响应式覆盖 Desktop / Tablet / Mobile / 320px
- [x] 零网络请求、零第三方依赖、零 emoji 图标、零美术渐变、零非零圆角
- [ ] **视觉渲染未经我本人目视确认**（headless 截图被沙箱命名管道限制拦下）。以上全部是代码级自动断言——排版、密度、霓虹强度这类主观观感需要你亲眼看一下

---

## 附：改动记录

| 项目 | 改前（AI 默认脸） | 改后 |
|---|---|---|
| 圆角 | 10/13/14/20px | 全 0px |
| 配色 | 紫 `#7c5cff` → 青 `#22d3ee` 渐变 | 终端绿 `#00FF41` + 品红 `#FF0080` |
| 背景 | 三处 radial-gradient 光晕 | `#0A0A0A` + 1px 网格细线 + 扫描线 |
| 层次 | `box-shadow` 卡片浮起 + 玻璃拟态 | 1px 边框 + 底色差 + 文字霓虹 |
| 骨架 | 居中容器 + 圆角卡片网格 | 机箱面板：`340px\|1fr` 双列 + 分隔线 |
| 图标 | emoji（🎲🎰🎡📒🔒） | 终端字形（`▶ ↻ ▤ ▣ ↓ × R L 01`） |
| 字体 | 系统无衬线 + 大圆角标题 | 等宽终端字族 + RGB 错位标题 |
| 动效 | 弹性缓动、脉冲、柔和淡入 | 阶跃闪烁、字符故障、瞬时反白 |

---

## 附：项目专属须知

> 项目级 `AGENTS.md` 已删除（用户在 2025 年要求去掉，理由：全局 `~/.dsh/AGENTS.md` 已覆盖通用规则，项目文件冗余）。**本文档现在是本项目界面规范与规则的唯一权威来源。**

### 规则来源

| 层级 | 位置 | 内容 |
|---|---|---|
| 全局 | `~/.dsh/AGENTS.md` | 11 条反 AI 味硬黑名单、工程质量底线、本机环境事实、沟通偏好。**对本机所有项目生效** |
| 项目 | 本文档 + `README.md` | 设计 token、组件规范、验收清单、踩坑记录 |

### 设计 token 全集（`index.html` 的 `:root` 是实现，这里是语义索引）

```
底色    --bg #0A0A0A   --surface #111111   --surface-2 #161616   --surface-3 #0C0C0C
线      --line #232323  --line-2 #333333   --dim #4A4A4A
文字    --ink #D8D8D8   --ink-dim #888888  --ink-lo #5E5E5E   --paper #FFFFFF   --hole #000000
语义    --green #00FF41(信息)  --magenta #FF0080(动作)  --cyan #00FFFF(次强调)
        --amber #FFB000(约束)  --red #FF3B30(雷区)
暗底染色  --tint-green #001A08   --tint-amber #140F00   --tint-magenta #1A0010
描边      --edge-green #0D3A1A   --edge-magenta #3D0A22  --edge-cyan #0A3A3A  --edge-amber #3D2C0A
其它      --r 0px（禁止修改）  --mono（终端等宽）  --cjk（中文宋体栈）
```

配色纪律：**品红是唯一动作色，一屏 ≤3 处**；绿色承载信息不承载品牌感；大色块反白只用于激活态。

### 已装设计 skill（在 `.claude/skills/`）

- `web-design/` — 本项目规范来源：10 套 style-seeds（本方案用 **#7 赛博朋克**）、58 个品牌设计系统、交互档位 L1–L3、质量清单
- `frontend-design/` — anti-slop 原则与 Tone Menu
- `theme-factory/` — 10 套预设主题 token
- `canvas-design/` — 海报/PDF 生成（字体二进制未下载，需用时再补）

⚠️ `bergside/awesome-design-skills` 的 67 套是模板套壳，正文全是同一段空话，没有组件规范，**别用**。

### 复验

```bash
node tools/check.mjs        # 界面 + 逻辑：必须 16/16 全过
node tools/check-spec.mjs   # 导出双形态：必须全部通过（加 --show 可打印样例输出）
```

不许口头声称通过，必须贴实测输出。

### 导出双形态（v1.1.0 新增）

同一份构思卡导出两份，服务不同读者。**这不是换个标题，两种形态的结构完全不同**：

| | 人看版 `briefToMd()` | agent 执行版 `briefToAgentMd()` |
|---|---|---|
| 读者 | 人 | AI agent |
| 文体 | 叙事式，讲「为什么这么做」 | 规范式，祈使句，讲「做什么、做到什么算完」 |
| 结构 | 标题 + 10 个语义章节 + 名字候选 | YAML frontmatter + 8 个编号章节 |
| 机器可解析 | 否 | **是**（frontmatter 可被程序直接读取） |
| 文件名 | `构思-<主题>.md` | `SPEC-<主题>.md` |
| 章节目录 | 核心动作 / 强制约束 / MVP / 扩展方向 / 成立判据 / 雷区 / 开工顺序 | 0 任务 · 1 执行规则 · 2 硬约束 · 3 交付步骤 · 4 核心动作 · 5 验收标准 · 6 明令禁止 · 7 不确定时怎么办 |

agent 版里几处是**专门为「能被可靠执行」设计的**，不是装饰：

1. **YAML frontmatter** — agent 不用正则去啃正文，直接读结构化字段（`hard_constraints` / `deliverable` / `must_not` / `out_of_scope`）
2. **祈使句 + 编号** — 是命令不是描述，可直接当待办清单执行
3. **验收标准写成可核对形式** — 每条都是 `- [ ]`，且要求「必须实际跑一遍，不要只读代码就勾选」
4. **明确 OUT OF SCOPE** — 列出账号体系/后端/多端同步等，防止 agent 自作主张扩大规模
5. **明确不许提问 + 冲突裁决顺序** — 避免执行中途停下来等人，或方向跑偏
6. **一次只做第一步** — 做完停下等确认，防止一口气做完五步然后全部返工

两份**从同一份 brief 数据派生**（`plain()` 去标签），保证人看版和执行版语义不漂移——这是 `tools/check-spec.mjs` 会断言的。

### 历史踩坑（不要重犯）

1. **名字候选用 `Set` 去重 3 次抽样** → 14% 概率只剩 2 个候选。已改为真正的无重复抽样（`sample()`）。
2. **反 AI 味红线判定过宽** → 把 1px 网格细线和 `repeating-` 扫描线误判成美术渐变。正确判定：**非 `repeating-` + 至少两个不同色点**才算违规。
3. **CSS 里硬编码颜色** → 违反「颜色只能走 token」。已把 10 处（`#001a08`、`#0d3a1a` 等暗底染色）收进 `--tint-*` / `--edge-*`。
4. **`.claude/skills/` 层级套错** → `anthropics/skills` 原始路径是 `skills/<name>/`，直接下载会多套一层，必须拍平到 `.claude/skills/<name>/`，否则 agent 读不到。
5. **桌面端 `git clone` 下不了** → 本机 git 远端操作要 spawn `sh.exe`/`ssh.exe`，沙箱禁命名管道（`Win32 error 5`）。下载第三方文件用 Node 原生 `fetch` + GitHub API/raw。
6. **pitch 模板拼接出「把把」叠字** → `themeNote` 本身以「把」开头，模板又加了一个「把」，长期没被发现（断言只查 undefined，不查中文语法）。已改为 `把「${themeNote}」这件事`，并在 `check-spec.mjs` 里加了叠字断言（把把/的的/了了/是是/在在）。
7. **PowerShell `Set-Content` 把 UTF-8 文件写成 ANSI** → 中文字符全部损坏，文件变成 `invalid UTF-8` 无法读取。**改代码文件一律用 write/edit 工具，不要用 PowerShell 的 `Set-Content` / `Out-File` 做字符串替换。**
