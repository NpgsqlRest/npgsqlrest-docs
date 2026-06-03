// Slide data for the "Backend That Writes Itself" deck.
// Single source of truth — used by the homepage (docs/index.md) and the
// blog page (docs/blog/the-backend-that-writes-itself-presentation.md).
// `notes` are the verbatim speaker notes from the original .pptx.

export interface Slide {
  src: string
  alt: string
  notes: string
}

export const presentationSlides: Slide[] = [
  { src: '/presentation/slide-1.webp',  alt: 'The backend that writes itself — title',
    notes: `One sentence: I built a tool that turns a Postgres database into a complete, production-grade backend — and I've been running a real product on it for 9 months.` },
  { src: '/presentation/slide-2.webp',  alt: 'The problem — change one column, touch five files',
    notes: `Change one column and you touch five files in three languages. Every team on earth pays this tax. It has nothing to do with their product.` },
  { src: '/presentation/slide-3.webp',  alt: 'The solution — a single native binary',
    notes: `A single native binary. You point it at your database, it builds the API at startup, and writes the typed frontend client into your source tree. The contract can't drift — it's generated from the schema minutes ago.` },
  { src: '/presentation/slide-4.webp',  alt: 'An endpoint is a SQL file',
    notes: `The same endpoint in a traditional stack: route, controller, validation, DTO, service, repository, client type, client function — 5 to 7 files, 2 to 3 languages, plus a code review for each. Here, an endpoint is a SQL file.` },
  { src: '/presentation/slide-5.webp',  alt: 'The type-system collapse — one source of truth',
    notes: `This is the type-system collapse: one source of truth. In the case-study product, 154 API contracts exist — and exactly zero are maintained by a human.` },
  { src: '/presentation/slide-6.webp',  alt: 'The declarative holy grail',
    notes: `Declarative systems are the holy grail: you state intent and the machine guarantees execution. Everyone who chased it built a new language and died on the adoption curve. We didn't invent a language — we removed everything except the declarative language that won 50 years ago. And declaring intent is exactly what AI models are best at.` },
  { src: '/presentation/slide-7.webp',  alt: 'Not a demo. A product. — measured figures',
    notes: `Every number on this slide is measured from the repo and reproducible — there's an appendix with the commands. The backend of this product is PostgreSQL plus one JSON file.` },
  { src: '/presentation/slide-8.webp',  alt: 'Making change cheap — 108 absorbed changes',
    notes: `The origin story is requirements churn: stakeholders who only recognize what they want when they see it working. The only winning strategy is making change cheap. The generated client files changed 108 times — 108 rounds of 'they changed their mind' absorbed automatically.` },
  { src: '/presentation/slide-9.webp',  alt: 'Security, caching, real-time — declarative and auditable',
    notes: `Security, caching, real-time — the checklist every business app needs — is declarative. You can audit the security posture of the whole API with grep.` },
  { src: '/presentation/slide-10.webp', alt: 'Performance — the convenient thing is also the fast thing',
    notes: `The usual trade is convenience vs performance. Here the convenient thing is also the fast thing, because we removed the layers instead of optimizing them. And note what we're compared against: hand-tuned raw-driver code no real team ships. Real projects use ORMs — the EF Core row, 30% slower.` },
  { src: '/presentation/slide-11.webp', alt: 'vs PostgREST and Supabase',
    notes: `PostgREST and Supabase validated the category. We differ on who writes the query: they let the client specify it, capping you at their URL syntax and exposing your whole schema. We say write SQL — the most expressive data language ever made — and expose exactly that. Plus we're 2.6× faster and one binary instead of seven services.` },
  { src: '/presentation/slide-12.webp', alt: 'Enterprise features, each an annotation',
    notes: `Deliver as a 20-second flyover — don't read the bullets. These are the unglamorous things enterprise deals hang on: upload an Excel file, encrypt SSNs, route reads to replicas. Each is normally a sprint; here each is an annotation. Longer list in the appendix.` },
  { src: '/presentation/slide-13.webp', alt: 'The worst-case measurement — still 28%',
    notes: `We measured the worst case for this architecture and still got 28%. The average business app does better, because the average business app is mostly the plumbing we delete.` },
  { src: '/presentation/slide-14.webp', alt: 'We removed the glue code',
    notes: `Everyone is making AI write the glue code faster. We removed the glue code. The agent reads two files, declares intent in SQL, and machines verify the rest. A third of commits AI-co-authored, with a human owning design and review — the realistic shape of AI development today, and this architecture is built for it.` },
  { src: '/presentation/slide-15.webp', alt: 'Letting AI agents touch your data safely',
    notes: `Every company is asking how to let AI agents touch their data safely. Our answer: the same governed, role-checked, rate-limited endpoints you already have — one annotation away. The database becomes the single source of truth for apps, frontends, AND agents. Note: it's still the same file.` },
  { src: '/presentation/slide-16.webp', alt: 'An AI-infrastructure play',
    notes: `Five years ago this would have been a developer-productivity tool. Today it's an AI-infrastructure play: the architecture that makes both AI-written code and AI-called APIs cheap and safe.` },
  { src: '/presentation/slide-17.webp', alt: 'The loop — one product, then multiply',
    notes: `End on the loop: we measured what this did for one product — a third of the code never written, one developer doing a team's work. Now multiply that across every product we build, and every AI agent that will want to talk to them.` },
  { src: '/presentation/slide-18.webp', alt: 'Appendix A1 — reproducible measurements',
    notes: `Reference slide. Every measured value is from the production repo and reproducible — exact commands in the case-study raw-data appendix.` },
  { src: '/presentation/slide-19.webp', alt: 'Appendix A2 — the full feature list',
    notes: `Don't read it — scroll it. The message is the LENGTH of the list, and that each line is an annotation or config block, not a sprint. PostgREST's answer to most of these is 'use a gateway'; Supabase's is 'use another service'; ours is 'it's already in the binary.'` },
]
