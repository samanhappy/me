---
author: 青扬
pubDatetime: 2026-05-02T18:09:00.000Z
modDatetime: 2026-05-10T12:30:00.000Z
title: "一台 Gateway，多个人设：OpenClaw 多人共用完整指南"
featured: false
draft: false
tags:
  - OpenClaw
  - AI Agent
  - Feishu
  - WeChat
  - Deployment
  - Multi-User
description: "一台 Gateway 就能撑起多个 Agent 的人格。本文讲解隔离上下文、精准路由和技能共享，附飞书/微信多账号实战，让你告别重复部署。"
---

## 太长不读

之前有不少人问，想在团队里共用一台机器跑 OpenClaw，或者自己想挂两个飞书号，是不是得装好几个容器？其实真不用，门槛没想象的高。OpenClaw 原生就支持用一个 Gateway 调度多个 Agent。

核心就一条线：如果是给家人、自己团队这种**彼此信任**的人用，或者同一个业务的不同飞书/微信账号，一个 Gateway 就够；如果是给外面的客户、或者互不信任的人用，老老实实加机器拆开部署。

这篇文章主要是想带大家把这几个边界盘清楚：怎么隔离上下文、怎么分发消息、怎么复用技能。

*注：如果你刚接触 OpenClaw，可以先记住这几个概念：Gateway 是统一入口，负责接收消息和调度；每个 Agent 都有自己的“脑子”（workspace），里面放着定义人格的 `SOUL.md` 和记录偏好的 `USER.md`。下面我们就从这些“脑子”建起。*

## 第一个坑：到底需不需要起一堆容器

起初用 OpenClaw 大家通常是单台机器起个网关（Gateway），只挂一个 Agent 对接 Telegram 或微信。当团队需要共用，或者自己要在发版群和闲聊群挂不同的人格时，最直觉的反应是加机器、开新容器。

但只要在同一个信任域内，真的大可不必。

OpenClaw 默认采用“个人助理信任模型”。它本身不是做成 SaaS 那种强多租户隔离的。与其去折腾一堆 `docker-compose` 和端口转发，不如直接把多个身份丢进一个 `openclaw.json` 里。统一看日志、统一装技能，维护起来反而轻松得多。

## 第一步：让大家都有自己的脑子

默认配置下所有流量命中 `agentId: "main"`。要想多开，得先把个人的工作区剥离开。通过命令行随便敲两下：

```bash
openclaw agents add zhou
openclaw agents add lin
```

这会在 `~/.openclaw` 下把脑子物理切开，分别多出 `workspace-zhou` 和 `workspace-lin`，以及配套的 auth、session 和模型目录。

### 把个性化体现在 SOUL 和 USER 里

建好之后，进各自的 workspace 写个简单的 `SOUL.md` 和 `USER.md`。

周舟是个全栈开发，他希望 AI 说人话、能 review 代码。他的 `SOUL.md` 就可以规定：“遇到代码问题先考虑 TDD，回复短点，坚决不说废话。”
林宁是个运营，拿 AI 帮忙整理资料。她的 `SOUL.md` 就可以写：“重点提取飞书文档里的 TODO，用表格输出即可。”

这种冷启动预热，能让每个 Agent 从一上线就自带人设。

## 第二步：消息怎么分发才准

Gateway 此时虽然有了多个 Agent，但它不知道谁发的消息该给谁。我们需要配一段 `bindings` 做路由。

### 精准到人的路由
同一个微信或 Telegram 账号里，想让不同联系人调不同 Agent？把 `peer`（发送方）写死就行，它的优先级永远高于全局通配。以微信为例：

```json5
bindings: [
  { agentId: "zhou", match: { channel: "wechat", peer: { kind: "direct", id: "wxid_zhou" } } },
  { agentId: "lin", match: { channel: "wechat", peer: { kind: "direct", id: "wxid_lin" } } }
]
```

对接其他渠道（如 Telegram）改 `channel` 和对应 ID 即可，逻辑完全一致。

### 微信接入指南：从零搭一条微信通道

上面的路由示例假设微信通道已经就绪。但 OpenClaw 的微信通道并非内置在核心仓库中，而是通过腾讯官方的外部插件 `@tencent-weixin/openclaw-weixin` 来实现的。完整接入分四步：

**① 安装插件**

```bash
# 快速安装
npx -y @tencent-weixin/openclaw-weixin-cli install

# 或通过 OpenClaw 插件系统安装
openclaw plugins install "@tencent-weixin/openclaw-weixin"
```

安装完成后，启用插件并重启 Gateway：

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

插件安装后，Gateway 会自动发现其清单（manifest）、加载入口，并将 `openclaw-weixin` 注册为可用渠道。

**② 扫码登录**

在运行 Gateway 的同一台机器上执行扫码命令：

```bash
openclaw channels login --channel openclaw-weixin
```

终端会弹出二维码，用手机微信扫描并确认登录。插件在扫码成功后会将账号凭证（token）保存在本地的 OpenClaw 状态目录下，之后无需重复登录。

**③ 挂多个微信账号**

如果要在一台机器上同时挂两个微信账号（比如个人号 + 工作号），只需再执行一次登录命令即可：

```bash
openclaw channels login --channel openclaw-weixin
```

第二次扫码后，两个账号的凭证会分开存储。务必将 Session 隔离策略设置为：

```bash
openclaw config set session.dmScope per-account-channel-peer
```

这确保不同微信账号的私聊上下文按账号、渠道和发送方三个维度彻底隔离，互不相干。

**④ 访问控制：审批新联系人**

微信渠道的私聊消息采用与 OpenClaw 其他渠道一致的配对（Pairing）与白名单模型。首次收到陌生人的消息时，不会被自动处理。你需要先查看待审批的发送方列表：

```bash
openclaw pairing list openclaw-weixin
```

确认无误后，执行审批：

```bash
openclaw pairing approve openclaw-weixin <sender_id>
```

审批通过后，该联系人即可与对应的 Agent 正常对话。当有多个微信账号时，审批是针对具体账号的，不会出现 A 账号的审批误开放给 B 账号的情况。

### 挂多个账号的矩阵

很多团队最实用的场景其实是飞书矩阵：一个做公司内部知识库，一个做对外支持。直接拿下 `accountId`：

```json5
channels: {
  feishu: {
    accounts: {
      intern: { appId: "cli_1", appSecret: "***", name: "内部助手" },
      support: { appId: "cli_2", appSecret: "***", name: "外部客服" }
    }
  }
},
bindings: [
  { agentId: "internal", match: { channel: "feishu", accountId: "intern" } },
  { agentId: "support", match: { channel: "feishu", accountId: "support" } }
]
```

微信这边完成了上述插件安装和多账号登录后，同样通过不同的 `accountId` 进入不同的绑定，实现与飞书矩阵完全对等的多账号调度。

## 第三步：防串线的关键开关

**多用户最容易翻车的地方，不是启动报错，而是张三看到了李四的对话上下文。** 

这通常是因为没配 Session 隔离。只要大家在共用一条总线，一定要记得在配置里挂上这句：

```json5
session: {
  dmScope: "per-account-channel-peer"
}
```

这句话看着不起眼，但它相当于一把锁，严格按账号、渠道、联系人把聊天状态切碎，避免不同人的历史记录被缝合到一起。

## 第四步：共享技能，但保留个性

共用一台服务器最大的好处就在这儿：不用一遍遍装环境。

你装个查天气的或者查 GitHub 的 Skill，丢在全局目录 `~/.openclaw/skills` 下，默认所有人都能调用。但很多时候，不同角色需要的动作颗粒度不同。

1. **白名单控制**：不想让运营用到危险的 shell 命令，就在 `list` 里写死 `skills: ["weather", "shopping"]`。
2. **局部覆盖**：如果周舟想要自己魔改一个 GitHub 审查工具，直接在自己的 `workspace-zhou/skills/github` 里手搓一份同名配置。框架会自动优先用离自己近的，不影响别人。

> 小提醒：即使在信任域内，也应按角色限制权限。假设全局技能库里有个能直连线上数据库的脚本，而林宁的 Agent 不小心被引导执行，那就不只是“串线”的问题了。守住最小权限，用得越久越踏实。

## 用熟之后的几条避坑习惯

- **群组里开沙箱要权衡**：只要你的 Agent 会进群，不管是不是熟人群，都建议把沙箱约束拉高。群聊里各种奇怪的指令防不胜防。最严格的做法是：
  ```json5
  sandbox: { mode: "all", scope: "agent" }
  ```
  但这会**关闭几乎所有工具调用**，只保留纯文本对话。如果你的 Agent 需要在群里查天气、搜文档，可以改成结合技能白名单和限定允许动作，而不是一刀切关停所有沙箱。

- **先跑干测试再开放**：先在 `allowFrom` 里只放自己的联系方式，连通测试通过、确信串不进别人上下文之后，再去把硬限制端掉。

- **留心权限的连带影响**：发现 `exec` 权力过大想禁掉（deny）时需要注意，一旦某个 Skill 底层依赖了这个权限，那么该 Skill 可能因为授权失败而无法正常返回结果（比如既不能改系统，连带着 tail 个日志也会静默失败）。排查时容易误以为是 Skill 本身坏了，实际是权限被截断。

## 一份可抄作业的配置骨架

把上面分散的配置拼在一起，你就得到了一个多 Agent、多账号的最小可用 `openclaw.json`。敏感值用占位符替换，对着改就行：

```json5
{
  "agents": {
    "internal": { "workspace": "workspace-internal" },
    "support": { "workspace": "workspace-support" }
  },
  "channels": {
    "feishu": {
      "accounts": {
        "intern": { "appId": "cli_xxx", "appSecret": "***", "name": "内部助手" },
        "support": { "appId": "cli_yyy", "appSecret": "***", "name": "外部客服" }
      }
    }
  },
  "bindings": [
    { "agentId": "internal", "match": { "channel": "feishu", "accountId": "intern" } },
    { "agentId": "support", "match": { "channel": "feishu", "accountId": "support" } }
  ],
  "session": {
    "dmScope": "per-account-channel-peer"
  },
  "sandbox": {
    "mode": "all",
    "scope": "agent"
  }
}
```

把这段骨架存好，之后加人、加账号、调权限都在这个基础上改，能少走很多弯路。