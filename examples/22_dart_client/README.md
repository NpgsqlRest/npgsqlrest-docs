# Example 22: Dart Client Code Generation

Generate a typed Dart client for Flutter projects from PostgreSQL functions, using the `NpgsqlRest.DartClient` plugin (version 3.20.0+).

## What it shows

- `DartClientCodeGen` configuration ([config.json](config.json)): output path, `IncludeSchemaInNames`, `IncludeHost`.
- Three endpoint shapes ([sql_22](sql_22/R__example_22_dart_client.sql)):
  - `search_products` — GET with query-string parameters (one with a database default, omitted from the query when null) and a table response with a `timestamp` column mapped to `DateTime`.
  - `get_product` — GET with a URL path parameter (`path /api/products/{_id}`) and a `single` object response.
  - `create_order` — POST with a JSON body and an `int` scalar response.
- The generated output ([dart/lib/example_22_api.dart](dart/lib/example_22_api.dart)): request/response model classes with `fromJson`/`toJson`, `ApiResult<T>`/`ApiError` status wrappers, and plain `package:http` calls.
- Consuming the client ([dart/lib/main.dart](dart/lib/main.dart)).

## Run it

From this directory:

```console
bun run db:up        # apply the example_22 schema migration
bun run dev          # start the server (regenerates the Dart client on startup)
bun run watch        # or start in watch mode
```

Validate and try the generated Dart (requires the Dart SDK):

```console
bun run dart:analyze # dart pub get && dart analyze
bun run dart:run     # runs dart/lib/main.dart against the local server
```

## Testing the generated client

Each generated module exposes a top-level `http.Client? httpClient` variable. In tests, assign a `MockClient` from `package:http/testing.dart` to intercept requests:

```dart
import 'package:http/testing.dart';
import 'package:http/http.dart' as http;
import 'package:example_22_dart_client/example_22_api.dart' as api;

void main() {
  api.httpClient = MockClient((request) async {
    return http.Response('[{"id":1,"name":"Mock","price":1.0}]', 200);
  });
  // api.example22SearchProducts(...) now returns the mocked data
}
```
