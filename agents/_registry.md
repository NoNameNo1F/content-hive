# Agent Registry
> Orchestrator reads this index first, then loads ONLY the agent file needed for the current task.
> Never load all agent files at once — load on demand to preserve token budget.

## Stack
Next.js (App Router) · Supabase (DB + Auth + Storage + FTS) · Vercel · TypeScript

## Agent Index

| ID | File | Domain | Status |
|----|------|--------|--------|
| `agent-arch` | `agents/arch.md` | DB schema, system design, API contracts | ✅ |
| `agent-devops` | `agents/devops.md` | Vercel + Supabase setup, env, CI/CD, MCP | ✅ |
| `agent-auth` | `agents/auth.md` | Supabase Auth, roles, middleware, onboarding | ✅ |
| `agent-backend` | `agents/backend.md` | Migrations, RLS policies, API routes | ✅ |
| `agent-content` | `agents/content.md` | Post creation, OG metadata, embeds, bookmarks | ✅ |
| `agent-feed` | `agents/feed.md` | Interest-based feed, sorting, pagination | ✅ |
| `agent-search` | `agents/search.md` | FTS tsvector, search UI, filters | ✅ |
| `agent-frontend` | `agents/frontend.md` | Pages, components, layouts, UI | ✅ |
| `agent-qa` | `agents/qa.md` | RLS tests, edge cases, phase sign-off | ✅ |

## Board Agents (Strategic Review — Non-Coding)

> These agents do not write code. They review phase outputs and debate what to build next.
> Run a board review by sending one prompt to all three in a group chat (BizClaw or similar).

| ID | File | Domain | Status |
| -- | ---- | ------ | ------ |
| `board-ceo` | `agents/board/ceo.md` | Product vision, prioritization, market positioning | ✅ |
| `board-cfo` | `agents/board/cfo.md` | Unit economics, revenue model, cost of goods | ✅ |
| `board-cmo` | `agents/board/cmo.md` | Growth, acquisition, retention, virality | ✅ |
| `board-cto` | `agents/board/cto.md` | Technical architecture, stack decisions, scalability | ✅ |
| `board-cso` | `agents/board/cso.md` | Security posture, access control, compliance | ✅ |

> **When to run a board review:** After each major phase completes. Prompt: "Phase N is done. Here's what we built: [summary]. What should Phase N+1 focus on?"

## Global Skills (all agents must read before coding)
- `agents/skills/code-standards.md` — folder structure, naming, TypeScript, patterns

## Dependency Order
```
agent-arch → agent-devops (parallel)
           → agent-auth
           → agent-backend → [agent-qa RLS gate] → agent-content
                                                  → agent-feed
                                                  → agent-search
                                                  → agent-frontend
```

## RLS Hard Gate
⛔ agent-content, agent-feed, agent-search, agent-frontend cannot start until agent-qa signs off on RLS.
