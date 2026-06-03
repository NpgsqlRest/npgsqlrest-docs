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

![](https://img.shields.io/badge/Human-Written-blue)
![](https://img.shields.io/badge/DRAFT-orange)

## Introduction

It has been twenty years since Ted Neward published ["The Vietnam of Computer Science"](https://www.odbms.org/wp-content/uploads/2013/11/031.01-Neward-The-Vietnam-of-Computer-Science-June-2006.pdf). Twenty years.

Did we win? Did we even leave? Are we stuck in a quagmire?

Since then, the industry has marched relentlessly through a never-ending parade of patterns, architectures, and methodologies: ORM tools of every flavor, Repository and Unit of Work patterns, Domain-Driven Design, CQRS, Event Sourcing (currently all the rage), Hexagonal Architecture, Clean Architecture, Onion Architecture, Service-Oriented Architecture (now obsolete and so last year), Microservices, and on and on.

The quagmire Neward described is, of course, Object-Relational Impedance Mismatch. So to speak, a shotgun marriage between Object and Relational worlds. One lives in your application memory and works over data structures, and the other, well, in a relational database.

And none of these patterns above made the problem go away. We need both, and somehow the majority of the effort goes into deailing with persistence in one way or another. It's like unsuccessful couples therapy for that shotgun marriage. Maybe we need divorce papers?

Let's dig in deep.

## What Is The Object–Relational Impedance Mismatch

According to Wikipedia (link: https://en.wikipedia.org/wiki/Object%E2%80%93relational_impedance_mismatch):

> Object–relational impedance mismatch is a **set of difficulties** going between data in relational data stores and data in domain-driven object models.

Ok, got it. A set of difficulties. Difficulties that refuse to go away, it seems, but fine.

It's worth noting that Object–Relational isn't the only mismatch on the menu. OO isn't the only way we work over application memory — functional programming is on the rise too, so there's a Functional–Relational mismatch as well. To be fair, FP gets along with relational better than OO does: SQL is already declarative, set-based, and value-oriented, right up FP's alley. But it still works over application memory, so it still has to bridge to the relational database like everyone else.

Anyway...

> Relational Database Management Systems (RDBMS) is the standard method for storing data in a dedicated database, while object-oriented (OO) programming is the default method for business-centric design in programming languages.

RDBMS is the standard method for storing data in a dedicated database, but are they typically doing only data storage? I mean, files are also doing that, are they not? Are we missing something here?

And this second claim that object-oriented (OO) programming is the default method for business-centric design, that might be true, but SQL is the default method for anything business data-related, like the way organizations store, manage, protect, and analyze their data.

We can see the tension already here, but let's move on.

> The problem lies in neither relational databases nor OO programming, but in the conceptual difficulty mapping between the **two logic models**. **Both logical models** are differently implementable using database servers, programming languages, design patterns, or other technologies.

Now, why would they say that we have two logical models?

Take a Customer. In your business, a customer is one thing — one concept. DDD even has a name for this: within a bounded context there is one ubiquitous language, so there is one shared notion of what a Customer is. That single concept becomes one logical model — what a Customer is, which attributes it has, how it relates to orders — with no implementation details attached. That's why it's called a *logical* model.

Then you build it. And here is where it splits: that one logical model gets implemented physically more than once. Once as a table — `customer`, with a `varchar(255)` name column. Once as a class — `Customer`, with a `string Name` property. Same concept, same logical model, two physical incarnations.

So in modern software design we are not talking about two different logical models, as Wikipedia claims. We have one logical model and two — sometimes more — physical models. Modern overengineering knows no bounds.

The reason why they say that we have two logical models is probably because OO and Relational are seen as totally different paradigms so the logical models must be genuinely different. For example OO does have behavior, but the problem is that we are talking strictly about data here, not behavior. Behavior is a different problem axis - we'll come to it when we get to algorithms.

In any case, impedance mismatch is not about two different logical models, but about the mismatch between those two physical models. Your system has to map them and make them work together because, logically, we still have one logical model and the system needs to reflect that. That’s the real problem and source of tension.

> Issues range from application to enterprise scale, whenever stored relational data is used in domain-driven object models, and vice versa. Object-oriented data stores can trade this problem for other implementation difficulties.

This last sentence just confirms what I just said. Whenever stored relational data (one physical model) is used in domain-driven object models (another physical model), we have this problem or mismatch. Maybe the belief that we are talking about two different logical models is the reason why these difficulties exist and persist and are not being resolved. If it was just a simple mapping, let's say from `varchar(255)` to a `string`, that would be easy to solve a long time ago. Or something a bit more complex, let's say many-to-many on a logical model level. In a relational model, that requires a junction table, but in an object model that can be just a collection of references. Still, a little bit more complex mapping, but still solvable and indeed already solved.

My sincere belief is that we are talking here about a series of misconceptions and misunderstandings about the nature of abstractions themselves. More specifically, about abstractions the RDBMS already provides. And if RDBMS already provides them, well, that means that the application layer goes on and re-implements them anyway. No wonder we have difficulties. Let's look at these misconceptions one by one and discuss in detail:

1. **State Data** Abstraction Misconception

2. **Storage Devices** Abstraction Misconception

3. **Data Structures** Abstraction Misconception

4. Abstraction Over **Algorithms**

5. Abstraction Over **Concurrency and Integrity**

## 1) State Data Abstraction Misconception

### The Claim

Object-oriented programming has one of its core tenets called **encapsulation**. Encapsulation is supposed to protect internal data — **the state**. The object is the authoritative custodian of its state. Nobody else has it. Period. Without encapsulation, we don't really have OOP anymore.

On the other hand, functional programming has its own version of that — **state immutability**. A function takes values in and returns new values out, leaving the originals untouched — so there's no shared mutable state to corrupt in the first place. FP also enforces valid state through invariants, often by encoding them directly into the type system. Same goal, fewer bugs from uncontrolled state, arguably reached more elegantly. Fine. State status - protected, bugs - reduced. Great, beautiful, love it.

This, in fact, is very reasonable and well-thought-out. State data is data shared between different parts of the system and even different users. If every part of the system can poke at it without other parts knowing about it, then you have a lot of bugs. So, naturally, over time people came up with these concepts of encapsulation and immutability to protect that state and make sure it is only changed and fiddled with in a controlled way. Because we don't want to have bugs. Bugs are bad, okay.

No objection here. This is perfectly fine, and it makes a lot of sense. Let's say we have something complex. A game scene. Compiler syntax tree. Whatever. Protecting state in memory of such systems is invaluable, to say at least. 

In his book Domain-Driven Design (2004), when describing the Domain Layer in Chapter 4, "Isolating the Domain," Eric Evans writes:

> State that reflects the business situation is controlled and used here, even though the technical details of storing it are delegated to the infrastructure.

So he treats the in-memory object as the custodian of state - state that is "controlled and used here," where "here" is the in-memory Domain Layer — while the RDBMS is merely "delegated to the infrastructure." More on that in the next chapter. What matters here is the claim itself: the state is in memory. No doubt about it.

### The Reality

But what about applications backed by relational databases, business or otherwise? 

In RDBMS-backed applications, the state lives in that RDBMS itself - not in memory. The authoritative custodian of state is the **database table row**, not the in-memory object. 

Take any business application backed by a relational database. How do you check the current state of some entity? Do you peek at the object in memory? No, you query the database for that. Anyone who has worked 5 seconds in industry knows this, of course.

I know what DDD people will say now: object memory (or functional state memory) is the real state data, and RDBMS is just where that data is persisted (presumably when the user clicks on a "Save" icon).

And, if you still believe that objects/memory are the real state and not RDBMS, then riddle me this:

What if we have multiple instances of the application running behind a load balancer? And then maybe some background work as well, and some other services too. Maybe reporting replica as well, so we have multiple processes accessing the same state data. Who is the sole custodian of that state data in that case? The in-memory object of one process, or the database row? The obvious answer is, of course, NONE of the in-memory copies. The best we can do is to have each process hold a copy, while the real state is in the RDBMS itself.

I know what some may say now, but databases have multiplicity too, right? We have multiple replicas, and they are all copies of the same data. And there are also multi-master setups as well with multiple writers for high availability scenarios. Yeah, but the big difference is that the database solves it, while in-memory objects dosn't even try to be honest. They just deny the reality. For multiple replicas, there is never any ambiguity about which one is the source of truth, since we are talking about read-only copies, and for multi-master setups we have either different consensus protocols that ensure a single source of truth or so-called eventual-consistency for the source of truth. In-memory objects have no such machinery, so they just pretend that they are the single custodian of the state data, which is, of course, a big, fat lie.

Also, if the object is the custodian of state, what if we kill and restart the application? Oh my, the object's custodianship has evaporated.

Also, what, for example, if we have two concurrent user writers? One loads an invoice as 'pending', but another writer marks it 'paid' while the first one holds it. Now the first one is lying about the state of that invoice. The database is right - it is the source of truth - the first one is stale. We will talk more about concurrency and integrity later - this is just to prove my point:

RDBMS is the authoritative custodian of state, not in-memory objects. The state lives in the database, not in memory.

### The Cost

Take a look at this example of a DDD-style domain model below:

<figure style="margin: 0; text-align: center;">
  <img src="/ddd-agggrate-transparent.webp" alt="" style="display: block; width: 50%; max-width: 100%; height: auto; margin: 0 auto;" />
  <figcaption style="font-size: 0.8em; color: #888; margin-top: 0.5em;">
    Source credit: <a href="https://www.reddit.com/r/DomainDrivenDesign/comments/1ttzr19/create_complex_and_deep_aggregate/">https://www.reddit.com/r/DomainDrivenDesign/comments/1ttzr19/create_complex_and_deep_aggregate/</a>
  </figcaption>
</figure>

This is a random example from Reddit, but it is indicative. Virtually every domain model is more or less like that - strip away the method, adjust types a bit, and it is basically an Entity-Relationship (ER) diagram, that's it. There is no structural difference between the domain model and the database model. It is the same logical model implemented twice. 

And that method `isValid()` - the only behavior in the whole model - is just a data integrity check. Every rule it enforces, the database enforces too: `dateBegin <= dateEnd` is a one-line `CHECK`, and the harder ones —- price periods that must not overlap, quantity ranges that must stay contiguous — are exactly what database constraints exist for (more on the how in the integrity misconception). Same logical model implemented twice, same integrity rules implemented twice.

Because modern software design orthodoxy refuses to acknowledge that the state lives in the RDBMS, it forces us to implement the same model at least twice - once in the database (relational model implementation), once in memory (object model implementation, mapped usually with an O/R tool or a library). 

I say at least, because there are examples where we have even more. Some "architects" will consider that O/R mapped model a persistence model because it doesn't have any behavior, and then they will add a separate domain model on top of that, which is the one with the behavior. So we have three implementations of the same logical model - database model, persistence model, and domain model.

And then, since we now have at least two physical models, we also have two type systems and two sets of constraints to protect the state. And we must keep them in sync at all times, and we must maintain the correct mapping. To be fair, this is mostly automated in modern systems (not completely), but we still have to do it and it is still there, automated or not. And even automated, it is still a cost and still a source of bugs and still a source of complexity. And even that can't bridge the semantic gap between the two type systems fully. For example, in PostgreSQL we can have a `NOT NULL` constraint on a column, but the corresponding C# property will be a nullable string. 

All because we believe that there is some important state data we need to protect with our objects. In the best case, there are just some transient and disposable chunks of data copies, and in any case there is a lot of plumbing to manage: connections, transactions, commands, queries, etc. You know, the actual infrastructure.

Personally, I see a lot of irony in this. Modern orthodoxy calls RDBMS infrastructure, just to end up with code bases implementing, well, actual infrastructure.

## 2) Storage Devices Abstraction Misconception

### The Claim

A modern software engineering approach makes the assumption that an RDBMS is a storage device. A device used to store data. Therefore, good engineering practice is to abstract that storage device.

We can see that in the quote from Eric Evans above, where he says that: 

> ... the technical details of storing it are delegated to the infrastructure.

Evans doesn't dwell on this point much - he just delegates storage to the infrastructure and moves on. On the other hand, Robert C. Martin is much more vocal about it. In *Clean Architecture*, Martin dedicates an entire chapter to "The Database Is a Detail" argument. He is very blunt about it, and he repeats it several times, for example:

> It's just a mechanism we use to move the data back and forth between the surface of the disk and the RAM.

Or this:

> The database is really nothing more than a big bucket of bits where we store our data on a long-term basis.

This is not some fringe blog post. These are two of the most-cited and influential authors in the field - arriving at one and the **same conclusion** - just at different volumes. 

Evans states it just once and quietly, like he doesn't want to talk about it too much, and then delegates it away (perhaps he'd rather not have you examine it too closely, I don't know). Martin states it over and over, bluntly, and goes as far as to insist we should not even acknowledge that the disk exists. 

Different approaches - identical claims: the **database is a storage device**. Storage is mechanical, it sits beneath the business — no different from a file system — and the architect's job is to wrap it up tight and forget it is there.

### The Reality

Reality is that RDBMS uses a storage device or devices, and that means that it already does this abstraction for you. It already abstracts storage. 

If we go back to the beginning, when Edgar Codd introduced the relational model in 1970, the pitch was *data independence* — the whole point was to insulate the logical shape of your data from how it physically sits on a device. In fact, that is the core concept of the relational model. It was codified as the numbered Rule 8 fifteen years later in [Edgar Codd's twelve rules](https://en.wikipedia.org/wiki/Codd%27s_12_rules): **Rule 8: Physical data independence**:

> Application programs and terminal activities remain logically unimpaired whenever any changes are made in either storage representations or access methods.

The ANSI/SPARC Architecture from that era formalized it and walled off internal storage as well. So, the relational model was designed, from day one, to hide the disk.

Back to modern times and modern RDBMS implementations. 

Riddle me this: We can write a `SELECT`, a `JOIN`, a `WHERE`, and even a an `INSERT`, `UPDATE`, or `DELETE`, and in most cases it will be executed with the same results on different RDBMS engines from different vendors. That is called ANSI/ISO standardized SQL, which goes to show the real separation between the model and the physical implementation. Virtually every RDBMS implements the same ANSI/ISO SQL standard, but with dialect differences at the edges. Those differences can sometimes be significant, but the core of the language is the same, and that is what matters here. The same `SELECT` statement can run on MySQL, PostgreSQL, SQL Server, Oracle, and so on, given that you have the same logical model implemented in each of them.

But the abstraction doesn't stop at the SQL language. The relational model and the RDBMS implementations built on top of it are designed to be agnostic to the underlying storage device. For example:

- In PostgreSQL, we can move any table to any **different storage device** we choose (they call it a tablespace), and the model above remains unchanged. Just use `ALTER TABLE ... SET TABLESPACE` — the table is now on a different physical device. The term `TABLESPACE` is Oracle's term for the same thing (switching table storage), and SQL Server has something called `FILEGROUPS`. Same `SELECT`, same result, different storage, no changes, no fuss.

- You can change the actual byte format in storage. In PostgreSQL, the **table access method is pluggable** (Citus columnar, TimescaleDB). SQL Server flips a table from rows to columns with a clustered columnstore index. Oracle does it with Hybrid Columnar Compression, or stores the whole table inside a B-tree as an index-organized table instead of a heap. Same logical table, same query — completely different bytes on disk.

- In MySQL you can **swap the storage engine** out from under a table entirely: `ALTER TABLE t ENGINE=...` moves a table between InnoDB (B-trees on disk), MyISAM, Archive (compressed), CSV (a literal text file), or MEMORY (pure RAM). One table, one query, completely different machinery underneath.

- The data doesn't even have to be in local storage at all. In PostgreSQL, make it a `FOREIGN TABLE` over an FDW (Foreign Data Wrappers) and the rows live happily on **another machine entirely** — the query doesn't even care or know. Oracle reads flat files as external tables; DuckDB queries Parquet files on disk as if they were tables. The data is somewhere else, on a remote machine - SQL is the same.

- It doesn't even have to be one machine. Hand it to a distributed SQL engine — CockroachDB, TiDB, Spanner — and your data becomes a replicated, sharded key-value store smeared **across a cluster**. You have no idea which node, let alone which disk, holds any given row. CockroachDB speaks Postgres's wire protocol so you can use standard PostgreSQL unchanged, TiDB speaks MySQL's, and you still write ordinary SQL. Or push it to the cloud, where Snowflake keeps everything as columnar micro-partitions in object storage. Same `SELECT`, same result, no fuss.

- And finally — no disk at all. Who says we need disks? Declare a MySQL table `ENGINE=MEMORY`, run PostgreSQL on a `tmpfs` with the **whole data directory in RAM**, switch on SQL Server's In-Memory OLTP, open SQLite as `:memory:`. No persistent storage anywhere. Same query, same result — and the thing is still, unmistakably, a database.

Martin writes: _"To mitigate the time delay imposed by disks, you need indexes..."_. Then why are in-memory databases full of indexes? Why are they (in-memory databases) a thing at all? Because an index was never about the medium - it is about not scanning every row when you want one, be it on disk or in RAM.

As we can see, different devices, different formats, even machines and clusters, or even no machines at all — the same logical model, the same SQL, the same results. The RDBMS already abstracts storage for you. It is designed to do exactly that. Thank you very much, but you are wrong.

### The Cost

Cost is **never ending persistence-ceremony**. We are asked to carefully construct our data models in memory (to maintain the illusion of encapsulation), protect it from illogical and unwanted changes, and then save it to the database (persist it) when the time is right. 

It is hard to overstate how big this persistence-ceremony thing really is. The number of specialized patterns, libraries, countless tutorials, videos, entire philosophies, strategies, etc. But take a look at this trivial example: 

This is a simple SQL statement to update a transfer approval - two people must sign off, they must be different people, and the status moves from pending to partly to fully approved. In a traditional codebase this would be a considerable chunk of code spanning multiple files and doing several database calls, just to maintain the illusion.

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

The entire pile of code which is now gone with this move is the following:

- the entity / aggregate class (the in-memory model)
- the repository (to fetch it and put it back)
- the unit-of-work / change tracker (to know which fields are dirty)
- the O/R mapping config (to translate object <-> row)
- the load → mutate-in-memory → save dance
- the surrounding transaction scope

Every one of those exists for one reason only: to carry state from memory to storage and back. Remove that belief, and every one of those big code blocks removes itself.

Now, I can already hear the cries. What about maintainability? What about testability? What about scaling? What about separation of concerns? Will somebody *please* think of the children?

Ive been debunking those objections for a decades, but let's do it again:

**Maintainability.** Less code is less to maintain - just look at that declarations, you can read this one like a book. And this will live in *one place*. Compare that to the entitiy class (or is that structs, records, habe no idea), then the repository of course, the mapping config, and so on. Here just one statement. And, one place.

**Testability.** "Logic in SQL can't be tested" is simply false, no other way to put it. There are many ways to do it, from specialized tools like pgTAP to containers or specialized techqineus like transactional rollbacks (my favorite), template databases, and so on. This is broeader subject and desreves an article, but point is yes, it is very much doable. And the biggest win is that you test the actual database, not in-memory fake or mock. You test the truth, not a stand-in.

**Scaling.** This is the one people are most sure about, and most wrong about. Putting the logic in SQL does not *add* work - the orthodox version runs the exact same logic, it just drags every row across the network into application memory to do it there, then drags the result back. You did not invent that CPU cost by writing `case when`; it was always going to be spent. What you removed was the round-trip and the serialization. And those few branches run right next to the data, on the same machinery - indexes, planner, buffer cache - that the engine already optimizes obsessively. The handful of `case` evaluations is a rounding error next to the work the engine is doing anyway, and it is nothing next to the network latency you just deleted.

So - maintainability, testability, scaling. Handled. The children are fine.

And we are right back where we started: strip away the storage and the persistence ceremony the engine already handles for you, and what are you actually left with? That's right - the business logic and business rules. Nothing else. No plumbing, no persistence layer, no storage, no nothing. Just the business rules.

## 3) Data Structures Abstraction Misconception

### The Claim

### The Reality

### The Cost

## 4) Abstraction Over Algorithms

### The Claim

### The Reality

### The Cost

## 5) Abstraction Over Concurrency and Integrity

### The Claim

### The Reality

### The Cost

<!-- ## The Good Parts

## How The Hell We Got Here

## Current State of Affairs

## My Solution

## Conclusion -->