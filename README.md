# regex-wand

Magic Regex authoring with ArkRegex-powered TypeScript inference.

[![npm version](https://img.shields.io/npm/v/regex-wand.svg)](https://www.npmjs.com/package/regex-wand)
[![CI](https://github.com/andrew-bierman/regex-wand/actions/workflows/ci.yml/badge.svg)](https://github.com/andrew-bierman/regex-wand/actions/workflows/ci.yml)
[![Release](https://github.com/andrew-bierman/regex-wand/actions/workflows/release.yml/badge.svg)](https://github.com/andrew-bierman/regex-wand/actions/workflows/release.yml)
[![Playground](https://github.com/andrew-bierman/regex-wand/actions/workflows/pages.yml/badge.svg)](https://andrew-bierman.github.io/regex-wand/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

This monorepo contains the published `regex-wand` npm package and a static
playground for trying examples in the browser.

## Links

- [npm package](https://www.npmjs.com/package/regex-wand)
- [Playground](https://andrew-bierman.github.io/regex-wand/)
- [Package docs](packages/regex-wand/README.md)
- [Type-safety guide](packages/regex-wand/docs/type-safety.md)
- [Testing strategy](packages/regex-wand/docs/testing.md)
- [Changelog](packages/regex-wand/CHANGELOG.md)
- [GitHub releases](https://github.com/andrew-bierman/regex-wand/releases)

## Workspaces

| Workspace | Purpose |
| --- | --- |
| `packages/regex-wand` | Published npm package. |
| `apps/playground` | Static React playground deployed to GitHub Pages. |
| `.github/workflows/ci.yml` | Auth-free CI gate for PRs and relevant `main` pushes. |
| `.github/workflows/release.yml` | npm release automation. |
| `.github/workflows/pages.yml` | Playground deployment. |

## What This Library Does

`regex-wand` is a thin adapter between two libraries:

- `magic-regexp` gives a readable, composable regex authoring API.
- `arkregex` gives strongly inferred regex types.

The package keeps runtime behavior native. A `regex-wand` result is still a
`RegExp`; it just carries the ArkRegex-powered type surface for `.infer`,
`.inferCaptures`, `.inferNamedCaptures`, `test()` narrowing, and typed `exec()`
groups.

## Quick Start

```sh
bun add regex-wand
```

```ts
import { createExactRegExp, digit } from "regex-wand"

const semver = createExactRegExp(
	digit.times.any().grouped(),
	".",
	digit.times.any().grouped(),
	".",
	digit.times.any().grouped(),
)

declare const value: string

if (semver.test(value)) {
	value satisfies `${number}.${number}.${number}`
}
```

Full package docs live in
[`packages/regex-wand/README.md`](packages/regex-wand/README.md).

## Development

This repo uses Bun workspaces.

```sh
bun install
bun run check
bun run dev
```

Useful commands:

```sh
bun run build
bun run test
bun run test:coverage
bun run typecheck
bun run ci:check
bun run release:check
bun run publish:dry-run
```

`bun run release:check` is the required pre-release gate. It runs formatting and
lint checks, TypeScript checks, package build, runtime tests, type tests, Intent
skill validation, publish-file assertions, packed-consumer verification,
playground checks, coverage, npm dry-run, and registry lookup.

`bun run ci:check` is the unauthenticated GitHub Actions gate. It runs the same
build, lint, type, runtime, type-test, packed-consumer, playground, and coverage
checks, but skips npm registry operations that require publish credentials.

## Test Coverage

The package has three layers of verification:

| Layer | Command | What it proves |
| --- | --- | --- |
| Runtime behavior | `bun run test:coverage` | Builders, exact vs contains matching, escaped strings, flags, native `RegExp` protocols, captures, named groups, lookarounds, backreferences, optional captures, `lastIndex`, and `toRegExp()` behavior. |
| Type safety | `bun run --filter './packages/regex-wand' type-test` | Inferred strings, captures, named captures, flags, narrowing, escaped slash parsing, and compatibility-error types. |
| Package integrity | `bun run ci:check` | Build output, no runtime ArkRegex import, npm tarball contents, install-from-packed-tarball consumer behavior, playground build, and coverage. |
| Release readiness | `bun run release:check` | Everything in CI plus npm dry-run and registry state. |

Current runtime coverage is 100% statements/functions/lines for the adapter
source. The adapter is intentionally small, so `tsd` and packed-consumer tests
are as important as line coverage.

## GitHub Actions

There are three workflows:

- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs the auth-free Bun
  CI gate on pull requests and relevant `main` pushes.
- [`.github/workflows/release.yml`](.github/workflows/release.yml) publishes the
  npm package. It runs on GitHub Release publish and supports manual
  `workflow_dispatch` with a tag.
- [`.github/workflows/pages.yml`](.github/workflows/pages.yml) builds and deploys
  the playground to GitHub Pages.

The current release workflow supports both private and public repository modes:

- Private repo: publishes with `npm publish --access public --provenance=false`.
- Public repo: publishes with `npm publish --access public --provenance`.

npm only accepts provenance from public GitHub source repositories. Once this
repo is public, the workflow will automatically use provenance.

## Versioning And Releases

`regex-wand` uses semver.

- Patch: docs, test hardening, release automation, and compatible bug fixes.
- Minor: new compatible APIs or broader supported Magic Regex/ArkRegex behavior.
- Major: breaking runtime API changes or intentional type-surface breaks.

Release checklist:

1. Update `packages/regex-wand/package.json`.
2. Update `packages/regex-wand/CHANGELOG.md`.
3. Run `bun run release:check`.
4. Merge to `main`.
5. Create a matching GitHub Release, or manually dispatch the Release workflow
   with the matching tag.

The release workflow validates that the tag matches the package version before
publishing.

## Required npm Setup

While the repo is private, set the repository secret `NPM_TOKEN` to an npm
automation or granular access token with publish access to `regex-wand`.

Once the repo is public, npm trusted publishing can replace the long-lived token:

- Publisher: GitHub Actions
- Owner/user: `andrew-bierman`
- Repository: `regex-wand`
- Workflow: `release.yml`
- Environment: blank

After trusted publishing is confirmed, remove the `NPM_TOKEN` fallback if you no
longer want token-based publishing.

## Playground

The playground is a static React app and can be hosted on GitHub Pages.

```sh
bun run --filter './apps/playground' build
```

The Pages workflow uploads `apps/playground/dist`. The live site is:

https://andrew-bierman.github.io/regex-wand/

## Contributing And Security

- See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, checks, and pull request
  expectations.
- See [SECURITY.md](SECURITY.md) for private vulnerability reporting guidance.
- This repository and package are MIT licensed.
