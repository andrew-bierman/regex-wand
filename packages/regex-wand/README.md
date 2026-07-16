# regex-wand

Typed regular expressions without giving up readable regex authoring.

[![npm version](https://img.shields.io/npm/v/regex-wand.svg)](https://www.npmjs.com/package/regex-wand)
[![CI](https://github.com/andrew-bierman/regex-wand/actions/workflows/ci.yml/badge.svg)](https://github.com/andrew-bierman/regex-wand/actions/workflows/ci.yml)
[![Playground](https://github.com/andrew-bierman/regex-wand/actions/workflows/pages.yml/badge.svg)](https://andrew-bierman.github.io/regex-wand/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

`regex-wand` lets you write patterns with the composable `magic-regexp` API and
get ArkRegex-powered TypeScript inference on the final `RegExp`.

At runtime, the result is still a native `RegExp`. The extra value is the typed
surface: `.infer`, `.inferCaptures`, `.inferNamedCaptures`, typed `exec()`
groups, literal flags, and `test()` narrowing. ArkRegex is type-only in the
built JavaScript.

## Try It

- [npm package](https://www.npmjs.com/package/regex-wand)
- [Playground](https://andrew-bierman.github.io/regex-wand/)
- [Monorepo README](https://github.com/andrew-bierman/regex-wand#readme)
- [Type-safety guide](docs/type-safety.md)
- [ArkType interop](docs/arktype-interop.md)
- [Support matrix](docs/support.md)
- [Roadmap](docs/roadmap.md)
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

## Quick Start

```ts
import { defineRegex, digit } from "regex-wand"

const route = defineRegex({
	match: "exact",
	pattern: ["/users/", digit.times.atLeast(1).as("userId")],
})

route.infer satisfies `/users/${number}`
route.inferNamedCaptures.userId satisfies `${number}`

const match = route.exec("/users/42")
match?.groups.userId satisfies string | undefined

declare const value: string

if (route.test(value)) {
	value satisfies `/users/${number}`
}
```

## Common Patterns

Exact semver-style match:

```ts
import { defineRegex, digit } from "regex-wand"

const semver = defineRegex({
	match: "exact",
	pattern: [
		digit.times.any().grouped(),
		".",
		digit.times.any().grouped(),
		".",
		digit.times.any().grouped(),
	],
})

semver.infer satisfies `${number}.${number}.${number}`
semver.inferCaptures satisfies [`${number}`, `${number}`, `${number}`]
```

Contains-style text search:

```ts
import { defineRegex, digit } from "regex-wand"

const ticketId = defineRegex({
	pattern: ["id:", digit.times.atLeast(1).grouped()],
})

ticketId.infer satisfies `${string}id:${number}${string}`
ticketId.test("ticket id:8042 is ready")
```

Flags:

```ts
import {
	caseInsensitive,
	defineRegex,
	global,
} from "regex-wand"

const accepted = defineRegex({
	flags: [global, caseInsensitive],
	match: "exact",
	pattern: ["ok"],
})

accepted.flags satisfies "gi"
accepted.infer satisfies "ok" | "oK" | "Ok" | "OK"
```

## Why Not Just Magic Regex Or ArkRegex?

`regex-wand` exists because Magic Regex and ArkRegex solve different parts of
the problem.

Raw regex strings are compact but hard to safely compose:

```ts
const route = /^\/users\/(?<userId>\d{1,})$/
```

Raw Magic Regex gives you readable, composable authoring:

```ts
import { createRegExp, digit } from "magic-regexp"

const route = createRegExp("/users/", digit.times.atLeast(1).as("userId"))

route.test("/users/42")
```

Magic Regex also ships a build-time transform that can compile those
`createRegExp(...)` calls to plain `RegExp` literals.

Raw ArkRegex gives you strong result types from a raw regex string:

```ts
import { regex } from "arkregex"

const route = regex("^/users/(?<userId>\\d{1,})$")

route.infer satisfies `/users/${number}`
route.inferNamedCaptures.userId satisfies `${number}`
```

`regex-wand` keeps the Magic Regex authoring style, adds readable object params,
and returns the ArkRegex-type surface:

```ts
import { defineRegex, digit } from "regex-wand"

const route = defineRegex({
	match: "exact",
	pattern: ["/users/", digit.times.atLeast(1).as("userId")],
})

route.infer satisfies `/users/${number}`
route.inferNamedCaptures.userId satisfies `${number}`
route.test("/users/42")
```

Use raw `magic-regexp` when you only need composable regex construction. Use raw
`arkregex` when you already have a regex string and want type inference for it.
Use `regex-wand` when you want both authoring ergonomics and result inference.

### Build-Time Transform Note

Magic Regex's transform only recognizes imports from `magic-regexp` and
`magic-regexp/further-magic`. If you do not enable `regex-wand/transform`, direct
`regex-wand` builders are small runtime adapters:

```ts
import { defineRegex, digit } from "regex-wand"

const route = defineRegex({
	match: "exact",
	pattern: ["/users/", digit.times.atLeast(1).as("userId")],
})
```

If you want Magic Regex's build-time transform in an app, compose with raw Magic
Regex and adapt at the boundary:

```ts
import { createRegExp, digit, exactly } from "magic-regexp"
import { fromMagic } from "regex-wand"

const magicRoute = createRegExp(
	exactly("/users/", digit.times.atLeast(1).as("userId"))
		.at.lineStart()
		.at.lineEnd(),
)

const route = fromMagic(magicRoute)

route.inferNamedCaptures.userId satisfies `${number}`
```

With Magic Regex's transform enabled, the raw `createRegExp(...)` call can
compile away, leaving only the `regex-wand` boundary adapter. ArkRegex remains
type-only in `regex-wand`'s built JavaScript.

If you want direct `regex-wand` builder calls to compile, use
`regex-wand/transform`:

```ts
// vite.config.ts
import { defineConfig } from "vite"
import { RegexWandTransformPlugin } from "regex-wand/transform"

export default defineConfig({
	plugins: [RegexWandTransformPlugin.vite()],
})
```

The transform recognizes static `defineRegex`, `createRegExp`,
`createExactRegExp`, `createRegExpWithFlags`, and
`createExactRegExpWithFlags` calls imported from `regex-wand`. Dynamic
expressions are left unchanged. The emitted code preserves the adapter shape, so
`.magic`, `.ark`, and `.toRegExp()` keep working.

For expressions that are valid at runtime but too complex or dynamic for
ArkRegex to infer, use `fromMagicAs` to provide the result type manually:

```ts
import { createRegExp, digit } from "magic-regexp"
import { fromMagicAs } from "regex-wand"

const magicRoute = createRegExp("/users/", digit.times.atLeast(1).as("userId"))

const route = fromMagicAs<
	`${string}/users/${number}${string}`,
	{ names: { userId: `${number}` } }
>(magicRoute)
```

## API

- `defineRegex({ pattern, match, flags })` is the recommended object-shaped API.
  `pattern` is a Magic Regex-compatible tuple, `match` is `"contains"` by
  default or `"exact"` for start/end anchoring, and `flags` accepts helper
  values, arrays, strings, or Sets.
- `createRegExp(...inputs)` compiles Magic Regex inputs as a contains-style regex.
- `createExactRegExp(...inputs)` compiles a start/end anchored regex.
- `createRegExpWithFlags(inputs, ...flags)` compiles with Magic Regex flag helpers.
- `createRegExpWithFlags(inputs, flags)` also accepts flag arrays, flag strings,
  and flag Sets.
- `createExactRegExpWithFlags(inputs, ...flags)` combines anchoring and flags.
- `fromMagic(magic)` adapts an existing `MagicRegExp`.
- `fromMagicAs<Pattern, Context>(magic)` adapts an existing `MagicRegExp` with
  manually supplied ArkRegex result types.
- `RegexWandTransformPlugin` from `regex-wand/transform` compiles static
  `regex-wand` builder calls at build time.
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
See [docs/arktype-interop.md](docs/arktype-interop.md) for when to use ArkType
schema regexes directly.
See [docs/support.md](docs/support.md) for the explicit support matrix and known
technical gaps.
See [docs/roadmap.md](docs/roadmap.md) for the upstream compatibility audit and
future support plan.

## Verification

The package test suite covers both runtime behavior and compile-time inference:

- Vitest runtime tests for builders, exact/contains matching, escaped strings,
  flag helpers/arrays/strings/Sets, indices, named groups, optional captures,
  lookarounds, backreferences, manual typing, string `RegExp` protocols, and
  `lastIndex`.
- Vitest transform tests for direct builder calls, namespaced builder calls, and
  dynamic expressions that must be left untouched.
- `tsd` tests for inferred strings, captures, named groups, flags, narrowing,
  manual typing, `RegexParts`, and compatibility errors.
- A runtime import guard to ensure built browser code does not import ArkRegex.
- A packed-consumer test that installs the generated tarball into a temporary
  project and verifies TypeScript, runtime behavior, and the
  `regex-wand/transform` Vite subpath.
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

The workflow publishes public GitHub releases to npm with provenance through npm
trusted publishing. Local publishing remains a fallback for emergencies.

`publish:regex-wand` runs `bun publish --access public` in the package workspace
and should only be used as a local fallback. Bump `packages/regex-wand/package.json`
before publishing because npm does not allow republishing the same version.
