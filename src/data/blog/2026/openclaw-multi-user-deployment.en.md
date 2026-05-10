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
description: "Set up one OpenClaw Gateway for multiple users, with separate Agents, shared skills, and clear routing boundaries across multiple Feishu or WeChat accounts."
---

## You Don't Need Ten Docker Containers

The typical first-time OpenClaw setup: install a Gateway, configure one Agent, connect WhatsApp or Telegram, and enjoy your personal AI assistant.

Then the questions start. "Can my partner use it too?" "Can my team share an assistant?" "Can I have a work personality and a personal personality on the same number?"

The first instinct is usually to add another machine, another container, or another Gateway. That works, but most of the time you are not there yet.

OpenClaw already supports multiple isolated Agents on one Gateway. Skills can be shared. Configuration can be reused. Messages can be routed by channel, account, contact, and group. The real work is not wiring it up. The real work is deciding where the boundary should sit. This article covers both: how to build it, and when not to keep sharing the same runtime.

## Start with the Trust Boundary

The official security docs make one assumption very clear: OpenClaw follows a personal-assistant trust model.

In plain terms, that means one trusted boundary. That can be one person, or one team that trusts each other. It is not a strong multi-tenant boundary for adversarial users.

So before you write any config, check the scenario.

### When one Gateway is a good fit

- one family or one team using it together
- users share the same business context
- centralized operations and logs are acceptable
- the goal is collaboration, not tenant isolation

### When one Gateway is the wrong fit

- different customers need hard separation
- users do not fully trust each other
- personal and company identities would mix in one runtime
- the system will be exposed as a service to external users

In those cases, the better answer is not more config. It is more boundaries: separate Gateways, and often separate OS users, containers, or hosts as well.

## Single Agent vs. Multi-Agent

In OpenClaw, an Agent is a complete "brain":

- **Workspace**: stores AGENTS.md / SOUL.md / USER.md and other definition files
- **State Directory** (`agentDir`): auth profiles, model registry, per-agent config
- **Session Store**: chat history and routing state

By default, OpenClaw runs in single-agent mode, so every message goes to `agentId: "main"`. Multi-user deployment starts by splitting that brain into several ones, then telling the Gateway which message belongs to which brain.

Once you look a bit closer, the model is really four layers:

1. **Gateway**: receives messages and owns the state
2. **Agent**: an isolated brain with its own workspace, sessions, and auth profiles
3. **Channel Account**: one concrete account on one messaging platform
4. **Bindings**: routing rules that map a channel, account, contact, or group to one Agent

That is why one OpenClaw instance can host multiple Feishu bots or multiple WeChat accounts without turning into chaos, as long as you split the routing clearly from the start.

## Step 1: Create an Agent for Each User

Use the CLI wizard to create new agents:

```bash
openclaw agents add oliver
openclaw agents add nina
```

This creates independent workspaces and state directories:

```
~/.openclaw/
├── workspace/         # main agent (default)
├── workspace-oliver/  # Oliver's workspace
├── workspace-nina/    # Nina's workspace
└── agents/
    ├── main/agent/
  ├── oliver/agent/
  └── nina/agent/
```

### Give Each User Their Own Context

Each Agent has its own SOUL.md. You can define completely different personas:

**Oliver's SOUL.md** (tech-oriented assistant):
```markdown
You are Claw, Oliver's technical partner. You know he maintains internal tools,
automation scripts, and a few side projects. He prefers TDD, refactoring, and code
that stays maintainable. Keep replies concise and direct. If he's clearly shipping late at night,
remind him to wrap up.
```

**Nina's SOUL.md** (life-oriented assistant):
```markdown
You are Nina's daily assistant. Help with shopping lists, travel planning,
and calendar reminders. Use a warm, steady tone, like a reliable friend.
She does not care about technical details, so keep things simple.
```

### Record User Preferences in USER.md

Beyond SOUL.md, include a `USER.md` in each Agent's workspace with user-specific information:

```markdown
# Oliver
- Works in backend development and also maintains a few internal systems
- Prefers concise replies
- Tech stack: Java, TypeScript, Python
- Uses the assistant for work during the day and personal projects at night
- Dietary preferences: dislikes cilantro
```

OpenClaw loads `USER.md` at session start, so the Agent does not need to re-learn the user every time.

## Step 2: Route Messages with Bindings

Once the Agents exist, the Gateway still needs a dispatch table. That is what `bindings` are for.

Each rule answers one question: for this channel, this account, this contact, or this group, which Agent should receive the message?

### Route by DM Contact

If you have one WhatsApp number but want different contacts to reach different agents:

```json5
// ~/.openclaw/openclaw.json
{
  agents: {
    list: [
      { id: "oliver", workspace: "~/.openclaw/workspace-oliver" },
      { id: "nina", workspace: "~/.openclaw/workspace-nina" },
    ],
  },
  bindings: [
    {
      agentId: "oliver",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+4912345678901" } },
    },
    {
      agentId: "nina",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+4912345678902" } },
    },
  ],
}
```

Peer-level matches take precedence over channel-level matches. If you configure both an exact contact and a channel-wide wildcard, the exact contact wins.

### Route by Channel

An even simpler approach: different platforms → different agents:

```json5
bindings: [
  { agentId: "work", match: { channel: "slack" } },
  { agentId: "life", match: { channel: "whatsapp" } },
]
```

All Slack messages go to the work Agent; all WhatsApp messages go to the personal Agent.

### Multiple Accounts, Multiple Numbers

If you have two WhatsApp accounts (work and personal), distinguish them with `accountId`:

```json5
bindings: [
  {
    agentId: "work",
    match: { channel: "whatsapp", accountId: "work" },
  },
  {
    agentId: "life",
    match: { channel: "whatsapp", accountId: "personal" },
  },
]
```

This is where multi-user deployment starts turning into multi-entry deployment. You are no longer just splitting people. You are splitting accounts as well.

## Step 3: Bring Multi-Account Routing into the Picture

The original multi-user article mostly answers one question: one Gateway, multiple Agents, then what? Once you add multiple Feishu or WeChat accounts, the focus shifts to a second question: how do you keep account boundaries clean?

### Feishu: the cleaner path

OpenClaw’s Feishu docs already define a clear multi-account model:

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Internal Bot",
        },
        support: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Support Bot",
        },
      },
    },
  },
}
```

Once multiple accounts exist, the natural next step is not to push all of them into one Agent. It is to route them deliberately:

```json5
{
  bindings: [
    {
      agentId: "internal",
      match: { channel: "feishu", accountId: "main" },
    },
    {
      agentId: "support",
      match: { channel: "feishu", accountId: "support" },
    },
  ],
}
```

Feishu is comfortable here because the account model and the routing model are both well defined.

### WeChat: supported, but think in plugins

WeChat is different. Today it comes through the external plugin `@tencent-weixin/openclaw-weixin`, not as a fully built-in runtime inside the core repository.

That changes the operating model:

- plugin versions need attention of their own
- compatibility with the host OpenClaw version should be checked explicitly
- incidents should be triaged as “core” versus “plugin,” not just “OpenClaw broke”

The multi-account flow is also simpler and more mechanical: sign in once per account. The Gateway can then monitor several WeChat login states at runtime, but session isolation has to match that setup.

## Step 4: Session Isolation — Keep Conversations from Bleeding Together

The most common multi-user mistake is not Agent creation. It is session isolation. OpenClaw controls DM isolation through `dmScope`:

```json5
{
  session: {
    dmScope: "per-channel-peer",
  },
}
```

| dmScope | Behavior | Best For |
|---------|----------|----------|
| `main` | All DMs share one session (default) | Single user |
| `per-peer` | One session per user, shared across channels | Single person on multiple platforms |
| `per-channel-peer` | One session per channel + user combination | **Multi-user deployment (recommended)** |

If one person is using several channels, `per-peer` can be enough. Once multiple people are involved, I would treat `per-channel-peer` as the minimum.

If the same Gateway also hosts multiple Feishu accounts or multiple WeChat accounts, move straight to this:

```json5
{
  session: {
    dmScope: "per-account-channel-peer",
  },
}
```

That one line is doing real work. It splits session state by account, channel, and sender, which keeps two different WeChat accounts and two different contacts from landing in the same context bucket.

### Session Lifecycle

Whether single-user or multi-user, session lifecycle works the same way:

```json5
{
  session: {
    reset: {
      mode: "daily",      // Reset at 4:00 AM daily
      idleMinutes: 120,    // Auto-reset after 2 hours idle
    },
  },
}
```

A session reset clears conversation history, but persistent memory in MEMORY.md stays intact.

## Step 5: Skill Sharing — One Shared Pool Is Usually Enough

One of the biggest advantages of multi-agent deployment is shared skills. No need to install the same skill repeatedly across agents.

### Skill Precedence Hierarchy

OpenClaw loads skills with the following precedence (highest to lowest):

| Priority | Source | Path | Visibility |
|----------|--------|------|------------|
| 1 | Workspace skills | `<workspace>/skills` | That agent only |
| 2 | Project-agent skills | `<workspace>/.agents/skills` | That agent only |
| 3 | Personal-agent skills | `~/.agents/skills` | All agents on this machine |
| 4 | Managed/local skills | `~/.openclaw/skills` | All agents on this machine |
| 5 | Bundled skills | Shipped with install | All agents on this machine |
| 6 | Extra dirs | `skills.load.extraDirs` | All agents on this machine |

### In Practice: Share + Override

Put common skills in `~/.openclaw/skills` — all agents can use them:

```bash
# Install shared skills globally
openclaw skills install weather    # → ~/.openclaw/skills/weather/
openclaw skills install github     # → ~/.openclaw/skills/github/
```

If an agent needs a customized version of a shared skill, just place a same-named one in its own workspace — workspace priority beats global:

```bash
# Nina doesn't need PR review — give her a simplified version
mkdir -p ~/.openclaw/workspace-nina/skills/github
# Write simplified SKILL.md → auto-overrides global version
```

### Agent Skill Allowlists

Not every agent needs every skill. Use allowlists for precise control:

```json5
{
  agents: {
    defaults: {
      skills: ["weather"],  // Default skills for all agents
    },
    list: [
      {
        id: "oliver",
        workspace: "~/.openclaw/workspace-oliver",
        skills: ["weather", "github", "coding-agent"],  // Oliver's extra skills
      },
      {
        id: "nina",
        workspace: "~/.openclaw/workspace-nina",
        skills: ["weather", "shopping"],  // Nina doesn't need github
      },
    ],
  },
}
```

This still applies when you introduce multiple accounts. The internal Feishu bot, the support Feishu bot, and the work WeChat account can share the same base skill pool. When one Agent needs a custom variant, override the skill in that Agent’s workspace and leave the rest alone.

## Step 6: Security Isolation — Different Surfaces, Different Permissions

If you're exposing an Agent to less-trusted users (like strangers in a group chat), security isolation becomes critical.

### Per-agent Sandbox

Run high-risk agents inside Docker sandboxes to constrain filesystem and network access:

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",      // Always sandboxed
          scope: "agent",   // One container per agent
          docker: {
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
      },
    ],
  },
}
```

### Tool Allowlists and Denylists

Further restrict which tools specific agents can use:

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        tools: {
          allow: ["read", "exec", "sessions_list", "sessions_history"],
          deny: ["write", "edit", "apply_patch", "browser", "cron"],
        },
      },
    ],
  },
}
```

> Note: `tools.allow/deny` controls tools (bash, browser, write, etc.), not skills. If a skill needs to call a blocked tool, that capability simply won't work.

### Mention Gate for Group Chats

When placing an Agent in a group, require mentions to trigger it — preventing the Agent from reading every message:

```json5
{
  agent: {
    groupChat: {
      mentionPatterns: ["@familybot", "@assistant"],
    },
  },
}
```

## Complete Configuration Example

Here is a more realistic team-shaped configuration that combines multi-user and multi-account routing:

```json5
// ~/.openclaw/openclaw.json
{
  // Global defaults
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      model: "anthropic/claude-sonnet-4-6",
      skills: ["weather"],
    },
    list: [
      {
        id: "internal",
        name: "Internal Assistant",
        workspace: "~/.openclaw/workspace-internal",
        skills: ["weather", "github", "coding-agent"],
        tools: {
          deny: ["exec", "browser", "gateway", "cron"],
        },
      },
      {
        id: "support",
        name: "Support Assistant",
        workspace: "~/.openclaw/workspace-support",
        skills: ["weather", "shopping"],
        sandbox: { mode: "all", scope: "agent" },
        tools: {
          allow: ["read", "sessions_list", "sessions_history"],
          deny: ["write", "edit", "apply_patch", "exec", "browser", "gateway", "cron"],
        },
      },
      {
        id: "sales",
        name: "Sales Assistant",
        workspace: "~/.openclaw/workspace-sales",
        sandbox: { mode: "all", scope: "agent" },
      },
    ],
  },

  channels: {
    feishu: {
      defaultAccount: "main",
      dmPolicy: "pairing",
      requireMention: true,
      accounts: {
        main: {
          appId: "cli_main",
          appSecret: "secret_main",
          name: "Internal Bot",
        },
        support: {
          appId: "cli_support",
          appSecret: "secret_support",
          name: "Support Bot",
        },
      },
    },
  },

  // Message routing
  bindings: [
    {
      agentId: "internal",
      match: { channel: "feishu", accountId: "main" },
    },
    {
      agentId: "support",
      match: { channel: "feishu", accountId: "support" },
    },
    {
      agentId: "sales",
      match: { channel: "openclaw-weixin", accountId: "biz" },
    },
  ],

  // Session isolation
  session: {
    dmScope: "per-account-channel-peer",
    reset: {
      mode: "daily",
      idleMinutes: 120,
    },
  },
}
```

## Common Deployment Patterns

### Pattern 1: Family Sharing

A home Mac mini as Gateway. Each family member gets their own Agent, all behind one WhatsApp number. The Gateway routes by sender phone number. Skills are shared. Personal coding tools stay private.

### Pattern 2: Team Collaboration

A shared Gateway server for the team. Each member has their own Agent and workspace. Slack, Feishu, or similar channels route DMs to the right Agent. Shared skills live in `~/.openclaw/skills`; project-specific ones stay in each workspace.

If the team also runs two Feishu bots, one for internal knowledge and one for support, keep the split at the `accountId` layer instead of spinning up another Gateway too early.

### Pattern 3: Multi-Account Entry Points

One Gateway hosts two Feishu accounts and two WeChat accounts. Internal traffic routes to `internal`; external traffic goes to `sales` or `support`. From the outside it looks like four separate bots. Underneath it is one control plane.

### Pattern 4: One Person, Multiple Personas

Same person, different platforms, different Agent personalities. Telegram gets the "deep work Agent" running Claude Opus; WhatsApp gets the "daily assistant" on Sonnet. Skills are shared, but persona and model are independent.

```json5
bindings: [
  { agentId: "deep-work", match: { channel: "telegram" } },
  { agentId: "daily", match: { channel: "whatsapp" } },
]
```

## When to Split into Multiple Gateways

If the question is “can one Gateway be shared,” the answer is yes. If the question is “when should I stop sharing it,” the line is not hard to find.

I would split into multiple Gateways when:

- users no longer sit inside the same trust boundary
- different customers need strict separation
- logs, sessions, and credentials should not live in one runtime
- the system is being offered as a service to external users
- you are already worried that one Agent may be getting the wrong tools or authority

The downside is more operational overhead. The upside is cleaner boundaries, a smaller blast radius, and simpler incident handling.

## Important Notes

### ⚠️ Never Share agentDir

Each Agent's `agentDir` (`~/.openclaw/agents/<agentId>/agent`) must be independent. It stores auth profiles and model registries — sharing them causes auth conflicts and session corruption.

### ⚠️ Configure Session Isolation Before Going Live

Before opening up to multiple users, verify `dmScope` is set to `per-channel-peer`. The default `main` mode merges everyone's conversations — fine for single-user, disastrous for multi-user.

### ✅ Verify Routing with `openclaw agents list --bindings`

```bash
openclaw agents list --bindings
```

This command shows all agents and their bindings — confirm your routing is correct before inviting others.

### ✅ Test Privately First

Start with only your own contacts in `allowFrom`. Test for a few days. Confirm isolation works and skills behave as expected before adding more numbers or accounts.

## Summary

The core of multi-user OpenClaw deployment is not “run more instances.” It is keeping four layers clean:

1. **Independent Agents** = independent brains (workspace, SOUL.md, session store)
2. **Channel Accounts** = separate entry points inside the same channel
3. **Bindings** = message dispatch rules (whose message goes to which brain)
4. **Layered Skills** = shared pool (`~/.openclaw/skills`) + per-agent overrides (`<workspace>/skills`)

If your setup stays inside one trust boundary, one Gateway can serve a family or a team, and it can host multiple Feishu or WeChat accounts without much trouble.

Once the trust boundary breaks, stop forcing it. Split the Gateway. In practice, that is often the simpler choice, not the more complex one.
