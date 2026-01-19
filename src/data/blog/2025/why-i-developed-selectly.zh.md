---
author: 青扬
pubDatetime: 2025-09-19T04:59:04.866Z
modDatetime: 2025-09-19T04:59:04.866Z
title: 为什么我要开发另一款网页划词插件 —— Selectly
featured: false
draft: false
tags:
  - AI
  - 产品
description: 介绍我开发的网页划词插件 Selectly 的初衷、功能和未来展望。
---

## 缘起

网页划词的需求由来已久，市面上相关插件也不少。那为什么我还要“重复造轮子”，再开发一款新的呢？

最初的动机其实很简单：我只想要一个好用的划词翻译插件。市面上的选择虽然丰富，但要么依赖传统翻译接口（如谷歌翻译），效果不够理想；要么接入大语言模型，却存在灵活性不足或成本过高的问题。

而我的需求很朴素：当我浏览英文网站时，遇到不懂的单词或句子，只想通过划词快速获得一个简洁、准确、不啰嗦的解释。其实这只需要一次 LLM 调用 + 一个合适的提示词就能解决。既然找不到现成的方案，那就自己“vibe coding”造一个吧。

![Selectly 翻译功能](@/assets/images/translate.png)

## 过程

翻译功能很快实现了。但在做的过程中，我发现基于“划词 + LLM”其实能做更多事：解释、润色、纠错……既然已经有了一个功能，为什么不顺手多做几个？甚至进一步，让用户能自定义？这便是 Selectly 诞生的契机。

![Selectly](@/assets/images/selectly.png)

Selectly 的定位，是一款基于“网页划词 + 人工智能”的可扩展工具集。我认为，尽管大语言模型已经逐渐走入个人生活，但网页端的划词需求依然远未被满足。

那么，Selectly 到底能做什么呢？

![Selectly 功能](@/assets/images/functions.png)

在 LLM 调用类功能中，除了翻译，还内置了润色、解释、纠错等。这些功能本质上只是在提示词和呈现方式上有所不同。更重要的是，Selectly 允许用户添加自定义功能模块：只需选择模型、输入提示词，就能构建出完全个性化的功能。

![Selectly 自定义功能](@/assets/images/add_function.png)

当然，划词除了 AI 相关，还长期存在一些基础需求：搜索、收藏、分享等。过去，这些要么依赖多个插件组合，要么体验欠佳。既然 Selectly 定位为“全家桶式”工具集，就必须把这些功能也打磨到位。

比如 **收藏**，我们提供了一个内容中心页，能根据网页自动分组，方便回顾。

![Selectly 收藏功能](@/assets/images/content_center.png)

比如 **分享**，选中文本后点击分享，可以生成一张带有网页标题和地址的分享图片，支持复制或下载。

![Selectly 分享功能](@/assets/images/share.png)

工具一多，如果每次划词都全部弹出，体验显然不够优雅。为此，Selectly 提供了功能的开关、排序与收起选项，用户可以根据偏好自由定制。

![Selectly 功能定制](@/assets/images/function_config.png)

至于价格，Selectly 的 **基础功能完全免费**：翻译、解释、润色、复制、搜索、跳转、分享、收藏等。
需要会员的部分是 **对话功能** 和 **自定义功能**。

需要说明的是，Selectly **本身不提供语言模型**。用户需要配置相应供应商的 API Key。目前支持 OpenAI、Anthropic、OpenRouter、SiliconFlow、Azure OpenAI、Ollama，以及任何兼容 OpenAI 接口标准的服务商。

![Selectly 支持的模型供应商](@/assets/images/llm_config.png)

为什么不内置模型服务？因为现有的模型供应商已经很成熟，Selectly 不想成为赚差价的“二道贩子”。以 OpenRouter 为例，它提供了数百种模型，用户可以自由选择、按量付费。比如翻译、润色这类轻量需求，用 gpt-4o-mini 这样的基础模型就足够：便宜、快速、效果也好。

## 展望

未来，Selectly 会做什么？原则上，只要与“网页划词”相关、用户又确实有需求的功能，都可能被加入。

值得一提的是，Selectly 的大部分代码由 **Claude Sonnet 4** 和 **GPT-5** 协作完成，期间大概使用了 **150 次 Copilot Premium request**。

最后，欢迎大家体验和反馈 👉 [https://selectly.app](https://selectly.app)
