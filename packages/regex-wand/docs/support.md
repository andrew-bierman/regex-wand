# Support Matrix

`regex-wand` aims to support the useful intersection of Magic Regex authoring and
ArkRegex result typing. This document is the source of truth for what is
supported directly, what needs a documented escape hatch, and what remains a
technical gap.

## Fully Supported

| Area | Status |
| --- | --- |
| Magic Regex base primitives | Re-exported from `regex-wand` and supported in builders. |
| Plain string inputs | Escaped by Magic Regex, matching Magic Regex behavior. |
| Contains matching | `createRegExp(...inputs)` preserves surrounding `${string}` inference. |
| Exact matching | `createExactRegExp(...inputs)` adds start/end anchors at runtime and in types. |
| Existing Magic Regex values | `fromMagic(magic)` adapts a `MagicRegExp` at the compile boundary. |
| Flag helpers | `createRegExpWithFlags(inputs, global, caseInsensitive)` and exact equivalent. |
| Flag arrays | `createRegExpWithFlags(inputs, [global, caseInsensitive])`. |
| Flag strings | `createRegExpWithFlags(inputs, "ig")`; normalized to native canonical order. |
| Flag Sets | `createRegExpWithFlags(inputs, new Set([...]))`; narrow Set types preserve flag precision. |
| ArkRegex typed surface | `.infer`, `.inferCaptures`, `.inferNamedCaptures`, `.flags`, `test()` narrowing, and typed `exec()`. |
| Runtime RegExp protocols | Native `match`, `matchAll`, `replace`, `split`, `lastIndex`, `indices`, sticky, global, and `toRegExp()`. |
| ArkRegex runtime cost | ArkRegex is type-only in built `regex-wand` JavaScript. |

## Supported With Escape Hatches

| Area | Path |
| --- | --- |
| Complex Magic Regex patterns ArkRegex cannot infer | Use `fromMagicAs<Pattern, Context>(magic)` to provide the ArkRegex result type manually. |
| Build-time-friendly app code | Use Magic Regex directly, enable `magic-regexp/transform`, then adapt with `fromMagic(magic)` at the boundary. |
| Broad dynamic flag Sets | Runtime works, but type precision depends on the Set element type. Use `new Set<typeof global \| typeof caseInsensitive>(...)` for narrow `.flags`. |

## Not Yet Supported Directly

| Area | Why |
| --- | --- |
| Direct `regex-wand/transform` | Magic Regex's transform only recognizes imports from `magic-regexp` and `magic-regexp/further-magic`. Direct `regex-wand` builders are small runtime adapters today. |
| Compiling direct `createExactRegExp(...)` calls away | This needs a regex-wand-aware transform that can preserve the runtime `magic`, `ark`, and `toRegExp()` contract or intentionally emit a plain typed `RegExp` shape. |
| Magic Regex `further-magic` string method augmentation | `regex-wand` focuses on the returned `RegExp` typed surface. Use `magic-regexp/further-magic` directly when you want its augmented `String.match`, `replace`, and iterator helper types. |
| Native `v` flag through Magic Regex builders | ArkRegex can model `v`, but Magic Regex 0.11's public `Flag` type does not expose `v`. |

## Design Rule

If Magic Regex can produce a runtime `RegExp` and ArkRegex can infer it,
`regex-wand` should expose that type directly.

If runtime support exists but inference cannot be proven, `regex-wand` should
make the gap explicit with `WandCompatibilityError` or a manual `fromMagicAs`
escape hatch.

If support would require build-time code rewriting, it belongs in a future
`regex-wand/transform` package entry rather than hidden runtime behavior.
