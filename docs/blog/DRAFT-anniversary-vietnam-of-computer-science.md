---
layout: doc
outline: [2, 3]
title: "DRAFT: 20th Anniversary of The Vietnam of Computer Science"
titleTemplate: NpgsqlRest
description: "DRAFT — A compilation of a decade of arguments about DDD, Clean Architecture, the wrong abstractions modern business software is built on, and the case for putting the database back where it belongs."
badge: human
head:
  - - meta
    - name: robots
      content: noindex, nofollow
  - - meta
    - name: keywords
      content: npgsqlrest postgresql clean architecture ddd database-first state abstraction sql platform business rules
---

# DRAFT: 20th Anniversary of The Vietnam of Computer Science

<p class="blog-meta">
  <span>DRAFT — TODO: date</span> ·
  <span class="tag">NpgsqlRest</span>
  <span class="tag">PostgreSQL</span>
  <span class="tag">Architecture</span>
  <span class="tag">DDD</span>
  <span class="tag">Clean Architecture</span>
  <span class="tag">Opinion</span>
</p>

![](https://img.shields.io/badge/DRAFT-orange)

## Introduction

It has been twenty years since Ted Neward published ["The Vietnam of Computer Science"](https://www.odbms.org/wp-content/uploads/2013/11/031.01-Neward-The-Vietnam-of-Computer-Science-June-2006.pdf). Twenty years.

Did we win? Did we even leave? Are we stuck in a quagmire?

Since then, the industry has marched relentlessly through a never-ending parade of patterns, architectures, and methodologies: ORM tools of every flavor, Repository and Unit of Work patterns, Domain-Driven Design, CQRS, Event Sourcing (currently all the rage), Hexagonal Architecture, Clean Architecture, Onion Architecture, Service-Oriented Architecture (now obsolete and so last year), Microservices, and on and on.

The quagmire Neward described is, of course, Object-Relational Impedance Mismatch. So to speak, a shotgun marriage between Object and Relational worlds. One lives in your application memory and works over data structures, and the other, well, in a relational database.

And none of these patterns above made the problem go away. We need both, and somehow, the majority of the effort goes into dealing with persistence in one way or another. It’s like unsuccessful couples therapy for that shotgun marriage. Maybe we need divorce papers?

Let’s dig in deep.

## What Is The Object–Relational Impedance Mismatch

According to Wikipedia (link: https://en.wikipedia.org/wiki/Object%E2%80%93relational_impedance_mismatch):

> Object–relational impedance mismatch is a **set of difficulties** going between data in relational data stores and data in domain-driven object models.

Ok, got it. A set of difficulties. Difficulties that refuse to go away, it seems, but fine.

It’s worth noting that Object–Relational isn’t the only mismatch on the menu. OO isn’t the only way we work over application memory — functional programming is on the rise, too, so there’s a Functional–Relational mismatch as well. To be fair, FP gets along with relational better than OO does: SQL is already declarative, set-based, and value-oriented, right up FP’s alley. But it still works over application memory, so it still has to bridge to the relational database like everyone else.

Anyway…

> Relational Database Management Systems (RDBMS) is the standard method for storing data in a dedicated database, while object-oriented (OO) programming is the default method for business-centric design in programming languages.

RDBMS is the standard method for storing data in a dedicated database, but do they typically do only data storage? I mean, files are also doing that, aren't they? Are we missing something here?

And this second claim that object-oriented (OO) programming is the default method for business-centric design, that might be true, but SQL is the default method for anything business data-related, like the way organizations store, manage, protect, and analyze their data.

We can see the tension already here, but let’s move on.

> The problem lies in neither relational databases nor OO programming, but in the conceptual difficulty mapping between the **two logic models**. **Both logical models** are differently implementable using database servers, programming languages, design patterns, or other technologies.

Now, why would they say that we have two logical models?

Take a Customer. In your business, a customer is one thing — one concept. DDD even has a name for this: within a bounded context, there is one ubiquitous language, so there is one shared notion of what a Customer is. That single concept becomes one logical model — what a Customer is, which attributes it has, how it relates to orders — with no implementation details attached. That’s why it’s called a logical model.

Then you build it. And here is where it splits: that one logical model gets implemented physically more than once. Once as a table — customer, with a varchar(255) name column. Once as a class — Customer, with a string Name property. Same concept, same logical model, two physical incarnations.

So in modern software design, we are not talking about two different logical models, as Wikipedia claims. We have one logical model and two — sometimes more — physical models. Modern overengineering knows no bounds.

The reason why they say that we have two logical models is probably that OO and Relational are seen as totally different paradigms, so the logical models must be genuinely different. For example, OO does have behavior, but the problem is that we are talking strictly about data here, not behavior. Behavior is a different problem axis - we’ll get to that later when we discuss algorithms. 

In any case, impedance mismatch is not about two different logical models, but about the mismatch between those two physical models. Your system has to map them and make them work together because, logically, we still have one logical model, and the system needs to reflect that. That’s the real problem and source of tension.

> Issues range from application to enterprise scale, whenever stored relational data is used in domain-driven object models, and vice versa. Object-oriented data stores can trade this problem for other implementation difficulties.

This last sentence just confirms what I just said. Whenever stored relational data (one physical model) is used in domain-driven object models (another physical model), we have this problem or mismatch. Maybe the belief that we are talking about two different logical models is the reason why these difficulties exist and persist and are not being resolved. If it were just a simple mapping, let’s say from varchar(255) to a string, that would have been easy to solve a long time ago. Or something a bit more complex, let’s say many-to-many on a logical model level. In a relational model, a junction table is required, but in an object model, it can be just a collection of references. Still, a little bit more complex mapping, but still solvable and indeed already solved.

My sincere belief is that we are talking here about a series of misconceptions and misunderstandings about the nature of abstractions themselves. More specifically, about the abstractions the RDBMS already provides. And if RDBMS already provides them, well, that means that the application layer goes on and re-implements them anyway. No wonder we have difficulties. Let’s look at these misconceptions one by one and discuss them in detail:

1. **State Data** Abstraction Misconception
2. **Storage Devices** Abstraction Misconception
3. **Data Structures** Abstraction Misconception
4. Abstraction Over **Algorithms**
5. Abstraction Over **Concurrency and Integrity**

## 1) State Data Abstraction Misconception

### The Claim

Object-oriented programming has one of its core tenets called **encapsulation**. Encapsulation is supposed to protect internal data — **the state**. The object is the authoritative custodian of its state. Nobody else has it. Period. Without encapsulation, we don’t really have OOP anymore.

On the other hand, functional programming has its own version of that — **state immutability**. A function takes values in and returns new values out, leaving the originals untouched — so there’s no shared mutable state to corrupt in the first place. FP also enforces valid state through invariants, often by encoding them directly into the type system. Same goal, fewer bugs from uncontrolled state, arguably reached more elegantly. Fine. State status - protected, bugs - reduced. Great, beautiful, love it.

This, in fact, is very reasonable and well-thought-out. State data is data shared between different parts of the system and even different users. If every part of the system can poke at it without other parts knowing about it, then you have a lot of bugs. So, naturally, over time, people came up with these concepts of encapsulation and immutability to protect that state and make sure it is only changed and fiddled with in a controlled way. Because we don’t want to have bugs. Bugs are bad, okay.

No objection here. This is perfectly fine, and it makes a lot of sense. Let’s say we have something complex. A game scene. Compiler syntax tree. Whatever. Protecting state in memory of such systems is invaluable, to say the least.

In his book Domain-Driven Design (2004), when describing the Domain Layer in Chapter 4, "Isolating the Domain," Eric Evans writes:

> State that reflects the business situation is controlled and used here, even though the technical details of storing it are delegated to the infrastructure.

So he treats the **in-memory object as the custodian of state** - state that is “controlled and used here,” where “here” is the in-memory Domain Layer — while the RDBMS is merely “delegated to the infrastructure.” More on that in the next chapter. What matters here is the claim itself: **the state is in memory**. 

No doubt about it.

### The Reality

But what about applications backed by relational databases, business or otherwise?

In RDBMS-backed applications, the state lives in that RDBMS itself - not in memory. The authoritative custodian of the **state is the database table row**, not the in-memory object.

Take any business application backed by a relational database. How do you check the current state of some entity? Do you peek at the object in memory? No, you query the database for that. Anyone who has worked 5 seconds in industry knows this, of course.

I know what DDD people will say now: object memory (or functional state memory) is the real state data, and RDBMS is just where that data is persisted (presumably when the user clicks on a “Save” icon).

And, if you still believe that objects/memory are the real state and not RDBMS, then riddle me this:

What if we have multiple instances of the application running behind a load balancer? And then maybe some background work as well, and some other services too. Maybe reporting replica as well, so we have multiple processes accessing the same state data. Who is the sole custodian of that state data in that case? The in-memory object of one process, or the database row? The obvious answer is, of course, NONE of the in-memory copies. The best we can do is to have each process hold a copy, while the real state is in the RDBMS itself.

Some may say now, but databases have multiplicity too, right? We have multiple replicas, and they are all copies of the same data. And there are also multi-master setups as well, with multiple writers for high availability scenarios. Yeah, but the big difference is that the database solves it, while in-memory objects don’t even try to be honest. They just deny the reality. For multiple replicas, there is never any ambiguity about which one is the source of truth, since we are talking about read-only copies, and for multi-master setups, we have either different consensus protocols that ensure a single source of truth or so-called eventual-consistency for the source of truth. In-memory objects have no such machinery, so they just pretend that they are the single custodian of the state data, which is, of course, a big, fat lie.

If the object is the custodian of the state, what if we kill and restart the application? Oh my, the object’s custodianship has evaporated.

Also, what, for example, if we have two concurrent user writers? One loads an invoice as ‘pending’, but another writer marks it ‘paid’ while the first one holds it. Now the first one is lying about the state of that invoice. The database is right - it is the source of truth - the first one is stale. We will talk more about concurrency and integrity later - this is just to prove my point:

RDBMS is the authoritative custodian of the state, not in-memory objects. The **state lives in the database**, not in memory.

### The Cost

Take a look at this example of a DDD-style domain model below:

<figure style="margin: 0; text-align: center;">
  <img src="/ddd-agggrate-transparent.webp" alt="" style="display: block; width: 50%; max-width: 100%; height: auto; margin: 0 auto;" />
  <figcaption style="font-size: 0.8em; color: #888; margin-top: 0.5em;">
    Source credit: <a href="https://www.reddit.com/r/DomainDrivenDesign/comments/1ttzr19/create_complex_and_deep_aggregate/">https://www.reddit.com/r/DomainDrivenDesign/comments/1ttzr19/create_complex_and_deep_aggregate/</a>
  </figcaption>
</figure>

This is a random example from Reddit, but it is indicative. Virtually every domain model is more or less like that - strip away the method, adjust types a bit, and it is basically an **Entity-Relationship (ER) diagram**, and that’s it. There is no structural difference between the domain model and the database model. It is the **same logical model implemented twice**.

And that method `isValid()` - the only behavior in the whole model - is just a data integrity check. Every rule it enforces, the database enforces too: `dateBegin <= dateEnd` is a one-line `CHECK` constraint, and the harder ones — price periods that must not overlap, quantity ranges that must stay contiguous — are exactly what database constraints exist for (more on the how in the integrity misconception). **Same logical model implemented twice, same integrity rules implemented twice.**

Because modern software design orthodoxy refuses to acknowledge that the state lives in the RDBMS, it forces us to implement the same model at least twice - once in the database (relational model implementation), once in memory (object model implementation, usually mapped with an O/R tool or a library).

I say at least, because there are examples where we have even more. Some developers will consider that O/R mapped model a persistence model because it doesn’t have any behavior, and then they will add a separate domain model on top of that, which is the one with the behavior. So we have three implementations of the same logical model: database model, persistence model, and domain model.

And then, since we now have at least two physical models, we also have two type systems and two sets of constraints to protect the state. And we must keep them in sync at all times, and we must maintain the correct mapping. To be fair, this is mostly automated in modern systems (not completely), but we still have to do it, and it is still there, automated or not. And even automated, it is still a cost, a **source of bugs**, and a **source of complexity**. 

Schema evolution is hard everywhere — but it is strictly harder when every change must land in two models, and a mapping at once, and anyone who has choreographed a zero-downtime deployment knows exactly when that bill arrives. And even that can’t bridge the semantic gap between the two type systems fully. For example, in PostgreSQL, we can have a `NOT NULL` constraint on a column, but the corresponding C# property will be a nullable string.

All because we believe that there is some important state data we need to protect with our objects. In the best case, there are just some **transient and disposable chunks of data copies**, and in any case, there is a lot of plumbing to manage: connections, transactions, commands, queries, etc. You know, the actual infrastructure.

Personally, I see a lot of irony in this. Modern orthodoxy calls RDBMS infrastructure, just to end up with the codebases juggling a whole lot of infrastructure.

## 2) Storage Devices Abstraction Misconception

### The Claim

A modern software engineering approach makes the assumption that an RDBMS is a storage device. A device used to store data. Therefore, good engineering practice is to abstract that storage device.

We can see that in the quote from Eric Evans above, where he says that: 

> ... the technical details of storing it are delegated to the infrastructure.

Evans doesn't dwell on this point much - he just delegates storage to the infrastructure and moves on. On the other hand, Robert C. Martin is much more vocal about it. In *Clean Architecture*, Martin dedicates an entire chapter to "The Database Is a Detail" argument. He is very blunt about it, and he repeats it several times, for example:

> It's just a mechanism we use to move the data back and forth between the surface of the disk and the RAM.

Or this:

> The database is really nothing more than a big bucket of bits where we store our data on a long-term basis.

This is not some fringe blog post. These are two of the most-cited and influential authors in the field, arriving at one and the same conclusion, just at different volumes.

Evans states it just once and quietly, like he doesn't want to talk about it too much, and then delegates it away (perhaps he'd rather not have you examine it too closely, I don't know). Martin states it over and over, bluntly, and goes as far as to insist we should not even acknowledge that the disk exists. 

Different approaches - identical claims: the **database is a storage device**. Storage is mechanical, it sits beneath the business — no different from a file system — and the architect's job is to wrap it up tight and forget it is there.

### The Reality

Reality is that RDBMS uses a storage device or devices, and that means that it already does this abstraction for you. It already abstracts storage. 

If we go back to the beginning, when Edgar Codd introduced the relational model in 1970, the pitch was *data independence* — the whole point was to insulate the logical shape of your data from how it physically sits on a device. In fact, that is the core concept of the relational model. It was codified as the numbered Rule 8 fifteen years later in [Edgar Codd's twelve rules](https://en.wikipedia.org/wiki/Codd%27s_12_rules): **Rule 8: Physical data independence**:

> Application programs and terminal activities remain logically unimpaired whenever any changes are made in either storage representations or access methods.

The ANSI/SPARC Architecture from that era formalized it and walled off internal storage as well. So, the relational model was designed, from day one, to hide the disk.

Back to modern times and modern RDBMS implementations. 

Riddle me this: We can write a `SELECT`, a `JOIN`, a `WHERE`, and even an `INSERT`, `UPDATE`, or `DELETE`, and in most cases, it will be executed with the same results on different RDBMS engines from different vendors. That is called ANSI/ISO standardized SQL, which goes to show the real separation between the model and the physical implementation. Virtually every RDBMS implements the same ANSI/ISO SQL standard, but with dialect differences at the edges. Those differences can sometimes be significant, but the core of the language is the same, and that is what matters here. The same `SELECT` statement can run on MySQL, PostgreSQL, SQL Server, Oracle, and so on, given that you have the same logical model implemented in each of them.

But the abstraction doesn't stop at the SQL language. The relational model and the RDBMS implementations built on top of it are designed to be agnostic to the underlying storage device. For example:

- In PostgreSQL, we can move any table to any **different storage device** we choose (they call it a tablespace), and the model above remains unchanged. Just use `ALTER TABLE ... SET TABLESPACE` — the table is now on a different physical device. The term `TABLESPACE` is Oracle's term for the same thing (switching table storage), and SQL Server has something called `FILEGROUPS`. Same `SELECT`, same result, different storage, no changes, no fuss.

- You can **change the actual byte format in storage**. In PostgreSQL, the **table access method is pluggable** (Citus columnar, TimescaleDB). SQL Server flips a table from rows to columns with a clustered columnstore index. Oracle does it with Hybrid Columnar Compression, or stores the whole table inside a B-tree as an index-organized table instead of a heap. Same logical table, same query — completely different bytes on disk.

- * In MySQL, you can **swap the storage engine** out from under a table entirely: `ALTER TABLE t ENGINE=...` moves a table between InnoDB (B-trees on disk), MyISAM, Archive (compressed), CSV (a literal text file), or MEMORY (pure RAM). One table, one query, completely different machinery underneath.

- * The data **doesn’t even have to be in local storage at all**. In PostgreSQL, make it a `FOREIGN TABLE` over an FDW (Foreign Data Wrappers), and the rows live happily on another machine entirely — the query doesn’t even care or know. Oracle reads flat files as external tables; DuckDB queries Parquet files on disk as if they were tables. The **data is somewhere else**, on a remote machine - SQL is the same.

- It doesn't even have to be one machine. Hand it to a distributed SQL engine — CockroachDB, TiDB, Spanner — and your data becomes a replicated, sharded key-value store smeared **across a cluster**. You have no idea which node, let alone which disk, holds any given row. CockroachDB speaks Postgres's wire protocol, so you can use standard PostgreSQL unchanged, TiDB speaks MySQL's, and you still write ordinary SQL. Or push it to the cloud, where Snowflake keeps everything as columnar micro-partitions in object storage. Same `SELECT`, same result, no fuss.

- And finally — no disk at all. Who says we need disks? Declare a MySQL table `ENGINE=MEMORY`, run PostgreSQL on a `tmpfs` with the **whole data directory in RAM**, switch on SQL Server's In-Memory OLTP, open SQLite as `:memory:`. No persistent storage anywhere. Same query, same result — and the thing is still, unmistakably, a database.

Martin writes: _"To mitigate the time delay imposed by disks, you need indexes..."_ Then why are in-memory databases full of indexes? Why are they (in-memory databases) a thing at all? Because an index was never about the medium - it is about not scanning every row when you want one, be it on disk or in RAM.

As we can see, different devices, different formats, even machines and clusters, or even no machines at all — the same logical model, the same SQL, the same results. The RDBMS already abstracts storage for you. It is designed to do exactly that. Thank you very much, but you are wrong.

### The Cost

Cost is a **never-ending persistence-ceremony**. WWe are asked to carefully construct our data models in memory (to maintain the illusion of encapsulation), protect them from illogical and unwanted changes, and then save them to the database (persist them) when the time is right.

It is hard to overstate how big this persistence-ceremony thing really is. The number of specialized patterns, libraries, countless tutorials, videos, entire philosophies, strategies, etc. But take a look at this trivial example: 

This is a simple SQL statement to update a transfer approval - two people must sign off, they must be different people, and the status moves from pending to partly to fully approved. In a traditional codebase, this would be a considerable chunk of code spanning multiple files and doing several database calls, just to maintain the illusion.

```sql
update transfer_approvals
set
  status = case
    when status = 'pending' then 'partly_approved'
    when status = 'partly_approved'
         and approver1 is distinct from $1 then 'fully_approved'
    else status
  end,
  approver1 = case when status = 'pending' then $1 else approver1 end,
  approver2 = case
    when status = 'partly_approved'
         and approver1 is distinct from $1 then $1
    else approver2
  end
where 
  transfer_id = $2
  and status in ('pending', 'partly_approved')
returning status;
```

We don't know where those transfer approvals are. Is it stored on a disk? What disk is it on? Is it in memory, what format it's in, or even what machine it is on, and we don't care. That is not the point. This is a DECLARATION. We have just declared business rules for how to update transfer approvals. 

It has nothing to do with storage as far as the application is concerned. And since our RDBMS engine hides and abstracts all the storage details and does all the persistence work for us, what are we left with then? That's right: **the business logic and business rules**. Just a declaration of how our transfer approvals should be updated in this case. Nothing else. No ceremony, no plumbing, no persistence layer, no storage, no nothing. 

The entire pile of code, which is now gone with this move, is the following:

- the entity / aggregate class (the in-memory model)
- the repository (to fetch it and put it back)
- the unit-of-work / change tracker (to know which fields are dirty)
- the O/R mapping config (to translate object <-> row)
- the load → mutate-in-memory → save dance
- the surrounding transaction scope

Every one of those exists for one reason only: to carry state from memory to storage and back. Remove that silly belief, and every one of those big code blocks removes itself.

## 3) Data Structures Abstraction Misconception

### The Claim

If we already have established two previous claims — that the state lives in memory and that the database is a storage device — then data itself must be an in-memory data structure as well. And, if we are going to perform operations on it, protect the state, mutate, and so on, then we need to have it in memory, and only suitable in-memory data structures will do, period.

Direct quote from Eric Evans, Domain-Driven Design (2003), Part II "Building Blocks of a Model-Driven Design," Chapter 6 "The Lifecycle of a Domain Object," in the section on Repositories (p. 108), he writes:

> For each type of object that needs global access, create an object that can provide the **illusion of an in-memory collection** of all objects of that type.

<figure style="margin: 1em 0; text-align: center;">
  <img src="/vietnam/evans.png" alt="Screenshot from Eric Evans, Domain-Driven Design (2003), p. 108, showing the Repository definition" style="display: block; max-width: 100%; height: auto; margin: 0 auto;" />
  <figcaption style="font-size: 0.8em; color: #888; margin-top: 0.5em;">
    Eric Evans, <em>Domain-Driven Design</em> (2003), p. 108.
  </figcaption>
</figure>

The word Evans uses: **illusion**. Not a real collection, oh no, just the *illusion* of an in-memory structure. This should tell you everything now: You should only build an elaborate pattern to **simulate an in-memory collection** if the real data collection was never in memory to begin with. 

The Repository exists precisely because the objects live in the database, and its entire job is to make them *look* like they are sitting in memory. Fake it until you make it, except you will never make it. 

The repository pattern is an admission in structural form: relational data, dressed up to pass as an in-memory data structure (so we can do OOP on it).

This is not a coincidence nor an isolated quote. For example, in the book *Patterns of Enterprise Application Architecture* (2002), Martin Fowler writes (source: https://martinfowler.com/eaaCatalog/repository.html):

> A Repository mediates between the domain and data mapping layers, **acting like an in-memory domain object collection**.

Acting like an in-memory domain object collection? Why do we want to force relational data into an in-memory collection? Just for good measure, let's check out Microsoft's recommendation in their [Software Architecture e-book](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/infrastructure-persistence-layer-design), in a part that teaches us how to "Design the infrastructure persistence layer." Microsoft echoes Fowler almost word-for-word, putting it as a set of domain objects in memory.

> A repository performs the tasks of an intermediary between the domain model layers and data mapping, acting in a similar way to a set of domain objects in memory.

And then they continue:

> Basically, a repository allows you to populate data in memory that comes from the database in the form of the domain entities. Once the entities are in memory, they can be changed and then persisted back to the database through transactions.

Again, just goes to prove the point above - real state is in the database, we are simply mandated to load temporary chunks into memory - in order to maintain the illusion of encapsulation and illusion of in-memory data structure.

Perhaps we might end up with an illusion of the entire software solution?

In any case, more than a decade after Evans and Fowler had laid out this machinery that simulates in-memory collections, the mismatch still had not been solved. We know this because in 2014, the field's leading DDD experts from around the world gathered at the DDD eXchange conference in NYC to figure out how to do DDD better and, finally, solve this Object-Relational Impedance Mismatch. Because you do not hold a summit to solve a problem you have already solved.

One of the speakers, renowned DDD expert Vaughn Vernon, gave a talk called ["The Ideal Domain-Driven Design Aggregate Store?"](https://kalele.io/the-ideal-domain-driven-design-aggregate-store/) where he proposed a final solution to the O/R Impedance Mismatch problem:

> During the park bench discussion I promoted the idea of serializing Aggregates as JSON and storing them in that object notation in a document store. A JSON-based store would enable you to query the object’s fields. Central to the discussion, there would be no need to use an ORM. This would help to keep the Domain Model pure and save days or weeks of time generally spent fiddling with mapping details. Even more, your objects could be designed in just the way your Ubiquitous Language is developed, and without any object-relational impedance mismatch whatsoever. Anyone who has used ORM with DDD knows that the limitations of mapping options regularly impede your modeling efforts.

<figure style="margin: 1em 0; text-align: center;">
  <img src="/vietnam/vernon.png" alt="Screenshot from Vaughn Vernon, 'The Ideal Domain-Driven Design Aggregate Store?', proposing JSON-serialized Aggregates in a document store" style="display: block; max-width: 100%; height: auto; margin: 0 auto;" />
  <figcaption style="font-size: 0.8em; color: #888; margin-top: 0.5em;">
    Vaughn Vernon, <a href="https://kalele.io/the-ideal-domain-driven-design-aggregate-store/">"The Ideal Domain-Driven Design Aggregate Store?"</a>
  </figcaption>
</figure>

Framing in this case is that the O/R mapping tools and libraries are the main source of impedance mismatch, and if we could just get rid of them, then we would have solved the problem. No O/R mapping, no O/R mapping at all, and no impedance mismatch. That's the idea. In essence, the proposed data design is this:

- Serialize each aggregate Object to JSON, store it as a blob.
- Every table is just (id, data json) — a key and a blob, nothing else.
- "Reference Other Aggregates By Identity Only" — no foreign keys, no joins, nothing, each blob standalone.

That's it. That is the "ideal aggregate store" solution to the impedance mismatch problem.

Now, to be fair, Vaughn Vernon is not saying that RDBMS = file system. He does propose using Postgres for ACID and JSON querying. He does want to keep the relational engine. Just not the relational model. 

And that is the whole trick. We have solved the Object-Relational impedance mismatch by removing the relational part entirely — and keeping the Object part, obviously. No relations, no foreign keys, no joins, no set operations, no nothing. Just a flat collection of objects, serialized, frozen to disk, and fetched by ID. The illusion of an in-memory collection, made real at last.

So, yeah, the solution to the O/R impedance mismatch is to remove the R (relational part) entirely, and just have a key-value store with JSON blobs.

That was proposed ten years ago. Does anyone use that today? Is that how the industry builds? I don't think so. Twenty years after Evans and Fowler, the mismatch sits exactly where it started. We never solved it.

### The Reality

The claim section did not just hand us quotes — it handed us a blueprint. Evans, Fowler, and Microsoft all describe the same machine, so let's name what that machine actually does.

The orthodoxy runs on two impersonations at once.

The first is a real data structure playing a role. The object graph is a genuine, honest, in-memory structure — objects, references, fields, nothing wrong with it as a structure — and it is cast to play the state it does not hold. The first misconception already took that custody claim apart: the state is the database row; the object holds a copy of it, taken at load time.

The second is a pattern playing with a data structure. The repository takes relational data — which lives in another process, usually on another machine — and makes it answer to `foreach` and property access as if it had been sitting in memory all along. Not a real collection: the *illusion* of one.

Two fakes, stacked, each covering for the other. The object graph can pose as the state only if something keeps feeding it fresh copies and carrying its changes home — that is the repository's job. And the repository has a reason to exist only if something upstream insists on holding state in objects — that is the object graph's job. A real structure faking the state, and a fake collection concealing where the state actually is.

And Evans already told us which side is real when he reached for the word *illusion*. You do not build an illusion of a thing you actually have.

Now, before taking the fakes apart, let me get one thing out of the way immediately, because I don't want to win this argument by cheating.

A table is a set. That is not a metaphor — it is the mathematical definition. Codd's 1970 paper defines a relation as a subset of the Cartesian product of domains: a set of tuples.

<figure style="margin: 1em 0; text-align: center;">
  <img src="/vietnam/codd.png" alt="Screenshot from E.F. Codd, 'A Relational Model of Data for Large Shared Data Banks,' defining a relation as a subset of the Cartesian product of domains" style="display: block; max-width: 100%; height: auto; margin: 0 auto;" />
  <figcaption style="font-size: 0.8em; color: #888; margin-top: 0.5em;">
    Codd, E.F., "A Relational Model of Data for Large Shared Data Banks," CACM 13(6), June 1970, pp. 377–387, §1.3.
  </figcaption>
</figure>

And SQL is an algebra over those sets — selection, projection, `JOIN`, `UNION`, `INTERSECT`, `EXCEPT` — a closed algebra, so every operation over sets returns another set you can keep operating on.

All true. And here is the problem with building the argument on that: an in-memory collection can do all of it too. LINQ in C# ships `Join`, `GroupJoin`, `Union`, `Intersect`, `Except`, `Distinct`, `GroupBy`. Those are not arbitrary method names — those are Codd's operators, reimplemented over `IEnumerable`. And every other ecosystem rebuilt some version of the same algebra over its collections; LINQ just did it most completely.

So if the impedance mismatch were about operations — about what you can *do* with the data — it would have been solved around 2007, when the operators finished porting. Case closed, everybody go home.

The mismatch is still here. Which means it was never about the operations. It is about the two things being faked: being the state, and being the structure that holds it.

Here is what the table has that no collection in your process can have. Not what it *does* — what it **is**:

1. **It is the record.** As established in the first misconception, the row is not a representation of the state; it is the state. Your collection is a copy of it, taken at load time.

2. **It is shared.** Every process, every writer, every background job operates on the same table, under the engine's arbitration. Your collection is private to one process. The other writers don't know it exists, and they are not waiting for it.

3. **It is durable and live.** The table existed before your process started, will exist after it dies, and keeps changing under other writers the whole time. Your collection is a photograph. The table is the thing being photographed — and it kept moving after the shutter clicked.

4. **It is guarded.** `CHECK`, `UNIQUE`, `NOT NULL`, foreign keys, etc. — all enforced transactionally, against every writer. Your in-memory validation binds exactly one thing: your copy. The next writer does not inherit your discipline.

Not one of these four is an operation. LINQ could port `Join` because join is a function — values in, values out. Pure computation travels; you can implement it anywhere. Being the shared, durable, guarded record is not a function. There is no method you can add to `List<T>` that makes it *become* the authoritative state. You can port an operator. You cannot port a status.

And the port itself came up short of the original, on both ends. Under the operators: in memory, they run as plain loops over the heap — no indexes, no statistics, no plan chosen for the data at hand. Above them: the port stopped at the basics. Window functions, recursive traversal, grouping sets — the top end of the algebra never shipped, so in memory you hand-roll what the engine declares. The cost section will send a bill for this, and the algorithms misconception will finish the audit; for now, note that even the ported algebra is a tribute act, not the band.

Which is why the industry itself closed this case: the most serious application of LINQ's relational operators is LINQ-to-Entities, which takes your C# expression tree and compiles it *back into SQL*, to send to the database. We rebuilt the algebra in memory, and its main job turned out to be translating itself back — the algebra made the trip, and the data never did. Port the operators; the data and the execution stay home.

This puts the domain object model in a completely new light. It is not an alternative data structure for your data. Look at the machinery again, piece by piece:

| The object model builds | To simulate |
|---|---|
| Repository | the table |
| Identity map | the primary key |
| Navigation properties | foreign keys and joins |
| Unit of work | the transaction |
| Change tracker | what `UPDATE ... SET` already knew |
| In-memory validation | `CHECK`, `UNIQUE`, and foreign key constraints |

That is not a different model. That is the same model — the database — re-implemented in RAM, minus the four properties that made it meaningful. The domain model is a simulation of the database, running inside your process — the two fakes from the top of this section, now itemized line by line. And the real thing sits two feet away the entire time, doing all of it correctly, under ACID, for every process at once. We call the copy "the domain" and the authority "a detail."

And now the theorem this whole chapter has been building toward — the reason the repository can be dismissed rather than merely criticized.

The repository has exactly one customer. No report needs the illusion of an in-memory collection. No SQL statement needs it. No background job, no other process, no other system ever asks for it. The only thing in your entire architecture that requires relational data to impersonate an in-memory collection is an in-memory object model that claims to be the custodian of state — the exact claim the first misconception dismantled. The first fake is the second fake's only client.

Retire the pretender, and the illusion plays to an empty theater. No custodian object means nothing to hydrate — no repository. Nothing to track — no unit of work, no change tracker, no identity map. Remember the transfer approval from the storage misconception: that whole pile of patterns removed itself the moment the statement was allowed to run where the state lives. The pattern family does not have to be refuted. It has to be recognized as unemployed.

So this misconception is not a separate mistake standing on its own. It is the running cost of the first one. The repository is the invoice.

To be precise about what I am *not* claiming, before somebody builds a strawman out of it:

In-memory data structures are not the problem. Pure computation over values you were genuinely given is exactly what memory is for — take inputs, compute, return outputs. The game scene and the compiler syntax tree from the first misconception live in memory legitimately, because they *are* the state of those systems. LINQ over data you rightfully hold is wonderful.

Caching is not the problem either — honest caching. A cache knows it is a copy. It has a TTL, an invalidation story, and it never claims to be the truth.

The sin is narrow and specific: **a copy that claims to be the authority and has no answer for the moment it goes stale.** That is not a cache, and it is not a data-structure choice. That is a simulation impersonating the thing it copied.

Hold on to that word — *impersonating* — because it explains something two decades of framework engineering could not fix. Every famous ORM pathology you have ever fought is not a separate bug with a separate fix. It is one failure with many faces: a simulation forced to behave like the authority it impersonates. Let's count the faces.

### The Cost

Man, where do I even start?

#### Read-Modify-Write Pattern

The object must first be properly hydrated (loaded from the database) before it can be mutated. That is the main idea. Or contract, if you will.

So, to change one column, the ORM first runs a SELECT followed by an UPDATE: load the row (usually the whole aggregate — scroll back to that Reddit picture and count the objects), let the object “decide” in memory, and then write it back.

Remember the transfer approval from the previous chapter: one UPDATE statement, zero preliminary round trips, the rule declared right where the state lives. The simulated version is this:

* Load from database (first round trip from database).
* Check in memory.
* Mutate in memory.
* Save to database (second round trip to database).

All that instead of just one update statement as we have for that transfer approval. And even worse, between load and save, the row is free to change under you.

And what happens, we either have lost updates or we have to add some kind of “optimistic concurrency token” — a rowversion or xmin or a simple update timestamp column added to the schema - not because the business really needs it or even cares - but to detect that your copy lied to you between load and save.

That token is a confession written in your DDL: **that in-memory copy in your object is not the record, and we all know it.**

#### Private! Not Shared!

Get this:

Two requests load the same invoice. Fine. Each holds it in memory, then makes a decision from it. And both decisions are “valid” in memory, but one of them is wrong in reality. The database is the only place where arbitration happens and where the truth lives.

Now add a background job, a second service, a nightly import — and the in-memory “state” stops being state at all. It is one process’s guess about what the state was, some number of milliseconds ago. (Much more on this in the concurrency and integrity misconception.)

To be fair, the database also has these kinds of concurrency and integrity problems. But at least it tries to solve them, and it has the machinery to do so. What are we going to do, reinvent the database in memory?

#### Graph Walk and N+1 Pathology

We conceded that collections have the operators. Fine. But the object model pushes you away from them: **objects navigate**. `customer.Orders`, `order.Lines` — walking references one object at a time, each step a query you didn’t see, fired from behind a property getter.

One `JOIN` can easily become a hundred `SELECT`s, all while the call site looks completely innocent. 

And it looks innocent because if you are programming against an in-memory collection, that is precisely what you would normally do with an in-memory collection. It is easy to forget that the collection is an illusion; we are in a simulation. Remember Evans's words.

In reality, this is a performance calamity known as N+1, the most documented performance pathology of the last two decades. The point is simple: the illusion breaks, and the hidden cost lands on you. And the fixes bill you separately: eager-load with `Include` and over-fetch half the database, or project into DTOs — at which point you are writing relational queries again, in C#, so that a library can compile them back into the SQL you were abstracting away. 

The abstraction is usually abandoned when it is first seriously tested.

#### The Simulation — Illusion of a Collection

- Window functions. 
- Recursive CTEs.
- Grouping Sets.
- Lateral joins.
- Partial and expression indexes.
- Set-based bulk updates. 
- etc.

And underneath all of it: a cost-based planner with live statistics about *your actual data*, choosing between a hash join, a merge join, and an index scan — per query, per data distribution. The simulation has none of this and cannot grow it. This one isn't even a defect — it is simply what a private copy in RAM lacks next to a database engine.

The standard reply — "but EF has raw SQL escape hatches" — is exactly my argument all along: If the object model were the system of record, there would be nothing to escape *to*. The moment you drop to SQL for the hard 20%, you have admitted where the real system was all along. The escape hatch is not a counterexample. 

It is the proof.

---

Now step back and look at the four together. None of them is an implementation defect. 

Hibernate is twenty-five years old; Entity Framework is eighteen. Some of the best engineers in the industry have been sanding these edges for two decades, and every one of these problems is still here — because they are not bugs in the simulation. 

They are the simulation *working correctly*: behaving exactly like what it is — a private, transient copy — instead of what it plays: the shared, durable record. That gap does not close with effort, because it is not made of code. It is made of what the two things *are*.

And that is Neward's quagmire, stated mechanically. An escalating investment that cannot win — not because the enemy is strong, but because a copy cannot out-invest its way into being the original.

## 4) Abstraction Over Algorithms

### The Claim

Let's talk about behavior. This is what the industry calls **business logic**: the algorithms, the rules, the behavior of the system. And the industry does not want you to have that business logic inside the database. Anywhere near the database, as a matter of fact. 

Don't take my word for it. Proofs are not that hard to find. And, by the way, if it is already established that RDBMS is just a storage device, logically, where else should business logic be then? In application memory, of course, not in the database. Because the database would then cease to be just a storage device, and that is the whole point.

Let's see what prominent people from industry have to say about that:

Martin Fowler wrote about this exact question back in February 2003, in an article called ["Domain Logic and SQL"](https://martinfowler.com/articles/dblogic.html). It opens with an honest description of the mainstream attitude:

> Many application developers, particularly strong OO developers like myself, tend to treat relational databases as a storage mechanism that is best hidden away.

To his credit, Fowler takes the SQL option far more seriously than most of his readers ever did. And still, the verdict:

> Personally I don't think performance should be the first question. My philosophy is that most of the time you should focus on writing maintainable code.

With a warning label attached:

> I would suggest that if you go the route of putting a lot of logic in SQL, don't expect to be portable — use all of your vendors extensions and cheerfully bind yourself to their technology.

And a concession that defines SQL's proper place in this worldview:

> If you use an in-memory approach and have hot-spots that can be solved by more powerful queries, then do that.

I think that Martin may be the most reasonable and balanced of all prominent voices on this topic. Let's see what the next one has to say.

Jeff Atwood — who would go on to co-found Stack Overflow — in October 2004, in a post titled ["Who Needs Stored Procedures, Anyways?"](https://blog.codinghorror.com/who-needs-stored-procedures-anyways/):

> Stored Procedures should be considered database assembly language: for use in only the most performance critical situations.

Assembly language? The only successful higher-level 4th-gen language that ever existed. The declarative data language. That one?

> Stored Procedures hide business logic.

Hide it — from whom? 

And then there is David Heinemeier Hansson, the man who needs no introduction, the famous creator of Ruby on Rails, whose ActiveRecord taught an entire generation how to talk to a database — in a 2005 post titled "Choose a single layer of cleverness":

> I don't want my database to be clever! ... I consider stored procedures and constraints vile and reckless destroyers of coherence. No, Mr. Database, you can not have my business logic. Your procedural ambitions will bear no fruit and you'll have to pry that logic from my dead, cold object-oriented hands... I want a single layer of cleverness: My domain model.

The original post has since vanished from the web, but the passage survives in the database field's own canonical anthology — [Readings in Database Systems](http://www.redbook.io/ch9-languages.html) — where the database people preserved it, I suspect, for roughly the same reason I am quoting it here.

So, basically, he wants to do away with not just stored procedures, but also with constraints. You okay, DHH?

I tell you, there is a certain pathology in this industry. My suspicion is that it has something to do with Objects. We'll get more into that later.

Twenty years later, after these quotes, this is still the mainstream position, and most codebases you will open this week are built on it.

### The Reality

The reality is that you can't remove the business logic from the database. You just can't. But what is the definition of business logic anyway? Let's do a quick check on the [Wikipedia entry](https://en.wikipedia.org/wiki/Business_logic), which defines it as follows:

> In computer software, business logic or domain logic is the part of the program that encodes the real-world business rules that determine how data can be created, stored, and changed.

How data can be created?

Can I create an invoice without a customer? Can I create a customer without an address? Can I have multiple customers with the same email? Are those real-world business rules that determine how data can be created? Or, are those part of our data model?

Both — that is the point. An invoice that must have a customer is a foreign key. A customer that must have an address is a `NOT NULL`. One email, one customer is a `UNIQUE` constraint. So, if we implement those rules with the relational model, are we implementing business logic by this definition? Yes, we are, of course. And if we implement those rules with SQL, are we implementing business logic by this definition? Yes, we are, of course.

Which means: by the industry's own definition, business logic is already in your database — like it or not. Every schema ever deployed is full of real-world business rules that determine how data can be created, stored, and changed, sitting in the exact place the claim says they must never be.

And no, "but we are code-first" does not get you out of it. You write the rule as an attribute on a mapped model, the ORM migration generates the constraint — now where does that rule live, and where does it bind? In the database, against every writer. The fact that the mapped model is part of your codebase does not make the rule any less *in the database*. The codebase holds the source text; the database holds — and enforces — the logic.

So the rules — the static half of business logic — never left the database, because they cannot leave. 

Now for the dynamic half: behavior. Queries and commands.

SQL is a programming language. A declarative one, but a programming language.

Look back at the transfer approval statement from the second misconception. Two approvers, they must be different people, the status walks from pending to partly to fully approved. That is not "fetching data." That is behavior — an algorithm, expressed as a declaration, executed next to the data, atomically.

Now ask what the algorithms of a business system actually are. Strip away the ceremony and it is overwhelmingly this: filter, join, group, aggregate, rank, deduplicate, walk a hierarchy, compute something over ordered data. Which is, item for item, exactly what SQL was designed to express. A running balance, for example:

```sql
select
  customer_id,
  transaction_date,
  amount,
  sum(amount) over (
    partition by customer_id
    order by transaction_date, transaction_id
  ) as running_balance
from transactions;
```

The in-memory version of this algorithm: fetch every transaction over the wire, group by customer in a dictionary, sort each group, loop and accumulate — writing by hand the very algorithms the database selects automatically — plus the memory footprint, plus deciding what happens on the day the table stops fitting in RAM. Load it in chunks, then? Now the simple loop grows paging, batching, and restart logic — everything the engine was already doing for you invisibly, with buffers and spill-to-disk it has been tuning for decades. More code, more maintenance, worse performance, same result. The declarative version is the window function above. Ranking, top-N-per-group, gaps in sequences, running totals, year-over-year — window functions. Org charts, bills of materials, category trees — recursive CTEs: declare the traversal, and the engine walks the graph. With recursive CTEs, SQL is Turing-complete — not that you should compute Fibonacci in it, but "SQL can't express my logic" stopped being true decades ago.

I have watched this collision live, more than once. A couple of times I have had the opportunity to teach SQL to working developers, and every time the same scene played out. These were good developers — trained in data structures and algorithms, and genuinely good at them — and that exact training is what kept tripping them. Whatever the task, the first instinct was to iterate: get the rows out, then loop over them. They kept trying to do `foreach` on me. But iteration is an anti-pattern in SQL — the cursor exists, and it has its legitimate uses, but they are rare. The unit of thought in SQL is not the row; it is the set. The job is not to walk the elements; it is to combine sets — filter them, join them, group them — until the answer falls out. Nobody had ever trained them to think that way, so the loop was all they had. The problem was never intelligence, and it was never the language. It was a reflex installed by training — a `foreach` where a set should be.

But here is the part that actually settles the argument, and it is not expressiveness. When you write the loop, you are writing one algorithm, frozen at commit time. When you write the declaration, the engine writes the algorithm — at runtime, with a cost-based planner and live statistics about your actual data. Hash join, merge join, nested loop; index scan or sequential scan; parallel workers or not — chosen per query, per data distribution, and re-chosen as the data grows. Your hand-written loop was a perfectly good plan at ten thousand rows. At ten million it is a catastrophe, and it will not adapt, because it is code — someone has to notice it, profile it, and rewrite it. The declaration just quietly gets a new plan. SQL is the only mainstream language that optimizes itself like this: you declare the *what*, the engine derives the *how*, and re-derives it as the data changes — which frees you to spend your effort on the one thing no engine can derive: the business rule itself.

Nobody would hand-write three join algorithms plus a statistics-driven optimizer to choose between them in the service layer. That machinery already exists. It sits directly under the data — and the claim instructs us not to use it.

Which leaves the claim's justifications, so let's take them in order. Maintainability: is the eight-line window function really less maintainable than the same algorithm spread across a repository, a service method, and a mapping profile? "Maintainable" is not a synonym for "written in my favorite language." Portability: the second misconception already dealt with that — the core of SQL is an ANSI/ISO standard that runs on every engine, while your domain layer is portable to exactly nothing; nobody in recorded history has swapped C# + EF for Java + Hibernate because the code was so nicely decoupled. Testability: SQL is testable — pgTAP exists, and the oldest trick in the book still works: open a transaction, run the test, roll back. Besides, when you mock the database out of a test of data logic, look at what is left standing: you are testing the simulation from the previous misconception, not the system.

And this is why, in practice, developers trying to escape all of this end up in one of exactly two places. One: use an ORM — write the query as C# expression trees and let a library compile them into SQL, living inside the simulation from the data structures misconception. Two: admit defeat and just write the SQL. Now look closely at the difference between those two, because there isn't one that matters. In both cases the logic is text in your codebase, version-controlled next to everything else. In both cases the thing that actually executes is SQL, inside the database engine, next to the data. The ORM route just puts a translator in the middle and prints C# on the page instead of SQL. Just because the ORM code is part of the application codebase does not mean the logic executes anywhere but the database.

The claim demanded that business logic stay out of the database. Neither escape route delivers that, because there was never anywhere else for it to run. The debate was never *where* business logic executes — it always executes in the database. The debate was only ever about which language you write it in.

### The Cost

Every other corner of the industry has a name for this cost: moving data to compute instead of moving compute to data. The entire big-data field was built on the lesson that you ship the algorithm to where the data lives, because the other direction does not scale. Business software orthodoxy teaches the other direction as a best practice.

So we pay, in four installments:

- **The wire tax.** Rows are read, serialized, shipped across the network, deserialized, and mapped into objects — so that a loop can run in the application, redoing work the engine would have done in place, with indexes.

- **The round-trip tax.** Iterative logic in the application is chatty by nature: a query per step, per entity, per iteration. The N+1 problem from the previous chapter is this tax's most famous invoice.

- **The reimplementation tax.** Every in-memory group, sort, join, and aggregate is a worse copy of what the engine already had: no indexes, no statistics, no planner, no parallelism, and memory bounded by your heap.

- **The frozen plan tax.** The hand-written algorithm does not adapt to data growth. It just gets slower, quietly, until the nightly job that took a minute takes six hours, and someone gets paged to rediscover this chapter.

And the punchline is already inside the claim itself. SQL is admitted as the exception, for hot-spots — and then, over the life of the system, every part that matters turns out to be a hot-spot. One by one, the pieces that count get rewritten in SQL anyway, by tired people, during incident reviews. It is the same concession we saw with the raw-SQL escape hatch in the previous misconception: the exception clause ends up doing all the load-bearing work. At some point, the honest question is why the exception is not the architecture.

## 5) Abstraction Over Concurrency and Integrity

::: info TL;DR
The claim: the aggregate guards the invariants, in memory, one object cluster per transaction. The reality: a check in memory binds one process at one moment; only the database sees every writer, so only constraints and transactions actually enforce anything.
:::

### The Claim

DDD's answer to data integrity is the **aggregate**. Eric Evans, Domain-Driven Design, Chapter 6:

> An AGGREGATE is a cluster of associated objects that we treat as a unit for the purpose of data changes.

The aggregate root guards the boundary and enforces the invariants — the business rules that must never be broken. That Reddit picture from the first misconception is exactly this: `Article` at the root, guarding its packages, price periods, and quantity ranges, with `isValid()` standing watch.

Vaughn Vernon — the same Vaughn Vernon from the aggregate store — codified the discipline in *Implementing Domain-Driven Design* (2013) and the ["Effective Aggregate Design"](https://www.dddcommunity.org/wp-content/uploads/files/pdf_articles/Vernon_2011_1.pdf) essays it grew from. He is admirably precise about it:

> An invariant is a business rule that must always be consistent.

> A properly designed Aggregate is one that can be modified in any way required by the business with its invariants completely consistent within a single transaction.

> Thus, Aggregate is synonymous with transactional consistency boundary.

Along with the rule that turns it into a discipline:

> A properly designed Bounded Context modifies only one Aggregate instance per transaction in all cases.

So the claim: invariants — the rules that must *always* hold — are enforced by the domain model, in memory, one aggregate at a time. The community even has a slogan for it: the *always-valid domain model*.

But read Vernon's third sentence again, slowly, because something remarkable is happening in it. "Aggregate is synonymous with *transactional consistency boundary*." The pattern defines itself as a transaction. Hold that thought.

### The Reality

First things first: the goal is completely right. Invariants must hold — that was never in dispute; it is the same reasonable instinct we already conceded in the first misconception. The question was never *whether* to enforce invariants. The question is where enforcement actually binds.

An invariant enforced in memory binds exactly one process — property four of the data structures misconception: the next writer does not inherit your discipline. And it binds at exactly one moment — validation time. Between the check and the write, the world keeps moving.

The canonical example, the one every team eventually learns in production: usernames must be unique. The domain model checks — no such username, valid — and inserts. Two concurrent registrations both check, both pass, both insert. The "always-valid" model just produced invalid data, twice, without a single line of it misbehaving. Check-then-act on a private snapshot is a race by construction — TOCTOU, time-of-check to time-of-use, a bug class old enough to have its own acronym. And notice what every team actually does about it: they add a `UNIQUE` constraint. The engine catches what the model cannot.

It is worth being precise about *why* the engine can do what the model cannot: it is the only party that sees every writer. Which makes it the only place where invariant machinery means anything: `NOT NULL`, `CHECK`, `UNIQUE`, foreign keys, `EXCLUDE` — wrapped in transactions, with isolation levels up to `SERIALIZABLE`, where concurrent transactions are guaranteed to behave as if they had run one at a time. Enforced against every writer: your application, the second instance behind the load balancer, the background job, the DBA at 2 a.m. No exceptions, and no discipline required.

Time to pay the debt from the first misconception. The hardest invariant in that Reddit aggregate: price periods must not overlap. `isValid()` can inspect its own copy — while another process commits an overlapping period it has never heard of. Here is the entire invariant, declared:

```sql
create extension if not exists btree_gist;

alter table price_periods
add constraint price_periods_no_overlap
exclude using gist (
  package_id with =,
  daterange(date_begin, date_end, '[]') with &&
);
```

Two periods for the same package with overlapping date ranges can now *not exist*. Not "will be caught, provided the request comes in through the domain layer" — cannot exist. Under any concurrency, from any writer, forever. One declaration. That is what enforcing an invariant actually means.

And now unhold that thought from the claim. *Aggregate is synonymous with transactional consistency boundary.* The transaction is a database concept. The pattern's own definition concedes that invariant enforcement is transaction work — it just redraws the transaction as an object graph, in one process's private memory, where it can see no other writer and therefore enforce nothing. The aggregate is a hand-drawn picture of a transaction. The database has the real ones — and the real ones can span whatever rows and tables the invariant actually needs, not just one object cluster.

### The Cost

**Everything is enforced twice — or worse, once, in the wrong place.** The same rules live in C# validation and in database constraints, drifting apart release by release — the behavioral edition of the duplicated models from the first misconception, same bill, new line item. And the team that takes "always-valid" at its word and skips the constraints has it worse: their invariants are now enforced nowhere. They hold only in the absence of concurrency — which is to say, they are not enforced. They are observed, until further notice.

**The races ship.** Check-then-act bugs pass every unit test, because in the test the domain model really is alone — the race needs a second writer, and the test suite proudly mocks that out. The mock removes the exact enemy the invariant exists to fight. So the bug appears only under production load, intermittently, and is discovered as corrupted data weeks later: the duplicate payment, the double-booked slot, the negative stock. Every experienced engineer has one of these stories, and in every single one of them, the domain model passed all of its tests.

**The aggregate-boundary industry.** Vernon's rule — one aggregate instance per transaction — voluntarily outlaws the multi-row, multi-table atomicity the engine offers natively. So what happens when a real invariant spans two aggregates? A whole discipline unfolds: redesign the boundaries, or accept *eventual consistency* between aggregates, coordinated through domain events, process managers, sagas, compensating actions. An entire detect-and-compensate machinery, invented to route around `BEGIN ... COMMIT`. The database would have held both rows in one transaction — the real kind — and gone to lunch.

And with that, the five misconceptions close into a single picture. The state lives in the database (1), which already abstracts its own storage (2). Its tables cannot be replaced by in-memory structures — only impersonated by them (3). Its language already expresses the algorithms (4), and its transactions and constraints are the only invariant enforcement that actually binds (5). Every axis the modern application layer re-implements is an axis the engine already owns. The impedance mismatch was never a mapping problem between two equal worlds. It is the ongoing cost of running a simulation of one world inside the other — and calling the original "a detail."

## How We Got Here

> Those who cannot remember the past are condemned to repeat it.
>
> — George Santayana

Five misconceptions is a lot of wrong for one industry. Nobody wakes up one morning and decides the database is a big bucket of bits. Beliefs like that have a history, and this one has a good one. I did the digging a while ago and [wrote about it on Medium](https://medium.com/dev-genius/business-rules-in-database-movement-e0167dba19b7) — here is the short version.

Did you know that there was an entire movement in software development, complete with its own manifesto, thought leaders, and everything, dedicated almost exclusively to putting business rules in SQL databases?

I certainly didn't. But it did happen, in the late 1990s and early 2000s. It was called the **Business Rules movement**, and its [manifesto](https://www.businessrulesgroup.org/brmanifesto/BRManifesto.pdf) reads, in essence, like this:

- **Data belongs to the organization, not the application.** Today we call this the Bounded Context.
- **Rules and constraints should be stored and enforced in one central place** — the database or a rules engine — not scattered and repeated across individual applications. Today we call that central place the Domain Model.
- **Rules should be declarative**, close to natural language, accessible to business people rather than buried in imperative code. Today we call those people Domain Experts, and that language Ubiquitous.
- **Manage business rules, not hardware and software platforms.** Today we call the platforms Implementation Details.

Does this sound familiar? It should. Every one of these ideas survived and is considered a virtue today. DDD did not defeat this philosophy — it renamed it, and moved the enforcement out of the one engine that could enforce it.

And this was not some fringe. Gartner promoted it under the catchy motto "change the rules, not the code" and labeled it "hot." There were conferences, workshops, a boom of BRMS and low-code startups; even Oracle and IBM built rule engines of their own.

Then it died. The dot-com crash wiped out the startups — but startups die in every crash, and ideas usually survive. This one didn't, and the reasons deserve an honest look, because they were not invented:

**Vendor lock-in was real.** Database-centric in 2000 effectively meant Oracle, SQL Server, or DB2 — commercial engines with license bills that could bend a budget. Put your business rules in PL/SQL and they become hostages of one vendor's pricing department. PostgreSQL existed, but it was not ready, and free open-source alternatives were not yet a serious option. That fear was rational.

**The tooling gap was real.** The application world was getting source control, automated tests, refactoring IDEs, continuous integration. The database world had a shared development instance, and rules were deployed by running a script — sometimes by hand — with no history and no tests. Nothing about the relational model requires any of that, but that is how it was practiced.

**The DBA bottleneck was real.** Those rules were supposed to be written by a dedicated DBA, and the dedicated DBA sat behind a ticket queue. Agile was winning, teams wanted to ship weekly, and every rule change had to be scheduled with a gatekeeper. Developers lost patience — understandably.

So: a vendor problem, a tooling problem, and a process problem. Now notice what is *not* on that list. Nobody claimed SQL could not express the rules. Expressiveness was never the complaint — declaring rules is precisely what the language is for:

```sql
alter table loans add constraint no_unqualified_approvals
check (not (status = 'approved' and credit_score < 650));

alter table users add constraint users_email_unique unique (email);

alter table users alter column email set not null;
```

The honest verdict would have been: right model, wrong vendors, missing tooling. And the reasonable fix would have been to fix the vendors and the tooling — which, note, the industry eventually did anyway. But that is not the order in which it happened. First came the re-diagnosis: a vendor problem and a tooling problem got written up as a *model* problem. A generation of developers wanted to do OOP — objects were the future, the database was the DBA's turf, and the fastest way out from under the evil vendor and the ticket queue was to demote the whole thing to a storage device and take the rules with them. Evans in 2003, three-tier as the norm, Clean Architecture later to codify it. That is the exodus this whole article has been auditing. It was not analysis. Mostly, it was ignorance with excellent timing.

But rules that leave the database do not stop needing the things the database gave them: one place to live, one enforcer that sees every writer, one source of truth. So the industry spent the next twenty years searching for a replacement address. Centralize the rules in the middle tier — three-tier. The middle tier grows into a monolith of duplicated logic — centralize it in services: SOA. SOA drowns in its own ceremony — decentralize: microservices. Now the rules are scattered and nobody agrees on the state — record every change and replay it: Event Sourcing, currently all the rage. Remember the never-ending parade from the introduction? It is not fashion. It is a search party. To be fair, each architecture had other drivers too — team autonomy, independent deployment, organizational scale; Conway's law is not a myth. But watch what every one of them kept tripping over, release after release — the questions the database had already answered: where do the shared rules live, who enforces them, and what is the source of truth.

And while the search party was out, every objection that killed the Business Rules movement quietly expired. Vendor lock-in? PostgreSQL is free, open source, and runs anywhere — the evil vendor is gone, and nobody is holding your rules hostage. Scaling? Citus, TimescaleDB, a whole family of distributed Postgres-compatible engines. Tooling? Schema migrations live in git next to the application code, a database spins up in a container on every laptop and in every CI run, tests run in a transaction and roll back, and pgTAP is there if you want more. Not as luxurious as C# in a good IDE — I will not pretend otherwise — but "the database can't be versioned or tested" stopped being true years ago.

The grievances died. The verdict outlived them. What remains is the one thing no release note can fix: a generation trained to treat the database as a detail — which is to say, the ignorance outlived its reasons.

## Neward's Options, Twenty Years Later

Time to return to the paper this article is named after, because we owe it an answer. The introduction asked: did we win? Did we even leave?

Here is the part the people who cite "The Vietnam of Computer Science" rarely mention: Neward did not end the paper in despair. He ended it with a list of exits. *"Several possible solutions present themselves to the O/R-M problem,"* he wrote, *"some requiring some kind of 'global' action by the community as a whole, some more approachable to development teams 'in the trenches.'"* Six of them — and he explicitly refused to rank them, calling that *"a value judgment that every developer and development team must make for themselves."*

Twenty years is enough time to check the homework. Let's grade all six.

| # | Neward's exit (2006) | Twenty years later |
|---|---|---|
| 1 | **Abandonment** — *"Developers simply give up on objects entirely"*. He calls it *"distasteful,"* but grants it *"eliminates the problem quite neatly, because if there are no objects, there is no impedance mismatch."* | Never seriously tried. Hold this one — we are coming back to it. |
| 2 | **Wholehearted acceptance** — give up relational storage instead; object stores like db4o, where there is no *"second schema"* | Tried, thoroughly. db4o is gone; the document-store wave of the 2010s was this option at industrial scale; Vernon's 2014 "ideal aggregate store" from the data structures misconception was it again, nearly word for word. The stores that survived grew back schema validation, joins, and transactions — the industry gave up relational storage with great enthusiasm, then quietly asked for most of it back. |
| 3 | **Manual mapping** — write the SQL yourself, materialize the results yourself; Neward even predicted code *"automatically generated by a tool examining database metadata"* | Alive and respectable — every Dapper codebase is option 3. The smallest dose of the disease: still two models, still a copy, but nobody pretends the copy is the authority. |
| 4 | **Acceptance of O/R-M limitations** — use the ORM for *"80% (or 50% or 95%, or whatever percentage seems appropriate)"* of the problem, raw SQL past the hard parts | The one the industry actually chose — EF plus raw SQL for the hard parts, Hibernate plus native queries. The quagmire's official uniform: the escape hatch from the data structures misconception, promoted to policy. |
| 5 | **Integration of relational concepts into languages** — Scala, F#, and, named before it even shipped, *"the LINQ project from Microsoft for C# and Visual Basic"* | Happened, and executed about as well as it will ever be. It proved the diagnosis instead of curing the disease: the algebra ported beautifully, the data never did, and LINQ's most serious application became compiling itself back into SQL. |
| 6 | **Integration of relational concepts into frameworks** — objects holding their data in *"a RowSet (Java) or DataSet (C#) instance"* instead of fields | Anyone remember typed DataSets? Died of unpopularity: it made objects feel like tables, and feeling like tables was precisely what everyone was fleeing. |

Read the right-hand column top to bottom: never tried, collapsed back into relational, honest but still taxed, adopted as the uniform, executed brilliantly to no effect, dead. And Neward even flagged option 4's internal contradiction himself — the raw SQL cannot see the ORM's caches, so the two halves of the data layer can quietly disagree about the state; twenty years of sanding later, that is still exactly how it works. Which leaves exactly one option that was never seriously tried.

Abandonment. The *"distasteful"* one.

And here is what the five misconceptions add to Neward's list — the thing that was genuinely hard to see in 2006: **option 1 is mislabeled.** "Abandonment" implies surrendering something you hold — the rich domain model, custodian of the state, guardian of the invariants. But we have spent five chapters establishing what that domain model actually is: a simulation of the database, impersonating an authority it never possessed. The state was never in the objects. The invariants were never enforced by them. You cannot abandon a post you never occupied. What Neward politely called abandonment is, on inspection, just *acknowledgment* — the decision to stop re-enacting, in memory, work the engine was already doing two feet away, correctly, under ACID, for every process at once.

So why did nobody take that path? Neward's own hesitation is instructive, and it hides in a footnote — footnote 4 of the paper:

> We could, perhaps, consider stored procedure languages like T-SQL or PL/SQL to be "relational" programming languages, but even then, it's extremely difficult to build a UI in PL/SQL.

That's it. That is the entire recorded objection to the relational-first path — fair, practical, and in 2006, completely true. You could put the rules in the database, but you could not put an *application* there, because between the database and the user there was nothing to stand on.

Twenty years later, that footnote has an answer.

## What Remains

Back in the storage misconception, after one `UPDATE` statement swept away the repository, the unit of work, the mapper, and the load-mutate-save dance, I asked what we are left with, and answered: the business logic and business rules. Time to make that concrete — because Neward's footnote deserves a concrete answer, not a slogan.

Start with what changed since 2006. Back then, "UI" meant a desktop toolkit or server-rendered pages — something a general-purpose language had to build, which is why "you can't build a UI in PL/SQL" ended the conversation. Today, nobody builds the UI on the server at all. The UI is the browser, or the mobile app, or — increasingly — an AI agent, and none of them want your objects. They speak JSON over HTTP. The UI problem left the server on its own, for its own reasons, years ago. The only question still standing is: what sits between HTTP and the database?

The orthodox answer: the whole simulation — controller, DTO, service, domain model, repository, mapper. This article has audited every one of those. Delete them and take inventory of what remains:

- **The schema** — the logical model, implemented once (first misconception).
- **Constraints** — the invariants, enforced against every writer (fifth).
- **SQL statements and functions** — the algorithms and use cases (fourth).
- **Transactions** — the real consistency boundaries, drawn per use case, not per object cluster (fifth).

Missing from that inventory: an HTTP endpoint and authentication. Here is the transfer approval from the storage misconception — the exact statement, unchanged — saved as `approve-transfer.sql`, with the missing parts declared the same way everything else in this article has been declared, in four comment lines on top:

```sql
-- HTTP POST
-- @authorize approvers
-- @param $1 _user_id
-- @param $2 _transfer_id
update transfer_approvals
set
  status = case
    when status = 'pending' then 'partly_approved'
    when status = 'partly_approved'
         and approver1 is distinct from $1 then 'fully_approved'
    else status
  end,
  approver1 = case when status = 'pending' then $1 else approver1 end,
  approver2 = case
    when status = 'partly_approved'
         and approver1 is distinct from $1 then $1
    else approver2
  end
where
  transfer_id = $2
  and status in ('pending', 'partly_approved')
returning status;
```

Those four comment lines are the entire remaining application layer. `HTTP POST` plus the file name make the route: `POST /api/approve-transfer`. `@authorize approvers` gates it to authenticated users in the approvers role. `_user_id` is not supplied by the client — it is injected server-side from the authenticated user's claims (one line of configuration), so it cannot be forged. And notice what did not change: the statement. It was already the whole use case back in the storage misconception; it only needed an address. No function was created, nothing was deployed to the database, no migration ran — this is a text file, living in git, reviewed like any other code, and checked against the live schema at startup, so a misspelled column fails the boot, not the 3 a.m. request. One HTTP call, one statement, one transaction. The invariants enforced where they bind, nothing loaded, nothing mapped, nothing simulated.

And when a rule earns a permanent home inside the database — callable from other SQL, versioned with your migrations, running `security definer` — wrap the same statement in a function and move the same annotations into the function's comment; both sources speak one vocabulary:

```sql
comment on function approve_transfer(bigint, text) is '
HTTP POST
@authorize approvers';
```

The annotation dialect in these examples is [NpgsqlRest](/) — the tool this site documents, so consider this the one and only plug — but the tool is not the point. PostgREST has served REST straight from Postgres for a decade; Hasura does GraphQL from the same idea. The point is the shape: the database is the application, and a thin, generated HTTP layer is how it faces the world.

Four honest boundaries, so nobody builds a strawman out of this chapter either. First, this is about RDBMS-backed business systems — the subject of this entire article. The game scene and the compiler from the first misconception keep their objects; systems whose state genuinely lives in memory are exactly what OOP is for, and pure computation over values you were genuinely given belongs in application languages. Second, the tooling is still less luxurious than C# in a good IDE — the history chapter conceded it, and writing this chapter from the database's side does not un-concede it. Migrations in git, databases in containers, tests that roll back: manageable, not luxurious. Third, the skills bill is real. This shape asks a team to read and write SQL as a first language, not a last resort — to think in sets, not loops — the history chapter located the barrier in culture, and choosing this architecture is choosing to pay that bill. And fourth, one relational core is not every system. If you genuinely outgrow it — multiple stores, multiple services, data that must live in different places — then sagas, eventual consistency, and the rest of the distributed toolbox stop being ceremony and start earning their keep. The pathology this article describes is narrower and far more common: importing that machinery into a system whose entire state fits in one database — paying the distributed tax without being distributed, to route around a transaction that was already there.

"It's extremely difficult to build a UI in PL/SQL." True then, true now — and beside the point. Nobody builds the UI in the database. The UI lives in the browser, the rules live in the database, and a few lines of declarations connect them. Footnote 4: answered.

## The Divorce Papers

The introduction asked whether the shotgun marriage between objects and relations needs divorce papers. Five misconceptions later, the honest answer is: no — because a divorce presumes a marriage between two parties, and there was only ever one. One side had the state, the storage abstraction, the algebra, the algorithms, and the enforcement, all along. The other side was its in-memory impersonator. You do not divorce an impersonator. You file for annulment: a recognition that the marriage never actually took place. Twenty years of couples therapy — the patterns, the summits, the frameworks — was therapy with an actor.

Did we win? There was nothing to win. Did we leave? We never had to be there. Neward himself put that option on the table when he reminded us that among the available responses to a looming quagmire is *"none at all."* The quagmire was elective — at every step, from the very first mapping file.

So call off the search party. The parade of architectures spent twenty years looking for a place where the shared rules could live, an enforcer that binds, a source of truth — and the answer was stationary the whole time: two feet away, under ACID, patiently holding everyone's state while we held meetings about it.

Neward closed his paper with Odysseus: *"Lash yourself to the mast if you wish to hear the song, but let the sailors row."* For twenty years we took the advice — tied to the mast, listening to the Siren song of one more pattern, one more mapper, one more architecture that would finally make the copy behave like the original. There was a simpler option the whole time, and it requires no rope: stop sailing toward the rocks.

The database was never the enemy shore. It was home port.

