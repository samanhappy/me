---
author: Qingyang
pubDatetime: 2025-09-19T04:59:04.866Z
modDatetime: 2025-09-19T04:59:04.866Z
title: Why I Built Another Web Highlighting Extension — Selectly
featured: false
draft: false
tags:
  - AI
  - Product
description: Why I built Selectly, what it does, and where it’s heading.
---

## Origin

Highlighting on the web has been around for a long time, and there are plenty of extensions out there. So why build another one?

The original motivation was simple: I wanted a great highlight-translate tool. The options on the market were either tied to traditional translation APIs (like Google Translate) with underwhelming results, or they relied on LLMs but were too rigid or too expensive.

My need was straightforward: when reading English sites, if I run into a word or sentence I don’t understand, I want a short, accurate, no-fluff explanation with a quick highlight. That’s essentially one LLM call plus a good prompt. Since I couldn’t find it, I decided to “vibe code” one myself.

![Selectly translation](@/assets/images/translate.png)

## The journey

The translation feature came together quickly. But during the build, I realized “highlight + LLM” could do more: explain, polish, correct… If I already had one feature, why not add a few more? Even better, why not let users customize them? That’s how Selectly was born.

![Selectly](@/assets/images/selectly.png)

Selectly is positioned as an extensible toolset powered by “web highlight + AI.” Even though LLMs are entering daily life, the web highlighting experience is still far from perfect.

So what can Selectly do?

![Selectly features](@/assets/images/functions.png)

For LLM-powered features, it includes translation, polishing, explanation, and correction. These are basically different prompts and presentation styles. More importantly, Selectly lets users build their own modules: choose a model, write a prompt, and you’re done.

![Selectly custom features](@/assets/images/add_function.png)

Highlighting also comes with long-standing basics like search, collection, and sharing. In the past, you’d need multiple extensions or accept a subpar experience. Since Selectly is designed as an all‑in‑one toolkit, these basics also needed to be polished.

For **collection**, we provide a content hub that automatically groups pages for easy review.

![Selectly collection](@/assets/images/content_center.png)

For **sharing**, once text is selected you can generate a shareable image with the page title and URL, then copy or download it.

![Selectly share](@/assets/images/share.png)

With so many tools, popping everything up every time would be messy. So Selectly provides toggles, ordering, and collapse options so users can tailor the experience.

![Selectly customization](@/assets/images/function_config.png)

As for pricing, Selectly’s **core features are free**: translation, explanation, polishing, copy, search, jump, share, collection, and more.
Membership is required for **chat** and **custom functions**.

One important note: Selectly **does not provide language models**. Users configure their own API keys. It currently supports OpenAI, Anthropic, OpenRouter, SiliconFlow, Azure OpenAI, Ollama, and any provider compatible with the OpenAI API.

![Supported LLM providers](@/assets/images/llm_config.png)

Why not bundle a model? Because existing providers are already mature, and I don’t want to be a middleman. Take OpenRouter for example: it offers hundreds of models with pay‑as‑you‑go flexibility. For lightweight tasks like translation or polishing, a model like gpt‑4o‑mini is plenty: cheap, fast, and good.

## Outlook

Looking ahead, anything related to “web highlighting” that users truly need can make its way into Selectly.

Notably, much of Selectly’s codebase was co-written by **Claude Sonnet 4** and **GPT‑5**, with roughly **150 Copilot Premium requests** along the way.

Try it out and share feedback 👉 [https://selectly.app](https://selectly.app)
