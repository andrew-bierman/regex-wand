# Support Matrix

`regex-wand` aims to support the useful intersection of Magic Regex authoring and
ArkRegex result typing. This document is the source of truth for what is
supported directly, what needs a documented escape hatch, and what remains a
technical gap.

See [roadmap.md](roadmap.md) for the public compatibility roadmap and upstream
feature audit.

## Fully Supported

| Area | Status |
| --- | --- |
| Magic Regex base primitives | Re-exported from `regex-wand` and supported in builders. |
| Plain string inputs | Escaped by Magic Regex, matching Magic Regex behavior. |
| Object-shaped definitions | `defineRegex({ inputs, match, flags })` is the recommended API for readable options. `pattern` is accepted as an alias for teams that prefer domain wording. |
| Magic-compatible positional builder | `createRegExp(...inputs)` mirrors Magic Regex's positional input API and preserves surrounding `${string}` inference. |
| Exact matching | `defineRegex({ match: "exact" })` and `createExactRegExp(...inputs)` add start/end anchors at runtime and in types. |
| Existing Magic Regex values | `fromMagic(magic)` adapts a `MagicRegExp` at the compile boundary. |
| Flag helpers | `createRegExpWithFlags(inputs, global, caseInsensitive)` and exact equivalent. |
| Flag arrays | `createRegExpWithFlags(inputs, [global, caseInsensitive])`. |
| Flag strings | `createRegExpWithFlags(inputs, "ig")`; normalized to native canonical order, including `"v"` on runtimes that support it. |
| Flag Sets | `createRegExpWithFlags(inputs, new Set([...]))`; narrow Set types preserve flag precision. |
| ArkRegex typed surface | `.infer`, `.inferCaptures`, `.inferNamedCaptures`, `.flags`, `test()` narrowing, and typed `exec()`. |
| Runtime RegExp protocols | Native `match`, `matchAll`, `replace`, `split`, `lastIndex`, `indices`, sticky, global, and `toRegExp()`. |
| ArkRegex runtime cost | ArkRegex is type-only in built `regex-wand` JavaScript. |
| Direct build-time transform | `regex-wand/transform` recognizes static direct and namespaced `regex-wand` builder calls, including `defineRegex`. |

## Supported With Escape Hatches

| Area | Path |
| --- | --- |
| Complex Magic Regex patterns ArkRegex cannot infer | Use `fromMagicAs<Pattern, Context>(magic)` to provide the ArkRegex result type manually. |
| Magic Regex transform compatibility | Use Magic Regex directly, enable `magic-regexp/transform`, then adapt with `fromMagic(magic)` at the boundary. |
| Broad dynamic flag Sets | Runtime works, but type precision depends on the Set element type. Use `new Set<typeof global \| typeof caseInsensitive>(...)` for narrow `.flags`. |

## Not Yet Supported Directly

| Area | Why |
| --- | --- |
| Dynamic builder expressions | Like Magic Regex's transform, `regex-wand/transform` only compiles expressions it can evaluate safely at build time. Dynamic expressions stay as runtime builder calls. |
| Magic Regex `further-magic` string method augmentation | Intentional non-goal. It augments string methods around Magic Regex's own branded type; use `magic-regexp/further-magic` directly when you want augmented `String.match`, `replace`, and iterator helper types. |
| Magic Regex converter wrapper | Use `magic-regexp/converter` directly. `regex-wand` does not currently add value around the converter output. |
| ArkType schema regex literals and `x/.../` exec mode | Use ArkType directly. `regex-wand` operates at the `RegExp` construction/adaptation layer, not the schema-validation layer. See [arktype-interop.md](arktype-interop.md). |
| Native `v` flag helper | Use the string form, for example `createRegExpWithFlags(inputs, "v")`. Magic Regex 0.11's public `Flag` helper type does not expose a named `v` helper. |

## Design Rule

If Magic Regex can produce a runtime `RegExp` and ArkRegex can infer it,
`regex-wand` should expose that type directly.

If runtime support exists but inference cannot be proven, `regex-wand` should
make the gap explicit with `WandCompatibilityError` or a manual `fromMagicAs`
escape hatch.

If support requires build-time code rewriting, it belongs in
`regex-wand/transform` rather than hidden runtime behavior.
