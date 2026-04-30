---
author: samanhappy
pubDatetime: 2026-04-30T15:00:00.000Z
modDatetime: 2026-04-30T15:00:00.000Z
title: "MCPHub: A Retrospective from 0 to 2000 Stars"
featured: false
draft: true
tags:
  - MCPHub
  - MCP
  - Open Source
description: "How a side project maintained in spare time reached 2000 stars in one year — on timing, decisions, and rhythm."
---

## The Numbers First

Repository created on March 31, 2025. One year later: 2000+ stars, 248 forks, 93 releases. All maintained as a side project — day job as a software architect at an internet insurance company, code in the evenings and weekends.

This isn't a success story in the grand sense. 2000 stars is modest in the open-source world. But as a side project from someone with a full-time job, the process had some decisions and rhythms worth documenting.

## Why I Built This

On November 25, 2024, Anthropic released MCP (Model Context Protocol) — an open standard for connecting AI models to external tools and data sources. Think of it as giving AI "hands" and "eyes."

My first reaction after reading the spec: this will explode, but there's an obvious gap. When you connect more and more MCP servers to your AI setup, who manages them all?

One MCP server is easy. Ten? Twenty? Each with different startup procedures, config formats, and auth mechanisms. As an architect, I naturally thought: this needs a unified management layer. A hub.

Four months passed between the idea and writing the first line of code. During those months, the MCP ecosystem grew rapidly — more servers being built, the multi-server management problem becoming increasingly real. By late March 2025, I decided it was time.

## Week One: Relentless Iteration

v0.1.0 shipped on April 13 — the first official release. Simple: an admin panel with login, MCP server configuration, persistence.

Then things got intense.

April 14: v0.1.1 bug fix. April 15: v0.2.0. April 17: v0.3.0. April 18 — six versions in a single day, from v0.3.2 to v0.3.8.

Why so fast? Early users started showing up. Issues poured in — bugs, feature requests, each from a real use case. My strategy was simple: **if a user reported it, fix it. If I thought of it, build it. If it's done, ship it.** No release schedule, no milestones. Pure feedback-driven development.

In retrospect, this pace isn't sustainable. But in the early days of a project, fast response to users is the most effective way to build trust. Early adopters tolerate bugs. They don't tolerate silence.

## Key Decisions

### Market: One-Click MCP Server Installation (v0.4.0)

On April 20, just one week after the first release, I introduced Market — a built-in catalog where users could browse and install MCP servers with a single click.

This transformed MCPHub from "a management tool for power users" into "an entry point anyone can use." It's a principle I've seen repeatedly in architecture work: **lower the barrier by one step, expand the user base tenfold.**

### Smart Routing: From Management Tool to Intelligent Gateway (v0.7.0)

v0.7.0 on May 28 introduced Smart Routing — semantic search with reranking to automatically discover the most relevant tools.

Before this, MCPHub was essentially a "configuration management center" that helped you organize multiple MCP servers. After Smart Routing, it became an "intelligent gateway" — an AI agent sends a request, and MCPHub automatically routes it to the best-matching tool.

The inspiration came from a practical problem: when you have twenty-plus MCP servers with potentially hundreds of tools, you can't expose all of them to the AI model (context window limitations). But if you only expose a subset, how do you choose?

The answer: **let AI choose.** Use semantic similarity to find the most relevant tools, and only pass those to the model. That's what Smart Routing does.

### Embracing AI-Assisted Development (v0.10.0+)

By v0.10.0 (October 2025), PRs started showing significant GitHub Copilot contributions. Not just me using Copilot as an assistant — Copilot directly authoring PRs.

There's an interesting recursion here: a project serving the AI tool ecosystem, itself being accelerated by AI tools.

My takeaway: for tasks with clear boundaries (adding an API endpoint, writing tests, refactoring config logic), AI-assisted development delivers real efficiency gains. But architectural decisions, feature prioritization, trade-offs — those still require a human.

### PostgreSQL Storage (v0.11.0)

v0.11.0 in November 2025 added PostgreSQL storage support. Before that, MCPHub used file-based storage.

The reason was straightforward: people started wanting to run MCPHub in production. File storage works fine for single-instance setups, but multi-instance deployment, data backup, and access control all require a proper database.

This marked MCPHub's transition from "personal tool" to "infrastructure you can deploy in your company."

## The Evolution Logic

Looking back at the version history, there's a clear progression:

1. **Make it work** (v0.1–v0.3): Basic config management, proof of concept
2. **Connect the ecosystem** (v0.4–v0.5): Market + Streamable HTTP, lowering barriers
3. **Get smart** (v0.6–v0.7): Multi-session + Smart Routing, from management tool to intelligent gateway
4. **Go production-ready** (v0.8–v0.11): OpenAPI conversion, OAuth, PostgreSQL — enterprise capabilities
5. **Data-driven** (v0.12): Activity tracking, vector search — setting up for what's next

Each phase lasted roughly 2–3 months. None of this was pre-planned — it evolved naturally from user feedback and ecosystem changes.

## Community

MCPHub has a WeChat group of 300+ members. Community management isn't my strength, honestly. My approach is simple:

- **Respond to issues within the day**: Even if it's just "noted, I'll look into it"
- **Triage user requests**: Bugs get fixed first; feature requests are evaluated for generality
- **Never commit to timelines**: The worst thing a side-project maintainer can do is over-commit. "I'll do it but can't say when" is honest and sustainable
- **WeChat for collecting needs, GitHub for deep discussion**

300 people isn't a large community, but quality matters more than quantity. Many core features were inspired by conversations in that group.

## Managing Rhythm

Full-time job plus open-source maintenance — time management is unavoidable.

My strategy: **accept unevenness.** Some weekends I can invest two full days. Some weeks I can only squeeze an hour or two for issues. I don't force weekly output, but I maintain a "still alive" signal — at minimum, respond to issues, let users know the project isn't abandoned.

On average: 1–2 releases per week. But the actual distribution is highly uneven — intensive bursts in the first two weeks, then stabilizing, with occasional concentrated pushes for major versions.

Another lesson: **don't do deep-thinking work on weekday evenings.** Decision-making resources are already spent from the day job. Evenings are for high-certainty tasks — fixing bugs, writing tests, updating docs. Architecture and new features wait for weekend mornings when the mind is fresh.

## Luck and Timing

Let me be honest: MCPHub's growth has a significant timing component.

MCP went from release to widespread adoption during a rapid climb. In December 2025, Anthropic donated MCP to the Agentic AI Foundation (AAIF) under the Linux Foundation, further cementing its industry position. During this rise, the "MCP ecosystem tools" category itself was expanding, and MCPHub as an early entrant benefited from that tide.

If I had started six months later, the competitive landscape would look completely different.

Also crucial: solving a "real and universal" problem. "Multi-server management" isn't a need I invented — it's a problem anyone seriously using MCP will encounter. Real demand doesn't require you to educate users. They find you.

## What I Haven't Done Well

A few gaps worth acknowledging:

- **Documentation is still lacking**: Technical docs are a persistent debt. Questions frequently asked in the WeChat group should have been covered in docs long ago
- **No monetization exploration**: What comes after 2000 stars? I haven't figured that out yet
- **Insufficient test coverage**: A side effect of spare-time maintenance is "if it runs, don't touch it." Technical debt accumulates
- **International community is underdeveloped**: WeChat covers Chinese users, but engagement with the global community is nearly zero

## Final Thoughts

What can one person do?

In the age of AI-assisted development, the answer is more optimistic than ever. One person with a full-time job, using spare time, can maintain a 2000+ star open-source project over a year — shipping 93 releases, serving hundreds of active users. This would have been implausible five years ago.

But tools are just amplifiers. They amplify your understanding of the problem, your judgment on timing, your respect for users. There are no shortcuts for those.

MCPHub is still on its way. I'm still figuring out what's next. But looking back at this year, the single best decision was: **starting when I saw the opportunity, instead of waiting until I felt "ready."**

No one ever feels ready. Start anyway.
