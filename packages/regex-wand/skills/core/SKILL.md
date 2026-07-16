---
name: core
description: Use regex-wand to compose regexes with Magic Regex fragments and compile them into ArkRegex-powered typed RegExp values.
---

# regex-wand

Use this skill when writing or reviewing code that imports `regex-wand`.

## Intent

`regex-wand` is a thin adapter, not a new regex DSL. Keep pattern authoring in
Magic Regex fragments and use `regex-wand` only at the compile boundary.

## Correct Patterns

- Import Magic Regex fragments from `regex-wand` when possible so examples use
  one package import.
- Prefer `defineRegex({ inputs, match, flags })` for new code. Omit `match`
  for contains-style matching; use `match: "exact"` when `test()` should narrow
  to the exact inferred string shape.
- Use `createRegExp(...inputs)` and `createExactRegExp(...inputs)` when matching
  Magic Regex's positional builder style is clearer for a small local pattern.
- Use `createRegExpWithFlags(inputs, ...flags)` or
  `createExactRegExpWithFlags(inputs, ...flags)` when flags must be part of the
  inferred type. Flag arrays, flag strings, and flag Sets are also accepted.
- Use `fromMagic(magic)` only when an existing Magic Regex value already exists.
- Use `fromMagicAs<Pattern, Context>(magic)` only as an explicit manual typing
  escape hatch for runtime-valid Magic Regex values ArkRegex cannot infer.

## Common Mistakes

- Do not build a competing fragment DSL around `regex-wand`.
- Do not hide a strict compatibility error by casting to `RegExp` in library
  code. Prefer `fromMagicAs` when you can state the result type.
- Do not pass raw regex syntax as a string when Magic Regex would escape it. Use
  Magic Regex helpers for anchors, groups, boundaries, and alternatives.

## Example

```ts
import { defineRegex, digit } from "regex-wand"

const semver = defineRegex({
	match: "exact",
	inputs: [
		digit.times.any().grouped(),
		".",
		digit.times.any().grouped(),
		".",
		digit.times.any().grouped(),
	],
})

declare const value: string

if (semver.test(value)) {
	value satisfies `${number}.${number}.${number}`
}
```
