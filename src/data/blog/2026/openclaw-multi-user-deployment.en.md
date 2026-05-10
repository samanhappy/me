---
author: samanhappy
pubDatetime: 2026-05-02T18:09:00.000Z
modDatetime: 2026-05-10T12:30:00.000Z
title: "OpenClaw Multi-User Deployment: Isolation, Preferences, Skill Sharing, and Multi-Account Routing"
featured: false
draft: true
tags:
  - OpenClaw
  - AI Agent
  - Feishu
  - WeChat
  - Deployment
  - Multi-User
description: "Setting up one OpenClaw Gateway for multiple shared agents with specific routing bounds across Feishu or WeChat domains."
---

## TL;DR

A lot of people ask me if they need to spin up multiple Docker containers or VMs just to share an OpenClaw instance with their team, or to hook up two different Feishu/WeChat accounts. The short answer is: you really don't. 

If you are setting this up for your family, a trusted team, or multiple accounts for your own business, one Gateway is plenty. But if you are building a SaaS for external, mutually distrusting customers, save yourself the headache and split them into separate machines.

This post is essentially about getting the boundaries right: how to isolate context, route messages accurately, and share skills without stepping on each other's toes.

## The First Hurdle: Over-Isolating Your Setup

When first starting out with OpenClaw, most people fire up a single Gateway, connect an Agent to Telegram, and call it a day. The moment someone else wants access, or they want a "work bot" and a "life bot", their instinct is to clone the whole setup.

But within a single trust boundary, this just adds unnecessary bloat.

OpenClaw is built on a "Personal Assistant Trust Model." It wasn't designed to be a hardcore multi-tenant SaaS out of the box. By throwing multiple identities into a single `openclaw.json`, you get to manage your logs centrally and share loaded skills. It’s actually much easier to maintain.

## Step 1: Give Everyone Their Own Brain

By default, all traffic hits `agentId: "main"`. To run multiple agents, you first need to split their workspaces. A couple of CLI commands handles this:

```bash
openclaw agents add oliver
openclaw agents add nina
```

This creates separate, physical folders under `~/.openclaw` (like `workspace-oliver` and `workspace-nina`), along with their respective auth, session, and model directories.

### Baking Vibes into SOUL and USER

Once created, jump into their respective workspaces and jot down a quick `SOUL.md` and `USER.md`. 

Oliver is a backend dev. He wants an AI that talks straight and helps review code. His `SOUL.md` might say: "Prioritize TDD for code questions. Keep responses short. No fluff."
Nina handles daily operations. Her `SOUL.md` might say: "Parse schedules from Feishu docs and format them into tables."

This kind of cold-start warmup ensures each Agent has its persona dialed in the moment it comes online.

## Step 2: Routing That Actually Works

Now the Gateway has multiple "brains," but it has no idea whose messages belong to whom. We need to wire up some `bindings`.

### Precision Routing by Sender
Want different numbers from the same WhatsApp account to hit different Agents? Just hardcode the `peer` (sender). It always takes precedence over the global channel rules:

```json5
bindings: [
  { agentId: "oliver", match: { channel: "whatsapp", peer: { kind: "direct", id: "+491..." } } },
  { agentId: "nina", match: { channel: "whatsapp", peer: { kind: "direct", id: "+492..." } } }
]
```

### The Multi-Account Matrix
Often, the most practical use case involves multiple Feishu bots—one for internal knowledge, one for external support. You can target the `accountId` directly:

```json5
channels: {
  feishu: {
    accounts: {
      intern: { appId: "cli_1", appSecret: "***", name: "Internal" },
      support: { appId: "cli_2", appSecret: "***", name: "Support" }
    }
  }
},
bindings: [
  { agentId: "internal", match: { channel: "feishu", accountId: "intern" } },
  { agentId: "support", match: { channel: "feishu", accountId: "support" } }
]
```

WeChat is similar, even if it runs through the external `@tencent-weixin/openclaw-weixin` plugin. Scan twice, land two distinct `accountId`s, and map them to their respective bindings.

## Step 3: The Crucial Anti-Bleed Switch

**The easiest way to ruin a multi-user setup isn't a crash loop—it's User A accidentally seeing User B's chat history.**

This happens when you forget session isolation. Whenever multiple people share a backbone, make sure this exact line is in your config:

```json5
session: {
  dmScope: "per-account-channel-peer"
}
```

It looks minor, but it acts as a hard lock. It shreds chat states strictly by account, channel, and contact, guaranteeing no one's context gets stitched together by accident.

## Step 4: Share Skills, Keep Quirks

The biggest perk of sharing a server? You only install dependencies once. 

Drop a weather or github skill into the global `~/.openclaw/skills/` directory, and everyone has access by default. But often, different roles need different constraints.

1. **Allowlisting**: If you don't want your ops bot running shell commands, explicitly define `skills: ["weather", "shopping"]` inside the config list. 
2. **Local Overrides**: If Oliver wants a tricked-out version of a GitHub review tool, he can write a same-named version inside `workspace-oliver/skills/github`. The framework prioritizes the local config automatically without breaking it for anyone else.

## A Few Real-World Habits to Adopt

- **Sandbox Your Group Bots**: If your Agent gets dropped into group chats—trusted or not—max out its sandbox constraints. Group chats invite weird command injections; don't let a stray message run a destructive script on your host.
  ```json5
  sandbox: { mode: "all", scope: "agent" }
  ```
- **Dry-Run Before Opening the Gates**: Set your `allowFrom` list to just your own number first. Only after you’ve verified the connection and are 100% sure context isn't bleeding, should you remove the hard limit for real traffic.
- **Watch Out for Tool Dependencies**: If you decide `exec` is too dangerous and block (deny) it globally, remember that any loaded Skill secretly relying on bash commands will quietly break too.

At the end of the day, it's rarely about making the infrastructure insanely complex. It’s about leaning into how the system was meant to be configured. Get these bounds right, and the initial setup friction will quickly turn into muscle memory.
