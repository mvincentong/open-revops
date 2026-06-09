# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Open-source governance scaffold: `README`, `LICENSE` (Apache-2.0), `NOTICE`,
  `CONTRIBUTING`, `CODE_OF_CONDUCT`, `SECURITY`, `SUPPORT`, `ROADMAP`, and `AGENTS.md`.
- Repository tooling: `.editorconfig`, `.gitattributes`, `.gitignore`, Prettier and
  markdownlint config, pinned Node version (`.nvmrc`), and `.env.example`.
- Secret-scanning configuration and a CI gate (lint, typecheck, test, build,
  secret scan, dependency review, CodeQL).
- Repo-local Claude Code configuration: project-scoped plugins, a secret-guard hook,
  project rules, skills, and slash commands (see [`.claude/README.md`](./.claude/README.md)).
- pnpm workspace with placeholder packages and apps, plus architecture, threat-model,
  decision-trace, policy, connectors, deployment, and demo-script docs under `docs/`.

[Unreleased]: https://github.com/mvincentong/open-revops/commits/main
