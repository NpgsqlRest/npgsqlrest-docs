# Examples

## Prerequisites

- **PostgreSQL** - A running PostgreSQL instance
- **Bun** (recommended) - [bun.sh](https://bun.sh)

Note: Node.js or Deno could also be used, but we recommend Bun.

## Setup (once, from `examples/` directory)

```bash
cd examples
bun install
```

Note: This downloads the NpgsqlRest binary from the GitHub releases page. Installation may take up to 30 seconds.

## Root Configuration Files

- `examples/.env` - Environment file for database connection parameters
- `examples/config.json` - NpgsqlRest root configuration file shared by all examples
- `examples/db.js` - pgmigrations configuration file and tool for running migrations

## Example Directory Structure

Each example follows this structure:

| Path | Description |
|------|-------------|
| `./http/` | Auto-generated HTTP files for testing endpoints |
| `./public/` | Web files served by the web server |
| `./sql/` | SQL migrations (`R__` prefix indicates repeatable migrations, see [pgmigrations](https://www.npmjs.com/package/@vbilopav/pgmigrations)) |
| `./src/` | TypeScript source files (may include auto-generated TypeScript files) |
| `./config.json` | NpgsqlRest configuration for this example (overrides the root config) |

## Running Examples

Each example lives in its own subdirectory (e.g., `1_my_first_function/`, `2_static_type_checking/`). To run a specific example:

1. Navigate to the example directory:
   ```bash
   cd examples/1_my_first_function
   ```

2. Use the available commands:

| Command | Description |
|---------|-------------|
| `bun run build` | Builds TypeScript into public JavaScript |
| `bun run watch` | Watches for TypeScript changes and incrementally builds |
| `bun run dev` | Starts NpgsqlRest, re-builds all files (HTTP and TypeScript), and runs the server |
| `bun run db:up` | Runs all pending migrations |
| `bun run db:list` | Lists all available migrations (not yet applied) |

Each example's `package.json` contains the scripts configured for that specific example.
