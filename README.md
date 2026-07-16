# regex-wand

Typed regular expressions without giving up readable regex authoring.

[![npm version](https://img.shields.io/npm/v/regex-wand.svg)](https://www.npmjs.com/package/regex-wand)
[![CI](https://github.com/andrew-bierman/regex-wand/actions/workflows/ci.yml/badge.svg)](https://github.com/andrew-bierman/regex-wand/actions/workflows/ci.yml)
[![Release](https://github.com/andrew-bierman/regex-wand/actions/workflows/release.yml/badge.svg)](https://github.com/andrew-bierman/regex-wand/actions/workflows/release.yml)
[![Playground](https://github.com/andrew-bierman/regex-wand/actions/workflows/pages.yml/badge.svg)](https://andrew-bierman.github.io/regex-wand/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

`regex-wand` lets you write patterns with the composable `magic-regexp` API and
get ArkRegex-powered TypeScript inference on the final `RegExp`.

```ts
import { createExactRegExp, digit } from "regex-wand"

const route = createExactRegExp(
	"/users/",
	digit.times.atLeast(1).as("userId"),
)

route.infer satisfies `/users/${number}`
route.inferNamedCaptures.userId satisfies `${number}`

const match = route.exec("/users/42")
match?.groups.userId satisfies string | undefined
```

The runtime value is still a native `RegExp`. The extra value is the typed
surface: `.infer`, `.inferCaptures`, `.inferNamedCaptures`, typed `exec()`
groups, literal flags, and `test()` narrowing.

## Try It

- [Interactive playground](https://andrew-bierman.github.io/regex-wand/)
- [npm package](https://www.npmjs.com/package/regex-wand)
- [Support matrix](packages/regex-wand/docs/support.md)
- [Type-safety guide](packages/regex-wand/docs/type-safety.md)
- [Roadmap](packages/regex-wand/docs/roadmap.md)

## Install

```sh
bun add regex-wand
```

```sh
npm install regex-wand
```

`magic-regexp`, `arkregex`, and the transform dependency are installed for you.
They are regular dependencies because `regex-wand` re-exports Magic Regex
primitives and uses ArkRegex in its public type surface.

## Why

Raw regex strings are compact but hard to safely compose:

```ts
const route = /^\/users\/(?<userId>\d{1,})$/
```

Magic Regex makes authoring readable:

```ts
import { createRegExp, digit } from "magic-regexp"

const route = createRegExp(
	"/users/",
	digit.times.atLeast(1).as("userId"),
)
```

ArkRegex makes raw regex results typed:

```ts
import { regex } from "arkregex"

const route = regex("^/users/(?<userId>\\d{1,})$")

route.inferNamedCaptures.userId satisfies `${number}`
```

`regex-wand` combines those two ideas:

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
`arkregex` when you already have a regex string. Use `regex-wand` when you want
both authoring ergonomics and result inference.

## API

```ts
import {
	caseInsensitive,
	createExactRegExp,
	createExactRegExpWithFlags,
	createRegExp,
	createRegExpWithFlags,
	digit,
	fromMagic,
	fromMagicAs,
	global,
} from "regex-wand"
```

| API | Use it for |
| --- | --- |
| `createRegExp(...inputs)` | Search-style patterns that can appear inside larger strings. |
| `createExactRegExp(...inputs)` | Whole-string validation and strongest `test()` narrowing. |
| `createRegExpWithFlags(inputs, ...flags)` | Search-style patterns with Magic Regex flag helpers. |
| `createExactRegExpWithFlags(inputs, ...flags)` | Exact patterns with flags. |
| `fromMagic(magic)` | Adapting an existing Magic Regex value. |
| `fromMagicAs<Pattern, Context>(magic)` | Manual typing for runtime-valid patterns ArkRegex cannot infer. |
| `regex-wand/transform` | Build-time compilation of static `regex-wand` builders. |

All core Magic Regex primitives are re-exported from `regex-wand`, so most code
can import from one package.

## Examples

Exact semver-style match:

```ts
import { createExactRegExp, digit } from "regex-wand"

const semver = createExactRegExp(
	digit.times.any().grouped(),
	".",
	digit.times.any().grouped(),
	".",
	digit.times.any().grouped(),
)

semver.infer satisfies `${number}.${number}.${number}`
semver.inferCaptures satisfies [`${number}`, `${number}`, `${number}`]
```

Contains-style text search:

```ts
import { createRegExp, digit } from "regex-wand"

const ticketId = createRegExp("id:", digit.times.atLeast(1).grouped())

ticketId.infer satisfies `${string}id:${number}${string}`
ticketId.test("ticket id:8042 is ready")
```

Flags:

```ts
import {
	anyOf,
	caseInsensitive,
	createExactRegExpWithFlags,
	global,
} from "regex-wand"

const accepted = createExactRegExpWithFlags(
	[anyOf("ok", "yes")],
	global,
	caseInsensitive,
)

accepted.flags satisfies "gi"
```

Manual type escape hatch:

```ts
import { createRegExp, digit } from "magic-regexp"
import { fromMagicAs } from "regex-wand"

const magic = createRegExp("feature:", digit.times.atLeast(1).as("id"))

const feature = fromMagicAs<
	`${string}feature:${number}${string}`,
	{ names: { id: `${number}` } }
>(magic)
```

## Build-Time Transform

Runtime builders are small, but static `regex-wand` calls can also compile to
native `RegExp` literals:

```ts
// vite.config.ts
import { defineConfig } from "vite"
import { RegexWandTransformPlugin } from "regex-wand/transform"

export default defineConfig({
	plugins: [RegexWandTransformPlugin.vite()],
})
```

The transform recognizes static `createRegExp`, `createExactRegExp`,
`createRegExpWithFlags`, and `createExactRegExpWithFlags` calls imported from
`regex-wand`. Dynamic expressions are left as runtime builder calls.

## Support Boundaries

`regex-wand` is intentionally strict:

- If Magic Regex can produce a runtime `RegExp` and ArkRegex can infer it,
  `regex-wand` exposes the type directly.
- If runtime behavior works but inference cannot be proven, use `fromMagicAs`.
- If a feature belongs to Magic Regex string-method augmentation, ArkType schema
  parsing, or Magic Regex converter output, use those upstream libraries
  directly.

The exact public contract lives in
[docs/support.md](packages/regex-wand/docs/support.md).

## Verification

The release gate covers:

- Vitest runtime behavior for builders, flags, captures, named groups,
  lookarounds, backreferences, native `RegExp` protocols, and transform output.
- `tsd` type tests for `.infer`, captures, named captures, flags, narrowing,
  manual typing, and compatibility errors.
- A packed-tarball consumer that installs the generated package and verifies
  both `regex-wand` and `regex-wand/transform` through Vite.
- A dedicated Vite fixture and static playground build.
- npm dry-run packaging and registry checks.

```sh
bun install
bun run release:check
```

## Repository

This is a Bun monorepo:

| Workspace | Purpose |
| --- | --- |
| `packages/regex-wand` | Published npm package. |
| `apps/playground` | Static playground deployed to GitHub Pages. |
| `apps/vite-fixture` | Real Vite build fixture for the transform. |

Release automation lives in [`.github/workflows/release.yml`](.github/workflows/release.yml).
The playground deploys through [`.github/workflows/pages.yml`](.github/workflows/pages.yml).

## License

MIT
