---
layout: doc
outline: [2, 3]
title: "Custom Types and Multiset for Nested JSON in PostgreSQL REST APIs"
date: "2025-08-24"
titleTemplate: NpgsqlRest
description: "Learn how to use PostgreSQL custom types and table types in REST APIs. Return nested JSON structures, use composite types as parameters, and build hierarchical responses with NpgsqlRest."
head:
  - - meta
    - name: keywords
      content: postgresql custom types, composite types rest api, nested json postgresql, table types api, npgsqlrest nested, postgresql array types, hierarchical json response, postgresql type system
  - - meta
    - property: og:title
      content: "Custom Types and Multiset for Nested JSON in PostgreSQL REST APIs"
  - - meta
    - property: og:description
      content: "Learn how to use PostgreSQL custom types and table types in REST APIs. Return nested JSON structures with NpgsqlRest."
  - - meta
    - property: og:type
      content: article
  - - meta
    - name: twitter:card
      content: summary_large_image
  - - meta
    - name: twitter:title
      content: "Custom Types and Multiset for Nested JSON in PostgreSQL REST APIs"
  - - meta
    - name: twitter:description
      content: "Use PostgreSQL custom types to build hierarchical REST API responses with automatic TypeScript generation."
---

# Custom Types and Multiset for Nested JSON in PostgreSQL REST APIs

<p class="blog-meta">
<span class="tag">PostgreSQL</span> · <span class="tag">Custom Types</span> · <span class="tag">Multiset</span> · <span class="tag">Nested JSON</span> · <span class="tag">January 2026</span>
</p>

---

There have been some exciting new features added to NpgsqlRest lately, and I wanted to share them personally, so this post will be human-written. 

Those features revolve mainly around usage of custom types in PostgreSQL, including composite types and table types and their support in TypeScript code generation. 

Custom types were supported from the beginning, but now, this support has been greatly expanded.

So let's do a quick overview of custom types and how they can help us building better APIs.

## Example Setup

> **Source Code For This Example**: [github.com/NpgsqlRest/npgsqlrest-docs/examples/7_csv_excel_uploads](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/7_csv_excel_uploads)

Databa schema for this example is fairly simple, we have `authors` and `books` tables with a one-to-many relationship (one author can have many books). There is also a `reviews` table that holds reviews for books. Source code (schema omitted here for brevity) can be found in the example folder:


```sql
create table authors (
    author_id int not null generated always as identity primary key,
    first_name text,
    last_name text
);

create table books (
    book_id int not null generated always as identity primary key,
    title text not null,
    author_id int references authors(author_id)
);

create table reviews (
    review_id int not null generated always as identity primary key,
    book_id int references books(book_id),
    reviewer_name text,
    rating int check (rating between 1 and 5),
    review_text text,
    created_at timestamp default now()
);

-- Test data for authors
insert into authors (first_name, last_name) values
    ('George', 'Orwell'),
    ('Jane', 'Austen'),
    ('Ernest', 'Hemingway'),
    ('Virginia', 'Woolf'),
    ('Franz', 'Kafka');

-- Test data for books
insert into books (title, author_id) values
    ('1984', 1),
    ('Animal Farm', 1),
    ('Pride and Prejudice', 2),
    ('Sense and Sensibility', 2),
    ('The Old Man and the Sea', 3),
    ('A Farewell to Arms', 3),
    ('Mrs Dalloway', 4),
    ('To the Lighthouse', 4),
    ('The Metamorphosis', 5),
    ('The Trial', 5);

-- Test data for reviews
insert into reviews (book_id, reviewer_name, rating, review_text) values
    (1, 'Alice Johnson', 5, 'A chilling and prophetic masterpiece.'),
    (1, 'Bob Smith', 4, 'Thought-provoking but bleak.'),
    (1, 'Carol White', 5, 'Essential reading for everyone.'),
    (2, 'David Brown', 5, 'Brilliant political allegory.'),
    (2, 'Eve Davis', 4, 'Simple yet profound.'),
    (3, 'Frank Miller', 5, 'The perfect romance novel.'),
    (3, 'Grace Lee', 5, 'Witty and timeless.'),
    (4, 'Henry Wilson', 4, 'Austen at her finest.'),
    (5, 'Ivy Chen', 5, 'Beautiful and moving.'),
    (5, 'Jack Taylor', 4, 'A short but powerful read.'),
    (6, 'Karen Adams', 4, 'Hemingway''s prose shines.'),
    (7, 'Leo Garcia', 5, 'Stream of consciousness done right.'),
    (8, 'Mia Robinson', 4, 'Poetic and haunting.'),
    (9, 'Noah Martinez', 5, 'Surreal and unforgettable.'),
    (9, 'Olivia Clark', 3, 'Disturbing but brilliant.'),
    (10, 'Paul Wright', 4, 'Kafka at his most absurd.');
```

## Returning Single Object

Common usage of custom types is to return a single object with multiple fields.

```sql
/*
* Get author by ID or all authors if ID is null and return author object from table type
*/
create function get_author(
    _author_id int
)
returns authors
language sql
begin atomic;
select author_id, first_name, last_name
from authors
where author_id = _author_id;
end;
comment on function get_author(int) is 'HTTP GET';
```

The entire client code for .http file and TypeScript with generated types is automatically generated when we run NpgsqlRest with development configuration (check the example on GitHub). 

And when we call `/api/example-12/get-author?authorId=1` we get the following response:

```json
{
  "authorId": 1,
  "firstName": "George",
  "lastName": "Orwell"
}
```

As we can see, the function returns a single `authors` type object. Of course, that is a table type, we can also define our own composite types if needed. For example:

```sql
create type author_info as (
    first_name text,
    last_name text,
    books int
);

/*
* Get author info by ID and return custom type with additional info
*/
create function get_author_info(
    _author_id int
)
returns author_info
language sql
begin atomic;
select first_name, last_name, count(b.*)
from authors a
left join books b using (author_id)
where author_id = _author_id
group by author_id, first_name, last_name;
end;
comment on function .get_author_info(int) is 'HTTP GET';
```

Calling `/api/example-12/get-author-info?authorId=1` now returns:

```json
{
  "firstName": "George",
  "lastName": "Orwell",
  "books": 2
}
```

This shows how we can use custom composite types to return simple JSON objects with specific fields. These types can also be reused across multiple functions and even as parameters as we will see next.

## Using Custom Types as Parameters

For example, we can reuse entire `authors` table type as a parameter to insert a new author:

```sql
/*
* Create author by passing author object as parameter to function.
* Demonstrates passing custom type as parameter to function. It can be user-defined type or table type.
* Type fields are unnested into individual parameters: authorFirstName, authorLastName
*/
create function create_author(
    _author authors
)
returns authors
language sql
begin atomic;
insert into authors (first_name, last_name)
values (_author.first_name,  _author.last_name)
returning author_id, first_name, last_name;
end;
comment on function create_author(authors) is 'HTTP POST'; 
```

We now have generated .http test call (along with TypeScript client code and types) that looks like this:

```http
// function create_author(
//     _author_author_id integer,
//     _author_first_name text,
//     _author_last_name text
// )
// returns record
//
// comment on function create_author is 'HTTP POST
POST {host}/api/example-12/create-author
content-type: application/json

{
    "authorAuthorId": 1,
    "authorFirstName": "XYZ",
    "authorLastName": "IJK"
}
```

And when we call this endpoint with the above body, we get the following response:

```json
{
  "authorId": 6,
  "firstName": "XYZ",
  "lastName": "IJK"
}
```

You may notice that parameter names are prefixed with the type name (`authorAuthorId`, `authorFirstName`, etc). This is because custom type fields are expanded and merged with normal parameters. 

The prefix avoids name collisions when multiple custom types are used as parameters in the same function. The separator between the type name and field name can be customized using the `CustomTypeParameterSeparator` setting in [Routine Options](/config/routine-options).

If, for example, we would add two more parameters to the above function:

```sql
create function create_author(
    _param1 text,
    _author authors,
    _param2 int
)
...
```

The generated parameter names would be: `param1`, `authorAuthorId`, `authorFirstName`, `authorLastName` and `param2`.

This is simple and effective way to share same types across multiple functions easily, either as return types or parameter types.

## Returning Sets of Objects

The most common usage of custom types is to return sets of objects, for example, returning all books for an author:

```sql
/*
* Get author by ID or all authors if ID is null and return author object from table type
*/
create function get_authors(
    _author_id int
)
returns setof authors
language sql
begin atomic;
select author_id, first_name, last_name
from authors
where
    _author_id is null or author_id = _author_id;
end;
comment on function get_authors(int) is 'HTTP GET';
```

Calling `/api/example-12/get-authors` now returns as expected a list of authors:

```json
[
  {
    "authorId": 1,
    "firstName": "George",
    "lastName": "Orwell"
  },
  {
    "authorId": 2,
    "firstName": "Jane",
    "lastName": "Austen"
  },
  ...
]
```

That is all fine, but in real-world scenarios, we rarely want to return the exact table structure. Those are our entities, meant to be part of the data model, we want to return something more tailored to the API consumer needs.

For example, we may want to return authors along with, for example, number of books they have written, then we may do something like this:

```sql
create function get_authors_with_details(
    _author_id int
)
returns table(
    author authors,
    books int
)
language sql
begin atomic;
select
    row(a.author_id, first_name, last_name),
    count(b.*)
from authors a join books b using (author_id)
where
    _author_id is null or author_id = _author_id
group by
    a.author_id, first_name, last_name;
end;
comment on function get_authors_with_details(int) is 'HTTP GET';
```

When we return a table type with multiple columns, NpgsqlRest will merge all columns, including custom types, into a single JSON object per row. The response for `/api/example-12/get-authors-with-details` now looks like this:

```json
[
  {
    "authorId": 1,
    "firstName": "George",
    "lastName": "Orwell",
    "books": 2
  },
  {
    "authorId": 2,
    "firstName": "Jane",
    "lastName": "Austen",
    "books": 2
  },
  ...
]
```

As we can see, the `author` custom type fields are merged into the main object, resulting in a flat structure that is easy to consume.

But we are not limited to table types, we can comibine multiple custom types, including user defined types as well:

```sql
-- Define a custom type to hold book statistics
create type books_info as (
    books int,
    active_reviews int,
    avg_rating numeric
);

create function get_authors_with_details_type(
    _author_id int
)
returns table(
    author authors,
    books_info books_info
)
language sql
begin atomic;
select
    row(a.author_id, a.first_name, a.last_name),
    (count(distinct b.book_id), count(r.review_id), avg(r.rating))
from
    authors a
    left join books b using (author_id)
    left join reviews r on b.book_id = r.book_id
where
    _author_id is null or author_id = _author_id
group by
    a.author_id, first_name, last_name;
end;
comment on function get_authors_with_details_type(int) is '
HTTP GET
';
```

As we can see, we are returning two custom types now, table type `authors` and custom type `books_info`. Note on implementation and casting types:

- We are using usage of `row(...)` constructor to create a table row that matches the `authors` type.
- We are using tuple syntax `(count(...), count(...), avg(...))` to create a composite type that matches the `books_info` type. In this case, no explicit casting is needed as PostgreSQL can infer the type from the return type declaration.


Resulting JSON for `/api/example-12/get-authors-with-details-type` now looks like this:

```json
[
  {
    "authorId": 1,
    "firstName": "George",
    "lastName": "Orwell",
    "books": 2,
    "activeReviews": 5,
    "avgRating": 4.6000000000000000
  },
  {
    "authorId": 2,
    "firstName": "Jane",
    "lastName": "Austen",
    "books": 2,
    "activeReviews": 3,
    "avgRating": 4.6666666666666667
  },
  ...
]
```

So, this is a powerful way to build tailored API responses using custom types, while keeping the database functions clean and reusable. There is one more piece.

## NEW: Nested JSON Objects

Starting from NpgsqlRest 3.4.0, we can now nest custom types within the JSON response, instead of merging all fields into a flat structure.

This is opt-in behavior to keep backward compatibility, and we can enable it either globally for all routines, or per-routine basis.

- To enable globally, we can set the `NestedJsonForCompositeTypes` option in the global [Routine Options](/config/routine-options):

```json
{
  "NpgsqlRest": {
      "RoutineOptions": {
        "NestedJsonForCompositeTypes": true
    }
  }
}
```

- To enable per-routine basis, we can use the [`@nested` annotation](/annotations/nested) in the function comment:

```sql
comment on function get_authors_with_details_type(int) is '
HTTP GET
@nested
';
```

And when we enable this feature, the response for `/api/example-12/get-authors-with-details` now looks like this:

```json
[
  {
    "author": {
      "authorId": 1,
      "firstName": "George",
      "lastName": "Orwell"
    },
    "books": 2
  },
  {
    "author": {
      "authorId": 2,
      "firstName": "Jane",
      "lastName": "Austen"
    },
    "books": 2
  },
  ...
]
```

And for `/api/example-12/get-authors-with-details-type`:

```json
[
  {
    "author": {
      "authorId": 1,
      "firstName": "George",
      "lastName": "Orwell"
    },
    "booksInfo": {
      "books": 2,
      "activeReviews": 5,
      "avgRating": 4.6000000000000000
    }
  },
  {
    "author": {
      "authorId": 2,
      "firstName": "Jane",
      "lastName": "Austen"
    },
    "booksInfo": {
      "books": 2,
      "activeReviews": 3,
      "avgRating": 4.6666666666666667
    }
  },
  ...
]
```

As we can see, the custom types are now nested within their own JSON objects, preserving the structure defined in the database function. And the best part is that TypeScript types are also generated accordingly, so we get proper type safety when consuming these APIs.

But, wait, there is even more!

## NEW: Nested JSON with Multiset

Starting from NpgsqlRest 3.4.0, we can now return nested JSON arrays (multisets) using custom types.

But, first, what is the Multiset?

In scenmarios when we are returning joined datasets with one-to-many relationships, such as authors and their books for example, typical SQL join query would return a flat result set with repeated author information for each book.

For example, consider the following simple query:

```sql
select * from authors join books using (author_id)
```

| author_id | first_name | last_name | book_id | title                 |
|-----------|------------|-----------|---------|----------------------|
| 1         | George     | Orwell    | 1       | 1984                 |
| 1         | George     | Orwell    | 2       | Animal Farm          |
| 2         | Jane       | Austen    | 3       | Pride and Prejudice  |
| 2         | Jane       | Austen    | 4       | Sense and Sensibility |

As we can see, author information is repeated for each book. Now imageine this query for thousands of authors and books, the result set would be huge and inefficient to transfer over the network.

And if we would join, for example, author addresses as well to form multiple one-to-many relationships, the result would something called the **Cartesian Explosion**, which a very bad thing, obviously we don't want that in our API.

To solve this problems, database vendors came up with the concept of **Multiset**, which allows us to return hierarchical data structures directly from the database.

Unfortunately, PostgreSQL does not have built-in support and in general, multisets are not widely supported in SQL databases. This is the support matrix from my AI research:

| Database      | Native MULTISET | Workaround              |
|---------------|-----------------|-------------------------|
| Oracle        | ✅ Full         | -                       |
| Informix      | ✅ Full         | -                       |
| PostgreSQL    | ❌              | ARRAY, JSON_AGG         |
| EDB Postgres  | ✅              | Oracle compat mode      |
| SQL Server    | ❌              | FOR JSON/XML            |
| MySQL         | ❌              | JSON_ARRAYAGG           |
| Teradata      | Partial         | SET/MULTISET tables     |

As we can see, we can use array workarounds in PostgreSQL to achieve similar results. And from NpgsqlRest 3.4.0, we can now use this to return nested JSON arrays using custom types. Let's see how that works.

```sql
create function get_authors_and_books(
    _author_id int
)
returns table(
    author authors,
    books books[]
)
language sql
begin atomic;
select
    row(
        a.author_id, first_name, last_name
    ),
    array_agg(
        row(b.book_id, b.title, b.author_id)::books
    )
from
    authors a
    left join books b using (author_id)
where
    _author_id is null or author_id = _author_id
group by
    a.author_id, first_name, last_name;
end;
comment on function get_authors_and_books(int) is '
HTTP GET
@nested
';
```

This function returns authors along with an array of their books. Note the usage of `array_agg(...)` to aggregate books into an array.

When we call `/api/example-12/get-authors-and-books`, we get the following nested JSON response:

```json
[
  {
    "author": {
      "authorId": 1,
      "firstName": "George",
      "lastName": "Orwell"
    },
    "books": [
      {
        "bookId": 1,
        "title": "1984",
        "authorId": 1
      },
      {
        "bookId": 2,
        "title": "Animal Farm",
        "authorId": 1
      }
    ]
  },
  {
    "author": {
      "authorId": 2,
      "firstName": "Jane",
      "lastName": "Austen"
    },
    "books": [
      {
        "bookId": 3,
        "title": "Pride and Prejudice",
        "authorId": 2
      },
      {
        "bookId": 4,
        "title": "Sense and Sensibility",
        "authorId": 2
      }
    ]
  },
  ...
]
```

So we now have a proper hierarchical JSON structure with authors and their books nested within just by returning arrays of custom types from our database function. As always, these can be any table or user defined type and TypeScript types are generated accordingly for type-safe consumption.

And this is even simpler then, for example, it would be in Oracle, where we would need to define MULTISET types explicitly. According to AI research, OraOracle/Informix/SQL Standard syntax would look something like this:

```sql
SELECT author_id, author_name,
       MULTISET(SELECT book_id, title FROM books 
                WHERE books.author_id = authors.id) AS books
FROM authors;
```

This may be more declarative, but it certainly doesn't have the automatic REST API and TypeScript generation like NpgsqlRest provides.

### Limitations

There are some limitations to be aware of when using nested JSON with multiset:

1) Nesting is limited to one level deep per function. 

For example, if we wanted to return authors, together with their books and with reviews for each book, we would ran into limitations:

First of all, PostgreSQL does not support aggregation in aggregation, so we cannot do `array_agg(...)` inside another `array_agg(...)` in a single query:

```
ERROR:
aggregate function calls cannot be nested
LINE 11: array_agg(
```

This limitation can be worked around by using subqueries, temp tables or CTEs, but it gets complicated quickly. Example is in source code on GitHub (see link above).

But even if we could do that, prior to NpgsqlRest 3.4.4, only one level of nesting was supported per function. Any additional levels of nesting were rendered as PostgreSQL tuple strings in JSON.

::: tip Deep Nesting Support (v3.4.4+)
Since NpgsqlRest 3.4.4, the [`ResolveNestedCompositeTypes`](/config/routine-options#resolve-nested-composite-types) option (enabled by default) resolves nested composite types to any depth, serializing inner composites as proper JSON objects/arrays instead of PostgreSQL tuple strings. The limitation below only applies when `ResolveNestedCompositeTypes` is set to `false`.
:::

For example, with `ResolveNestedCompositeTypes: false`, a single object in the JSON array would look like this:

```json
[
  {
    "author": {
      "authorId": 1,
      "firstName": "George",
      "lastName": "Orwell"
    },
    "books": [
      {
        "bookId": 1,
        "title": "1984",
        "reviews": [
          "(1,1,\"Alice Johnson\",5,\"A chilling and prophetic masterpiece.\",\"2026-01-16 08:45:55.560972\")",
          "(2,1,\"Bob Smith\",4,\"Thought-provoking but bleak.\",\"2026-01-16 08:45:55.560972\")",
          "(3,1,\"Carol White\",5,\"Essential reading for everyone.\",\"2026-01-16 08:45:55.560972\")"
        ]
      },
      {
        "bookId": 2,
        "title": "Animal Farm",
        "reviews": [
          "(4,2,\"David Brown\",5,\"Brilliant political allegory.\",\"2026-01-16 08:45:55.560972\")",
          "(5,2,\"Eve Davis\",4,\"Simple yet profound.\",\"2026-01-16 08:45:55.560972\")"
        ]
      }
    ]
  },
  ...
]
```

With the default `ResolveNestedCompositeTypes: true`, the `reviews` array is properly serialized as JSON objects:

```json
[
  {
    "author": {
      "authorId": 1,
      "firstName": "George",
      "lastName": "Orwell"
    },
    "books": [
      {
        "bookId": 1,
        "title": "1984",
        "reviews": [
          {"reviewId": 1, "bookId": 1, "reviewerName": "Alice Johnson", "rating": 5, "reviewText": "A chilling and prophetic masterpiece.", "createdAt": "2026-01-16T08:45:55.560972"},
          {"reviewId": 2, "bookId": 1, "reviewerName": "Bob Smith", "rating": 4, "reviewText": "Thought-provoking but bleak.", "createdAt": "2026-01-16T08:45:55.560972"},
          {"reviewId": 3, "bookId": 1, "reviewerName": "Carol White", "rating": 5, "reviewText": "Essential reading for everyone.", "createdAt": "2026-01-16T08:45:55.560972"}
        ]
      },
      {
        "bookId": 2,
        "title": "Animal Farm",
        "reviews": [
          {"reviewId": 4, "bookId": 2, "reviewerName": "David Brown", "rating": 5, "reviewText": "Brilliant political allegory.", "createdAt": "2026-01-16T08:45:55.560972"},
          {"reviewId": 5, "bookId": 2, "reviewerName": "Eve Davis", "rating": 4, "reviewText": "Simple yet profound.", "createdAt": "2026-01-16T08:45:55.560972"}
        ]
      }
    ]
  },
  ...
]
```

2) Working memory pressure on the database server.

Aggregations in PostgreSQL are accumulated in working memory and by default PostgreSQL allocates 4MB per aggregation operation (see the `work_mem` parameter). Those allocations are per operation and even a single query can have multiple aggregations, let alone multiple concurrent queries. When memory limit is exceeded, PostgreSQL spills to disk to complete the operation, which can severely impact performance.

This is a consideriation when using aggregations excessively, especially with large datasets on a busy server. Always monitor memory usage and tune `work_mem` accordingly.

### Conclusion And Workaround

Using custom types and multiset patterns in PostgreSQL with NpgsqlRest allows us to build expressive and efficient REST APIs with hierarchical JSON responses but as we can see, there are some limitations to be aware of.

There is a good workaround that I use in my projects. More like different pattern. Simply, run multiple queries, preferably in parallel, instead of a single complex query with multiple levels of nesting. This pattern gives us:

- Better performance by avoiding complex aggregations and joins.
- No working memory pressure on the database server.
- Two simlpler funcntions instead of one complex query.
- We still get full type safety with generated TypeScript types for both functions.

Speaking of which, that might be just the best part of using NpgsqlRest with PostgreSQL. The amount of code that I dont have to write myself is incredible. You can see it in the example source code on GitHub (see link above), but just to illustrate, here is the copy and paste here just for the interfaces part, the entire file is much longer:

```typescript
interface IAuthor {
    authorId: number | null;
    firstName: string | null;
    lastName: string | null;
}

interface IBooks {
    bookId: number | null;
    title: string | null;
    authorId: number | null;
}

interface IBooks {
    bookId: number | null;
    title: string | null;
    reviews: string[] | null;
}

interface IBooksInfo {
    books: number | null;
    activeReviews: number | null;
    avgRating: number | null;
}

interface ICreateAuthorRequest {
    authorAuthorId?: number | null;
    authorFirstName?: string | null;
    authorLastName?: string | null;
}

interface ICreateAuthorResponse {
    authorId: number | null;
    firstName: string | null;
    lastName: string | null;
}

interface IGetAuthorRequest {
    authorId: number | null;
}

interface IGetAuthorResponse {
    authorId: number | null;
    firstName: string | null;
    lastName: string | null;
}

interface IGetAuthorInfoRequest {
    authorId: number | null;
}

interface IGetAuthorInfoResponse {
    firstName: string | null;
    lastName: string | null;
    books: number | null;
}

interface IGetAuthorsRequest {
    authorAuthorId?: number | null;
    authorFirstName?: string | null;
    authorLastName?: string | null;
}

interface IGetAuthorsResponse {
    authorId: number | null;
    firstName: string | null;
    lastName: string | null;
}

interface IGetAuthorsAndBooksRequest {
    authorId: number | null;
}

interface IGetAuthorsAndBooksResponse {
    author: IAuthor | null;
    books: IBooks[] | null;
}

interface IGetAuthorsAndBooksAndReviewsRequest {
    authorId: number | null;
}

interface IGetAuthorsAndBooksAndReviewsResponse {
    author: IAuthor | null;
    books: IBooks[] | null;
}

interface IGetAuthorsWithDetailsRequest {
    authorId: number | null;
}

interface IGetAuthorsWithDetailsResponse {
    author: IAuthor | null;
    books: number | null;
}

interface IGetAuthorsWithDetailsNestedRequest {
    authorId: number | null;
}

interface IGetAuthorsWithDetailsNestedResponse {
    author: IAuthor | null;
    books: number | null;
}

interface IGetAuthorsWithDetailsTypeRequest {
    authorId: number | null;
}

interface IGetAuthorsWithDetailsTypeResponse {
    author: IAuthor | null;
    booksInfo: IBooksInfo | null;
}

interface IGetAuthorsWithDetailsTypeNestedRequest {
    authorId: number | null;
}

interface IGetAuthorsWithDetailsTypeNestedResponse {
    author: IAuthor | null;
    booksInfo: IBooksInfo | null;
}
```

That is a lot of code that I did not have to write myself. Plus, there is also the .http test file with all the calls, which is also generated automatically.

I built this project to save me time and effort, and it does exactly that. I hope you find it useful as well. If you do, give it a star on GitHub!

::: tip SQL File Source
Everything in this post also works with [SQL file endpoints](/guide/sql-files) — no functions needed. See the [SQL file version of this example](https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/12_custom_types_sql_file).
:::

<BlogNav
  source-code="https://github.com/NpgsqlRest/npgsqlrest-docs/tree/main/examples/12_custom_types"
  :get-started="[
    { text: 'Quick Start Guide', href: '/guide/quick-start' },
    { text: 'Routine Options', href: '/config/routine-options' },
    { text: 'Code Generation', href: '/config/codegen' }
  ]"
/>
