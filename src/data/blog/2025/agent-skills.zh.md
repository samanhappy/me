---
author: 青扬
pubDatetime: 2025-10-21T10:00:00.000Z
title: Agent Skills 核心要义
featured: false
draft: true
tags:
  - AI
description: 介绍 Agent Skills 的定义、设计原则等。
---

## 定义

简单来说，Agent Skills 只是一组 Skill 目录，每个 Skill 目录下包含一组文件：

- SKILL.md：核心定义
- 引用指令
- 可执行代码。

这些文件可以为 agent 提供额外的指令上下文和确定性代码能力。

## 设计原则

渐进式加载是 Agent Skills 的核心设计原则。

## 对比

和 MCP 相比，Skills 更简单，只是文件而已。

## 参考

- [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
