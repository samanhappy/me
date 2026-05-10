---
author: 青扬
pubDatetime: 2026-05-02T18:09:00.000Z
modDatetime: 2026-05-10T12:30:00.000Z
title: "OpenClaw 多用户部署实战：隔离、偏好与技能复用"
featured: false
draft: true
tags:
  - OpenClaw
  - AI Agent
  - Feishu
  - WeChat
  - Deployment
  - Multi-User
description: "从零搭建一个 OpenClaw Gateway，让多个用户共享同一台服务器，各自拥有独立的 AI 助手、个性化偏好、共享技能池，以及清晰的多账号路由边界。"
---

## 你需要的不是十个 Docker 容器

第一次用 OpenClaw 的人，通常是这样开始的：装一个 Gateway，配一个 Agent，连上 WhatsApp 或 Telegram，跟自己的 AI 助手聊得很开心。

但很快就会出现新需求——"能不能让我爱人也用上？""能不能给团队开一个共享的助手？""能不能一个号里工作状态和生活状态的 AI 是不同的？"

很多人这时候的第一反应是加机器、加容器、再开一个 Gateway。真要这么搞，当然也能跑，但通常还没到那个复杂度。

OpenClaw 本身就支持在一个 Gateway 上跑多个隔离的 Agent，技能可以复用，配置可以共享，消息还能按渠道、账号、联系人、群聊继续细分。真正难的不是搭起来，而是先把边界想清楚。这篇文章想解决的，就是这两件事：**怎么搭**，以及**什么时候该共用，什么时候该拆开**。

## 先把边界想清楚

官方安全文档有个很重要的前提：OpenClaw 默认是 personal assistant trust model。

说直白一点，它默认服务的是一个可信边界。这个边界可以是你自己，也可以是一个彼此信任的团队，但不是给互相敌对的用户做强隔离的平台。

所以先别急着写配置，先判断场景。

### 适合同一个 Gateway 的场景

- 同一个家庭或同一个团队内部使用
- 大家共享同一类业务数据
- 统一运维、统一日志、统一工具权限可以接受
- 目标是协作，不是租户级隔离

### 不适合同一个 Gateway 的场景

- 不同客户之间要严格隔离
- 使用者彼此并不信任
- 个人身份和公司身份会混在一个 runtime 里
- 你打算把它做成对外服务的平台

后一类场景就别硬省机器了。那时候更好的做法不是继续往一个 `openclaw.json` 里堆配置，而是拆多个 Gateway，最好连 OS 用户、容器甚至主机一起拆开。

## 先理解单 Agent vs 多 Agent

在 OpenClaw 里，一个 Agent 是一套完整的“大脑”：

- **Workspace**：存放 AGENTS.md / SOUL.md / USER.md 等定义文件
- **State Directory**（`agentDir`）：认证配置、模型注册、定制度配置
- **Session Store**：聊天历史和路由状态

默认情况下，OpenClaw 运行的是单 Agent 模式，所有消息都去 `agentId: "main"`。多用户部署的本质，就是把这些大脑从一个拆成多个，再告诉 Gateway：谁的消息该进哪个脑子。

如果再往前走一步，你会发现它不只是“多用户”。它其实有四层：

1. **Gateway**：统一接收消息和管理状态
2. **Agent**：不同的大脑，各自有 workspace、session 和 auth profile
3. **Channel Account**：同一个渠道里的不同账号实例
4. **Bindings**：按渠道、账号、联系人、群聊把消息路由到指定 Agent

这也是为什么一个 OpenClaw 可以同时挂多个飞书 Bot、多个微信号，最后还不至于乱套。前提是你愿意在一开始就把路由拆清楚。

## 第一步：为每个用户创建独立 Agent

使用 CLI 向导创建新 Agent：

```bash
openclaw agents add zhou
openclaw agents add lin
```

这会为每个 Agent 创建独立的 workspace 和 state 目录：

```
~/.openclaw/
├── workspace/           # main agent（默认）
├── workspace-zhou/      # 周舟的 workspace
├── workspace-lin/       # 林宁的 workspace
└── agents/
    ├── main/agent/
  ├── zhou/agent/
  └── lin/agent/
```

### 给每个人一套自己的上下文

每个 Agent 都有自己独立的 `SOUL.md`。你可以给不同用户写完全不同的人格定义：

**zhou 的 SOUL.md**（技术型助手）：
```markdown
你叫 Cola，是周舟的技术搭档。你了解他正在维护公司的内部工具、自动化脚本和几个 side project。
你知道他偏爱 TDD、重构和能长期维护的代码。回复简洁、直接，不说空话。
如果他明显在熬夜赶版本，可以顺手提醒一句早点收工。
```

**lin 的 SOUL.md**（生活型助手）：
```markdown
你是林宁的日常助手。帮她管理购物清单、安排行程、整理待办。
语气温和，有耐心，像一个靠谱的朋友。她平时不关心技术细节，不要把事情说复杂。
```

### 记录用户偏好：USER.md

除了 SOUL.md，每个 Agent 的 workspace 里可以放一个 `USER.md`，专门记录用户信息：

```markdown
# 周舟
- 在杭州做后端开发，也维护一些内部系统
- 喜欢简洁回复，不喜欢兜圈子
- 常用技术栈：Java、TypeScript、Python
- 工作日白天在公司环境，晚上会处理个人项目
- 饮食偏好：不吃香菜
```

OpenClaw 会在每次会话启动时自动加载 `USER.md` 到上下文，这样 Agent 不用每次都重新了解用户。

## 第二步：用 Bindings 路由消息

Agent 创建好了，Gateway 还不知道谁的消息该给谁。这时候就轮到 `bindings` 上场了。

它本质上就是一张分发表：某个渠道、某个账号、某个联系人、某个群，该进哪个 Agent。

### 按 DM 联系人路由

如果你只有一个 WhatsApp 号，但想让不同联系人的消息路由到不同 Agent：

```json5
// ~/.openclaw/openclaw.json
{
  agents: {
    list: [
      { id: "zhou", workspace: "~/.openclaw/workspace-zhou" },
      { id: "lin", workspace: "~/.openclaw/workspace-lin" },
    ],
  },
  bindings: [
    {
      agentId: "zhou",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+8612345678901" } },
    },
    {
      agentId: "lin",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+8612345678902" } },
    },
  ],
}
```

`peer` 级别的匹配永远优先于 channel 级别。你既配了联系人精确匹配，又配了整个 channel 的通配规则，最终生效的是更具体的那条。

### 按 Channel 路由

更简单的方式：不同平台用不同 Agent：

```json5
bindings: [
  { agentId: "work", match: { channel: "slack" } },
  { agentId: "life", match: { channel: "whatsapp" } },
]
```

这样 Slack 来的所有消息都走工作 Agent，WhatsApp 来的都走生活 Agent。

### 多账号多手机号

如果你的 WhatsApp 挂了两个号（工作和生活），可以通过 `accountId` 区分：

```json5
bindings: [
  {
    agentId: "work",
    match: { channel: "whatsapp", accountId: "work" },
  },
  {
    agentId: "life",
    match: { channel: "whatsapp", accountId: "personal" },
  },
]
```

这一层很重要，因为它把“同一个渠道”继续往下拆成了“同一个渠道里的不同账号”。到了这里，多用户部署就不再只是一个人一个 Agent，而是可以继续扩展成一个 Gateway 管多个入口。

## 第三步：把多账号场景讲透

原来那篇多用户部署，更多讲的是“一个 Gateway，多个 Agent”。如果你的场景再往前走一步，变成“一个 Gateway，同时挂多个飞书或微信账号”，重点就从 Agent 隔离变成了**账号隔离 + 路由隔离**。

### 飞书：这条路更成熟

OpenClaw 的飞书文档已经明确支持多账号配置，结构大概是这样：

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Internal Bot",
        },
        support: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Support Bot",
        },
      },
    },
  },
}
```

有了多账号之后，最自然的做法不是把它们全指向同一个 Agent，而是继续路由：

```json5
{
  bindings: [
    {
      agentId: "internal",
      match: { channel: "feishu", accountId: "main" },
    },
    {
      agentId: "support",
      match: { channel: "feishu", accountId: "support" },
    },
  ],
}
```

飞书这边的好处是账号模型和路由模型都比较清楚，很适合做团队内部共享。

### 微信：能接，但要按插件来理解

微信不一样。它当前通过外部插件 `@tencent-weixin/openclaw-weixin` 接入，严格说不算 core 仓库里内建的一条运行时链路。

这意味着你在运维上要多想一步：

- 插件版本要单独看
- 主程序和插件的兼容性要一起验证
- 出问题时要把“OpenClaw 本体”和“插件本身”分开排查

微信的多账号方式也更直接：再登录一次，就是另一个账号。实际效果是一个 Gateway 可以监控多个微信登录态，但会话隔离一定要配对。

## 第四步：Session 隔离，别让上下文串线

多用户部署最容易踩的坑，不是 Agent 没创建好，而是 Session 隔离没配好。

OpenClaw 通过 `dmScope` 控制私聊会话隔离粒度：

```json5
{
  session: {
    dmScope: "per-channel-peer",
  },
}
```

| dmScope | 行为 | 适用场景 |
|---------|------|----------|
| `main` | 所有私聊共用一个 Session（默认） | 单用户 |
| `per-peer` | 每个用户独立 Session，跨 Channel 共享 | 单人多平台 |
| `per-channel-peer` | 每个 Channel + 用户组合独立 Session | **多用户部署（推荐）** |

如果只是一个人跨平台使用，`per-peer` 也够用；但只要开始多人共享，我建议至少用 `per-channel-peer`。

再往前一步，如果你同时挂多个飞书账号、多个微信账号，最好直接上：

```json5
{
  session: {
    dmScope: "per-account-channel-peer",
  },
}
```

这行配置很值钱。它会把会话键拆成“账号 + 渠道 + 发送者”三个维度。换句话说，两个不同微信号、两个不同联系人，不会掉进同一个上下文桶里。

### Session 生命周期

不管单用户还是多用户，Session 的生命周期管理是一样的：

```json5
{
  session: {
    reset: {
      mode: "daily",      // 每天凌晨 4:00 重置
      idleMinutes: 120,    // 空闲 2 小时后自动重置
    },
  },
}
```

Session 重置意味着对话历史清空，但 MEMORY.md 中的持久记忆不受影响——这点跟你的个人助手体验一致。

## 第五步：Skills 复用，一个技能池就够了

多 Agent 部署最大的优势之一就是 Skills 可以共享，不用每个 Agent 重复安装。

### 技能优先级体系

OpenClaw 加载技能时按以下优先级（高到低）：

| 优先级 | 来源 | 路径 | 可见性 |
|--------|------|------|--------|
| 1 | Workspace skills | `<workspace>/skills` | 仅该 Agent |
| 2 | Project-agent skills | `<workspace>/.agents/skills` | 仅该 Agent |
| 3 | Personal-agent skills | `~/.agents/skills` | 本机所有 Agent |
| 4 | Managed/local skills | `~/.openclaw/skills` | 本机所有 Agent |
| 5 | Bundled skills | 随安装附带 | 本机所有 Agent |
| 6 | Extra dirs | `skills.load.extraDirs` | 本机所有 Agent |

### 实践：共享 + 覆盖

把通用技能放 `~/.openclaw/skills`，所有 Agent 都能用：

```bash
# 安装一个共享技能到全局
openclaw skills install weather    # → ~/.openclaw/skills/weather/
openclaw skills install github     # → ~/.openclaw/skills/github/
```

某个 Agent 要对共享技能做定制——直接在自己的 workspace 里放一个同名版本，因为 workspace 优先级更高：

```bash
# 林宁不需要 GitHub 的 PR review 功能，简化一版
mkdir -p ~/.openclaw/workspace-lin/skills/github
# 写一个简化版 SKILL.md → 自动覆盖全局版本
```

### Agent 技能白名单

不是每个 Agent 都需要所有技能。用 allowlists 精确控制：

```json5
{
  agents: {
    defaults: {
      skills: ["weather"],  // 所有 Agent 默认可用的技能
    },
    list: [
      {
        id: "zhou",
        workspace: "~/.openclaw/workspace-zhou",
        skills: ["weather", "github", "coding-agent"],  // 周舟额外的技能
      },
      {
        id: "lin",
        workspace: "~/.openclaw/workspace-lin",
        skills: ["weather", "shopping"],  // 林宁不需要 github
      },
    ],
  },
}
```

多账号场景下，这一层仍然成立。飞书内部 Bot、飞书客服 Bot、微信工作号背后的 Agent，可以共用一套基础技能；某个 Agent 要特殊处理，再在自己的 workspace 里覆盖掉同名技能就行。

## 第六步：安全隔离，不同入口不同权限

如果给不太信任的用户（比如群组里的陌生人）开放 Agent，安全隔离就很重要。

### Per-agent Sandbox

安全要求高的 Agent 跑在 Docker 沙箱里，限制其文件系统和网络访问：

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",      // 始终在沙箱中运行
          scope: "agent",   // 一个容器服务一个 Agent
          docker: {
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
      },
    ],
  },
}
```

### 工具白名单/黑名单

更进一步，限制特定 Agent 能用的工具：

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        tools: {
          allow: ["read", "exec", "sessions_list", "sessions_history"],
          deny: ["write", "edit", "apply_patch", "browser", "cron"],
        },
      },
    ],
  },
}
```

> 注意：`tools.allow/deny` 控制的是工具（bash、browser、write 等），不是技能。如果某个技能需要调用被禁止的工具，那个功能就用不了。

### 群组场景的 Mention Gate

把 Agent 放进群组时，设置 mention 触发，避免 Agent 误读群聊里的每一句话：

```json5
{
  agent: {
    groupChat: {
      mentionPatterns: ["@familybot", "@助手"],
    },
  },
}
```

## 完整配置示例

下面给一个更接近真实团队场景的配置。它把“多用户”和“多账号”放到了一起：

```json5
// ~/.openclaw/openclaw.json
{
  // 全局默认
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      model: "anthropic/claude-sonnet-4-6",
      skills: ["weather"],
    },
    list: [
      {
        id: "internal",
        name: "内部助手",
        workspace: "~/.openclaw/workspace-internal",
        skills: ["weather", "github", "coding-agent"],
        tools: {
          deny: ["exec", "browser", "gateway", "cron"],
        },
      },
      {
        id: "support",
        name: "支持助手",
        workspace: "~/.openclaw/workspace-support",
        skills: ["weather", "shopping"],
        sandbox: { mode: "all", scope: "agent" },
        tools: {
          allow: ["read", "sessions_list", "sessions_history"],
          deny: ["write", "edit", "apply_patch", "exec", "browser", "gateway", "cron"],
        },
      },
      {
        id: "sales",
        name: "销售助手",
        workspace: "~/.openclaw/workspace-sales",
        sandbox: { mode: "all", scope: "agent" },
      },
    ],
  },

  channels: {
    feishu: {
      defaultAccount: "main",
      dmPolicy: "pairing",
      requireMention: true,
      accounts: {
        main: {
          appId: "cli_main",
          appSecret: "secret_main",
          name: "Internal Bot",
        },
        support: {
          appId: "cli_support",
          appSecret: "secret_support",
          name: "Support Bot",
        },
      },
    },
  },

  // 消息路由
  bindings: [
    {
      agentId: "internal",
      match: { channel: "feishu", accountId: "main" },
    },
    {
      agentId: "support",
      match: { channel: "feishu", accountId: "support" },
    },
    {
      agentId: "sales",
      match: { channel: "openclaw-weixin", accountId: "biz" },
    },
  ],

  // Session 隔离
  session: {
    dmScope: "per-account-channel-peer",
    reset: {
      mode: "daily",
      idleMinutes: 120,
    },
  },
}
```

## 常见部署模式

### 模式一：家庭共享

一台家用 Mac mini 当 Gateway，家人各有自己的 Agent，公用一个 WhatsApp 号。谁发消息，Gateway 根据发件人号码路由到对应 Agent。技能池共享，个人的 coding 技能只有自己能看到。

### 模式二：团队协作

团队共用一台 Gateway 服务器，每个人有自己的 Agent 和 workspace。通过 Slack、飞书等渠道接入，私聊消息自动路由到各自 Agent。共用技能放 `~/.openclaw/skills`，特定项目技能放各自 workspace。

如果团队里同时有两个飞书 Bot，一个负责内部知识，一个负责客服支持，就继续用 `accountId` 拆，不用再起一整套新 Gateway。

### 模式三：多账号入口

一个 Gateway 同时挂两个飞书账号、两个微信账号。内部入口走 `internal` Agent，对外入口走 `sales` 或 `support` Agent。它看起来像四个 Bot，底层其实是一套控制平面。

### 模式四：一人多分身

同一个人在不同平台用不同人格的 Agent——比如 Telegram 上的是"深度工作 Agent"跑 Claude Opus 模型，WhatsApp 上的是"日常助理"跑 Sonnet 模型。技能共享，但人格和模型独立。

```json5
bindings: [
  { agentId: "deep-work", match: { channel: "telegram" } },
  { agentId: "daily", match: { channel: "whatsapp" } },
]
```

## 什么时候该拆多个 Gateway

如果你只是问“能不能共用一个”，答案当然是能。但到了一定规模，继续共用反而会让边界越来越脏。

下面这些情况，我会建议直接拆 Gateway：

- 不同使用者已经不在同一个 trust boundary 内
- 不同客户的数据必须严格隔离
- 你不希望日志、会话、凭证放在同一运行时里
- 你要把系统作为服务开放给外部用户
- 你已经开始担心某个 Agent 拿到了不该拿到的工具权限

拆 Gateway 的坏处是运维成本上去，配置也会分散。好处也一样直接：边界更干净，事故面更小，排障更清楚。

## 注意事项

### ⚠️ 不要共享 agentDir

每个 Agent 的 `agentDir`（`~/.openclaw/agents/<agentId>/agent`）必须独立。这里面存了认证配置和模型注册，共享会导致认证冲突和 session 混乱。

### ⚠️ 先配 Session 隔离再开放

在开放给多人使用之前，务必检查 `dmScope` 是否设为 `per-channel-peer`。默认的 `main` 模式会把所有人的对话混在一起——这在单用户场景下没问题，但多用户是灾难。

### ✅ 用 `openclaw agents list --bindings` 验证路由

```bash
openclaw agents list --bindings
```

这条命令会输出当前所有 Agent 和绑定关系，确保你的路由配置正确生效。

### ✅ 先私有测试，再公开

先在 `allowFrom` 里只加自己的联系方式测试几天，确认隔离正常、技能可用，再逐步加入其他人的号码或账号。

## 总结

OpenClaw 的多用户部署，核心不是“多开几个实例”，而是把四件事拆清楚：

1. **独立 Agent** = 独立的大脑（workspace、SOUL.md、session store）
2. **Channel Account** = 同一渠道里的不同入口
3. **Bindings** = 消息分发规则（谁的消息去哪个大脑）
4. **Skills 分层** = 共享池（`~/.openclaw/skills`）+ 个人覆盖（`<workspace>/skills`）

如果你的场景在同一个 trust boundary 内，一个 Gateway 足够把全家或全团队的助手跑起来，甚至还能同时挂多个飞书或微信账号。

如果你的场景已经超出了这个边界，就别再硬抠配置了，直接拆 Gateway。很多时候，真正省事的做法不是把一切塞进同一台机器，而是早点承认它们本来就不是一回事。
