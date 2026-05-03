---
author: samanhappy
pubDatetime: 2026-05-03T17:45:00.000Z
modDatetime: 2026-05-03T17:45:00.000Z
title: "OpenClaw Heartbeat: Teaching Your AI to Patrol Autonomously"
featured: false
draft: true
tags:
  - OpenClaw
  - AI Agent
  - Automation
description: "A deep dive into OpenClaw's Heartbeat mechanism — what it is, how it differs from Cron, how to enable and disable it, and how much token you save by turning it off."
---

You install OpenClaw for the first time. You configure a model, connect Telegram, and everything feels magical. Then, after a while — maybe a day, maybe a week — you notice something: the agent only responds when you message it first. If you don't say anything, it stays completely silent.

That's not a bug. OpenClaw is passive by default — receive a message, run inference, reply, sleep.

But a real AI assistant shouldn't just be "on call." It should proactively watch things for you: any urgent emails? Is that meeting starting soon? Is the server disk almost full?

That's what the Heartbeat mechanism is for.

![OpenClaw Heartbeat Mechanism](../../../assets/images/openclaw-heartbeat.png)

## What Heartbeat Is: Your Agent's Autonomous Patrol

Heartbeat is a built-in OpenClaw mechanism that wakes the agent at fixed intervals to check if anything needs attention.

Think of it as a security guard making rounds. Every 30 minutes (by default), the agent reads a `HEARTBEAT.md` "patrol checklist" and checks each item. If everything is fine, it replies `HEARTBEAT_OK` and goes back to sleep. If it finds something worth noting — an urgent email, an upcoming deadline — it proactively sends you a message.

> **Core design philosophy**: Heartbeat is a **gate**, not a **workflow**. Its job isn't to execute complex tasks — it's to decide: is there anything worth waking up to tell the human?

## How Heartbeat Works

A full heartbeat cycle:

```
Timer fires (default: every 30 min)
    ↓
Agent wakes up, reads HEARTBEAT.md
    ↓
Checks each item (inbox / calendar / system state / custom tasks)
    ↓
Anything worth noting? ── Yes → Sends you a proactive message
    │
    No → Replies HEARTBEAT_OK → Goes back to sleep
```

### HEARTBEAT.md: Your Patrol Checklist

Heartbeat reads a Markdown file in the agent's workspace. The official template is minimal:

```markdown
# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
```

A practical `HEARTBEAT.md` looks like this:

```markdown
# Heartbeat Checklist

- Quick scan: anything urgent in the inbox?
- If daytime, check for meetings in the next 2 hours that need prep.
- If a task is blocked, note what's missing and remind me next chat.
```

**Key detail**: If `HEARTBEAT.md` exists but is effectively empty (only blank lines and headers), OpenClaw skips the heartbeat run entirely — no API call at all. The log will show `reason=empty-heartbeat-file`.

### Embedded tasks: finer rhythm control

You can define sub-tasks at different intervals within `HEARTBEAT.md`:

```markdown
tasks:
  - name: inbox-triage
    interval: 30m
    prompt: "Check for urgent unread emails and flag anything time-sensitive."
  - name: calendar-scan
    interval: 2h
    prompt: "Check for meetings in the next 4 hours that need preparation."
  - name: system-health
    interval: 6h
    prompt: "Check disk and memory. Alert if over 80%."

# Additional notes
- Keep alerts short.
- If no tasks need attention, reply HEARTBEAT_OK.
```

This way you don't need a separate Cron job for each check — one `HEARTBEAT.md` handles it all. The heartbeat fires every 30 minutes, but `calendar-scan` only triggers every 2 hours, and `system-health` every 6 hours.

### The HEARTBEAT_OK Protocol

This is the most elegant part of the heartbeat design. The agent doesn't send you every heartbeat result — that would flood you with noise.

The protocol works like this:

1. If the agent decides everything is fine, it replies `HEARTBEAT_OK`.
2. The Gateway detects this token and **automatically drops the reply** — you get no notification.
3. If the agent finds something worth noting, it **omits** `HEARTBEAT_OK` and sends the alert directly.
4. The Gateway sees no `HEARTBEAT_OK` and knows it's a "real message" — it pushes the notification to you.

The core logic: **you're a human, not a log system. Only meaningful things should trigger a notification.**

## Heartbeat vs Cron: Patrol and Alarm Clock Are Different

A common first reaction: "Isn't this just a cron job? Why do I need heartbeat if I already have Cron?"

They are fundamentally different mechanisms.

| Dimension | Heartbeat | Cron |
|-----------|----------|------|
| **Essence** | Patrol: check if anything needs attention | Alarm clock: execute at a precise time |
| **Trigger** | Periodic (default 30 min), approximate timing | Precise timing (cron expression) |
| **Context** | Runs in main session, sees full conversation history | Isolated session by default, no history |
| **Response** | `HEARTBEAT_OK` silent protocol | Always produces output |
| **Best for** | Inbox checks, calendar monitoring, anomaly detection | Daily briefings, weekly reports, exact-time reminders |

In one sentence:

> **Heartbeat is for "watching" — continuously monitoring state changes. Cron is for "broadcasting" — delivering content at precise times.**

Real example:

- **Heartbeat**: Check the calendar every 30 minutes. Alert me if there's a meeting in the next 2 hours. Meeting time changed? Heartbeat adapts automatically.
- **Cron**: Push a "daily news briefing" every morning at 9:00 AM. Whether you're awake or not, 9 AM sharp.

They're complementary, not competing. I use both — heartbeat watches my calendar and inbox, Cron handles the 9:30 AM news briefing and 10:00 AM GitHub activity check.

## Practical Heartbeat Use Cases

### Use Case 1: Inbox Sentry

The classic use case. Write a `HEARTBEAT.md` that scans unread emails and only alerts you about truly important ones. Not every email triggers a notification — this is where heartbeat's "gatekeeper" philosophy shines.

### Use Case 2: Calendar Guardian

"You have a client meeting at 2 PM and haven't prepared the presentation."

The agent's heartbeat checks your calendar every 30 minutes and catches meetings you forgot to prep for. This is "proactive reminding" — a fundamentally different experience from the passive alarm you set in your calendar app.

### Use Case 3: System Health Monitoring

If you're running OpenClaw on a server, heartbeat can monitor disk, memory, and process status:

```markdown
tasks:
  - name: system-health
    interval: 1h
    prompt: "Run df -h and free -m. Alert if disk > 80% or memory > 90%."
```

### Use Case 4: "Time to Rest" Check-ins

Heartbeat has a thoughtful default — "check up on your human occasionally during daytime." Combined with `activeHours`, the agent might occasionally ask "anything you need help with?" during your waking hours, but never in the middle of the night.

### Use Case 5: Manual Wake

Sometimes you want to trigger a heartbeat immediately, without waiting:

```bash
openclaw system event --text "Check for urgent emails" --mode now
```

`--mode now` triggers an immediate heartbeat. `--mode next-heartbeat` waits for the next scheduled tick.

## How to Enable and Configure Heartbeat

### Minimal Config — Works Out of the Box

Heartbeat is enabled by default at 30-minute intervals. If you change nothing, your agent is already patrolling silently.

But the default has a problem: **it runs in the main session, carrying the full conversation history.** If you've been chatting for hundreds of turns, each heartbeat sends tens of thousands of history tokens to the model — that's heartbeat's biggest hidden cost.

### Recommended Config — Affordable and Effective

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last",               // Deliver to last-used channel
        isolatedSession: true,        // 🔑 Fresh session — no conversation history
        lightContext: true,           // 🔑 Only load HEARTBEAT.md, skip other bootstrap files
        skipWhenBusy: true,           // Defer when agent is busy
        activeHours: {
          start: "08:00",
          end: "23:00",
          timezone: "Asia/Shanghai",
        },
        model: "deepseek/deepseek-chat-v4",  // Use a cheap model for heartbeats
      },
    },
  },
}
```

What each option does:

| Option | Effect | Recommended |
|--------|--------|-------------|
| `every` | Heartbeat interval | `"30m"` balanced; `"10m"` more responsive but pricier; `"1h"` frugal |
| `target` | Where to deliver alerts | `"last"` (last used channel); `"none"` if you don't want notifications |
| `isolatedSession` | Fresh session each run | `true` — dramatically reduces token usage |
| `lightContext` | Minimal context | `true` — only injects HEARTBEAT.md |
| `skipWhenBusy` | Defer when busy | `true` — avoids conflicts with sub-agents or Cron |
| `activeHours` | Active time window | Set to your waking hours, skip at night |
| `model` | Heartbeat-specific model | Use a cheap model like DeepSeek V4 Flash |

### Per-Agent Heartbeat

If you have multiple agents, only enable heartbeat for specific ones:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last",
      },
    },
    list: [
      { id: "main", default: true },   // Main agent, no heartbeat
      {
        id: "ops",                      // Ops agent, runs heartbeat alone
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "123456789",
          prompt: "Read HEARTBEAT.md. Check server health and inbox. Reply HEARTBEAT_OK if all clear.",
        },
      },
    ],
  },
}
```

> Note: once any agent in `agents.list[]` defines a `heartbeat` block, **only those agents** run heartbeats. The global default no longer auto-applies.

### Multi-Account Setup

Your Telegram has two bots (personal and work). Heartbeat only sends to the work bot:

```json5
{
  agents: {
    list: [{
      id: "ops",
      heartbeat: {
        every: "1h",
        target: "telegram",
        to: "12345678:topic:42",
        accountId: "work-bot",
      },
    }],
  },
  channels: {
    telegram: {
      accounts: {
        "work-bot": { botToken: "YOUR_WORK_BOT_TOKEN" },
      },
    },
  },
}
```

## How to Disable Heartbeat and the Token Savings

### Full Disable

One line of config:

```json5
{
  agents: {
    defaults: {
      heartbeat: { every: "0m" },
    },
  },
}
```

Set `every` to `"0m"` and heartbeat stops completely. Common reasons to disable:

- You're a light user who doesn't need 24/7 background monitoring
- You're using a pay-per-token model and want to cut costs
- Cron alone covers your needs, no autonomous judgment required

### Effects After Disabling

**Short-term**: The agent stops proactively checking. Your inbox, calendar, and system status lose automatic monitoring — unless you ask manually.

**Token savings**: This is the most tangible benefit. Let's do the math.

Default heartbeat config (30 min interval, main session, full context):

```
Frequency: every 30 min → 48 times/day
Tokens per run: main session history + system prompt ≈ 20,000–50,000 tokens
Daily token consumption: 48 × 35,000 ≈ 1,680,000 tokens
```

**That's 1.68 million tokens per day just on heartbeats.** Using DeepSeek V4 Flash (input $0.14/million tokens):

```
Daily heartbeat cost: 1.68M × $0.14 ≈ $0.235/day
Monthly heartbeat cost: $0.235 × 30 ≈ $7/month
```

In contrast, optimized heartbeat (isolated session + light context):

```
Tokens per run: ~2,000–5,000 tokens (just HEARTBEAT.md + default prompt)
Daily token consumption: 48 × 3,500 ≈ 168,000 tokens
Daily heartbeat cost: 0.168M × $0.14 ≈ $0.023/day
Monthly heartbeat cost: $0.023 × 30 ≈ $0.70/month
```

Same heartbeat, optimised cost is **1/10th** of the default.

Disabling heartbeat saves that $0.70–$7/month. Not huge in absolute terms, but if you're on Claude Sonnet 4 as your main model with no `isolatedSession: true`, disabling could save you hundreds per month.

### On-Demand (Keep the Power, Skip the Automation)

A middle ground: keep `HEARTBEAT.md`, disable automatic heartbeat, trigger manually:

```json5
// Disable automatic heartbeat
{ heartbeat: { every: "0m" } }
```

```bash
# Trigger manually when needed
openclaw system event --text "Check for urgent emails today" --mode now
```

You keep the patrol capability but don't burn tokens when you don't need it.

## Five Cost Optimization Tips

If you don't want to fully disable heartbeat but want to save tokens:

| Technique | Savings | Trade-off |
|-----------|---------|-----------|
| `isolatedSession: true` | Massive (from 30K tokens/run → 3K) | Heartbeat can't reference conversation history |
| `lightContext: true` | Moderate (removes AGENTS.md etc. from bootstrap) | Only HEARTBEAT.md remains |
| Longer interval | Direct (30 min → 1h = 50% savings) | Patrol density drops |
| Cheaper model | Based on model price difference | Judgment quality may decrease |
| `activeHours` time window | Direct (15 hours/day = 37.5% savings) | No monitoring while you sleep |

**Top recommended combo**: `isolatedSession: true` + `lightContext: true` + `activeHours` + DeepSeek V4 Flash. Monthly heartbeat cost under $0.50.

## Summary

Heartbeat is the mechanism that transforms OpenClaw from a "passive chatbot" into a "proactive AI assistant."

Key takeaways:

- **Heartbeat ≠ Cron**. Heartbeat patrols (watching state changes), Cron broadcasts (precise-time execution).
- **The HEARTBEAT_OK protocol** is the magic — only meaningful things interrupt you.
- **Default config is expensive**. Without `isolatedSession`, heartbeat can burn 1.68M tokens/day.
- **Optimized, it's dirt cheap**. Isolated session + cheap model = under $1/month.
- **Disabling is trivial**: `every: "0m"` — one line.

Whether to keep heartbeat on depends on how much you need the agent's proactive awareness. If you're a light user who chats occasionally, turn it off and save. If you want your agent watching your inbox, calendar, and system state, keep it on — just make sure `isolatedSession` is set.
