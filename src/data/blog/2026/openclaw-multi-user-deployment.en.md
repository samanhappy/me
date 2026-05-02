---
author: samanhappy
pubDatetime: 2026-05-02T18:09:00.000Z
modDatetime: 2026-05-02T18:09:00.000Z
title: "OpenClaw Multi-User Deployment: Isolation, Personalization, and Skill Sharing"
featured: false
draft: true
tags:
  - OpenClaw
  - AI Agent
  - Deployment
  - Multi-User
description: "Set up a single OpenClaw Gateway to serve multiple users, each with their own AI assistant, personalized preferences, and a shared skill pool."
---

## You Don't Need Ten Docker Containers

The typical first-time OpenClaw setup: install a Gateway, configure one Agent, connect WhatsApp or Telegram, and enjoy your personal AI assistant.

Then the questions start. "Can my partner use it too?" "Can my team share an assistant?" "Can I have a work personality and a personal personality on the same number?"

The instinct is to spin up another Gateway instance, or even another server. But OpenClaw supports running multiple fully isolated Agents on a single Gateway — with shared skills and reusable configuration. This article walks you through the whole process.

## Single Agent vs. Multi-Agent

In OpenClaw, an Agent is a complete "brain":

- **Workspace**: stores AGENTS.md / SOUL.md / USER.md and other definition files
- **State Directory** (`agentDir`): auth profiles, model registry, per-agent config
- **Session Store**: chat history and routing state

By default, OpenClaw runs in single-agent mode — all messages route to `agentId: "main"`. Multi-user deployment is about splitting these brains into multiple ones, then telling the Gateway "whose message goes to which brain."

## Step 1: Create an Agent for Each User

Use the CLI wizard to create new agents:

```bash
openclaw agents add alex
openclaw agents add mia
```

This creates independent workspaces and state directories:

```
~/.openclaw/
├── workspace/         # main agent (default)
├── workspace-alex/    # Alex's workspace
├── workspace-mia/     # Mia's workspace
└── agents/
    ├── main/agent/
    ├── alex/agent/
    └── mia/agent/
```

### Customize Each AI Personality

Each Agent has its own SOUL.md. You can define completely different personas:

**Alex's SOUL.md** (tech-oriented assistant):
```markdown
You are Claw, Alex's technical partner. You know his projects (data pipelines,
backend services), his preference for TDD, and his toolchain. Responses should
be concise and direct. When he ships code past midnight, gently remind him to rest.
```

**Mia's SOUL.md** (life-oriented assistant):
```markdown
You are Mia's daily assistant. Help with shopping lists, recipe recommendations,
and calendar reminders. Warm, patient tone — like a thoughtful friend. She is not
a developer, so avoid technical jargon.
```

### Record User Preferences in USER.md

Beyond SOUL.md, include a `USER.md` in each Agent's workspace with user-specific information:

```markdown
# Alex
- Based in Berlin, backend engineer
- Prefers concise replies
- Tech stack: Python, Rust, Kubernetes
- Active hours: weekdays 9:00-23:00 CET
- Dietary preferences: vegetarian
```

OpenClaw loads `USER.md` into context at the start of every session, so the Agent doesn't have to re-learn the user each time.

## Step 2: Route Messages with Bindings

Agents are created, but the Gateway doesn't yet know whose message goes where. Configure **Bindings** — mappings from inbound messages to agents.

### Route by DM Contact

If you have one WhatsApp number but want different contacts to reach different agents:

```json5
// ~/.openclaw/openclaw.json
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+4912345678901" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+4912345678902" } },
    },
  ],
}
```

> **Most-specific-wins principle**: peer-level matches always take precedence over channel-level matches. If you configure both an exact contact match and a channel-wide wildcard, the specific contact's rule wins.

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

## Step 3: Session Isolation — Keep Conversations Private

The most common multi-user pitfall: misconfigured session isolation, causing User A's conversation context to leak into User B's. OpenClaw controls this granularity via `dmScope`:

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

With `per-channel-peer`, Alex's WhatsApp conversations and Mia's are completely isolated — neither can see the other's.

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

A session reset clears conversation history, but persistent memory in MEMORY.md is unaffected — same as your personal assistant experience.

## Step 4: Skill Sharing — One Pool, Everyone Benefits

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
# Mia doesn't need PR review — give her a simplified version
mkdir -p ~/.openclaw/workspace-mia/skills/github
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
        id: "alex",
        workspace: "~/.openclaw/workspace-alex",
        skills: ["weather", "github", "coding-agent"],  // Alex's extra skills
      },
      {
        id: "mia",
        workspace: "~/.openclaw/workspace-mia",
        skills: ["weather", "shopping"],  // Mia doesn't need github
      },
    ],
  },
}
```

## Step 5: Security Isolation — Tailored Permissions

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

A typical family multi-user deployment:

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
        id: "alex",
        name: "Alex's Assistant",
        workspace: "~/.openclaw/workspace-alex",
        skills: ["weather", "github", "coding-agent"],
      },
      {
        id: "mia",
        name: "Mia's Assistant",
        workspace: "~/.openclaw/workspace-mia",
        skills: ["weather", "shopping", "cooking"],
        sandbox: { mode: "off" },
      },
      {
        id: "family",
        name: "Family Assistant",
        workspace: "~/.openclaw/workspace-family",
        groupChat: {
          mentionPatterns: ["@familybot"],
        },
        sandbox: {
          mode: "all",
          scope: "agent",
        },
        tools: {
          allow: ["read", "exec"],
          deny: ["write", "edit", "apply_patch", "browser", "cron"],
        },
      },
    ],
  },

  // Message routing
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+4913811112222" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+4913811113333" } },
    },
    {
      agentId: "family",
      match: {
        channel: "whatsapp",
        peer: { kind: "group", id: "120363999999999999@g.us" },
      },
    },
  ],

  // Session isolation
  session: {
    dmScope: "per-channel-peer",
    reset: {
      mode: "daily",
      idleMinutes: 120,
    },
  },
}
```

## Common Deployment Patterns

### Pattern 1: Family Sharing

A home Mac mini as Gateway. Each family member has their own Agent, all sharing one WhatsApp number. Gateway routes by sender phone number. Shared skill pool (weather, shopping, recipes), while personal coding skills are visible only to the developer in the family.

### Pattern 2: Team Collaboration

A shared Gateway server for the team. Each member has their own Agent and workspace. Connected via Slack or similar channels — DMs auto-route to individual agents. Shared skills (GitHub, Jira, documentation search) live in `~/.openclaw/skills`; project-specific skills stay in individual workspaces.

### Pattern 3: One Person, Multiple Personas

Same person, different platforms, different Agent personalities. Telegram gets the "deep work Agent" running Claude Opus; WhatsApp gets the "daily assistant" on Sonnet. Skills are shared, but persona and model are independent.

```json5
bindings: [
  { agentId: "deep-work", match: { channel: "telegram" } },
  { agentId: "daily", match: { channel: "whatsapp" } },
]
```

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

Start with only your own contacts in `allowFrom`. Test for a few days to confirm isolation works and skills function correctly before adding other people's numbers.

## Summary

OpenClaw's multi-agent architecture is elegantly simple, built on three principles:

1. **Independent Agents** = independent brains (workspace, SOUL.md, session store)
2. **Bindings** = message dispatch rules (whose message goes to which brain)
3. **Layered Skills** = shared pool (`~/.openclaw/skills`) + per-agent overrides (`<workspace>/skills`)

No multiple instances. No extra servers. One Gateway serves your entire household or team with personalized AI assistants. And because skills are shared, maintenance cost actually decreases as you add users — that's the right way to do multi-user deployment.
