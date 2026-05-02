---
author: 青扬
pubDatetime: 2026-05-02T19:00:00.000Z
modDatetime: 2026-05-02T19:00:00.000Z
title: "2026 年，用性价比最高的方式拥有你的专属 OpenClaw"
featured: false
draft: true
tags:
  - OpenClaw
  - DeepSeek
  - AI Agent
  - 云部署
description: "从选服务器到选模型，完整的 OpenClaw 部署指南。重点推荐 DeepSeek V4 Flash——现阶段养龙虾性价比最高的模型。"
---

OpenClaw 已经火了大半年。作为一个能读懂你的文件、执行你的命令、帮你回消息的 AI 代理，它不像 ChatGPT 那样只是个聊天窗口——它更像一个住在你服务器里的数字分身，24 小时待命。

但问题来了：怎么部署最划算？选什么模型既不贵又好用？

这篇文章是我实践了三个月的总结。不讲虚的，直接给方案。

![OpenClaw - 你的数字分身](../../../assets/images/openclaw-install-hero.png)

## 选服务器：花多少，得什么

OpenClaw 需要一台 24 小时在线的机器。虽然它支持本地部署，但家用电脑一关机就断联，出差在外也连不上。所以云服务器是更好的选择。

### 方案一：腾讯云轻量应用服务器

腾讯云是 OpenClaw 在国内最早的合作伙伴，提供了专门的"龙虾镜像"——买完服务器，OpenClaw 已经预装好了，开箱即用。

**推荐配置**：2 核 2G 内存，境外地域（新加坡/香港）

**价格**：活动价约 99 元/年（约 8 元/月）

**为什么选境外？**

- 海外服务器访问 GitHub、Docker Hub 毫无障碍
- 连接 OpenAI / Anthropic / DeepSeek 等 API 不需要额外代理
- 境内服务器后续升级和使用会遇到各种墙相关的问题

腾讯云活动页通常有专门的 OpenClaw 入口，选"境外轻量服务器"那个，不要选境内的。[活动链接](https://cloud.tencent.com/act/pro/lighthouse-moltbot)

### 方案二：阿里云 ECS

阿里云也有类似的 OpenClaw 一键镜像。流程基本一样：买 ECS → 选 OpenClaw 镜像 → 启动 → 配置。

**推荐配置**：2 核 2G，境外地域

**价格**：新用户约 68-99 元/年

### 方案三：Hetzner（海外性价比之选）

如果你不介意全英文的控制台，Hetzner 是目前全球性价比最高的 VPS。

**推荐配置**：CX22（2 核 4G 内存，40GB SSD）

**价格**：约 €3.79/月（约 30 元/月，360 元/年）

Hetzner 的优势是硬件扎实，网络稳定，不会像国内云那样有各种隐形限制。缺点是没有一键镜像，需要自己手动装 Docker 和 OpenClaw——但也就几条命令的事。

### 方案四：Oracle Always Free（零成本）

Oracle Cloud 提供永久免费的 ARM 服务器：4 核 CPU、24GB 内存——跑 OpenClaw 绰绰有余。

**价格**：$0/月

缺点是注册门槛高（需要信用卡验证），而且"永久免费"的前提是 Oracle 不回收（偶尔会发生）。适合想折腾的技术玩家。

### 方案对比一览

| 方案 | 配置 | 年费 | 适合谁 |
|------|------|------|--------|
| 腾讯云轻量 | 2C2G | ~99 元 | 国内用户，想要开箱即用 |
| 阿里云 ECS | 2C2G | ~99 元 | 已有阿里云账号的用户 |
| Hetzner CX22 | 2C4G | ~360 元 | 追求硬件质量，不介意英文 |
| Oracle Free | 4C24G | 0 元 | 技术玩家，愿意折腾注册 |

> 后续步骤以腾讯云境外轻量服务器为例，其他方案大同小异。

## 安装 OpenClaw

### 一键部署（腾讯云/阿里云）

购买服务器时选择 OpenClaw 应用镜像，启动后直接访问 `http://<公网IP>:18789` 就能看到管理后台。

如果用的是纯净系统，手动安装：

```bash
# SSH 登录服务器后
curl -fsSL https://openclaw.ai/install.sh | bash
```

### 别忘了安全组

这是新手最容易踩的坑。服务器买好了，镜像装好了，但浏览器打不开管理后台——十有八九是安全组没放行端口。

在云控制台的安全组设置中，放行以下端口：

| 端口 | 用途 |
|------|------|
| 18789 | OpenClaw 管理后台 |
| 443 | HTTPS（Webhook 回调） |
| 22 | SSH 管理 |

## 选模型：这场仗，模型比服务器更重要

服务器花的是固定成本，一年一百块到头了。但模型是跑得越多花得越多——选错了模型，一个月 API 费用轻松超过一年的服务器费用。

过去三个月我试了七八个模型，结论很明确：

> **DeepSeek V4 Flash 是现阶段养 OpenClaw 性价比最高的模型，没有之一。**

不是因为它最强，而是因为它在"够用"和"便宜"之间找到了最佳平衡点。

![模型价格对比：DeepSeek V4 Flash vs 其他](../../../assets/images/openclaw-install-pricing.png)

### DeepSeek V4 Flash 技术规格

2026 年 4 月发布，DeepSeek V4 家族的两个成员：

| | V4 Flash | V4 Pro |
|---|---|---|
| 总参数量 | 284B | 1.6T |
| 激活参数 | 13B | 49B |
| 架构 | MoE（混合专家） | MoE |
| 上下文窗口 | **100 万 token** | **100 万 token** |
| 定位 | 速度优先，高吞吐 | 旗舰推理，最强能力 |

V4 Flash 是 MoE 架构的精髓体现——284B 的总参数保证了知识广度，但每次推理只激活 13B，所以速度快、成本低。100 万 token 的上下文窗口更是离谱：你可以把一整本技术书丢进去，它都能处理。

### 价格对比：省多少？

直接看数据（单位：美元 / 百万 token）：

| 模型 | 输入价格 | 输出价格 | 缓存输入 |
|------|---------|---------|---------|
| **DeepSeek V4 Flash** | **$0.14** | **$0.28** | $0.0028 |
| DeepSeek V4 Pro | $1.74 | $3.48 | - |
| Claude Sonnet 4 | $3.00 | $15.00 | $0.75 |
| GPT-4o | $2.50 | $10.00 | $1.25 |
| Gemini 2.5 Flash | $0.15 | $0.60 | $0.04 |
| GLM 4.5 Air（免费） | $0 | $0 | $0 |

算一笔账。假设你是一个中度 OpenClaw 用户——每天让它帮你查资料、写代码、回消息，日均消耗约 50 万 token（含上下文），输入输出比例 3:1：

- **DeepSeek V4 Flash**：输入 37.5 万 × $0.14 + 输出 12.5 万 × $0.28 ≈ **$0.088/天，$2.6/月**
- **Claude Sonnet 4**：输入 37.5 万 × $3.00 + 输出 12.5 万 × $15.00 ≈ **$3.0/天，$90/月**
- **GPT-4o**：输入 37.5 万 × $2.50 + 输出 12.5 万 × $10.00 ≈ **$2.2/天，$66/月**

DeepSeek V4 Flash 的月费是 Claude Sonnet 4 的 **1/34**，是 GPT-4o 的 **1/25**。

而且，DeepSeek 的缓存定价（$0.0028/百万 token）简直白送——当你反复使用相同的系统提示词和上下文时，大量 token 命中了缓存，实际成本还会更低。

### 能力够不够？

一个问题：这么便宜，能力会不会差太多？

说实话，V4 Flash 在最高难度的代码推理和数学证明上，确实比不过 Claude Opus 或 V4 Pro。但对于 OpenClaw 的日常场景——理解你的问题、搜索信息、写代码片段、回消息、管理日历——V4 Flash 完全够用。

它的 100 万 token 上下文尤其重要：OpenClaw 的系统提示词、技能定义、用户偏好加起来可能就占了几万 token，还有对话历史和搜索结果……上下文窗口不够大，Agent 就会"忘记"前面的内容。V4 Flash 的 1M 窗口让你基本不用担心这个。

### 在 OpenClaw 中配置 DeepSeek V4 Flash

两种方式：直接连 DeepSeek API，或者通过 OpenRouter。

**方式一：DeepSeek 官方 API**（推荐，最便宜）

```json5
{
  models: {
    providers: {
      deepseek: {
        baseUrl: "https://api.deepseek.com",
        apiKey: "sk-xxx",  // 从 platform.deepseek.com 获取
        api: "openai-completions",
        models: [
          { id: "deepseek-chat", name: "DeepSeek V4 Flash" },
        ],
      },
    },
  },
}
```

**方式二：OpenRouter**（方便对比切换）

```json5
{
  models: {
    providers: {
      openrouter: {
        baseUrl: "https://openrouter.ai/api/v1",
        apiKey: "sk-or-v1-xxx",
        models: [
          { id: "deepseek/deepseek-chat-v4", name: "DS V4 Flash" },
        ],
      },
    },
  },
}
```

> DeepSeek API 充值很方便，支持支付宝。最低充值 $1 就能起步。

## 配置通道：把 AI 带到你常用的聊天工具里

模型配好了，接下来是让 OpenClaw 和你日常用的聊天工具连通。OpenClaw 支持几乎所有主流平台：

| 平台 | 适合场景 | 复杂度 |
|------|---------|--------|
| Telegram | 个人使用（最推荐） | ⭐ 简单 |
| Discord | 社区/团队 | ⭐⭐ 中等 |
| WhatsApp | 个人使用 | ⭐⭐ 中等 |
| Slack | 工作团队 | ⭐⭐ 中等 |
| 企业微信/钉钉/飞书 | 国内企业 | ⭐⭐⭐ 较复杂 |

Telegram 是个人使用最推荐的选择——创建 Bot 只需在 @BotFather 聊两句，拿到 Token 填进 OpenClaw 后台就通了。

国内即时通讯工具的接入稍微复杂，需要企业认证和回调配置。具体教程可以参考腾讯云/阿里云的 OpenClaw 专区文档，步骤很详细这里不赘述。

## 进阶：多用户共用一台服务器

如果你想让家人或同事也使用你的 OpenClaw 服务器，不需要再买一台——一个 Gateway 就能支撑多个用户。核心思路：

1. **创建独立 Agent**：`openclaw agents add 用户名`，每个人有独立的 workspace 和 session
2. **配置 SOUL.md**：给每个人的 AI 助手写不同的人格定义
3. **设置 dmScope**：`per-channel-peer` 确保会话隔离
4. **Skills 共享**：通用技能放 `~/.openclaw/skills`，个人的放各自 workspace

详细的配置方法，可以参考我另一篇文章《[OpenClaw 多用户部署实战：隔离、偏好与技能复用](/blog/openclaw-multi-user-deployment)》。

## 总结

跑一个 OpenClaw 的全成本：

| 项目 | 月费 |
|------|------|
| 腾讯云轻量服务器（境外） | ~8 元 |
| DeepSeek V4 Flash API | ~18 元（$2.6） |
| **合计** | **~26 元/月** |

一杯咖啡的钱，换一个 24 小时待命的 AI 私人助理。

而且这个成本还有下降空间：如果你用 Oracle 的免费服务器，每月开销就只有 API 的十几块钱。如果你用量不大，甚至可以先用 GLM 4.5 Air 等免费模型跑起来，零成本入门。

养一只龙虾不贵，关键是选对模型。DeepSeek V4 Flash 就是目前最对的选择。
