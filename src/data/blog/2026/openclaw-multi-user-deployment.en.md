---
author: samanhappy
pubDatetime: 2026-05-02T18:09:00.000Z
modDatetime: 2026-05-11T10:00:00.000Z
title: "One Gateway, Multiple Personas: A Complete Guide to OpenClaw Multi-User Deployment"
featured: false
draft: false
tags:
  - OpenClaw
  - AI Agent
  - Feishu
  - WeChat
  - Deployment
  - Multi-User
description: "One Gateway, multiple Agent personas. Learn context isolation, message routing, and skill sharing with practical Feishu/WeChat multi-account setups — no more duplicate deployments."
---

## TL;DR

People often ask: if my team wants to share one machine running OpenClaw, or I need to connect two Feishu accounts, do I have to spin up multiple containers? The answer is no — the barrier is much lower than you think. OpenClaw natively supports orchestrating multiple Agents from a single Gateway.

The core principle is simple: if you’re serving **trusted** users like family or your own team, or running multiple Feishu/WeChat accounts for a single business, one Gateway is enough. If you’re serving external customers or mutually untrusted parties, deploy separate instances without overthinking it.

This article walks through the key boundaries: how to isolate context, route messages, and share skills.

*Note for newcomers: Gateway is the unified entry point that receives messages and dispatches them. Each Agent has its own "brain" (workspace) containing a `SOUL.md` that defines its personality and a `USER.md` for personal preferences. Let’s start by creating those brains.*

## The First Pitfall: Do You Really Need a Bunch of Containers?

When first adopting OpenClaw, most of us set up a single Gateway on one machine, attached to one Agent, connected to Telegram or WeChat. When the team needs to share the setup, or you want different personas in the release-announcement channel versus the casual chat group, the knee-jerk reaction is to add machines and spawn new containers.

But within a single trust domain, that’s completely unnecessary.

OpenClaw uses a “personal assistant trust model” by default. It wasn’t built as a rigid multi-tenant SaaS. Rather than wrangling multiple `docker-compose` files and port forwards, just drop multiple identities into one `openclaw.json`. Unified logging, unified skill installation — way easier to maintain.

## Step 1: Give Everyone Their Own Brain

By default all traffic hits `agentId: "main"`. To support multiple users, you need to separate their workspaces. Just two quick commands:

```bash
openclaw agents add zhou
openclaw agents add lin
```

This physically splits the brains under `~/.openclaw`, creating `workspace-zhou` and `workspace-lin`, along with their respective auth config directories (`~/.openclaw/agents/<agentId>/agent/`) and session stores (`~/.openclaw/agents/<agentId>/sessions/`). Verify the result:

```bash
openclaw agents list --bindings
```

Both Agents are now ready, but haven't been bound to any channel yet — let's set up message routing next.

### Embedding Personalization into SOUL and USER

After creation, go into each workspace and write a simple `SOUL.md` and `USER.md`.

Zhou is a full-stack developer who wants the AI to speak plainly and review code. His `SOUL.md` can state: “For code issues, default to TDD. Keep replies short. Cut the fluff.”
Lin is an operations specialist who uses the AI to organize documents. Her `SOUL.md` can read: “Extract TODOs from Feishu docs and always output them as tables.”

This kind of cold-start priming ensures each Agent comes online already knowing its role.

## Step 2: How to Route Messages Accurately

The Gateway now has multiple "brains," but it doesn’t know whose message goes where. We need a `bindings` section to route them.

### Routing Priority

OpenClaw routing follows a most-specific-wins rule, from highest to lowest priority:

1. **peer** (sender ID — routes to a specific contact)
2. **accountId** (a specific channel account)
3. Channel-wide wildcard (`accountId: "*"` — matches all accounts on that channel)
4. Default Agent (final fallback)

### Binding by Channel Account (Prefer the CLI)

For account-level routing, use CLI commands rather than editing JSON by hand:

```bash
# Bind zhou to a specific Telegram account
openclaw agents bind --agent zhou --bind telegram:ops

# Bind lin to another account
openclaw agents bind --agent lin --bind telegram:lin-account

# Verify the bindings
openclaw agents list --bindings
```

The `--bind` format is `<channel>` or `<channel:accountId>`. If you omit `accountId`, OpenClaw resolves it from channel defaults. You can upgrade a binding to a specific account later by running `bind` again — OpenClaw upgrades it in place rather than creating a duplicate.

Removing bindings is equally simple:

```bash
openclaw agents unbind --agent zhou --bind telegram:ops
# Or remove all bindings for an agent
openclaw agents unbind --agent zhou --all
```

### Person-Level Routing

Within the same account, want different contacts to trigger different Agents? Hard-code the `peer` (sender ID) in config — its priority always trumps account-level and channel-wide rules. Example for WeChat:

```json5
bindings: [
  { agentId: "zhou", match: { channel: "wechat", peer: { kind: "direct", id: "wxid_zhou" } } },
  { agentId: "lin", match: { channel: "wechat", peer: { kind: "direct", id: "wxid_lin" } } }
]
```

> Peer-level matches currently require `openclaw.json` config — the `agents bind` CLI does not yet support writing peer-scoped bindings. For other channels like Telegram, just swap `channel` and the corresponding ID; the logic is identical.

### WeChat Setup Guide: Building a WeChat Channel from Scratch

The routing examples above assume a WeChat channel is already ready. But OpenClaw’s WeChat channel isn’t built into the core repository; it comes via Tencent’s official external plugin `@tencent-weixin/openclaw-weixin`. The full setup involves four steps:

**① Install the Plugin**

```bash
# Quick install
npx -y @tencent-weixin/openclaw-weixin-cli install

# Or via the OpenClaw plugin system
openclaw plugins install "@tencent-weixin/openclaw-weixin"
```

After installation, enable the plugin and restart the Gateway:

```bash
openclaw config set plugins.entries.openclaw-weixin.enabled true
openclaw gateway restart
```

Once installed, the Gateway automatically discovers its manifest, loads the entry point, and registers `openclaw-weixin` as an available channel.

**② Scan to Log In**

On the same machine running the Gateway, execute the login command:

```bash
openclaw channels login --channel openclaw-weixin
```

A QR code will appear in the terminal. Scan it with your WeChat mobile app and confirm. The plugin saves the account credentials (token) in your local OpenClaw state directory; subsequent restarts don’t require re-login.

**③ Adding Multiple WeChat Accounts**

To run two WeChat accounts simultaneously on one machine (e.g., personal + work), just run the login command again:

```bash
openclaw channels login --channel openclaw-weixin
```

After scanning the second QR code, both accounts’ credentials are stored separately. You must set the session isolation policy:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

This ensures that private chat context for different WeChat accounts is completely isolated across three dimensions: account, channel, and sender.

**④ Access Control: Approving New Contacts**

Private messages on the WeChat channel follow the same pairing and allowlist model as other OpenClaw channels. Messages from strangers are not processed automatically upon first contact. You need to list pending senders:

```bash
openclaw pairing list openclaw-weixin
```

After verifying, approve them:

```bash
openclaw pairing approve openclaw-weixin <sender_id>
```

Once approved, the contact can chat normally with the designated Agent. With multiple WeChat accounts, approvals are account-specific; there’s no risk of account A’s approval leaking to account B.

### Multi-Account Matrix

For many teams, the most practical scenario is a Feishu matrix: one account for internal knowledge base, another for external support.

**Step 1 — Create the Agents:**

```bash
openclaw agents add internal --workspace ~/.openclaw/workspace-internal
openclaw agents add support --workspace ~/.openclaw/workspace-support
```

**Step 2 — Add the Feishu account credentials to `openclaw.json`** (channel account credentials still need to be maintained in the config file):

```json5
channels: {
  feishu: {
    accounts: {
      intern: { appId: "cli_xxx", appSecret: "***", name: "Internal Assistant" },
      support: { appId: "cli_yyy", appSecret: "***", name: "External Support" }
    }
  }
}
```

**Step 3 — Bind the routing via CLI:**

```bash
openclaw agents bind --agent internal --bind feishu:intern
openclaw agents bind --agent support --bind feishu:support

# Verify the result
openclaw agents list --bindings
```

After completing the WeChat plugin installation and multi-account login described above, you can similarly bind with `openclaw agents bind --agent <agentId> --bind openclaw-weixin:<accountId>`, achieving full multi-account dispatch parity with the Feishu matrix.

## Step 3: The Critical Switch to Prevent Context Leakage

**The most common multi-user pitfall isn’t a startup error; it’s Zhang San seeing Li Si’s conversation context.**

This typically happens when Session isolation isn't configured. As long as everyone shares the same bus, always run this command:

```bash
openclaw config set session.dmScope per-account-channel-peer
```

This unassuming line acts as a lock, strictly shredding chat state by account, channel, and peer, preventing different users' histories from being stitched together. The equivalent JSON form is `"session": { "dmScope": "per-account-channel-peer" }` — both approaches have identical effect.

## Step 4: Sharing Skills While Preserving Individuality

Here’s the biggest benefit of sharing a single server: you don’t have to install environments over and over.

Install a weather or GitHub Skill into the global directory `~/.openclaw/skills`, and by default everyone can use it. But different roles often require different degrees of action granularity.

1. **Allowlist Control**: If you don't want operations folks running dangerous shell commands, hard-code `["weather", "shopping"]` in `agents.list[].skills`. For a shared baseline across all Agents, use `agents.defaults.skills`.
2. **Local Override**: If Zhou wants to customize a GitHub review tool, he just drops a same-name config under his own `workspace-zhou/skills/github`. The framework automatically prefers the nearest configuration, without affecting others.

> Quick reminder: Even inside a trust domain, restrict permissions by role. Imagine the global skill pool contains a script that directly hits the production database. If Lin’s Agent is inadvertently guided to run it, the problem goes beyond simple “context leakage.” Uphold the principle of least privilege — the longer you run, the more you’ll appreciate it.

## Hard-Won Best Practices

- **Weigh Sandboxing in Groups Carefully**: Whenever your Agent joins a group — even a trusted one — raise the sandbox restrictions. Bizarre instructions fly everywhere in group chats. Sandbox settings can be **configured per Agent** — apply strict restrictions to external-facing Agents while keeping internal ones more permissive:
  ```json5
  // External support Agent (strict)
  { id: "support", sandbox: { mode: "all", scope: "agent" }, tools: { deny: ["exec", "write"] } }
  // Internal assistant Agent (normal tool access)
  { id: "internal", sandbox: { mode: "off" } }
  ```
  Setting `mode: "all"` globally **shuts down nearly all tool invocations**, leaving only plain-text chat. If your Agent needs to check weather or search docs in a group, combine skill allowlists with `tools.allow` to grant precise access rather than killing all sandboxing outright.

- **Run Dry Tests Before Opening Up**: Initially restrict `allowFrom` to only your own contact. Once connectivity tests pass and you’re sure no context bleeds across users, then remove the hard limits.

- **Watch Out for Permission Side Effects**: When you’re tempted to deny `exec` because it’s too powerful, be aware that if any Skill depends on that permission, the Skill may fail silently due to authorization errors (e.g., you can’t modify the system, and even tailing a log will blow up). During troubleshooting, you might mistakenly think the Skill itself is broken, when the permission is simply being stripped upstream.

## A Copy-Paste Config Skeleton

Stitch the scattered configurations together, and you get a minimal yet functional `openclaw.json` for multi-agent and multi-account setups. Replace the placeholders with your actual values:

```json5
{
  "agents": {
    "internal": { "workspace": "workspace-internal" },
    "support": { "workspace": "workspace-support" }
  },
  "channels": {
    "feishu": {
      "accounts": {
        "intern": { "appId": "cli_xxx", "appSecret": "***", "name": "Internal Assistant" },
        "support": { "appId": "cli_yyy", "appSecret": "***", "name": "External Support" }
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

Save this skeleton well. Whenever you need to add people, accounts, or adjust permissions, you can build on this basis — it saves a ton of detours.