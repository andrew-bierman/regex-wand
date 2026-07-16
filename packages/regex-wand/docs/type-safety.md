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
import { defineRegex, digit } from "regex-wand"

const version = defineRegex({
	match: "exact",
	pattern: [
		digit.times.any().grouped(),
		".",
		digit.times.any().grouped(),
		".",
		digit.times.any().grouped(),
	],
})

declare const input: string

if (version.test(input)) {
	input satisfies `${number}.${number}.${number}`
}
```

## Exact Versus Contains Inference

`defineRegex({ match: "exact" })` anchors the pattern at the type and runtime
boundary. Omitting `match` keeps the default contains-style behavior:

```ts
import { defineRegex, digit } from "regex-wand"

const exact = defineRegex({
	match: "exact",
	pattern: ["id:", digit.times.atLeast(1).grouped()],
})
exact.infer satisfies `id:${number}`

const contains = defineRegex({
	pattern: ["id:", digit.times.atLeast(1).grouped()],
})
contains.infer satisfies `${string}id:${number}${string}`
```

Use exact regexes when you want `test()` to narrow an arbitrary string to the
whole inferred pattern. Use contains regexes for search-style matching.

## Captures And Groups

Anonymous captures flow into `inferCaptures` and `exec()` result tuples. Named
captures flow into `inferNamedCaptures` and `exec().groups`.

```ts
import { defineRegex, digit } from "regex-wand"

const route = defineRegex({
	match: "exact",
	pattern: ["/users/", digit.times.atLeast(1).as("userId")],
})

route.inferNamedCaptures.userId satisfies `${number}`

const match = route.exec("/users/42")
match?.groups.userId satisfies string | undefined
```

Optional captures are represented as optional tuple states rather than widened
away:

```ts
import { defineRegex, digit, maybe } from "regex-wand"

const maybeDigit = defineRegex({
	match: "exact",
	pattern: [maybe(digit.grouped())],
})
maybeDigit.inferCaptures satisfies [undefined] | [`${number}`]
```

## Flags

Flag helpers are preserved in the type-level `flags` string in the order passed
to the helper. Runtime `RegExp#flags` still follows native JavaScript behavior.

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
```

The flag helpers also accept Magic Regex's documented flag container forms:

```ts
import { caseInsensitive, defineRegex, global } from "regex-wand"

defineRegex({ flags: "ig", pattern: ["ok"] }).flags satisfies "gi"
defineRegex({ flags: [global, caseInsensitive], pattern: ["ok"] }).flags satisfies
	"gi"
defineRegex({
	flags: new Set<typeof global | typeof caseInsensitive>([
		global,
		caseInsensitive,
	]),
	pattern: ["ok"],
}).flags satisfies "gi"
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
prefer `fromMagicAs` to provide the ArkRegex result type manually:

```ts
import { createRegExp, digit } from "magic-regexp"
import { fromMagicAs } from "regex-wand"

const magic = createRegExp("feature:", digit.times.atLeast(1).as("id"))

const feature = fromMagicAs<
	`${string}feature:${number}${string}`,
	{ names: { id: `${number}` } }
>(magic)

feature.inferNamedCaptures.id satisfies `${number}`
```

Use local casts only for runtime tests or when you intentionally want to give up
the typed surface.
