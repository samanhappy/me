---
author: 青扬
pubDatetime: 2026-05-03T17:45:00.000Z
modDatetime: 2026-05-03T17:45:00.000Z
title: "OpenClaw 心跳机制：让你的 AI 学会自主巡逻"
featured: false
draft: true
tags:
  - OpenClaw
  - AI Agent
  - Automation
description: "详解 OpenClaw 心跳（Heartbeat）机制——它是什么、和 Cron 有什么区别、怎么开怎么关、关闭后能省多少 Token。"
---

你第一次装上 OpenClaw，配好模型、连上 Telegram，一切都很新鲜。然后过了一段时间——可能一天，可能一周——你发现了一个问题：这家伙好像只会被动等消息。你不找它，它就彻底安静。

这不是 bug。OpenClaw 的默认设计就是被动响应的——收到一条消息，执行一次推理，回复结果，然后休眠。

但真正的 AI 助理不应该只是"随叫随到"。它应该能主动帮你盯着事情：邮件到了没？日历上的会议要开始了吗？服务器磁盘是不是快满了？

这就是心跳（Heartbeat）机制存在的意义。

![OpenClaw Heartbeat 心跳机制](../../../assets/images/openclaw-heartbeat.png)

## 心跳是什么：Agent 的"自主巡逻"

心跳是 OpenClaw 的一项内置机制：让 Agent 按照固定间隔主动"醒来"，检查有没有需要关注的事情。

可以把它理解成一个定时巡逻的保安。每 30 分钟（默认），Agent 打开 `HEARTBEAT.md` 这份"巡逻清单"，逐项检查。如果一切正常，回复一个 `HEARTBEAT_OK`，然后继续睡觉。如果发现了值得注意的事——一封紧急邮件、一个快到期的任务——它会主动给你发消息。

> **核心设计哲学**：心跳是"门卫"（gate），不是"流水线"（workflow）。它的本职工作不是执行复杂任务，而是判断——有没有什么值得我醒过来告诉主人的？

## 心跳怎么工作

心跳的一轮完整流程：

```
定时触发（默认 30 分钟）
    ↓
Agent 醒来，读取 HEARTBEAT.md
    ↓
逐项检查（收件箱 / 日历 / 系统状态 / 自定义任务）
    ↓
有需要关注的事？── 是 → 主动给你发消息
    │
    否 → 回复 HEARTBEAT_OK → 继续睡觉
```

### HEARTBEAT.md：你的巡逻清单

心跳读的是一份放在 Agent workspace 里的 Markdown 文件。OpenClaw 官方提供了一个极简模板：

```markdown
# 保持此文件为空（或只有注释）以跳过心跳 API 调用。

# 添加以下任务，让 Agent 定期检查某些事项。
```

一个实用的 `HEARTBEAT.md` 长这样：

```markdown
# 心跳检查清单

- 快速扫一眼收件箱：有没有紧急未读邮件？
- 如果是白天，看看接下来 2 小时内有没有需要准备的会议。
- 如果某个任务被阻塞了，记下来缺什么，下次聊天时提醒我。
```

**关键细节**：如果 `HEARTBEAT.md` 文件存在但实际内容为空（只有空行和标题），OpenClaw 会直接跳过本轮心跳，连 API 调用都省了。官方日志里会记为 `reason=empty-heartbeat-file`。

### 内嵌 tasks：更精细的节奏控制

你还可以在 `HEARTBEAT.md` 里定义不同频率的子任务：

```markdown
tasks:
  - name: inbox-triage
    interval: 30m
    prompt: "检查是否有紧急未读邮件，标记需要马上处理的。"
  - name: calendar-scan
    interval: 2h
    prompt: "检查接下来 4 小时内的会议，需要我提醒准备吗？"
  - name: system-health
    interval: 6h
    prompt: "检查服务器磁盘和内存，如果超过 80% 就告警。"

# 其他说明
- 告警尽量简短。
- 如果所有 task 都没有需要关注的事，回复 HEARTBEAT_OK。
```

这样你不需要为每个检查写一个 Cron 任务——一份 `HEARTBEAT.md` 就够了。心跳每 30 分钟跑一次，但 `calendar-scan` 只在每 2 小时的整点才触发，`system-health` 每 6 小时一次。

### HEARTBEAT_OK 协议

这是心跳机制里最精妙的设计。Agent 不是每条心跳回复都发给你——那样你会被垃圾消息淹死。

心跳有一套"响应协议"：

1. 如果 Agent 判断一切正常，它回复 `HEARTBEAT_OK`。
2. Gateway 检测到这个标记，**自动丢弃这条回复**——你不会收到任何通知。
3. 如果 Agent 发现了需要关注的事，它**不包含** `HEARTBEAT_OK`，直接发送提醒内容。
4. Gateway 看到没有 `HEARTBEAT_OK`，知道这是"真消息"，推送到你手机。

核心逻辑：**你是人，不是日志系统。只有重要的东西才该弹通知。**

## 心跳 vs Cron：巡逻和闹钟是两回事

很多人第一次看到心跳会问："这不就是定时任务吗？我有 Cron 了还要心跳干嘛？"

他们是两种完全不同的机制。

| 维度 | 心跳（Heartbeat） | 定时任务（Cron） |
|------|------------------|-----------------|
| **本质** | 巡逻：看看有没有需要关注的 | 闹钟：到点就执行 |
| **触发** | 周期性（默认 30 分钟），时间不精确 | 精确时间（cron 表达式） |
| **上下文** | 运行在主 Session 中，能看到完整对话历史 | 默认隔离 Session，不加载历史 |
| **回复** | 有 `HEARTBEAT_OK` 静默协议 | 每次都产出内容 |
| **适用** | 收件箱检查、日历监控、异常检测 | 每日早报、周报、精确时间提醒 |

一句话总结：

> **心跳适合"盯"——持续关注状态变化。Cron 适合"播"——在精确时间点推送内容。**

举个实际例子：

- 用**心跳**：每 30 分钟检查一次日历，发现接下来 2 小时内有会议就提醒你。会议时间改了？心跳能自动适应。
- 用 **Cron**：每天早上 9 点推送"今日新闻早报"。不管你起没起床、看不看手机，9 点准时到。

它们不冲突，是互补的。我自己就两种都在用——心跳盯日历和收件箱，Cron 做每天 9:30 的新闻早报和 10:00 的 GitHub 动态。

## 心跳的实用场景

### 场景一：收件箱哨兵

最经典的用法。写一个 `HEARTBEAT.md`，让 Agent 定期扫描未读邮件，只在你收到"真正重要的"邮件时才提醒。不是每封邮件都弹通知——心跳的"门卫"哲学在这里体现得最充分。

### 场景二：日历守护者

"下午 2 点有客户会议，你还没准备演示文档。"

Agent 的心跳每 30 分钟检查一次日历，提前发现你忘了准备的会议。这是"主动提醒"，和你在日历 App 里设的被动闹钟是两种体验。

### 场景三：系统健康监控

如果你把 OpenClaw 跑在服务器上，心跳可以帮你监控磁盘、内存、进程状态：

```markdown
tasks:
  - name: system-health
    interval: 1h
    prompt: "执行 df -h 和 free -m，如果磁盘超过 80% 或内存超过 90%，告警。"
```

### 场景四：提醒你"该休息了"

心跳里有一个贴心的默认行为——"在白天偶尔 check-in 一下你的主人"。结合 `activeHours`（活跃时间窗口），Agent 会在你醒着的时候偶尔发一句"有什么需要帮忙的吗？"，但绝不会半夜吵你。

### 场景五：手动唤醒

有时候你想立刻触发一次心跳，不等下次定时：

```bash
openclaw system event --text "检查一下有没有紧急邮件" --mode now
```

`--mode now` 会让 Agent 立刻执行一次心跳，`--mode next-heartbeat` 则等到下一次定时触发。

## 如何开启和配置心跳

### 最简配置——开箱即用

心跳默认就是开启的，间隔 30 分钟。如果你什么都不改，Agent 已经在默默巡逻了。

但默认配置有一个问题：**它运行在主 Session 中，携带完整对话历史**。如果你的对话已经跑了上百轮，每次心跳都要把几万 token 的历史上下文重新发给模型——这是心跳最大的隐性成本。

### 推荐配置——省钱又有效

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last",               // 有消息时发到上次用的频道
        isolatedSession: true,        // 🔑 独立 Session，不加载对话历史
        lightContext: true,           // 🔑 只加载 HEARTBEAT.md，不加载其他启动文件
        skipWhenBusy: true,           // Agent 正忙时跳过
        activeHours: {
          start: "08:00",
          end: "23:00",
          timezone: "Asia/Shanghai",
        },
        model: "deepseek/deepseek-chat-v4",  // 用便宜的模型跑心跳
      },
    },
  },
}
```

逐个解释：

| 配置项 | 作用 | 推荐值 |
|--------|------|--------|
| `every` | 心跳间隔 | `"30m"` 适中；`"10m"` 更及时但贵；`"1h"` 省钱 |
| `target` | 消息发到哪里 | `"last"`（上次用的频道）；不想被打扰设 `"none"` |
| `isolatedSession` | 是否独立 Session | `true`——大幅节省 Token |
| `lightContext` | 是否精简上下文 | `true`——只加载 HEARTBEAT.md |
| `skipWhenBusy` | 忙时跳过 | `true`——避免 Sub-agent 或 Cron 运行时冲突 |
| `activeHours` | 活跃时间窗口 | 设成你的清醒时间段，半夜不跑 |
| `model` | 心跳专用模型 | 用便宜的模型（DeepSeek V4 Flash 之类） |

### Per-agent 心跳

如果你有多个 Agent，只给特定 Agent 开启心跳：

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last",
      },
    },
    list: [
      { id: "main", default: true },   // 主 Agent，不跑心跳
      {
        id: "ops",                      // 运维 Agent，独跑心跳
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "123456789",
          prompt: "Read HEARTBEAT.md. Check server health and inbox. Reply HEARTBEAT_OK if all clear.",
        },
      },
    ],
  },
}
```

> 注意：一旦在 `agents.list[]` 中任何 Agent 定义了 `heartbeat` 块，就**只有那些 Agent** 会跑心跳。全局默认不再自动生效。

### 多账号场景

你的 Telegram 挂了两个 Bot（个人和工作），心跳只发给工作号：

```json5
{
  agents: {
    list: [{
      id: "ops",
      heartbeat: {
        every: "1h",
        target: "telegram",
        to: "12345678:topic:42",
        accountId: "work-bot",
      },
    }],
  },
  channels: {
    telegram: {
      accounts: {
        "work-bot": { botToken: "你的工作 Bot Token" },
      },
    },
  },
}
```

## 如何关闭心跳和关闭后的效果

### 彻底关闭

一行配置：

```json5
{
  agents: {
    defaults: {
      heartbeat: { every: "0m" },
    },
  },
}
```

把 `every` 设为 `"0m"`，心跳就完全停了。常见的关闭原因：

- 你是轻度用户，不需要 24/7 后台监控
- 你在用按量付费的模型，想节省 API 费用
- 你只用 Cron 就够了，不需要心跳的自主判断

### 关闭后的效果

**短期效果**：Agent 不再主动醒来检查状态。你的收件箱、日历、系统状态将失去自动监控——除非你手动问它。

**Token 节省效果**：这是关闭心跳最直接的好处。我们来算一笔账。

默认配置下的心跳（30 分钟间隔，主 Session，加载全部上下文）：

```
心跳频率：每 30 分钟 → 每天 48 次
每次消耗 Token：主 Session 对话历史 + 系统提示词 ≈ 20,000–50,000 token
每天 Token 消耗：48 × 35,000 ≈ 1,680,000 token
```

**一天光心跳就跑掉 168 万 token。** 用 DeepSeek V4 Flash（输入 $0.14/百万 token）：

```
每天心跳成本：1.68M × $0.14 ≈ $0.235/天
每月心跳成本：$0.235 × 30 ≈ $7/月
```

相比之下，优化后的心跳（独立 Session + 精简上下文）：

```
每次消耗 Token：~2,000–5,000 token（只有 HEARTBEAT.md + 默认 prompt）
每天 Token 消耗：48 × 3,500 ≈ 168,000 token
每天心跳成本：0.168M × $0.14 ≈ $0.023/天
每月心跳成本：$0.023 × 30 ≈ $0.70/月
```

同样跑心跳，优化后成本只有原来的 **1/10**。

关闭心跳则直接省下这 $0.70–$7/月。虽然绝对值不大，但如果你同时用着 Claude Sonnet 4 当主力模型、又没配 `isolatedSession: true`，关闭心跳可能一个月省几百块。

### 按需关闭（保留能力但不自动跑）

还有一个折中做法：保留 `HEARTBEAT.md`，关闭自动心跳，用 `--mode now` 手动触发：

```json5
// 关闭自动心跳
{ heartbeat: { every: "0m" } }
```

```bash
# 需要时手动触发
openclaw system event --text "检查一下今天有没有紧急邮件" --mode now
```

这样你保留了巡逻的能力，但不会在不需要的时候白白消耗 Token。

## 成本优化的五个技巧

如果你不想完全关闭心跳，但想省 Token，五个优化方向：

| 技巧 | 省多少 | 代价 |
|------|--------|------|
| `isolatedSession: true` | 大幅（每次心跳从 3 万 token 降到 3 千） | 心跳看不到对话历史，无法引用之前的上下文 |
| `lightContext: true` | 中等（去除 AGENTS.md 等启动文件） | 只保留 HEARTBEAT.md |
| 延长间隔 | 直接（从 30 分钟改 1 小时 = 省一半） | 巡逻密度降低 |
| 用便宜模型 | 按模型价格差异 | 巡逻的判断质量可能下降 |
| `activeHours` 限时 | 直接（每天只跑 15 小时 = 省 37.5%） | 睡眠时间没有监控 |

**最推荐的组合拳**：`isolatedSession: true` + `lightContext: true` + `activeHours` + DeepSeek V4 Flash。每月心跳成本控制在 $0.50 以内。

## 总结

心跳是 OpenClaw 从"被动聊天机器人"变成"主动 AI 助理"的关键机制。

几个要点：

- **心跳 ≠ Cron**。心跳是巡逻（关注状态变化），Cron 是闹钟（精确时间执行）。
- **HEARTBEAT_OK 协议**是精华——只有值得关注的事才会打扰你。
- **默认配置很贵**。不配 `isolatedSession`，每天心跳可能吃掉 168 万 token。
- **优化后极便宜**。独立 Session + 便宜模型，月成本不到 $1。
- **关闭也很简单**：`every: "0m"` 一行搞定。

要不要开心跳，取决于你有多需要 Agent 的"主动意识"。如果你只是偶尔聊天的轻度用户，关了省钱。如果你想让 Agent 帮你盯着邮件、日历和系统状态，开着它，但记得配好 `isolatedSession`。
