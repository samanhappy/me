---
author: 青扬
pubDatetime: 2026-05-12T10:00:00.000Z
modDatetime: 2026-05-12T10:00:00.000Z
title: "OpenClaw vs Hermes: A Deep Dive into Their Memory Systems"
featured: false
draft: false
tags:
  - OpenClaw
  - Hermes
  - AI Agent
  - Memory
description: "A practical comparison of memory systems in two major AI agent frameworks: bounded curated memory vs searchable long-term memory — what actually differs and when to pick which."
---

> **TL;DR**: Both systems use MEMORY.md for persistent memory, but the design philosophies diverge sharply. Hermes uses bounded, curated memory split across two files (MEMORY.md for environment facts, USER.md for user profile) with hard character limits — when full, the agent must compress. OpenClaw uses searchable long-term memory: a single MEMORY.md, retrieved via hybrid vector + keyword search, with no strict size cap. If you care about predictable context token costs, go Hermes. If you need larger memory capacity and flexible retrieval, go OpenClaw.

---

After running an AI agent for a few weeks, most people hit the same question: what does it actually remember, and what does it silently forget?

Memory is the foundation of whether an agent gets smarter over time. I've been running both OpenClaw and Hermes, and this post tears apart both memory systems — not to summarize feature lists, but to show where the real differences land in practice.

## How Each System Stores Memory

### OpenClaw: One MEMORY.md, Retrieved on Demand

OpenClaw stores persistent memory in a MEMORY.md file inside the agent workspace. You can open this file directly, read what the agent recorded, and even edit it by hand — **human-auditable** is the most distinctive property of OpenClaw's memory design.

Retrieval uses **hybrid search**: vector semantic search and keyword matching run in parallel, scores are merged. Each time the agent needs memory context, the system automatically pulls relevant entries and injects them. There's no hard character cap — however much the agent remembers, that's what's there.

Session and Memory are two separate things. Session History is the running conversation log — it clears on daily reset, idle timeout, or `/new`. The contents of MEMORY.md survive session resets. That's the point of persistent memory.

### Hermes: Two Files, Bounded and Curated

Hermes splits memory into two files:

- **MEMORY.md**: The agent's personal notes — environment facts, tool conventions, lessons learned
- **USER.md**: User profile — your preferences, communication style, expectations

Both live at `~/.hermes/memories/` with strict character limits: MEMORY.md caps at 2,200 characters (~800 tokens), USER.md at 1,375 characters (~500 tokens).

At the start of every session, both files are loaded as a **frozen snapshot** and injected into the system prompt. It's not dynamic retrieval — it's a fixed block. Changes made mid-session are written to disk immediately but won't appear in the system prompt until the next session. This is intentional: it keeps the system prompt prefix stable for LLM caching.

When memory fills up, the agent gets an error and has to compress: merge related entries, remove stale ones, then add the new content.

## The Core Divide: Bounded vs Searchable

The fundamental split between these two designs is how they approach memory capacity.

Hermes answers with bounded, curated memory. Hard character limits force the agent to actively manage and compress. Context token cost per session is fixed and predictable. The downside: complex environments with many accumulated preferences fill 2,200 characters faster than you'd expect.

OpenClaw answers with searchable long-term memory. No hard cap, retrieval pulls what's needed. Theoretically unlimited. The downside: retrieval quality determines what's effectively available — if a memory entry isn't retrieved, it doesn't exist for that turn.

> Hermes memory is "cards always on the table." OpenClaw memory is "an archive you can search."

## Cross-Session History

How each system handles finding things from past conversations differs meaningfully.

Hermes has **Session Search**: every CLI and messaging session is stored in SQLite (`~/.hermes/state.db`) with FTS5 full-text indexing. The agent can use the `session_search` tool to find what was discussed last week, with results summarized by an LLM. This acts as an unbounded recall layer — searchable on demand, zero token cost when idle.

OpenClaw session history is cleared at session end. Important information depends on the agent proactively writing it to MEMORY.md during the conversation. There's no built-in cross-session full-text search — MEMORY.md is the entire persistence layer.

Both approaches trade off differently: Hermes Session Search lets you surface any past conversation, but requires a search + summarization step. OpenClaw's model is simpler — it's either in memory, or it's gone.

## Who Keeps Memory Updated

Hermes has a **background review** loop: every N conversation turns, the agent automatically reflects and updates MEMORY.md, USER.md, and its own skills. The goal is for the agent to progressively build a model of who you are without you explicitly saying "remember this."

OpenClaw also supports the agent proactively writing to memory, but there's no dedicated background memory maintenance process. OpenClaw's Heartbeat mechanism focuses on proactive monitoring and task triggering — not memory consolidation.

The practical difference: with Hermes, after extended use you notice the agent's sense of your preferences sharpening over time, almost without trying. With OpenClaw, memory is more explicit — you said it, it recorded it, you can see exactly what's there. Higher transparency, less automation.

## External Memory Plugins

When built-in memory isn't enough, the extension paths diverge.

Hermes ships with 8 official external memory provider plugins: Honcho, OpenViking, Mem0, Hindsight, Holographic, RetainDB, ByteRover, and Supermemory. These stack on top of built-in memory and add capabilities like knowledge graphs, semantic search, automatic fact extraction, and cross-session user modeling.

The community also produced **Mnemosyne** — a third-party local-first memory system built specifically for Hermes. It runs on SQLite with native vector search, sub-millisecond read latency, and a three-tier BEAM architecture (working memory, episodic memory, scratchpad). It supports importing from Mem0, Letta, Zep, and several other systems.

OpenClaw's design is more self-contained, with no official external memory provider interface. Extensibility runs through the Skills system.

## Security

Hermes scans entries before writing them to memory: prompt injection patterns, credential exfiltration, SSH backdoor indicators, and invisible Unicode characters are all blocked.

The reasoning is straightforward: when an agent autonomously manages its own memory, and that memory gets injected into the system prompt, memory becomes an attack surface. You can't unconditionally trust what gets written in.

OpenClaw's human-auditable design addresses this from the other direction — open MEMORY.md and you can see exactly what's in there. Any anomaly is immediately visible. One approach relies on automated filtering, the other on human review.

## Side-by-Side

| Dimension | OpenClaw | Hermes |
|-----------|----------|--------|
| Memory files | Single MEMORY.md | MEMORY.md + USER.md |
| Character limit | None | 2,200 + 1,375 chars |
| Retrieval | Hybrid search (vector + keyword) | Frozen snapshot injection |
| Cross-session search | None built-in | FTS5 full-text search |
| Background memory updates | None dedicated | Background review (every N turns) |
| External providers | No official interface | 8 official plugins |
| Security scanning | None | Yes |
| Auditability | File is directly readable/editable | File readable, auto-managed |

## Habits That Save You Pain Later

**When Hermes memory fills up, don't just delete things**. The 2,200-character limit triggers after sustained use. Have the agent consolidate related entries rather than deleting at random. High information density entries are worth keeping.

**Check OpenClaw's MEMORY.md periodically**. With no capacity cap, the file accumulates cruft over time and retrieval quality drifts downward. Every few weeks, open it and manually remove what's outdated.

**Hermes memory updates have a one-session lag**. Changes written during a session aren't visible in the system prompt until the next session starts. If you just told it an important preference, it still doesn't "know" in the current session.

**Neither system benefits from remembering everything**. The value of a memory system is remembering what's actually useful, not storing every exchange. Curation beats volume.

---

If you're coming from OpenClaw, Hermes ships a migration tool: `hermes claw migrate` imports your MEMORY.md and USER.md entries directly. Low friction if you want to try the other side.

The core difference between these two memory systems isn't complicated: one optimizes for determinism and compactness, the other for flexibility and capacity. Which matters more depends on what you're actually doing with the agent.
