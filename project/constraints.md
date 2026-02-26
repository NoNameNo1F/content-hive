# Project Constraints

---

## Decided Stack

**Frontend:** Next.js (App Router)
**Backend/DB/Auth/Storage:** Supabase (all-in-one)
**Hosting:** Vercel
**Search:** Supabase Full-Text Search (tsvector, built-in)

---

## Budget

| Service | Tier | Cost/mo |
|---------|------|---------|
| Supabase — DB + Auth + Storage + FTS | Free → Pro | $0–$25 |
| Vercel — Next.js Frontend + API Routes | Hobby | $0 |
| **Total** | | **$0–$25/mo** |

**Hard limit: $50/month.** Any decision that pushes beyond this must be flagged to the Orchestrator.

**Free tier watch:** Supabase pauses the DB after 1 week of inactivity on the free plan. Upgrade to Pro ($25/mo) when the team starts active daily use.

---

## Team Constraints

- **Team size:** 1–2 engineers (solo primary developer)
- **Timeline:** ASAP — V1 target is 3–4 weeks
- No dedicated DevOps, QA, or design resources
- Must be maintainable by a single developer long-term

---

## Architectural Rules

- **RLS must be enabled from day one** — public vs team visibility is enforced at the DB level, never in application code alone
- Write business logic in **Next.js API routes**, not Supabase edge functions — keeps backend logic portable if stack evolves
- Interact with Postgres via **standard SQL** — avoid Supabase-specific extensions that would block future migration
- Keep DB schema simple and normalized — no premature optimization
- No over-engineering: if a feature takes > 2 days to build in V1, defer to V2

---

## Design Constraints

- No dedicated designer — use shadcn/ui component library
- Mobile-responsive markup from day one, full mobile polish is V2
- Dark/light mode is optional — do not block V1 on it

---

## Scope Constraints — NOT in V1

| Feature | Reason Deferred |
|---------|----------------|
| AI summaries / Q&A | Requires additional infra + cost |
| Knowledge graph | High complexity, V3 feature |
| Native mobile app | Out of budget and scope |
| Real-time live feed | Adds complexity, not core to V1 |
| Video hosting/upload | Embeds only (YouTube, Vimeo) |
| Payment/monetization | Not in current vision |
| Advanced analytics | V2+ |
| Email notifications | V2 |
| Custom domain | Vercel subdomain sufficient for V1 |

---

## Risk Flags

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep into V2/V3 | Delays V1 | Strict V1 checklist, Orchestrator enforces scope gate |
| RLS misconfiguration | Team content leaks to public | agent-qa must sign off on RLS before any content feature ships |
| Supabase free tier DB pause | Dev disruption | Upgrade to $25 Pro when daily use begins |
| Solo developer burnout | Project stalls | Timebox features, ship imperfect V1 |
