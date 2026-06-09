# Claude Code configuration (`.claude/`)

This directory is the **committed, team-shared** [Claude Code](https://claude.com/claude-code)
configuration for OpenRevOps. Anyone who clones the repo and opens it in Claude Code gets
the same setup. It is scoped to **this repository only** — it does not change your global
Claude Code config.

> If you don't use Claude Code, you can ignore this directory entirely. Nothing here is
> required to build or run the project; the contract that governs all contributions
> (human or agent) is [`AGENTS.md`](../AGENTS.md).

## What's wired up

| Path                       | What it does                                                              |
| -------------------------- | ------------------------------------------------------------------------ |
| `settings.json`            | Team-shared settings: enabled plugins, permissions, and the safety hook. |
| `hooks/guard-secrets.sh`   | PreToolUse guard that blocks writing/committing secret-bearing files.    |
| `rules/`                   | Modular project rules (scope, security, determinism, testing, connectors).|
| `skills/`                  | Task skills the agent can invoke (decision traces, connectors, demo data).|
| `commands/`                | Project slash commands (`/check`, `/scaffold-package`).                   |
| `settings.local.json`      | **Your** personal overrides — gitignored, never committed.               |

## Plugins (enabled at the project level, not globally)

`settings.json` declares two third-party marketplaces and enables one plugin from each, so
contributors get a consistent agent toolkit without changing their global config:

- **[Superpowers](https://github.com/obra/superpowers)** (`superpowers@superpowers-dev`,
  MIT) — planning, TDD, systematic debugging, and collaboration workflows.
- **[ECC](https://github.com/affaan-m/ecc)** (`ecc@ecc`, MIT) — a large library of agents,
  skills, and operator workflows.

```jsonc
// .claude/settings.json (excerpt)
"extraKnownMarketplaces": {
  "superpowers-dev": { "source": { "source": "github", "repo": "obra/superpowers" } },
  "ecc":             { "source": { "source": "github", "repo": "affaan-m/ECC" } }
},
"enabledPlugins": {
  "superpowers@superpowers-dev": true,
  "ecc@ecc": true
}
```

### First-open trust prompt

Because this repo enables third-party marketplaces/plugins, the **first time** you open it
Claude Code asks you to trust the workspace before any plugin, hook, or MCP config is
activated. This is expected and is your security checkpoint:

- **Trust it** → the marketplaces are registered and both plugins are installed at
  **project scope** (they show up only while you're in this repo). Manage them anytime with
  `/plugin`.
- **Don't trust it** → plugins and hooks stay off. You can still work normally and install
  later with `/plugin` if you change your mind.

Only trust a repository whose configuration you've reviewed — which is exactly why this is
all in plain text here.

## The safety hook

`hooks/guard-secrets.sh` runs before every `Write`/`Edit`/`Bash` call and **blocks**:

1. writing or editing secret-bearing paths (`.env`, `secrets/`, `*.pem`, `*.key`, …) —
   while always allowing `.env.example`;
2. `git add` of those paths;
3. content carrying a **live**-credential marker — for example the live-mode secret-key
   prefix used by Stripe-style keys, an AWS access-key id, or a PEM private-key block
   header. (Test/sandbox prefixes and placeholders like `<YOUR_API_KEY>` are allowed.)

It "fails open" if it can't parse a tool call, so it never bricks a session. It is a
guardrail, **not** a vault — the hard gates are `.gitignore`, the gitleaks secret scan in
CI (`.github/workflows/secret-scan.yml`), and simply never putting real keys on disk in the
repo. A useful side effect: documentation should describe credential shapes in words rather
than pasting literal token prefixes, which keeps both this hook and secret scanners quiet.

## Permissions

`settings.json` pre-approves common, safe commands (`pnpm …`, read-only `git`, `node`,
`gitleaks`) to reduce prompt fatigue, **asks** before `git push`, and **denies** reading or
editing secret files and destructive commands (`git push --force`, `git reset --hard`,
`rm -rf`). Override these for yourself in `settings.local.json` (gitignored).

## Optional: MCP servers

This repo does not commit a `.mcp.json`, to keep the trust surface small. If you want
up-to-date library docs while working here, consider adding the
[Context7](https://github.com/upstash/context7) MCP server to your **personal** config
rather than committing it for everyone.

## Other harnesses

`AGENTS.md` is written to be read by any agent harness (Codex, Cursor, etc.), not just
Claude Code. Tool-specific config lives here; the rules of engagement live in `AGENTS.md`.
