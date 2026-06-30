# regex-wand

Magic Regex authoring with ArkRegex-powered type inference.

[![npm version](https://img.shields.io/npm/v/regex-wand.svg)](https://www.npmjs.com/package/regex-wand)
[![CI](https://github.com/andrew-bierman/regex-wand/actions/workflows/ci.yml/badge.svg)](https://github.com/andrew-bierman/regex-wand/actions/workflows/ci.yml)
[![Playground](https://github.com/andrew-bierman/regex-wand/actions/workflows/pages.yml/badge.svg)](https://andrew-bierman.github.io/regex-wand/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

`regex-wand` is intentionally a thin adapter. You keep composing patterns with
`magic-regexp`; the final compiled value has ArkRegex-powered types for string
inference, captures, named groups, flags, `exec`, and `test` narrowing.

At runtime, `regex-wand` constructs a native `RegExp`. ArkRegex is used for the
published type surface, so browser bundlers do not need to execute ArkRegex code.

## Links

- [npm package](https://www.npmjs.com/package/regex-wand)
- [Playground](https://andrew-bierman.github.io/regex-wand/)
- [Monorepo README](https://github.com/andrew-bierman/regex-wand#readme)
- [Type-safety guide](docs/type-safety.md)
- [Testing strategy](docs/testing.md)
- [Changelog](CHANGELOG.md)
- [GitHub releases](https://github.com/andrew-bierman/regex-wand/releases)

## Install

```sh
bun add regex-wand
```

```sh
npm install regex-wand
```

`magic-regexp` and `arkregex` are installed with `regex-wand`. They remain part
of the public type surface because Magic Regex primitives are re-exported and
ArkRegex powers the inferred `RegExp` types.

## Usage

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

semver.inferCaptures satisfies [`${number}`, `${number}`, `${number}`]
```

Use `createRegExp` when the pattern can appear inside a larger string:

```ts
import { createRegExp, digit } from "regex-wand"

const ticketId = createRegExp("id:", digit.times.atLeast(1).grouped())

ticketId.infer satisfies `${string}id:${number}${string}`
ticketId.test("ticket id:8042 is ready")
```

Use named captures when you want `exec()` group types:

```ts
import { createExactRegExp, digit } from "regex-wand"

const userRoute = createExactRegExp(
	"/users/",
	digit.times.atLeast(1).as("userId"),
)

const match = userRoute.exec("/users/42")
match?.groups.userId satisfies string | undefined
```

Use flag helpers from the same import:

```ts
import {
	caseInsensitive,
	createExactRegExpWithFlags,
	global,
} from "regex-wand"

const accepted = createExactRegExpWithFlags(["ok"], global, caseInsensitive)

accepted.flags satisfies "gi"
accepted.infer satisfies "ok" | "oK" | "Ok" | "OK"
```

## Why Not Just Magic Regex Or ArkRegex?

`regex-wand` exists because Magic Regex and ArkRegex solve different parts of
the problem.

Raw Magic Regex gives you readable, composable authoring:

```ts
import { createRegExp, digit } from "magic-regexp"

const route = createRegExp("/users/", digit.times.atLeast(1).as("userId"))

route.test("/users/42")
```

Raw ArkRegex gives you strong result types from a raw regex string:

```ts
import { regex } from "arkregex"

const route = regex("^/users/(?<userId>\\d{1,})$")

route.infer satisfies `/users/${number}`
route.inferNamedCaptures.userId satisfies `${number}`
```

`regex-wand` keeps the Magic Regex authoring style and returns the ArkRegex-type
surface:

```ts
import { createExactRegExp, digit } from "regex-wand"

const route = createExactRegExp(
	"/users/",
	digit.times.atLeast(1).as("userId"),
)

route.infer satisfies `/users/${number}`
route.inferNamedCaptures.userId satisfies `${number}`
route.test("/users/42")
```

Use raw `magic-regexp` when you only need composable regex construction. Use raw
`arkregex` when you already have a regex string and want type inference for it.
Use `regex-wand` when you want both in one API.

## API

- `createRegExp(...inputs)` compiles Magic Regex inputs as a contains-style regex.
- `createExactRegExp(...inputs)` compiles a start/end anchored regex.
- `createRegExpWithFlags(inputs, ...flags)` compiles with Magic Regex flag helpers.
- `createExactRegExpWithFlags(inputs, ...flags)` combines anchoring and flags.
- `fromMagic(magic)` adapts an existing `MagicRegExp`.
- `WandCompatibilityError` marks strict type-level conversion failures.

All Magic Regex primitives are re-exported from the package.

## Runtime Contract

The returned value is a native `RegExp` with extra typed properties attached:

- `magic` is the original Magic Regex `RegExp`.
- `ark` is an alias to the adapted value for explicit interop.
- `toRegExp()` returns a new plain `RegExp` with the same source and flags.

Plain string inputs are escaped by Magic Regex. Magic Regex fragments keep their
composition behavior. Native `RegExp` rules still apply at runtime, including
duplicate flag errors and `lastIndex` behavior for global or sticky regexes.

## Type Safety Contract

`regex-wand` is strict by default. If the adapter cannot preserve the ArkRegex
type benefit for a Magic Regex value, the return type carries a compatibility
error instead of silently degrading to a plain `RegExp`.

See [docs/type-safety.md](docs/type-safety.md) for the longer version.

## Verification

The package test suite covers both runtime behavior and compile-time inference:

- Vitest runtime tests for builders, exact/contains matching, escaped strings,
  flags, indices, named groups, optional captures, lookarounds, backreferences,
  string `RegExp` protocols, and `lastIndex`.
- `tsd` tests for inferred strings, captures, named groups, flags, narrowing,
  `RegexParts`, and compatibility errors.
- A runtime import guard to ensure built browser code does not import ArkRegex.
- A packed-consumer test that installs the generated tarball into a temporary
  project and checks TypeScript plus runtime behavior.
- TanStack Intent skill validation.

See [docs/testing.md](docs/testing.md) for the test matrix and what each layer
proves.

Run everything from the monorepo root:

```sh
bun run release:check
```

## Agent Skill

This package ships a TanStack Intent skill under `skills/core/SKILL.md` so coding
agents can load version-aligned usage guidance from the installed npm package.

## Development And Publishing

```sh
bun install
bun run check
bun run test:coverage
```

Useful monorepo commands:

```sh
bun run release:check
bun run publish:dry-run
bun run publish:regex-wand
bun run registry:check
```

Automated publishing lives in the monorepo release workflow:
`.github/workflows/release.yml`.

While the GitHub repo is private, the workflow publishes with provenance
disabled because npm rejects GitHub Actions provenance from private source
repositories. Once the repo is public, the same workflow publishes with npm
provenance enabled.

`publish:regex-wand` runs `bun publish --access public` in the package workspace
and should only be used as a local fallback. Bump `packages/regex-wand/package.json`
before publishing because npm does not allow republishing the same version.
