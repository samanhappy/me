---
author: 青扬
pubDatetime: 2026-05-12T10:00:00.000Z
modDatetime: 2026-05-12T10:00:00.000Z
title: "深入对比 OpenClaw 和 Hermes 的记忆系统"
featured: false
draft: false
tags:
  - OpenClaw
  - Hermes
  - AI Agent
  - Memory
description: "两个主流 AI Agent 框架的记忆系统深度对比：有界策划记忆 vs 可搜索长记忆，从设计哲学到实际使用边界，聊清楚该选哪个。"
---

> **TL;DR**：两个系统都用 MEMORY.md 存持久记忆，但设计哲学差很多。Hermes 是有界的策划记忆，分两个文件（MEMORY.md 存环境事实，USER.md 存用户画像），字符上限死的，塞满了得压缩。OpenClaw 是可搜索的长记忆，单一 MEMORY.md，靠向量+关键词混合检索，没有严格字符限制。在意精准控制上下文 token，选 Hermes；在意记忆容量和灵活检索，选 OpenClaw。

---

用 AI Agent 一段时间后，大多数人会遇到同一个问题：它记住了什么，又忘了什么？

记忆系统是 Agent 能不能越用越好的底层。我同时在跑 OpenClaw 和 Hermes，这篇文章把两套记忆系统拆开来对比，不讲框架概念，直接说区别在哪、各自的上限在哪。

## 两套系统各自怎么存记忆

### OpenClaw：一个 MEMORY.md，搜着用

OpenClaw 的持久记忆存在 Agent workspace 里的 MEMORY.md 文件里。这个文件你可以直接打开、读内容，甚至手动编辑——**人类可审计**是 OpenClaw 记忆系统最明显的特点。

检索走**混合搜索**（Hybrid Search），向量语义搜索和关键词匹配同时跑，合并排分。每次 Agent 需要记忆，系统自动检索相关条目注入上下文。没有严格的字符上限，记多少就有多少。

Session 和 Memory 是两个分开的概念。Session History 是当前对话的历史，每日凌晨重置、空闲重置或者 `/new` 都会清空。但 MEMORY.md 里的内容不随 Session 重置而消失，这是"持久记忆"的意义所在。

### Hermes：两个文件，有界有策略

Hermes 把记忆拆成了两个文件：

- **MEMORY.md**：Agent 的自我笔记，存环境事实、工具约定、学到的经验
- **USER.md**：用户画像，存你的偏好、沟通风格、期待

两个文件都存在 `~/.hermes/memories/` 下，有严格的字符上限：MEMORY.md 最多 2,200 字符（约 800 tokens），USER.md 最多 1,375 字符（约 500 tokens）。

每次 Session 开始时，这两个文件作为**冻结快照**注入系统 prompt。不是动态检索，是固定的一整块内容，Session 中途改了记忆，下次启动才能生效。这个设计是刻意的——保持系统 prompt 的前缀缓存稳定，减少 token 浪费。

记忆满了 Agent 会报错，要自己压缩：合并相关条目、删过时信息、再写新的。

## 核心差异：有界 vs 可搜索

这两套设计的根本分歧，在于对"记忆容量"的态度不同。

Hermes 的答案是有界的策划记忆。字符上限锁死，逼 Agent 主动管理和压缩。上下文 token 成本固定可控，每次 Session 开销一眼明了。但工作环境复杂、积累的偏好多，2,200 字符很快就装不下。

OpenClaw 的答案是可搜索的长记忆。没有硬性上限，靠检索按需拉取。理论上可以记住任意多的信息。但检索质量决定了记忆的有效性——某条记忆没被检索出来，它就相当于不存在。

> Hermes 的记忆是"始终在场的卡片"，OpenClaw 的记忆是"随时可查的档案馆"。

## 跨 Session 的历史怎么找

两个系统处理跨 Session 历史的方式也不一样。

Hermes 有 **Session Search**：所有 CLI 和消息对话都存在 SQLite (`~/.hermes/state.db`)，走 FTS5 全文搜索。Agent 可以用 `session_search` 工具检索上周聊过什么，结果通过 LLM 汇总后返回。这相当于一个无限容量的"回忆"层，按需搜索，平时不占 token。

OpenClaw 的 Session 历史在 Session 结束后清空，重要信息依赖 Agent 在对话中主动写入 MEMORY.md。没有内置的跨 Session 全文搜索——MEMORY.md 就是全部的持久层。

两套设计各有取舍：Hermes 的 Session Search 让你随时能找回过去的对话，但依赖一次额外的搜索+汇总。OpenClaw 的模型更简单——要么在记忆里，要么找不到。

## 主动学习：谁在帮你记

Hermes 有**后台评审**机制：每隔 N 轮对话，Agent 自动反思，更新 MEMORY.md 和 USER.md，以及创建或更新 Skills。目标是让 Agent 越用越懂你，不需要你每次都说"记住这个"。

OpenClaw 也支持 Agent 主动写入记忆，但没有专门的后台记忆管理进程。OpenClaw 的心跳机制（Heartbeat）侧重主动巡逻和任务触发，不是专门的记忆整理后台。

实际体验的差异是：用 Hermes 一段时间后，它对你的偏好和工作习惯的感知会逐渐变准，有种"越来越懂我"的感觉。OpenClaw 的记忆更多是显式的——你说了什么、它记住了什么，透明度高，但自动化程度低一些。

## 外部记忆插件

内置记忆系统不够用时，两个系统的扩展路径不同。

Hermes 官方提供 8 个外部记忆 Provider 插件：Honcho、OpenViking、Mem0、Hindsight、Holographic、RetainDB、ByteRover、Supermemory。这些插件在内置记忆之上叠加能力，比如知识图谱、语义搜索、自动事实提取、跨 Session 用户建模。

社区还有第三方的 **Mnemosyne** 项目，专门为 Hermes 设计的本地优先记忆系统，SQLite + 向量搜索，读取延迟在亚毫秒级，架构叫 BEAM（三层：工作记忆、情节记忆、草稿区），支持从 Mem0、Letta、Zep 等系统迁移数据。

OpenClaw 本身的设计更集中，没有官方的外部记忆 Provider 接口，扩展能力集中在 Skills 体系里。

## 安全这块

Hermes 在写入记忆前会做安全扫描：检测 prompt injection、凭证外泄、SSH 后门等模式，以及不可见 Unicode 字符，命中的条目直接拒绝写入。

这条设计背后是一个实际问题：当 Agent 能自主管理记忆，记忆注入系统 prompt 就成了一个潜在的攻击面，不能无条件信任写进去的内容。

OpenClaw 的人类可审计设计从另一个角度缓解了这个问题——直接打开 MEMORY.md 看发生了什么，异常很容易发现。两种思路，一个靠机器过滤，一个靠人类审计。

## 主要差异汇总

| 维度 | OpenClaw | Hermes |
|------|----------|--------|
| 记忆文件 | 单一 MEMORY.md | MEMORY.md + USER.md |
| 字符上限 | 无 | 2,200 + 1,375 字符 |
| 检索方式 | 混合搜索（向量+关键词） | 冻结快照注入 |
| 跨 Session 搜索 | 无内置 | FTS5 全文搜索 |
| 后台自动记忆 | 无专门机制 | 后台评审（每 N 轮） |
| 外部 Provider | 无官方接口 | 8 个官方插件 |
| 安全扫描 | 无 | 有 |
| 可审计性 | 文件直接可读写 | 文件可读，自动管理 |

## 用熟之后的几条避坑习惯

**Hermes 记忆满了别急着删**。2,200 字符的限制用一段时间后会触发。正确做法是让 Agent 合并相关条目，而不是随便删掉。信息密度高的条目越值得留。

**OpenClaw 的 MEMORY.md 要定期检查**。没有容量上限，记忆文件可能积累越来越多冗余信息，检索质量会跟着下降。建议每隔一段时间打开看一眼，手动清理过时内容。

**Hermes 的记忆更新有一轮延迟**。Session 中写入的记忆要下次 Session 才能在系统 prompt 里看到。刚告诉它一个重要偏好，本轮 Session 它依然"不知道"，下次聊才生效。

**两个系统都不是越记越好**。记忆系统的价值在于记住真正有用的信息，不是把所有对话都存下来。精华比全量更重要。

---

如果你正在用 OpenClaw，Hermes 提供了迁移工具 `hermes claw migrate`，可以直接导入 OpenClaw 的 MEMORY.md 和 USER.md 条目，迁移成本不高。

两套记忆系统的核心差异不复杂：一个追求确定性和精简，一个追求灵活性和容量。你的工作模式更接近哪一端，答案就在那里。
