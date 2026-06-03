Here's the full thing — every section in order, with the existing draft material mapped into it and the cuts called out.

I. Intro (short). Keep what you have: the 25th-anniversary framing, "I've been infamous for this," and the clarification that this is not an ORM critique — the culprits are DDD, Clean Architecture, Hexagonal, Onion. One paragraph, set the stakes, move on.

II. The Impedance Mismatch — and what it actually is. Your "Beginning of Wisdom" section: the definition, the note that functional programming has the same mismatch, then name the five. State the 2 + 3 spine right here so the reader has a map: two pillars about the truth — where it lives (#1) and keeping it correct under concurrent writers (#5) — bracketing three about the engine abstracting the stack beneath you (#2, #3, #4). The five chapters then descend from the truth down to the metal and back up.

III. State Data Abstraction. Lead with the r/DDD class diagram — delete the method, it's an ER diagram, one logical model implemented twice. Problem/consequence: the bones. Their own words: the "Domain Modeling Made Functional" claim that a CHECK constraint is "hard to model." Cost: the Three Type Systems section drops in whole here — it is the duplication argument with receipts (three to five physical implementations of one logical model).

IV. Abstraction Over Storage Devices. Problem/consequence: the bones. Their own words: Evans delegating storage "to the infrastructure layer" + the Repository; Martin's "Databases Only Exist Because of Disks" and "buckets of bits." Proof: swap-the-storage-keep-the-model (tablespace → columnar → FDW → MEMORY engine), plus Codd's data independence and ANSI/SPARC. Cost: rebuilding the database badly upstairs.
→ This chapter absorbs the entire "Database Is a Detail" Parts 1–7 critique. Cut the blow-by-blow; keep only the two or three quotes as evidence and the data-independence rebuttal. The anecdote (Part 6 — he quit, became a consultant) moves to the history section, where it's narrative, not argument.

V. Abstraction Over Data Structures. Problem/consequence: the bones (sets vs push/pop/peek/traverse). Their own words: Evans's "illusion of an in-memory collection" — the repository materializing sets into one fixed container. Proof: the optimizer choosing heap/b-tree/hash; index = avoid checking every row, not fight disk; in-memory databases still full of indexes. Cost: the materialization half of the 1000-record audit (allocations, N+1), framed as your "Patterns of Data Displacement."

VI. Abstraction Over Algorithms. Problem/consequence: the bones (declarative set language vs frozen imperative loop). Their own words: Martin's "SQL was never intended to be used by programs… one of the gravest errors" and the linked-lists-into-rows quote. Proof: EXPLAIN switching seq→index scan as data grows; abstraction inversion. Cost: the iteration half of the 1000-record audit (four passes), set operations collapsing into row-at-a-time storms, and the "swap SQL for HTTP/GraphQL?" point.

VII. Abstraction Over Concurrency and Integrity. Problem/consequence: the bones. Their own words: the "doubling down" ladder — Repository → Unit-of-Work → Aggregate → eventual consistency → domain events → CQRS → event sourcing → projections — reframed as ACID reimplemented in code and then in messaging. Proof: the deep-aggregate-as-pure-Postgres demo we built — exclusion constraints for the non-overlap rules, deferred constraint triggers where the aggregate boundary literally is COMMIT. That's your strongest exhibit and it's already written and tested. Cost: Fetch → Modify → Save, lost updates, double-booking, oversold inventory, illegal states written by a second code path the aggregate never saw.
→ The "what's left" payoff lands right after VII: strip storage, structures, algorithms, integrity, concurrency — the database does all five — and what remains is the business rules, which belonged next to the data the whole time.

VIII. How We Got Here (history — sociology, not technical re-argument). Your "Those Who Cannot Remember the Past": the Business Rules Manifesto, "change the rules not the code," Gartner hype — then why it died: Agile killed the dedicated DBA, vendor-lock fears, weak tooling and no source control. Then the reaction: SOA → microservices → DDD → Clean Architecture, all putting the rules back in the app layer. "The goals were right; the tools were inadequate; we threw out the goals with the tools." Close with the 2026 re-check (lock-in, scaling, separation-of-concerns, testing — none load-bearing anymore) and the verdict that the last blocker is cultural. Martin's anecdote lives here. Keep this section off the technical pillars — its job is "why the industry chose wrong," nothing more.

IX. The Current State (tools that get it half-right). Your "PostgreSQL as a Platform": PostgREST and Supabase expose tables — your private state; PostGraphile and Hasura wrap tables in GraphQL. All of them treat the schema as the API, which is exactly backwards: tables are private state, functions and procedures are the public interface. This is the setup for the solution.

X. The Solution — NpgsqlRest (earned, proportionate). Your "What Problem Does It Solve": introspects functions/procedures or SQL files, never tables; one source of truth; no DTOs/mappers/ORM; two iterations instead of four, zero app-side allocations; the line-count and 2.6×-PostgREST numbers; "the cost of changing your mind." Land it and stop — don't let it outgrow any single pillar chapter.

XI. Conclusion. DDD treats memory as truth, Clean Architecture treats the database as a doorknob, PostgREST treats the schema as the API — three wrong premises. The Business Rules movement had it right; the tools have arrived; culture is the last habit to break. Star Wars line.
What gets cut or merged, explicitly: the "Three Misconceptions" section disappears as a container — its three claims are pillars #1, #2, and #4. The Clean Architecture Parts 1–7 collapse into the evidence block of #2 plus the anecdote into VIII. The 1000-record audit and Three Type Systems stop being standalone "costs" sections and become the cost evidence inside their pillars. Net effect: every argument has exactly one home, the article stops repeating itself, and the length is carried by depth instead of restatement.
Want me to draft any single chapter end-to-end so you can see the problem → consequence → their-own-words → cost rhythm in full prose? Pillar VII is the natural one to start with, since the Postgres demo is already built and it's your sharpest.

---------


Here are the five, written tight enough to drop in as section intros, in your register. I kept #5 as a separate block clearly marked, since it's the one I argued you're missing — if you decide to stay at four, you fold it into #1 and #2 rather than lose it.

1. State Data Abstraction
Problem: OOP encapsulation and FP immutability both assume the authoritative state lives in memory, waiting to be protected from illegal mutation. In a business application it doesn't. The authoritative state lives in the relational database — it's the thing you query when you want to know what's true.
Consequence: The in-memory "state" the paradigm guards is either transient — a copy downloaded from the database — or plumbing: connections, queries, transactions, mappings. The domain layer spends its effort protecting a copy, not the truth. And because that copy mirrors the database's logical model one-for-one, you maintain two physical implementations of a single logical model — the class diagram and the schema are the same model drawn twice — kept in sync by hand. Only one is load-bearing: the application runs without the object copy; it cannot run without the database.
2. Abstraction Over Storage Devices
Problem: The orthodoxy treats the database as storage — a place to park bytes until the real program needs them back. But the relational database already abstracts storage for you; it abstracts your storage, not your application. Data independence — insulating the logical model from physical representation — is the reason the model was invented in the first place.
Consequence: Treating the engine as a dumb disk, you haul the processing it was built for up into the application. You throw away the layer that lets you swap tablespace, on-disk format, or even the whole machine without a single query noticing — and then you rebuild, badly, the storage abstraction that was already sitting right there. The bytes were never your problem until you decided to make them your problem.
3. Abstraction Over Data Structures
Problem: Business data is sets — sets of sets, graphs, sets of graphs. It does not fit the in-memory structures imperative code reaches for: push, pop, peek, traverse, add, remove. The engine already picks the right structure per query — heap, b-tree, hash — and hands you a result, not a container.
Consequence: To force the data into the language, you materialize every set into one fixed in-memory collection — the repository's "illusion of an in-memory collection" — and discard the structure the engine would have chosen. You over-fetch rows and object graphs you don't need, you turn one set operation into N+1 round trips, and you express set logic by walking references between objects. An update … set … where … becomes a loop.
4. Abstraction Over Algorithms
Problem: SQL is a higher-level, declarative, set-based language. You state the intent; the optimizer reads its statistics and chooses the algorithm — which scan, which join, in which order — and re-chooses as the data grows. Imperative code freezes the algorithm at the moment you write the loop.
Consequence: You swap a declarative set language for a lower-level imperative one, and instead of declaring a set operation you iterate over pretend data structures. The optimizer never sees the real question, so it can't answer it well — set operations collapse into row-at-a-time storms. It's a textbook abstraction inversion: hand-coding low-level access on top of a high-level engine that already provided it.

5. Abstraction Over Concurrency and Integrity — (the missing one; your strongest argument)
Problem: The database abstracts correctness under concurrent access — MVCC, isolation levels, locking — and integrity — constraints, foreign keys, atomic transactions. This is not "where the state lives" from #1; it's keeping that state correct while many writers hit it at once. You declare a constraint or choose an isolation level. You don't implement two-phase locking yourself.
Consequence: Move the invariant up into the domain and you enforce it on a stale in-memory snapshot, outside any transaction. Between the load and the save, another writer changes the row you were reasoning about — classic time-of-check-to-time-of-use. Lost updates, double-bookings, oversold inventory: the exact failures the architecture promised to prevent. And the whole Aggregate → Unit-of-Work → eventual-consistency → domain-events ladder is just ACID reimplemented in application code and then in messaging — arriving decades late and leakier. The aggregate guarded the invariant in memory; the data violated it on disk.

Two things to wire this into the rest of the piece. The spine is 2 + 3: two pillars about the truth — where it lives (#1) and keeping it correct under load (#5) — and three about the engine abstracting the stack beneath you (#2, #3, #4). State that split once and the five stop reading as a flat list of grievances. And it sets up your existing payoff cleanly: strip storage, structures, algorithms, integrity, and concurrency — because the database already does all five — and what's left is the business rules, which is the part that belonged next to the data the whole time.
If you keep it at four: the race-condition material from #5 goes into #2 (treating the engine as dumb storage), and the "illegal states / two sources of validation truth" material folds into #1. But you lose the one pillar that's about correctness rather than elegance, which is the one that actually wins the argument.

----


----

## Abstraction Over Storage Devices

Strip away the patterns, the diagrams, the concentric circles, and the ubiquitous language, and the entire modern orthodoxy — DDD, Clean Architecture, Hexagonal, Onion, all the variants — rests on one load-bearing premise:

**The database is storage.**

Not a participant in your system. Not where your logic lives. Storage. A place to park bytes until your *real* program, the one running in memory, needs them back. Every layer they draw, every abstraction they sell you, exists to keep that storage at arm's length from the part that "matters."

It is the premise everything else is balanced on. So let's check it. Because if it's wrong, the whole structure built on top of it is wrong too.

And the proof is in the pudding — they will tell you the premise themselves, in their own words.

### Eric Evans

Evans is careful, which is exactly what indicts him. He doesn't sneer at the database; he politely escorts it out of the room.

In his Layered Architecture, business state lives in the Domain Layer — but the database does not. Of the state, he writes that

> *the technical details of storing it are delegated to the infrastructure layer.*

Storing it. The database is "storing it." It goes downstairs to the infrastructure layer, to sit with the message queues and the file handles, well away from the model that supposedly matters.

And the Repository — his handle on the database — is defined explicitly as a thing that presents persistent objects *as if they were an in-memory collection*. That is the whole job: maintain the fiction that there is no database, only objects in memory that happen to survive a restart. The relational engine is reduced to a backing store for a pretend in-memory list.

For Evans, the database is where state is *stored*. Storage.

### Robert C. Martin

Martin is not careful. He says the quiet part at full volume, with a section literally titled **"Databases Only Exist Because of Disks."**

The argument: disks are slow, so we built indexes, caches, and query schemes to work around them — and the relational structure is just more of the same workaround. Hence:

> *To mitigate the time delay imposed by disks, you need indexes.*

From there the conclusions write themselves. A database, for Martin, is a mechanism for moving bits between the surface of a rotating disk and RAM — nothing more than big buckets of bits for long-term storage. Storage, he argues, is a concern that can be entirely encapsulated and separated from the business rules. The form the data takes on the disk is, from an architectural standpoint, beneath our notice.

For Martin, the database is indistinguishable from a storage device. Storage.

Two of the most cited authors in our field. One premise. **The database is storage, and storage is a detail to be wrapped by something more important.**

---

### What if it isn't true?

Here is the question nobody in that tradition stops to ask:

**What if the modern relational database already abstracts storage for you?**

What if the thing they're straining to wrap is, by design, the wrapper? What if storage — the disk, the pages, the byte layout, the access paths — was already encapsulated, decades ago, by the very component they've decided is too lowly to think about?

Then they aren't protecting you from the storage. They're rebuilding, badly, the abstraction that was already there — and throwing away the parts they didn't understand.

Let's prove the database abstracts storage. Then let's count the cost of pretending it doesn't.

### Proof, part one: it was designed to abstract storage

This isn't a happy accident the engines stumbled into. It is the reason the relational model was invented.

When Codd published the relational model in 1970, he sold it on a single promise: **data independence** — insulating applications from how data is physically represented and physically organized. The ANSI/SPARC architecture in 1975 made it formal: a separate *internal schema* describing storage, walled off from the *conceptual schema* describing the logical model, with **physical data independence** named as the explicit goal.

Now read Martin's chapter again. The thing he calls a low-level disk detail to be hidden from your architecture was *designed, from its first day, to be the layer that hides the disk from your architecture.* He has the arrow pointing backwards. Databases do not exist because of disks. **The relational model exists to hide disks.**

### Proof, part two: swap the storage, keep the model

Assertions are cheap, so here is a falsifiable test. If the database really *were* the storage, changing the storage would force you to change your application. Let's change it as violently as possible and watch the application not flinch.

Take one table. Run one query. Now move the storage underneath it:

```sql
-- Different physical device entirely
ALTER TABLE invoices SET TABLESPACE nvme;

-- Different on-disk format: row-store to column-store
-- (pluggable table access methods)
CREATE TABLE invoices (...) USING columnar;

-- Storage moved off the machine: another server, a CSV, a REST API
CREATE FOREIGN TABLE invoices (...) SERVER remote_pg;
```

Same `SELECT`. Same result. Every time. The bytes went to a different device, then to a different physical layout, then to a different *machine*, and the consumer never noticed — because the consumer was never talking to the storage. It was talking to an abstraction sitting on top of it.

MySQL says it even more bluntly: flip `ENGINE=InnoDB` to `ENGINE=MEMORY` and the table runs entirely in RAM, no disk in the path — the full relational structure with zero disk, which by itself buries the idea that the relational model is some disk-shaped artifact.

That invariance — **the logical model held constant while the physical storage is swapped underneath it** — is not evidence of an abstraction. It *is* the abstraction. Storage you can replace without the consumer knowing is, by definition, abstracted away.

### Proof, part three: it abstracts the algorithms too

And it's not just the storage. You write a declarative query — *invoices where amount = 100* — and you never say how. The optimizer reads its statistics and chooses: sequential scan, index scan, bitmap heap scan; nested loop, hash join, merge join. `EXPLAIN` will show the same query text using a sequential scan on a small table and silently switching to an index scan as it grows — and you never touched the query.

Which also disposes of "to mitigate disk delay, you need indexes." An index doesn't fight disk latency; it avoids checking every row. Linear search is slow as a function of *data volume*, not *medium* — a billion-row scan is `O(n)` on disk and `O(n)` in RAM and `O(n)` on Martin's disk-free future. An index turns it into `O(log n)` everywhere, for the same reason, regardless of where the bytes live. That's why **in-memory databases — Redis, SAP HANA, VoltDB, SingleStore — keep everything in RAM and are still full of indexes.** If indexes existed to fight disks, a RAM-only database wouldn't have any. They're full of them.

So storage is abstracted, algorithms are abstracted, data structures are abstracted. The developer is relieved of all three — which, you'll notice, are the exact three things this chapter set out to talk about.

### Proof, part four: the experiment already ran

Martin made a prediction: when disks die, the relational database dies with them, and we return to plain in-memory structures.

That future partly arrived. SAP HANA, VoltDB, SingleStore, OrioleDB, Postgres on `tmpfs`, MySQL's MEMORY engine. We removed the disk. The relational model and SQL did not die — they came along for the ride. The thing he called a disk-artifact **outlived the disk.** I don't have to guess how his thought experiment ends; I can point at the production systems where it already ran, and it ran backwards from his prediction.

(It leaks, yes. Performance bleeds through; sometimes you must know about an index or a partition. But every useful abstraction leaks — you can drop to assembly from C, and C still abstracts the machine. `EXPLAIN ANALYZE` is the abstraction exposing a controlled hatch to the layer below, which is what good abstractions do. It is not a reason to throw away the best one we have.)

---

### So what happens when you build on the wrong premise?

The premise is false. The database isn't storage; it's the abstraction over storage, and over the algorithms and structures on top of it. So what does it cost you to spend an entire architecture pretending otherwise?

It costs more than diagrams. It costs correctness.

**You rebuild the database, badly, in application code.** Once the database is demoted to a bucket of bits, every responsibility it was quietly handling has to be re-homed upstairs. Identity, change tracking, unit-of-work, query construction, caching, concurrency — reimplemented in the domain and service layers, by application developers, decades behind the people who do this for a living. The Repository that "presents an in-memory collection" is the tell: you are writing your own little database on top of the real one, and yours is slower, leakier, and wrong in ways you won't discover until production.

**You lose the guarantees that were the whole point.** A relational database makes illegal states unrepresentable — foreign keys, unique constraints, check constraints, types, transactions. Move that validation "up" into the domain and one of two things happens. Either you now have two sources of validation truth that drift apart, or you switch the database's constraints off entirely ("the ORM handles it") and your data quietly rots — orphaned rows, duplicate keys, broken invariants written by some other code path your domain layer never saw: a migration script, a second service, a bulk import. The aggregate guarded the invariant in memory. The data violated it on disk.

**You invite the race conditions you tried to design away.** This is the sharpest cost, so look at it closely. If the real state is pretended to live in memory and the database is just where you sync it, your invariants are enforced on a *snapshot*. Load the entity, check the rule in application code, save it back — and in the gap between load and save, another transaction changed the row you were reasoning about. Classic time-of-check-to-time-of-use. The database could have closed that gap for free with a constraint or the right transaction isolation. But you took that job away from it, so now you get lost updates, double-bookings, oversold inventory — the exact failures the architecture was supposed to prevent, caused by the architecture that was supposed to prevent them.

**You fight your own engine.** The optimizer, the statistics, the access-method selection — neutralized, because you only ever issue trivial row-at-a-time CRUD through the repository. Set-based operations decompose into N+1 storms. The one component that could have answered your question in a single planned query never gets to see the question. You have performed an abstraction inversion: reimplementing low-level facilities on top of a high-level facility that already provided them, then wondering why it's slow.

**And you pay for all of it, forever.** Mapping layers, DTOs, repository interfaces, unit-of-work, the onion of indirection — an enormous standing tax in accidental complexity, levied solely to maintain the fiction that the database isn't there. Every new feature pays it. Every new hire learns it before they learn the domain.

That's what a wrong abstraction does. It doesn't just make the system slower or more elaborate. It mislocates the source of truth — insisting it lives in memory when it has always lived in the database — and then systematically dismantles the one component built, over fifty years by an enormous number of very talented people, to keep that truth correct.

Strip the storage, the structures, the algorithms, the integrity, and the concurrency out of your "domain" — because the database already handles every one of them — and ask what's actually left.

The business rules. The logic. The part your users actually care about. The part that belonged next to the data the entire time.

A lie repeated often does not become true, no more than a database becomes a storage device. But it does create the illusion of one — and we have built an entire industry inside that illusion.

---
the old stuff:

## Those Who Cannot Remember the Past

Did you know that there was an entire movement in software development, complete with its own manifesto, thought leaders, and conferences, dedicated almost exclusively to putting business logic in SQL databases?

I certainly didn't, until recently. But it did happen, in the late 1990s and early 2000s.

Their core philosophy was as follows:

- **Data belongs to the organisation, not the application.** Today, we typically call this Bounded Context.
- **Rules and constraints should be stored and enforced in the database, not scattered across applications.** Today, we call this the Domain Model. But, in essence, it is just *don't repeat yourself* — the database is the source of truth, and there is no point in repeating the same logic across every application, service, and business report.
- **Rules should be declarative, in natural language, accessible to a non-technical audience.** Today we say Domain Experts. Same business people.
- **Focus on managing business rules, not on hardware and software platforms.** Today we say *implementation details*. Same idea.

Does any of this sound familiar?

There is even a manifesto — the [Business Rules Manifesto](https://www.businessrulesgroup.org/brmanifesto/BRManifesto.pdf) — still online. Gartner promoted the idea under the slogan **"change the rules, not the code"** and labelled it as "hot". Startups built low-code platforms on top of it. Oracle and IBM tried to incorporate it into their rules engines. The movement was hyped, and rightly so.

And then it fizzled out and almost completely disappeared. Why?

A few reasons.

**1. The Agile Movement.** Development teams of that era had dedicated DBAs, and a dedicated DBA was supposed to implement business rules in the database, close to the data, in declarative SQL:

```sql
ALTER TABLE loans
  ADD CONSTRAINT loans_credit_check
  CHECK (NOT (status = 'approved' AND credit_score < 650));

ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
```

That was not agile enough, obviously. Developers preferred flexibility and speed over centralised governance. The DBAs and the data-centric architects pushing this lost to the agile, app-centric teams. Dedicated DBAs have been a rare breed ever since.

**2. Vendor lock-in.** Centralisation meant locking yourself into proprietary platforms — Oracle, IBM — and paying them forever, because free and open-source alternatives weren't yet viable. Reasonable concern at the time.

**3. Perceived complexity and weak tooling.** A central, declarative model was perceived as more complex than scattering the same logic across many services. And, to be fair, things we now consider basic — source control, automated testing — weren't exactly a priority in that centralised RDBMS / BRMS world managed by DBAs.

So the industry made a choice. The business rules went back into the application layer. And then, because that obviously meant duplicating those rules across applications, services, and reports, we got:

- **Service-Oriented Architecture** in the mid-2000s. Centralise the logic in services where programmers have control.
- **Microservices** in the 2010s. Scatter the logic across many specialised services.
- **Domain-Driven Design**, starting with Eric Evans's Blue Book in 2003. *The rules belong in the Domain Model, not in the database.*
- **Clean Architecture**, popularised by Robert C. Martin in 2017. *The rules belong in the architecture core. The database is a detail.*

All of which were, in essence, *attempts to put the rules back where the Business Rules movement had wanted them in the first place* — but now in the application layer, not in the database. Because, you know. The database is a detail.

Here is the thing. The goals of the Business Rules movement were right. **It was the tools that were inadequate, not the idea.** And we threw the goals out along with the tools.

And here we are, about 25 years later. Let me list the original objections and check whether they still hold:

- **Vendor lock-in?** PostgreSQL is free, open-source, portable, and has a massive ecosystem of support. You are no longer tied to Oracle just to run stored procedures or triggers.
- **Scaling?** There are now distributed Postgres-compatible variants — Citus, Timescale, CockroachDB, and several others. Scaling is still hard, but it is no longer a killer.
- **Separation of concerns?** Was a misunderstanding from the very beginning. SQL rules are *domain semantics*. SQL is not storage code by any means.
- **Testing and tooling?** pgTAP exists. Migrations in containers, rollback-tests, fixtures. It is a weaker spot than modern app languages with their IDEs and type systems, but it is very much doable and manageable.

The real gap today is *cultural*. Developers are trained to think in code-first terms, not data-first. Fewer of us are fluent in SQL as a primary modelling language.

But we live in 2026, not 2005. The objections that killed the Business Rules movement are no longer load-bearing. The industry just hasn't caught on yet — and the architectural philosophies it adopted to replace it have, in my opinion, made the original problem worse.

Let me show you how.

---

## The Three Misconceptions

The way I see it, modern business software is built on three big misconceptions. They are related, they reinforce each other, and they have cascaded into an entire architectural style that delivers, in practice, exactly what the relational database was already going to deliver. With more code. And more bugs.

1. **State lives in memory.** No. Your state is in your RDBMS.
2. **The RDBMS abstracts your application.** No. It abstracts your storage. Your application is what you write *on top* of that.
3. **SQL doesn't count.** SQL is the most misunderstood computer language in the world.

Let me take them one by one.

---

### Misconception #1 — State Lives in the Database

I found a free chapter from *Domain Modeling Made Functional*, so I wanted to check whether Functional DDD was any better than the standard OOP DDD.

No, it is not. It may even be worse.

The entire premise of that chapter is that something like:

```sql
CHECK ((IsQuote is true) OR (IsQuote is false AND BillingAddressId IS NOT NULL))
```

…is, and I quote, *"hard to model"*. Well, okay.

I don't get it.

We have this core, fundamental tenet in OOP called **encapsulation**. Encapsulation is supposed to protect internal data — the state. The object is the authoritative custodian of its state. Nobody else has it. Period. Without encapsulation, we don't really have OOP anymore.

Functional has its own version — **state immutability**. Functional takes state in the constructor and elegantly returns mutated copies as the result of a function. Same idea — protect inner state, the common source of bugs — but arguably more elegant.

These are very reasonable, well-thought-out approaches *when you have complex states in memory that you need to manage*. A complex AST. A game scene graph. A spreadsheet's formula trees. Whatever.

Except they don't work for business applications. At all.

That shared state lives in a shared, **relational database**. And the database is already doing — and has been doing for forty years — what both of these paradigms are promising. **Encapsulation** (SQL — you don't poke at pages and tuples directly, you query). **Enforced invariants** (constraints, types, transactions). It already makes illegal states unrepresentable. In real data, not just in code.

So what does that leave for OOP / Functional in a business app? In the worst case, our internal state is just **plumbing**: connections, queries, transactions, mappings. In the best case, it is **transient state** — chunks of data downloaded from the database, temporarily held in memory.

The entire premise is broken. There is no internal state to manage other than plumbing for the real state. But instead of admitting that, the response is cognitive dissonance and **doubling down**:

- We need the **Repository pattern** to wrap the database in object syntax and pretend it is a collection.
- When repositories leak relational concerns, the response is **Unit of Work**, to wrap transactions in object syntax.
- When *that* still leaks, oh no, we need **Aggregate Roots** to redraw consistency boundaries the database was already enforcing.
- When aggregates conflict across services, we need **eventual consistency** and **domain events** — to simulate, in messaging, what the database had as ACID.
- When the system becomes incomprehensible, **CQRS** — to admit that reads and writes are different.
- When CQRS isn't enough, **event sourcing**. What else. To rebuild a transaction log. AKA the WAL.
- When event sourcing is hard to query, **projections into a read model** — which is, congratulations, *a database*.

Each layer is a sophistication and a workaround to deliver what the database was already going to deliver.

---

### Misconception #2 — The RDBMS Abstracts Storage, Not Your Application

I watched Zoran Horvat's video *"Your DDD Abstractions Are a Waste of Code"*. He talks about a common problem of over-abstraction in modern DDD codebases.

I think the problem with DDD is **NOT (only) over-abstraction**. The problem is **wrong abstraction**.

Almost every DDD tutorial on the internet shows the same old anti-pattern:

1. **Get** some data from the repository into memory.
2. **Change** that data in memory (the Object-Oriented way).
3. **Put** that data back to the repository.

The classic **Fetch → Modify → Save** pattern. The primary source of performance bottlenecks and concurrency bugs in enterprise applications. I am sure Zoran would agree we have a race condition and a performance problem with this code.

If it is wrong, why are all the learning materials showing this?

Let me pull a direct quote from Eric Evans's Blue Book — the DDD bible, the foundational text — Chapter 6, *The Life Cycle of a Domain Object*, the chapter that defines the Repository pattern:

> *"For each type of object that needs global access, create an object that can provide the illusion of an in-memory collection of all objects of that type."*

The **illusion of an in-memory collection**. Read that again.

In the same chapter, he says it *"requires a lot of complex technical infrastructure, but the interface is simple."*

What is that complex machinery? Juggling queries, commands, ORMs, mappers. Those are **set operations**.

Here is the question I would love a DDD expert to answer for me. How does a set operation fit into an in-memory collection? And what problem does an in-memory-collection-like structure solve that our set operations cannot?

Because modern relational databases do not have data in *collections* that we can, quote, "emulate". Data comes in sets, sets of sets, graphs, sets of graphs, graphs of sets, and everything in between. And we have a set-based language to work with all of that. The most refined, mature, and widely deployed language in the entire business world.

Why are we compelled to compress and abstract and emulate all of that into something we can *iterate*?

In my career I have had the opportunity to mentor younger developers on SQL. I don't particularly like doing it — partly because I am still not confident in my SQL expertise after 30 years, and partly because I don't like people that much. But I did notice something peculiar:

- Developers trained on imperative languages — Python, Java, C#, whatever — have trouble thinking in sets. When it comes to code, they think in algorithms, memory structures, and iterations. But in SQL, iteration is an anti-pattern. We are required to think in sets. We should never write a procedural loop over our data. That is a no-no. A cursor can have a legitimate use case occasionally, but it is a rare exception.
- They are all overconfident about their SQL — because they have learned CRUD. They have not learned SQL. Classic Dunning–Kruger. And then you give them something slightly more complex and they all go `FOREACH LOOP` on you with some procedural extension.

So when the Blue Book says *create the illusion of an in-memory collection* — what it is really doing is letting the developer keep iterating, in the language they are comfortable with, **over data that is supposed to live in sets in a database**. The Repository pattern is a comfort blanket. Nothing more.

Modern relational databases are already abstracting storage. DDD wants to treat them *as* storage — the thing those databases are already abstracting away. And since we are treating them as storage, that means treating them as a *repository*: the thing we put data into and retrieve data from.

That is precisely why virtually every example follows the same inefficient, race-condition-riddled pattern. They treat everything as a *collection of objects*; objects live in memory; the relational database is just a backup. A repository. Almost a file system. Instead of what it truly is: **a set-based logic engine that does your storage abstraction for you**.

These examples are not simplifications. They are *ramifications* of that wrong abstraction. As far as the relational database is concerned, there is neither *storage* nor *repository* — those are buried deep in the implementation, not something users or database clients should ever be concerned with.

There are **relational sets**. That is why `update <set> set <value> where <…>` is natural there, and the repository approach is not.

These are not *Patterns of Persistence*, as modern DDD calls them. **These are Patterns of Data Displacement.** They unnecessarily move data where it doesn't belong — memory — just to be able to use clean C# (or whatever) syntax. Notice how DDD never wants to abstract the *memory device*. Only the *storage*. Well…

---

### Misconception #3 — SQL Is the Most Misunderstood Computer Language

Software architecture for business applications has been in a permanent state of cognitive dissonance for decades. Let me put two facts next to each other and see if you can make them make sense.

**Fact one.** SQL is the undisputed crowned king of computer languages in the business world. There is no doubt about that. Every business application of any consequence, anywhere on the planet, has an SQL database underneath it. Forty years of refinement. Trillions of dollars of value moving through it every day.

**Fact two.** We are not supposed to use it in our business applications at all. We are not allowed to write any business logic with it.

Unless we want to be shamed for how inadequate and bad our software architecture is — because we used the *computer language of business* in our business application.

**Make it make sense.**

And here is the part that I find the most disorienting. We are following software architecture and design guidelines for our SQL-backed business systems from a person who clearly states, and *rants*, that he doesn't want to use SQL databases at all.

Direct quote, from *Clean Architecture*:

> *"Why in the world would I want to rearrange my linked lists and trees into a bunch of rows and tables accessed through SQL? Why would I introduce all the overhead and expense of a massive RDBMS when a simple random access file system was more than sufficient?"*

And, more recently — May 2025:

> *"SQL was never intended to be used by computer programs. It was a console language for printing reports. Embedding it into programs was one of the gravest errors of our industry."*

Right. Let's follow this man's advice on how to design a business system backed by an SQL database.

SQL has been refined for forty years. It is the **primary interface** to your PostgreSQL database, and it lets you use PostgreSQL's capabilities to the fullest extent.

And we are going to swap it out for the HTTP protocol? Or for something completely new like GraphQL? Really?

How does that measure in terms of expressiveness and the power of the PostgreSQL implementation? How does that make any sense from an architectural standpoint?

It doesn't. We just don't say that part out loud.

---

## What This Costs In Practice

So the three misconceptions are: state lives in memory, the database is storage, and SQL doesn't count. Let me show you what we actually *pay* for them, in real engineering terms.

### Three Type Systems That Don't Talk to Each Other

The modern development stack is literally crazy. It is insane.

Take any modern business web application — let's say a .NET / Angular stack running on PostgreSQL. We have three separate type systems, and they don't particularly like each other.

**1. The PostgreSQL type system.** I would argue easily that it is the richest of the three. Separate subject for another day. In any case, we might have something like:

```sql
INVOICE_NUMBER TEXT NOT NULL
```

There might even be a CHECK constraint on the shape of that text, but let's keep it simple.

**2. The C# / .NET type system.** Same thing, now expressed as:

```csharp
public string InvoiceNumber { get; set; }
```

That string might be `null`, by the way. In PostgreSQL it literally cannot ever be null.

**3. The TypeScript type system on your frontend.** Same thing, one more time:

```typescript
invoiceNumber: string;
```

But, in practice, as we all know, it might be `null`. Or `undefined`. Who knows. No one knows.

And it gets worse. We don't just have three separate, mutually incompatible type systems for the same logical thing. Depending on your design — looking at you, DDD — we have anywhere from **three to five separate implementations** of the same logical model: domain entity, persistence entity, request DTO, response DTO, ViewModel. In three incompatible type systems. That all have to be stitched together and kept in perfect sync, at all times, or your software doesn't run correctly.

**Holy cognitive load, Batman.**

Insane, isn't it? And here is the kicker — we do this to *simplify maintainability*. It is not even funny at this point.

To be fair, there are serious attempts in the industry to sort out at least the backend-to-frontend mess. Stacks like SvelteKit, Next.js, Nuxt, and Blazor let you reuse the same models on both sides of the wire. That is something. But all of those stacks ignore the database part entirely. Your PostgreSQL schema can still drift without anyone noticing, and you have to keep it in sync by hand — adjust the code, write the migration, update the model, hope you got it right.

The friction is real. Type systems, model mapping, naming conventions, the works. The compiler is not going to save you.

### A 1000-Record Performance Audit

Have you ever wondered what actually happens when you pull 1000 records out of PostgreSQL and send them down the HTTP wire to your frontend?

Let me count the iterations.

1. **PostgreSQL builds the result set.** The executor materialises 1000 tuples from heap or index access. That is the first 1000-times iteration, inside the database.
2. **PostgreSQL serialises the result to the wire protocol and sends it to the client.** The client driver — Npgsql, psycopg — reads from the incoming stream, and the ORM allocates 1000 objects into a memory list. That is the second 1000-times iteration, fused with the consumer's read loop. And 1000 memory allocations.
3. **Convert the in-memory list to a DTO.** In a standard `eShopOnWeb`-style template, that is mapping `List<CatalogItem>` to `List<CatalogItemDto>`. In Python, `CatalogItemDto.model_validate(item)` for each entity. That is the third 1000-times iteration. Another 1000 allocations.
4. **JSON serialisation.** The fourth and final 1000-times iteration. Depending on the serialiser, possibly another 1000 allocations on top.

So for 1000 records over the wire — *pulls out the calculator* — that is **four thousand iterations, two thousand memory allocations, and one network call** to PostgreSQL, before the JSON response even leaves the server.

Such a waste of resources. And I haven't even started on what happens *before* the database request — the controller, the validation, the request DTO, the unit-of-work, the repository, the query builder.

This is the price of the three misconceptions. It is paid by every request, by every user, on every page.

---

## "The Database Is a Detail" — A Critique

Now let me get to the book that pushed all of this into the mainstream. *Clean Architecture: A Craftsman's Guide to Software Structure and Design*, Robert C. Martin, 2017. Chapter 30: **The Database Is a Detail**.

This is my analysis, originally published as a series of posts. I am going to compress it here.

### Part 1: Intro

![](/CA/part1.webp)

The claim is that the database is a non-entity when it comes to architecture. Basically, it is as important as the design of a doorknob is to the architecture of your home. And you are a bad software designer if you *"allow low-level mechanisms to pollute the system architecture."*

Nothing could be further from the truth.

Which database to use in your system — and he is talking *here* about that, not about data modelling — is one of the most important decisions you can make. It has long-term consequences.

There are so many considerations that come into this decision that it is hard to count them all:

- Are we going to have **analytical processing** needs? We may have to look at specialised OLAP databases like Snowflake or ClickHouse.
- Are we going to have **real-time transactional** or transaction-heavy needs? CockroachDB, DynamoDB.
- Are general-purpose databases — PostgreSQL, SQL Server, MySQL — good enough for our requirements?
- Some of those do one thing better and another thing just barely. How does that match our requirements?
- Can we use a combination and get the best of all worlds? How much complexity penalty do we pay?
- What about **graph and tree** processing? How much hierarchical data?
- Do we have **search** features, and over what type and amount of data?
- What about **scaling**? Read-only request scaling, write-only, or both? The wrong decision will haunt you.

…and on and on.

Doorknob, you say?

### Part 2: Relational Databases

![](/CA/part2.webp)

In this part, Martin discusses *relational databases* to prove his point that databases — and in particular relational databases, because I don't see him even mention any other kind — are, in fact, a detail.

The problem in this chapter is that **Edgar Codd did not define the principles of relational databases — he defined the principles of the *relational model*.**

It may sound like a small nitpick, but it is an extremely important distinction. The relational model has nothing to do with technology. It is neither the data storage nor the access technology of any kind. It is a relational *model* of data, which later became the theoretical foundation for relational databases. Codd did not define the principles of relational databases — which involve things like indexing, concurrency control, etc.

It is based on mathematics — set theory, relational calculus, relational algebra. That is why it is so elegant and robust, as Martin himself points out.

If you start from the wrong premise, what will your conclusions be?

Later he goes on to say it is an architectural error to pass relational data (rows and tables) into your application, because *"it couples use cases, business rules, and in some cases even the UI to the relational structure of the data."*

I am truly failing to understand this. Relational data has tuples (rows) and attributes (name, email, amount, type — whatever). Why would it be an error to use your data structured for your use case? If my users have invoices, they would want to see invoices in rows, with their amount, date, customer.

**Is it an error to use your own data?**

He doesn't explain. And he doesn't say what the alternative would be. Maybe in the next part…

### Part 3: Why Are Database Systems So Prevalent?

![](/CA/part3.webp)

We start with a flawed premise: *"Databases Only Exist Because of Disks."* Disks are slow. Therefore, with the disappearance of disks, databases will become irrelevant.

That is outright not true.

Databases are not *just* mitigating disk slowness — they are doing data integrity, transactional correctness, concurrency control, security, optimisation, and primarily acting as a **reliable source of truth** for your system.

Memory is volatile. It is gone forever when the process exits. You can't rely on memory. Different parts of the application (or applications) usually need a different view of the same data. Therefore there is a need for a single source of truth, structured in an accessible and predictable way, that eliminates redundancies and anomalies.

Those things have nothing to do with *disks*.

Quote: *"To mitigate the time delay imposed by disks, you need indexes."*

Let's say we have built a memory structure — a linked list, a hash table — that holds invoices. We have a lot of them. A gigabyte or two. We need to find all invoices with amount equal to 100. Iteration takes too long.

I know, maybe we can build a balanced binary tree memory structure — what a great idea. This structure would help us avoid all those costly iterations. We can call it just *B-Tree* for short.

…and how do you think those indexes work?

I am not trying to be too facetious here, but this is a fundamental misunderstanding of how indexes work and why they exist.

If we also added concurrency control so multiple threads and processes could access our search tree, and a mechanism to transfer to and retrieve from non-volatile memory (a.k.a. storage), and exposed all of it through some kind of language — you see where I am going.

**Indexes have nothing to do with disks.** There are many kinds of indexes, and they all implement different structures.

It seems Martin has some kind of beef with relational databases in particular. He doesn't even mention document databases — those exist too, and there is a big use case for them. And not to mention that relational databases can store, retrieve, and index documents efficiently.

### Part 5: Details, and "But What About Performance?"

![](/CA/part5.webp)

In these two parts, Martin is basically summarising his false premises:

- A database is *"just a mechanism to move the data back and forth between the surface of the disk and the RAM."*
- *"Nothing more than big buckets of bits we store our data on a long-term basis."*

For him, databases are indistinguishable from storage devices.

When you start from premises like these, the conclusion is going to be wrong. *"We should not care about the form that the data takes while it is on the surface of a rotating magnetic disk"* — sure, certainly true. And **that is why we use databases**. Their engines take care of that for us, so we don't have to.

But then: *"…when it comes to data storage, it's a concern that can be entirely encapsulated and separated from the business rules."*

Here is the false assumption again. **The database is not data storage** — it takes care of the storage concern for us.

Virtually all databases regularly collect statistics about your data — shape, volume, everything. Why so many statistics? When the database receives a request (a query), it uses those statistics to find the **optimal algorithm and the most appropriate data structure** for the stated intent.

Think about that for a second. It will find the most suitable algorithm — accompanied by an appropriate data structure — for your declared intent, and then execute it for you.

So, in practice: not only is storage abstracted, but **so are the algorithms and data structures**. To an extent, of course — it is a leaky abstraction, but an abstraction nevertheless.

It means operators are relieved from lower-level concerns: storage devices, algorithms, data structures. SQL and similar declarative tools are *higher-level* than what Martin counts as *"low-level data access mechanisms."*

And most importantly — if you are relieved from all of that — storage, memory, algorithms, data structures — what is left?

That's right. **The business rules.** The business logic. You know, the things your clients and users actually care about.

### Part 6: The Anecdote

In my opinion, anecdotes can be a very powerful persuasion technique. Nothing like a good anecdote to prove I am right and you are wrong. Although it is still a logical fallacy.

Martin tells a story. Almost everyone on his team — clients, marketing, hardware engineers — wanted him to use an RDBMS. He fought back. He wanted to keep the data in memory and save and load it to and from raw files instead.

His hardware engineer, quote: *"held meetings behind my back with the executives"* and *"claimed that RDBMS was somehow more reliable than the random access files that we were using"* — implying that an RDBMS doesn't provide any reliability advantage over the file system.

Here is the problem. **His hardware engineer was right.**

Databases are built to ensure durability, atomicity, and consistency, even under the worst conditions. You can be left with corrupted or incomplete data when you save your linked lists to files. Databases use a myriad of incredibly sophisticated techniques — Write-Ahead Log, checkpoints, recovery protocols, snapshots, two-phase commit, crash recovery — all to avoid partial writes and corruption. Decades of work by very talented people.

If you use a file system instead, you would have to re-implement all of those features yourself just to achieve a comparable level of reliability. A lifetime of programming. Questionable result.

> *"I stuck to my engineering principles in the face of incredible ignorance."*

No. You refused to admit you were wrong.

I'd like to take a step back and give Martin some benefit of the doubt:

- Marketing should not be involved in this kind of decision.
- Modern software development marketing is absolutely atrocious. It consistently corrupts the entire industry. All for money.

That doesn't mean we shouldn't be open to rational arguments.

In the end, Martin quit and became a consultant. Funny part — so did I. And like Martin, I have a similar anecdote. The only difference is I was on the other side of the argument. But I lost too — maybe thanks to this book — and became a consultant.

### Part 7: Conclusion

![](/CA/part7.webp)

There is not much to be said about the conclusion. It just repeats the same wrong assumptions and the same wrong conclusions from the previous parts.

A lie repeated many times doesn't become a truth — no more than a database becomes a *"storage device"*. But it does create the illusion of one.

So I asked an AI to estimate how much of an impact this book has had on business software development.

> Explicit Adoption: ~20–30% of modern business software projects (especially in enterprise, microservices, complex domains) explicitly follow Clean Architecture's structure.
>
> Implicit/Partial Adoption: ~70–80% incorporate at least some of its principles.

**Approximately 20–30% of modern business software projects explicitly follow Clean Architecture.**

And you thought *vibe coding* was bad.

Maybe not all of those involved have a lack of understanding of database fundamentals. But in that case they have a lack of understanding of what the architecture book they follow is trying to teach. I don't know how many times I have encountered digital content showing the famous concentric circles of Clean Architecture with no database system in sight at all — in blogs, posts, any type of content. **All virtue signaling, zero understanding.**

To rephrase the original quote: *"If you think good architecture is expensive, try Clean Architecture."*

---

## PostgreSQL as a Platform — and Why Existing Tools Miss

OK. So if the database is *not* a detail, and SQL is the public interface, and "state" lives there — what should the tool stack look like?

There are solutions out there that already treat PostgreSQL as a platform. Let's check them one by one.

**PostgREST** will introspect schema *tables and views* and generate HTTP endpoints. It basically lets you define logic in your HTTP protocol — filters, sorts, etc., in your request parameters, query string, JSON body. I know, I know, they will say it is a *query specification*, not logic. Yeah, right. **It is the logic.**

And when that doesn't work — not surprisingly — they have PostgreSQL functions and procedures as an escape hatch.

**Supabase** is a platform built on PostgREST. Same thing.

**PostGraphile** and **Hasura** will introspect schema tables and views and generate a GraphQL grammar — with all the problems that GraphQL brings to the table (table — get it, pun intended).

The common thread: they all expose your **tables** through HTTP or GraphQL. But your tables are your **state data**. That is the *private* part. It should be encapsulated and absolutely protected.

**SQL statements** — or, more strictly, **functions and procedures** — are your public interface.

That is a different philosophy. And it is why I had to build my own tool.

---

## But What Problem Does It Solve?

This is the question I learned to ask from the wisest manager I have ever worked with. If a developer couldn't clearly articulate the answer, the proposal and the code were rejected. It shaped how I think about software development to this day. If I can't answer *what problem does it solve* — it should not exist. Period.

So, what problem does **NpgsqlRest** solve?

I spent two years of my life building this tool, for my own needs. Let me give you the numbers from a real project.

- **3,287 lines of TypeScript fetch typed clients**, auto-generated on every build.
- **1,156 lines of TypeScript models** for those requests and responses, auto-generated.
- **1,804 lines of HTTP client files** for testing, auto-generated.
- **74 endpoints × ~40–80 lines of per-endpoint C#** that I never had to write — controllers, repositories, services, DI registrations. That is roughly 3,000 to 6,000 lines of imperative C# that simply does not exist in the project. About 220–370 files that don't exist.
- **305 lines of declarative JSON** absorbing infrastructure plumbing that would otherwise be roughly 550–1,300 lines of imperative C#: auth, SSE, caching, rate limiting, health checks, security headers, OpenAPI, retries, CORS, antiforgery, response compression.

Grand total, conservative numbers: about **6,247 lines of auto-generated artefacts in the repo**, plus **3,500 to 7,300 lines of C# I never had to write**, plus **55 to 100 hours of typing I never had to do**.

Now think about what happens when requirements change. As they always do. Sometimes, honestly, I don't even understand them — sometimes it is just bad communication, it happens. Anyone who has worked in this industry knows this very well. So entire parts need to be changed, sometimes rewritten from scratch.

How long would it take me to keep up with all those changes in a traditional setup? Even with AI tools — how many tokens would I have burned regenerating boilerplate? How many bugs would I have written in the process?

NpgsqlRest solves what I now consider the most expensive problem in software development: **the cost of changing your mind.**

I can iterate 5–10× faster. And give my users exactly what they want.

There is one and only one source of truth in this system, and that is the PostgreSQL database. Not two. Not three. **One.** If you need to check the type of something, you go to the database. If you need to check a constraint, you go to the database. The TypeScript client module is regenerated on every build. There can be no drift. No mismatch. No room for error. Ever. Period.

And because there are no DTOs, no mappers, no ORM, no domain entities — the request path is direct. PostgreSQL serialises the result to its wire protocol. NpgsqlRest reads from the PostgreSQL stream and writes directly to the HTTP response stream. **Two iterations instead of four. Zero allocations on the application side. One network call.**

My own benchmark puts NpgsqlRest at roughly **2.6× PostgREST** on a fair fight — both serving identical SQL, no DTOs, no mappers. That is the framework-overhead gap.

**The architecture-overhead gap, on the other hand, isn't even measured.**

That is what NpgsqlRest never introspects. It does not look at your schema. It does not generate endpoints from your tables. What it *does* introspect is either:

- your **PostgreSQL functions and procedures**, or
- your **PostgreSQL SQL script files**,

…depending on your preferred approach. And then exposes that as an automatic REST endpoint. Your tables, your types, your relational structure — that is private. SQL statements, functions, and procedures are your public interface.

That's it. That is the whole philosophy.

---

## Conclusion

DDD treats memory as the source of truth.
Clean Architecture treats the database as a doorknob.
PostgREST and friends treat your schema as your API.

All three are wrong, in slightly different ways. NpgsqlRest is what you get when you reject all three premises at once.

The Business Rules movement had the right idea 25 years ago. The tools weren't there. They are now. The only thing left in the way is **culture** — and culture, in the end, is just a habit. Habits change.

To paraphrase Star Wars:

**NOW WITNESS THE FIREPOWER OF THIS FULLY ARMED AND OPERATIONAL POSTGRESQL STATION.**
