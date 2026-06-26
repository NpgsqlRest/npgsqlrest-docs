---
outline: [2, 3]
title: "Claude Code Skill"
titleTemplate: NpgsqlRest
description: "NpgsqlRest ships an official Claude Code skill that teaches the AI agent both endpoint sources, the full annotation set, configuration, testing, and client code generation. Install it once and build endpoints by describing them."
head:
  - - meta
    - name: keywords
      content: npgsqlrest claude code skill, claude skill postgresql rest api, ai assisted api development, claude code postgresql, ai agent sql endpoints
  - - meta
    - property: og:title
      content: "NpgsqlRest Claude Code Skill"
  - - meta
    - property: og:description
      content: "An official Claude Code skill that teaches the AI agent how to build with NpgsqlRest."
  - - meta
    - property: og:type
      content: article
---

# Claude Code Skill

NpgsqlRest ships an official [Claude Code](https://claude.com/claude-code) skill that teaches the agent how to build with NpgsqlRest: both endpoint sources (database routines and `.sql` files), the full annotation vocabulary, configuration, HTTP custom types, proxy, caching, auth, SSE, MCP, client code generation, the SQL test runner, and watch mode.

Without it, an AI assistant guesses annotation names and configuration keys from training data — often from an older version, or just wrong. With it, Claude works from the exact reference for the current release and knows to verify against your installed binary.

## What's in the Skill

A [skill](https://code.claude.com/docs/en/skills) is a folder of instructions and reference files that Claude Code loads on demand. This one lives in the main repository at [`.claude/skills/npgsqlrest/`](https://github.com/NpgsqlRest/NpgsqlRest/tree/master/.claude/skills/npgsqlrest) and contains three files:

| File | What it is |
|------|------------|
| `SKILL.md` | The working knowledge: mental model, both endpoint sources, an annotation cheat-sheet, HTTP custom types, proxy, auth patterns, caching, testing, and the common gotchas |
| `annotations-reference.md` | Every comment annotation with syntax, aliases, and description |
| `configuration-reference.jsonc` | The complete `appsettings.json` with every option and inline comments |

The two reference files are generated from `npgsqlrest --annotations` and `npgsqlrest --config`, so they match the release they ship with.

## Installation

Since 3.21.0, the binary installs the skill itself — the same command on every platform:

```console
npgsqlrest --install-skill
```

That installs into the project's `.claude/skills/npgsqlrest` folder (run it from the project root). **Commit the three files** — everyone working on the repository, including any CI or cloud agent, gets the same skill automatically. This is the recommended scope.

For a per-user install, available in every project on your machine (`~/.claude/skills/npgsqlrest`):

```console
npgsqlrest --install-skill global
```

The command downloads the skill files from the **release branch matching your installed version**, so the references are exactly right for the binary you run. If that branch is not available it falls back to `master` with a printed note — and the skill instructs Claude to trust your installed binary (`--config`, `--annotations`) over the bundled references anyway.

Claude Code discovers skills in both places: the project's `.claude/skills/` folder and your personal `~/.claude/skills/`.

### Manual Installation

On versions before 3.21.0, or without the binary at hand, fetch the three files directly (replace `master` with your version branch, e.g. `3.21.0`, to pin them):

::: code-group

```bash [macOS / Linux]
mkdir -p .claude/skills/npgsqlrest
for f in SKILL.md annotations-reference.md configuration-reference.jsonc; do
  curl -fsSL "https://raw.githubusercontent.com/NpgsqlRest/NpgsqlRest/master/.claude/skills/npgsqlrest/$f" \
    -o ".claude/skills/npgsqlrest/$f"
done
```

```powershell [Windows]
New-Item -ItemType Directory -Force -Path .claude\skills\npgsqlrest | Out-Null
foreach ($f in 'SKILL.md', 'annotations-reference.md', 'configuration-reference.jsonc') {
  Invoke-WebRequest "https://raw.githubusercontent.com/NpgsqlRest/NpgsqlRest/master/.claude/skills/npgsqlrest/$f" `
    -OutFile ".claude\skills\npgsqlrest\$f"
}
```

:::

For a per-user manual install, use `$HOME/.claude/skills/npgsqlrest` (or `%USERPROFILE%\.claude\skills\npgsqlrest`) as the target directory instead. The bash variant also works in WSL and Git Bash on Windows.

## How It Activates

There is nothing to configure. Claude Code matches each request against the skill's description and loads it automatically when the work touches NpgsqlRest: writing endpoint SQL or annotations, editing `appsettings.json`, generating clients, or running and troubleshooting the `npgsqlrest` server. You can also invoke it explicitly by typing `/npgsqlrest` in the prompt, or just asking Claude to use it.

## Cookbook

Once installed, describe endpoints instead of writing them. Some prompts to steal:

**Building:**

- *"Add a `GET /api/top-customers` endpoint: top 20 by revenue, managers only, cached 5 minutes keyed on the region parameter."*
- *"Create a SQL file endpoint returning monthly order totals between two date parameters."*
- *"Expose this function as an MCP tool with no public HTTP route."*
- *"Add an HTTP custom type that calls the weather API, with the key from an allowlisted environment variable."*

**Debugging:**

- *"My `@cached` endpoint returns the same data for every user — why?"* (the skill knows how cache keys are derived from `@cached` parameters)
- *"This endpoint returns 404 — check how the URL path is derived from the function name."*
- *"Startup fails describing one of my `.sql` files — find and fix it."*

**Configuration:**

- *"Set up cookie auth with a login function and map user claims to function parameters."*
- *"Enable the TypeScript client with React Query hooks, but only in the development config."*

**Testing and verifying** — the skill tells Claude to use the binary itself rather than guess: `npgsqlrest --validate` checks configuration keys and database connectivity, `--endpoints` builds and lists every endpoint without starting the server, `--test` runs SQL test files, `--annotations` and `--config` are the authoritative reference for the installed version, and debug logging confirms each annotation parsed as intended.

## Keeping It Current

The skill files are updated with each release. When you upgrade NpgsqlRest, re-run `npgsqlrest --install-skill` — it pulls the skill from the branch matching the new version, so binary and skill stay in lockstep. If the versions ever drift, no harm done — the skill instructs Claude to trust the output of your installed binary over the bundled references.
