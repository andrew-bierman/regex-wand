# regex-wand

Magic Regex authoring with ArkRegex-powered type inference.

`regex-wand` is intentionally a thin adapter. You keep composing patterns with
`magic-regexp`; the final compiled value has ArkRegex-powered types for string
inference, captures, named groups, flags, `exec`, and `test` narrowing.

At runtime, `regex-wand` constructs a native `RegExp`. ArkRegex is used for the
published type surface, so browser bundlers do not need to execute ArkRegex code.

## Install

```sh
bun add regex-wand magic-regexp arkregex
```

`magic-regexp` and `arkregex` are peer dependencies so projects can control the
versions they use.

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

## API

- `createRegExp(...inputs)` compiles Magic Regex inputs as a contains-style regex.
- `createExactRegExp(...inputs)` compiles a start/end anchored regex.
- `createRegExpWithFlags(inputs, ...flags)` compiles with Magic Regex flag helpers.
- `createExactRegExpWithFlags(inputs, ...flags)` combines anchoring and flags.
- `fromMagic(magic)` adapts an existing `MagicRegExp`.
- `WandCompatibilityError` marks strict type-level conversion failures.

All Magic Regex primitives are re-exported from the package.

## Type Safety Contract

`regex-wand` is strict by default. If the adapter cannot preserve the ArkRegex
type benefit for a Magic Regex value, the return type carries a compatibility
error instead of silently degrading to a plain `RegExp`.

See [docs/type-safety.md](docs/type-safety.md) for the longer version.

## Agent Skill

This package ships a TanStack Intent skill under `skills/core/SKILL.md` so coding
agents can load version-aligned usage guidance from the installed npm package.

## Development

```sh
bun install
bun run check
bun run test:coverage
```

The check suite runs Biome, TypeScript, tsup, a runtime import guard, Vitest
runtime tests, `tsd` type tests, TanStack Intent validation, and a packed-consumer
install check. The type tests are the main proof that this package adds value
over plain Magic Regex output.
