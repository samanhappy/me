---
author: 青扬
pubDatetime: 2026-05-02T18:09:00.000Z
modDatetime: 2026-05-02T18:09:00.000Z
title: "OpenClaw 多用户部署实战：隔离、偏好与技能复用"
featured: false
draft: true
tags:
  - OpenClaw
  - AI Agent
  - Deployment
  - Multi-User
description: "从零搭建一个 OpenClaw Gateway，让多个用户共享同一台服务器，各自拥有独立的 AI 助手、个性化偏好和共享技能池。"
---

## 你需要的不是十个 Docker 容器

第一次用 OpenClaw 的人，通常是这样开始的：装一个 Gateway，配一个 Agent，连上 WhatsApp 或 Telegram，跟自己的 AI 助手聊得很开心。

但很快就会出现新需求——"能不能让我爱人也用上？""能不能给团队开一个共享的助手？""能不能一个号里工作状态和生活状态的 AI 是不同的？"

这时候最容易犯的错误是：再开一个 Gateway 实例，甚至再搞一台服务器。其实 OpenClaw 本身就支持在一个 Gateway 上运行多个完全隔离的 Agent，而且技能可以复用、配置可以共享。这篇文章就是带你走完这个过程。

## 先理解单 Agent vs 多 Agent

在 OpenClaw 里，一个 Agent 是一套完整的"大脑"：

- **Workspace**：存放 AGENTS.md / SOUL.md / USER.md 等定义文件
- **State Directory**（`agentDir`）：认证配置、模型注册、定制度配置
- **Session Store**：聊天历史和路由状态

默认情况下，OpenClaw 运行的是单 Agent 模式——所有消息路由到 `agentId: "main"`。多用户部署的本质，就是把这些"大脑"从一个拆成多个，然后告诉 Gateway "谁的消息该给哪个大脑"。

## 第一步：为每个用户创建独立 Agent

使用 CLI 向导创建新 Agent：

```bash
openclaw agents add qingyang
openclaw agents add xiaomei
```

这会为每个 Agent 创建独立的 workspace 和 state 目录：

```
~/.openclaw/
├── workspace/           # main agent（默认）
├── workspace-qingyang/  # 青扬的 workspace
├── workspace-xiaomei/   # 小美的 workspace
└── agents/
    ├── main/agent/
    ├── qingyang/agent/
    └── xiaomei/agent/
```

### 定制每个人的 AI 人格

每个 Agent 都有自己独立的 SOUL.md。你可以给不同用户写完全不同的人格定义：

**qingyang 的 SOUL.md**（技术型助手）：
```markdown
你叫 Cola，是青扬的技术搭档。你了解他的项目（MCPHub、Selectly），
知道他喜欢 TDD + AI Coding 的开发方式。回复简洁、直接、不说废话。
当他在深夜还在写代码时，偶尔提醒他休息。
```

**xiaomei 的 SOUL.md**（生活型助手）：
```markdown
你是小美的日常助手。帮她管理购物清单、推荐菜谱、提醒日程。
语气温暖、有耐心，像个贴心的朋友。她不是程序员，不要跟她聊技术。
```

### 记录用户偏好：USER.md

除了 SOUL.md，每个 Agent 的 workspace 里可以放一个 `USER.md`，专门记录用户信息：

```markdown
# 青扬
- 南京，保险行业后端架构师
- 喜欢简洁回复，讨厌废话
- 常用技术栈：Java、TypeScript、Python
- 活跃时间：工作日 9:00-23:00
- 饮食偏好：不吃香菜
```

OpenClaw 会在每次会话启动时自动加载 `USER.md` 到上下文，这样 Agent 不用每次都重新了解用户。

## 第二步：用 Bindings 路由消息

Agent 创建好了，但 Gateway 还不知道谁的消息该给谁。这时候需要配置 **Bindings**——把传入消息跟 Agent 对应起来。

### 按 DM 联系人路由

如果你只有一个 WhatsApp 号，但想让不同联系人的消息路由到不同 Agent：

```json5
// ~/.openclaw/openclaw.json
{
  agents: {
    list: [
      { id: "qingyang", workspace: "~/.openclaw/workspace-qingyang" },
      { id: "xiaomei", workspace: "~/.openclaw/workspace-xiaomei" },
    ],
  },
  bindings: [
    {
      agentId: "qingyang",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+8612345678901" } },
    },
    {
      agentId: "xiaomei",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+8612345678902" } },
    },
  ],
}
```

> **most-specific wins 原则**：peer 级别的匹配永远优先于 channel 级别。如果你既配了某个联系人的精确匹配，又配了整个 channel 的通配规则，具体联系人的那条优先。

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

## 第三步：Session 隔离——别让用户看到彼此的对话

多用户部署最容易踩的坑是 Session 隔离没配好，导致用户 A 的对话上下文泄漏到用户 B。OpenClaw 通过 `dmScope` 控制这个粒度：

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

设置 `per-channel-peer` 后，青扬在 WhatsApp 上的对话和小美的对话完全隔离，互不可见。

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

## 第四步：Skills 复用——一个技能池，大家都能用

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
# 小美不需要 GitHub 的 PR review 功能，简化一版
mkdir -p ~/.openclaw/workspace-xiaomei/skills/github
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
        id: "qingyang",
        workspace: "~/.openclaw/workspace-qingyang",
        skills: ["weather", "github", "coding-agent"],  // 青扬额外的技能
      },
      {
        id: "xiaomei",
        workspace: "~/.openclaw/workspace-xiaomei",
        skills: ["weather", "shopping"],  // 小美不需要 github
      },
    ],
  },
}
```

## 第五步：安全隔离——不同用户不同权限

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

一个典型的家庭多用户部署，完整配置如下：

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
        id: "alex",
        name: "Alex 的助手",
        workspace: "~/.openclaw/workspace-alex",
        skills: ["weather", "github", "coding-agent"],
      },
      {
        id: "mia",
        name: "Mia 的助手",
        workspace: "~/.openclaw/workspace-mia",
        skills: ["weather", "shopping", "cooking"],
        sandbox: { mode: "off" },
      },
      {
        id: "family",
        name: "家庭助手",
        workspace: "~/.openclaw/workspace-family",
        groupChat: {
          mentionPatterns: ["@familybot"],
        },
        sandbox: {
          mode: "all",
          scope: "agent",
        },
        tools: {
          allow: ["read", "exec"],
          deny: ["write", "edit", "apply_patch", "browser", "cron"],
        },
      },
    ],
  },

  // 消息路由
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+8613811112222" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+8613811113333" } },
    },
    {
      agentId: "family",
      match: {
        channel: "whatsapp",
        peer: { kind: "group", id: "120363999999999999@g.us" },
      },
    },
  ],

  // Session 隔离
  session: {
    dmScope: "per-channel-peer",
    reset: {
      mode: "daily",
      idleMinutes: 120,
    },
  },
}
```

## 常见部署模式

### 模式一：家庭共享

一台家用 Mac mini 当 Gateway，家人各有自己的 Agent，公用一个 WhatsApp 号。谁发消息，Gateway 根据发件人号码路由到对应 Agent。技能池共享（天气、购物、菜谱），个人的 coding 技能只有自己能看到。

### 模式二：团队协作

团队共用一台 Gateway 服务器，每个人有自己的 Agent 和 workspace。通过 Slack/飞书等 Channel 接入，私聊消息自动路由到各自 Agent。共用技能（如 GitHub、Jira、文档搜索）放 `~/.openclaw/skills`，特定项目技能放各自 workspace。

### 模式三：一人多分身

同一个人在不同平台用不同人格的 Agent——比如 Telegram 上的是"深度工作 Agent"跑 Claude Opus 模型，WhatsApp 上的是"日常助理"跑 Sonnet 模型。技能共享，但人格和模型独立。

```json5
bindings: [
  { agentId: "deep-work", match: { channel: "telegram" } },
  { agentId: "daily", match: { channel: "whatsapp" } },
]
```

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

先在 `allowFrom` 里只加自己的联系方式测试几天，确认隔离正常、技能可用，再逐步加入其他人的号码。

## 总结

OpenClaw 的多 Agent 架构设计很干净，核心思路就三个：

1. **独立 Agent** = 独立的大脑（workspace、SOUL.md、session store）
2. **Bindings** = 消息分发规则（谁的消息去哪个大脑）
3. **Skills 分层** = 共享池（`~/.openclaw/skills`）+ 个人覆盖（`<workspace>/skills`）

不需要多开实例，不需要额外的服务器，一个 Gateway 就能让全家或全团队用上各自专属的 AI 助手。而且因为 Skills 可以复用，维护成本随着用户增加反而递减——这才是多人部署的正确打开方式。
