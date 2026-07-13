# Changelog

## 0.3.0

### Added

- Installer `--detect` gaps, `packageVersion`, `installCommands`, template health
- Installer `--yes` / `-y` installs recommended runtime non-interactively
- Installer `--verify` post-install file checks; standalone verify mode
- Installer `--selfcheck` validates package templates
- TTY without `--runtime` auto-enters interactive mode
- Project skill `install-acceptance-agents` installed with every runtime
- Optional `.trellis/acceptance.defaults.md` stub when installing Grok into Trellis projects
- OpenCode skill isolation notes vs Grok path
- `CHANGELOG.md`, `package.files`, repository metadata

### Changed

- AI install playbook: detect → choices → install with `--verify --json`
- Version bump for grok-qa templates to `1.1.0-trellis-global`

## 0.2.0

- Grok runtime templates (`grok-qa` + `grok-qa-acceptance`)
- Installer `--runtime opencode|grok|all`, `--detect`, `--interactive`
- Dual-path docs (README / AI-INSTALL / AGENTS)

## 0.1.0

- Initial OpenCode acceptance agents + skills
