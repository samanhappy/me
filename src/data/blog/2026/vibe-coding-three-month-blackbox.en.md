---
author: samanhappy
pubDatetime: 2026-04-30T14:00:00.000Z
modDatetime: 2026-04-30T14:00:00.000Z
title: "The Three-Month Black Box of Vibe Coding: Why I Chose AI Coding + TDD"
featured: false
draft: false
tags:
  - AI Coding
  - TDD
  - Vibe Coding
  - MCP
description: "When 92% of developers use AI to write code daily, the line between 'it works' and 'it works well' has never mattered more."
---

## A Real Scenario

A friend recently asked me to look at his project. A SaaS backend built entirely with Cursor over three months — it worked fine at first, but now every change triggers a cascade of failures. "I'm afraid to touch it," he told me. "Even the AI can't fix it anymore."

I opened the repo: no tests, no documentation, functions named `handleStuff` and `processData`, the same logic duplicated across four files in three different variations. Every line of AI-generated code "worked," but no one — including the AI itself — could understand the system as a whole anymore.

This is what I call the "three-month black box."

## The Seduction of Vibe Coding

Let me be clear: I'm not against vibe coding. When Andrej Karpathy coined the term in early 2025, he described a way of programming where you "fully give in to the vibes, embrace exponentials, and forget that the code even exists." For prototypes, weekend projects, and throwaway scripts, it's genuinely great.

The numbers show how massive this trend has become: 92% of US developers use AI coding tools daily, and 46% of new code is AI-generated. This isn't the future — it's the present.

But seduction always has a price.

## What Happens After Three Months

When you push a project forward with vibe coding for three months, several things happen simultaneously:

**The context window hits a wall.** AI can only see a limited context at any given time. When the project is small, it can "remember" the entire system. As it grows, the AI starts forgetting — solving the same problem with different patterns in different files. Code duplication can reach up to 8x — not because the AI is dumb, but because each conversation starts from scratch.

**Security vulnerabilities accumulate silently.** Research shows that 45% of AI-generated code contains OWASP Top-10 vulnerabilities. SQL injection, XSS, insecure deserialization — these aren't sophisticated attack vectors, they're fundamentals. The AI won't proactively tell you "this code has a security risk" unless you ask.

**Debugging costs overtake the savings.** 63% of developers report spending more time debugging AI-generated code. The time saved upfront gets paid back in debugging — often with interest, because you're debugging code you didn't fully write or understand.

**No one can see the full picture.** This is the most lethal one. After three months, the codebase's complexity exceeds anyone's — including the AI's — ability to comprehend it. You don't know what a change will break, which code is alive and which is dead. The project enters a state where you can only add, never modify.

## My Approach: AI Coding + TDD

I used AI to write nearly all the code in MCPHub. The project now has over 2,000 stars, runs stably, and is continuously iterated on. But from day one, I never "vibed" — I gave the AI guardrails.

### AGENTS.md: A Behavior Contract for AI

In MCPHub, I maintain an AGENTS.md file that defines all constraints for AI-assisted development: code style, naming conventions, testing requirements, commit rules. Every time I ask the AI to write code, this file defines its behavioral boundaries.

This isn't bureaucracy. An AI without AGENTS.md is like a new hire who doesn't know your team's coding standards — technically capable, but producing code that clashes with everything else. The longer it goes on, the worse it gets.

### TDD: Tests as a Second Brain

Test-driven development isn't new, but in the context of AI coding, its value gets redefined.

In traditional development, TDD helps you clarify requirements and ensure correctness. In AI coding, TDD gains an additional role: **it's your verification mechanism for AI output.** The AI writes a function — tests tell you if it's actually correct. The AI refactors some logic — tests tell you if existing behavior broke.

My workflow looks roughly like this:

1. I write the requirements (defining "what correct looks like")
2. AI writes the implementation and tests (solving "how to get there")
3. Tests pass → I do a code review
4. Review passes → merge to main

Tests don't expire. They don't forget. They aren't limited by context windows. They're the only thing in the system that "always remembers the rules."

### Human Review: Final Authority Stays with Humans

AI writes code fast, but I never auto-merge. Every piece of AI-generated code gets my eyes on it before it goes in.

Not because the AI is frequently wrong — accuracy is actually quite high. But because:

- I need to understand the code. If I don't understand it now, I won't know how to fix it when things break.
- I need to judge direction. AI can solve the immediate problem, but it doesn't always know whether the solution aligns with the overall architecture.
- I need to maintain judgment. Developers who fully delegate to AI gradually lose their intuition for what good code looks like.

## Not Rejecting AI — Harnessing It

I've seen two extremes: people who refuse AI, believing "real programmers don't use these tools," and people who hand everything to AI, believing "we'll never need to write code again."

Both are wrong.

AI is the most powerful programming lever of this era, but a lever needs a fulcrum. TDD is a fulcrum. AGENTS.md is a fulcrum. Human review is a fulcrum. A lever without a fulcrum is just a stick — the harder you push, the faster you lose control.

My experience: constraints aren't the enemy of velocity — they're the prerequisite. MCPHub's development speed is no slower than any vibe-coded project, but three months later it remains maintainable, comprehensible, and safe to iterate on.

## Final Thought

If you're using AI to write code — and you probably are — ask yourself one question:

**Three months from now, will you still be able to understand this project?**

If the answer is uncertain, maybe it's time to give your AI some scaffolding. You don't need to sacrifice speed — just add a bit of structure: write tests, define standards, keep reviewing.

AI won't slow down. But unconstrained code definitely will.
