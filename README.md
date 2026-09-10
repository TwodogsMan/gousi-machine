# 狗屎机 // GX-01 · 灵感抽取终端

[![License: MIT](https://img.shields.io/badge/License-MIT-00FF41.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-v1.0.0-FF0080.svg)](https://github.com/TwodogsMan/gousi-machine/releases)
[![No Dependencies](https://img.shields.io/badge/dependencies-0-00FFFF.svg)](#)
[![Offline](https://img.shields.io/badge/network-0%20requests-FFB000.svg)](#)

灵感枯竭时用的抽取工具：**投骰子 / 转转盘**，吐出主题、机制、形态、强制约束，拼成一张能直接开工的构思卡。

界面是一台离线终端的样式——全直角、等宽字、终端绿 + 品红、扫描线。设计规范见 `DESIGN.md`。

> **零依赖、零构建、零网络请求。** 单个 HTML 文件，双击即用，断网可用，数据只写在本机 localStorage。
> 适合：卡在"今天做什么"的独立开发者 / 想练手但不知道做什么项目的人 / 需要随机约束来破局的人。

## 怎么打开

双击 `index.html` 就行。单文件、零依赖、纯离线，不需要装任何东西、不需要联网。
（数据只存在你自己浏览器的 localStorage 里，不上传、不发请求。）

## 四个模式

| 模式 | 做什么 |
|---|---|
| **01 ROLL / 灵感老虎机** | 一次掷出 8 个维度 → 自动生成完整构思卡（一句话说明 / 核心动作 / 强制约束 / MVP 三条 / 扩展方向 / 成立判据 / 雷区 / 名字候选 / 开工顺序） |
| **02 WHEEL / 元素转盘** | Canvas 转盘，五组元素可切换（形态 / 机制 / 主题 / 约束 / 气质），支持停用某些元素、加自己的元素；命中后可一键送入老虎机当「形态」 |
| **03 PROMPT / 一句话命题** | 只给一句刁钻约束，适合热身 |
| **04 ARCHIVE / 灵感本** | 掷出的卡自动入档（上限 200 条），可复制、导出 Markdown、删除 |

## 关键设计（为什么它不是「随机词生成器」）

1. **强制约束是题眼。** 每张卡都带一条硬约束（如「一个文件跑完全程」「不许有账号」「界面完全无文字」「只能有一个按钮」），再附加一条。灵感往往不是来自更多自由，而是来自更窄的出口。
2. **锁定 + 重抽。** 每个格子有单独的 `R`（只重抽这格）和 `L`（锁住保留）。可以只换「形态」保留题材，或者反过来。空格 = 整张重掷。
3. **直接给 MVP 和雷区。** 卡片里的三条 MVP 是「先做这三件」，雷区是「别做成待办清单 / 别贪大 / 别做成另一种社交媒体」这类真实会踩的坑。
4. **组合空间够大。** 40 主题 × 42 机制 × 30 形态 × 30 约束 × 32 用户 × 16 转折 × 12 气质 × 5 规模，且成卡句式随机制/主题/形态动态生成——实测 3000 次抽样，3000 张卡的一句话说明互不相同。

## 快捷键

`空格` 掷一次（转盘模式 = 转一下，命题模式 = 抽一句） · `R` 全部重抽 · `1` `2` `3` `4` 切换模式

## 想改词库

打开 `index.html`，搜索 `/* ---------------------- 词库 ---------------------- */`，下面就是全部数据：

```js
const THEMES = [["主题名","一句说明"], ...];   // 题材领域
const MECHANICS = [["机制名","机制怎么运作"], ...]; // 核心玩法/交互
const FORMS = [["形态名","形态的特点"], ...];   // 网站 / 插件 / 游戏 / 工具…
const CONSTRAINTS = [["约束","为什么这条约束有用"], ...];
const AUDIENCES = ["目标用户", ...];
const TWISTS = ["但……", ...];
const VIBES = ["气质", ...];
const SCOPES = ["规模", ...];
const PROMPTS = ["一句话命题", ...];
```

每条都是 `[名称, 说明]` 两元组，说明会作为小字显示在格子里。加多少条都行，也可以直接在转盘界面里加。

## 已验证

跑一条命令即可复验全部结论：

```bash
node tools/check.mjs
```

当前 **16/16 全部通过**：反 AI 味红线（圆角 / 渐变 / 毛玻璃 / emoji / 浮起阴影 / 硬编码色）、可访问性（focus-visible、reduced-motion）、离线（零外链）、响应式断点、逻辑回归（3000 张卡无空字段无 `undefined`、锁定语义正确）、工具名一致性。任何一项不过就是没做完。

## 设计来源

界面规范不是自己拍的，取自公开的设计 skill，取用内容与理由记在 `DESIGN.md`：

- [KAOPU-XiaoPu/web-design](https://github.com/KAOPU-XiaoPu/web-design) — 10 套 style-seeds 中选定 **#7 赛博朋克**（配色 / 字体 / 圆角 / 动效档位），并沿用其「中文页面专属要求」
- [anthropics/skills · frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) — anti-slop 约束：禁用 Inter/Roboto/系统默认字、禁用紫渐变、禁用统一圆角卡片网格、禁止居中一切
- [bergside/awesome-design-skills](https://github.com/bergside/awesome-design-skills) — 组件必须含 default/hover/active/focus/disabled 全状态、可测试的可访问性验收项

## 已安装的设计 skill

装在项目内 `.claude/skills/`，Claude Code / Cursor 打开本项目即可读取：

| 路径 | 来源 | 内容 |
|---|---|---|
| `.claude/skills/web-design/` | [KAOPU-XiaoPu/web-design](https://github.com/KAOPU-XiaoPu/web-design) | 79 个文件 / 1.2MB：10 套 style-seeds、58 个品牌设计系统规范、交互档位 L1–L3 代码库、质量清单、DESIGN.md 模板、3 个 Python 脚本 |
| `.claude/skills/frontend-design/` | [anthropics/skills](https://github.com/anthropics/skills) | anti-slop 原则（Apache 2.0） |
| `.claude/skills/theme-factory/` | 同上 | 10 套预设主题 token |
| `.claude/skills/canvas-design/` | 同上 | 海报 / PDF 生成。字体二进制未下载（54 个 ttf / 5.2MB），需要时再补 |

安装方式说明：本机 `git clone` 会 spawn 传输助手被沙箱拦下、HTTPS 又只有 Node 原生 `fetch` 走得通，所以是用 GitHub API + raw 逐个文件下载的。**这些是第三方文件，改动或再分发前先看各目录内的 LICENSE。**

## 项目规则

| 文件 | 作用 |
|---|---|
| `DESIGN.md` | **本项目界面规范与规则的唯一权威来源**：设计 token 全集、组件规范、10 条 Don'ts、验收清单、踩坑记录 |
| `tools/check.mjs` | 可执行的验收清单，`node tools/check.mjs`，必须 16/16 全过 |
| `~/.dsh/AGENTS.md` | 全局规则（本机所有项目生效）：11 条反 AI 味硬黑名单、工程质量底线、环境事实。项目内不再放 `AGENTS.md` |

## 许可证

[MIT](LICENSE) © 2025 KeMing。可任意使用、修改、分发、商用，只需保留版权声明。

---

## 仓库元数据（维护者备忘）

GitHub 的 **About** 区域决定别人能不能搜到、点进来第一眼看到什么。以下为准备好的文案。

**Description**（搜索结果显示的就是这行）：

```
离线灵感抽取终端 · 投骰子/转盘抽出主题×机制×形态×强制约束，生成可直接开工的构思卡 · 单文件零依赖
```

**Topics**（在仓库页右侧 ⚙️ 里粘贴，最多 20 个）：

```
idea-generator  brainstorming  creativity-tool  inspiration  randomizer
spinner-wheel  vanilla-js  single-file  offline-first  no-dependencies
cyberpunk  web-app  localstorage  indie-hacker  side-project
game-design  productivity  chinese  zero-build  mit-license
```

选词理由：前 4 个是**别人真会搜**的词（idea generator / brainstorming 是英文区高频搜索），`indie-hacker` / `side-project` / `game-design` 是**目标人群聚集的标签**，`single-file` / `offline-first` / `no-dependencies` / `zero-build` 是**这个项目的真实差异点**（很多人专门搜这类"拿来就能跑"的工具）。

> ⚠️ 只打 tag 不会带来曝光。**git tag** 是版本标记，**GitHub Topics** 才是发现机制。两者都在 2025 年做过。

