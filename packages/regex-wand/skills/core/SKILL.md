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
- Use `createRegExp(...inputs)` for contains-style matching.
- Use `createExactRegExp(...inputs)` when `test()` should narrow to the exact
  inferred string shape.
- Use `createRegExpWithFlags(inputs, ...flags)` or
  `createExactRegExpWithFlags(inputs, ...flags)` when flags must be part of the
  inferred type.
- Use `fromMagic(magic)` only when an existing Magic Regex value already exists.

## Common Mistakes

- Do not build a competing fragment DSL around `regex-wand`.
- Do not hide a strict compatibility error by casting to `RegExp` in library code.
  Casts are acceptable only in runtime tests that intentionally cover Magic Regex
  fragments ArkRegex cannot currently infer.
- Do not pass raw regex syntax as a string when Magic Regex would escape it. Use
  Magic Regex helpers for anchors, groups, boundaries, and alternatives.

## Example

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
