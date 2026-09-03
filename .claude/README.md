# .claude

Project configuration for AI coding agents working on Kwartje.

| Path | What it is |
|---|---|
| `settings.json` | Project settings: permissions, hooks that enforce the rules mechanically |
| `rules/` | The engineering rules. **All of them are binding.** `CLAUDE.md` at the repo root points here |
| `commands/` | Slash commands for repeated workflows (`/new-feature`, `/new-screen`, `/review`, `/check`) |
| `agents/` | Sub-agent definitions (`code-reviewer`, `ui-implementer`, `spec-checker`) |

**Reading order for a fresh agent**: root `CLAUDE.md` → `rules/00-core.md` → `rules/` in numeric order → `docs/00-INDEX.md`.

The rules in `rules/` govern *how* code is written. The specs in `docs/` govern *what* is built. When they seem to conflict, the rules win on style and structure, the specs win on behaviour.
