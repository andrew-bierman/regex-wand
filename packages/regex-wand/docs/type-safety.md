# Type Safety

`regex-wand` exists to combine two strengths:

- Magic Regex provides a pleasant compositional authoring API.
- ArkRegex provides richer inferred `RegExp` types.

The adapter is strict by default. If `regex-wand` cannot convert Magic Regex's
type-level `"/source/flags"` literal into an ArkRegex typed regex, the resulting
type includes `WandCompatibilityError` instead of pretending the value has strong
ArkRegex inference.

Runtime behavior can still work for native JavaScript regular expressions that
ArkRegex cannot infer today. Keep casts local and deliberate when testing those
runtime-only cases.

```ts
import { createExactRegExp, digit } from "regex-wand"

const version = createExactRegExp(
	digit.times.any().grouped(),
	".",
	digit.times.any().grouped(),
	".",
	digit.times.any().grouped(),
)

declare const input: string

if (version.test(input)) {
	input satisfies `${number}.${number}.${number}`
}
```

## Exact Versus Contains Inference

`createExactRegExp` anchors the pattern at the type and runtime boundary:

```ts
import { createExactRegExp, createRegExp, digit } from "regex-wand"

const exact = createExactRegExp("id:", digit.times.atLeast(1).grouped())
exact.infer satisfies `id:${number}`

const contains = createRegExp("id:", digit.times.atLeast(1).grouped())
contains.infer satisfies `${string}id:${number}${string}`
```

Use exact regexes when you want `test()` to narrow an arbitrary string to the
whole inferred pattern. Use contains regexes for search-style matching.

## Captures And Groups

Anonymous captures flow into `inferCaptures` and `exec()` result tuples. Named
captures flow into `inferNamedCaptures` and `exec().groups`.

```ts
import { createExactRegExp, digit } from "regex-wand"

const route = createExactRegExp(
	"/users/",
	digit.times.atLeast(1).as("userId"),
)

route.inferNamedCaptures.userId satisfies `${number}`

const match = route.exec("/users/42")
match?.groups.userId satisfies string | undefined
```

Optional captures are represented as optional tuple states rather than widened
away:

```ts
import { createExactRegExp, digit, maybe } from "regex-wand"

const maybeDigit = createExactRegExp(maybe(digit.grouped()))
maybeDigit.inferCaptures satisfies [undefined] | [`${number}`]
```

## Flags

Flag helpers are preserved in the type-level `flags` string in the order passed
to the helper. Runtime `RegExp#flags` still follows native JavaScript behavior.

```ts
import {
	caseInsensitive,
	createExactRegExpWithFlags,
	global,
} from "regex-wand"

const accepted = createExactRegExpWithFlags(["ok"], global, caseInsensitive)
accepted.flags satisfies "gi"
```

Duplicate flags are native `RegExp` errors at runtime. Keep flag composition
centralized when passing dynamic flag lists.

## Compatibility Errors

When ArkRegex cannot infer a Magic Regex literal, `regex-wand` exposes a
readable compatibility marker:

```ts
import type { MagicRegExp, WandRegExp } from "regex-wand"

type Invalid = WandRegExp<MagicRegExp<"/(/", never, [], never>>

// Invalid carries:
// WandCompatibilityError<"ArkRegex could not infer this pattern", "(">
```

This is deliberate. Runtime JavaScript may still support a pattern that the
type-level parser cannot prove. If you need one of those runtime-only patterns,
cast locally at the call site so the loss of inference remains visible.
