---
layout: doc
outline: [2, 3]
title: "The Backend That Writes Itself — NpgsqlRest in 19 Slides"
titleTemplate: NpgsqlRest
description: "An interactive slide deck: how NpgsqlRest turns a PostgreSQL database into a complete, production-grade backend — REST API, typed TypeScript client, and AI-agent tools — with real, reproducible numbers from a product in production."
head:
  - - meta
    - name: keywords
      content: npgsqlrest presentation, postgresql backend, sql rest api, declarative backend, ai infrastructure postgres, postgrest supabase alternative
  - - meta
    - property: og:title
      content: "The Backend That Writes Itself — NpgsqlRest in 19 Slides"
  - - meta
    - property: og:description
      content: "An interactive slide deck on turning PostgreSQL into a complete production backend with NpgsqlRest."
  - - meta
    - property: og:type
      content: article
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - property: og:image
      content: https://npgsqlrest.github.io/presentation/slide-1.png
---

<script setup>
import { presentationSlides as slides } from '../.vitepress/theme/data/presentationSlides'
</script>

# The Backend That Writes Itself

*An interactive walk-through of the NpgsqlRest pitch deck — point a single binary at PostgreSQL and get a complete, production-grade backend: a REST API, a typed TypeScript client, and AI-agent tools, all generated from your schema.*

Use the arrows, thumbnails, or your keyboard (**←/→** to move, **F** for fullscreen, **N** for speaker notes). Hit **▶** to let it auto-advance. Every figure in the deck is measured from a real product in production and is reproducible — see the appendix slides.

<SlideDeck :slides="slides" title="The backend that writes itself · 2026" />

## The narration

The deck is designed to be skimmed visually, but the story is in the speaker notes. Here it is slide by slide.

<div class="transcript">

1. **The backend that writes itself.** I built a tool that turns a Postgres database into a complete, production-grade backend — and I've been running a real product on it for 9 months.
2. **The tax.** Change one column and you touch five files in three languages. Every team on earth pays this tax. It has nothing to do with their product.
3. **The solution.** A single native binary. You point it at your database, it builds the API at startup, and writes the typed frontend client into your source tree. The contract can't drift — it's generated from the schema minutes ago.
4. **An endpoint is a SQL file.** The same endpoint in a traditional stack is route, controller, validation, DTO, service, repository, client type, client function — 5 to 7 files, 2 to 3 languages, plus a code review for each. Here, an endpoint is a SQL file.
5. **The type-system collapse.** One source of truth. In the case-study product, 154 API contracts exist — and exactly zero are maintained by a human.
6. **The declarative holy grail.** You state intent and the machine guarantees execution. Everyone who chased it built a new language and died on the adoption curve. We didn't invent a language — we removed everything except the declarative language that won 50 years ago. Declaring intent is exactly what AI models are best at.
7. **Not a demo. A product.** Every number here is measured from the repo and reproducible. The backend of this product is PostgreSQL plus one JSON file.
8. **Making change cheap.** The origin story is requirements churn — stakeholders who only recognize what they want when they see it working. The only winning strategy is making change cheap. The generated client files changed 108 times: 108 rounds of "they changed their mind," absorbed automatically.
9. **Declarative everything.** Security, caching, real-time — the checklist every business app needs — is declarative. You can audit the security posture of the whole API with `grep`.
10. **Performance.** The usual trade is convenience vs. performance. Here the convenient thing is also the fast thing, because we removed the layers instead of optimizing them. Note what we're compared against: hand-tuned raw-driver code no real team ships. Real projects use ORMs — the EF Core row is 30% slower.
11. **vs. PostgREST & Supabase.** They validated the category. We differ on who writes the query: they let the client specify it, capping you at their URL syntax and exposing your whole schema. We say write SQL — the most expressive data language ever made — and expose exactly that. Plus we're 2.6× faster and one binary instead of seven services.
12. **Enterprise features.** The unglamorous things enterprise deals hang on: upload an Excel file, encrypt SSNs, route reads to replicas. Each is normally a sprint; here each is an annotation.
13. **The worst case.** We measured the worst case for this architecture and still got 28%. The average business app does better, because the average business app is mostly the plumbing we delete.
14. **We removed the glue code.** Everyone is making AI write the glue code faster. We removed the glue code. The agent reads two files, declares intent in SQL, and machines verify the rest. A third of commits are AI-co-authored, with a human owning design and review.
15. **Agents touching your data safely.** The same governed, role-checked, rate-limited endpoints you already have — one annotation away. The database becomes the single source of truth for apps, frontends, *and* agents. It's still the same file.
16. **An AI-infrastructure play.** Five years ago this would have been a developer-productivity tool. Today it's the architecture that makes both AI-written code and AI-called APIs cheap and safe.
17. **The loop.** We measured what this did for one product — a third of the code never written, one developer doing a team's work. Now multiply that across every product we build, and every AI agent that will want to talk to them.
18. **Appendix A1.** Every measured value is from the production repo and reproducible — exact commands in the case-study raw-data appendix.
19. **Appendix A2.** The full feature list. The message is the *length* of the list, and that each line is an annotation or a config block — not a sprint.

</div>

## Where to go next

- [Case Study: 74 Endpoints, Zero Backend Code](/blog/case-study-zero-backend-code) — the production product behind these numbers.
- [SQL REST API](/blog/sql-rest-api) — the philosophy in long form, in the author's own words.
- [NpgsqlRest vs PostgREST vs Supabase](/blog/npgsqlrest-vs-postgrest-supabase-comparison) — the category comparison from slide 11.
- [Turn PostgreSQL into MCP Tools an AI Agent Can Call](/blog/mcp-server-postgresql-ai-tools-npgsqlrest) — the AI-agent story from slides 14–16.

<style scoped>
.transcript { font-size: 0.95rem; }
.transcript ol { padding-left: 1.4rem; }
.transcript li { margin: 0.5rem 0; line-height: 1.65; }
</style>
