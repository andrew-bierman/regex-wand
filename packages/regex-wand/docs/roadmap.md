# Roadmap

`regex-wand` is public-facing glue between Magic Regex authoring and ArkRegex
typing. The roadmap is intentionally explicit so support gaps do not hide behind
the adapter.

## Public Compatibility Goal

`regex-wand` should be feature-complete for the intersection of:

- Magic Regex inputs that can produce a native `RegExp`.
- ArkRegex patterns that can expose sound `.infer`, `.inferCaptures`,
  `.inferNamedCaptures`, `.flags`, typed `exec()`, and `test()` narrowing.
- Native `RegExp` behavior in the JavaScript runtime.

When an upstream feature sits outside that intersection, the package should
provide one of three things:

- direct support,
- a documented escape hatch,
- or a clearly named roadmap gap.

## Current Roadmap

| Priority | Area | Current path | Target |
| --- | --- | --- | --- |
| P0 | Transform execution coverage | Static calls are transformed, executed, and verified through a real host adapter. | Keep transformed-output execution tests so emitted adapters are proven, not just snapshot-like. |
| P0 | Public support docs | `docs/support.md` lists direct support and gaps. | Keep this roadmap, support matrix, and testing matrix updated before each release. |
| P1 | Vite/host fixture for `regex-wand/transform` | A dedicated Vite fixture builds static `regex-wand` calls and verifies compiled output in CI. | Keep fixture checks green across Vite and unplugin updates. |
| P1 | Magic Regex converter interop | Use `magic-regexp/converter` directly. | Docs-only unless a wrapper can add real typed value beyond returning a string. |
| P1 | `further-magic` string method typing | Use `magic-regexp/further-magic` directly. | Intentional non-goal unless Magic Regex exposes an adapter-friendly extension point. |
| P1 | ArkType `x/.../` exec mode | Use ArkType directly for schema-level regex capture parsing. | Documented in `docs/arktype-interop.md`. |
| P2 | Dynamic transform expressions | Runtime builders work; transform intentionally skips dynamic inputs. | Consider opt-in partial evaluation only if it can stay predictable and safe. |
| P2 | Native `v` flag helper | String flags support `"v"` when the JavaScript runtime supports it. Magic Regex 0.11's public `Flag` type does not expose a named helper. | Add a named helper path if upstream Magic Regex exposes one. |

## Upstream Feature Audit

| Upstream feature | `regex-wand` status |
| --- | --- |
| Magic Regex `createRegExp` with variadic string/Input args | Supported by `createRegExp`. |
| Magic Regex escaped string semantics | Supported; plain strings are escaped by Magic Regex. |
| Magic Regex flags as helpers, arrays, strings, and Sets | Supported by `createRegExpWithFlags` and `createExactRegExpWithFlags`. |
| Magic Regex primitives and chained inputs | Re-exported and covered by runtime tests for representative primitives/chains. |
| Magic Regex named and anonymous groups | Supported at runtime and through ArkRegex capture types where inferable. |
| Magic Regex lookarounds and backreferences | Runtime-supported; ArkRegex precision depends on whether the resulting pattern can be inferred. |
| Magic Regex build-time transform | Use `regex-wand/transform` for direct static `regex-wand` calls, or raw Magic Regex plus `fromMagic`. |
| Magic Regex `further-magic` literal string match/replace result typing | Intentional non-goal; use `magic-regexp/further-magic` directly because it augments string methods around Magic Regex's own branded type. |
| Magic Regex converter | Intentionally not wrapped; use `magic-regexp/converter` directly because the upstream API returns generated source text and `regex-wand` cannot add type inference to that string. |
| ArkRegex `.infer`, captures, named captures, flags, `test()`, and `exec()` | Supported through the `WandRegExp` type surface. |
| ArkRegex `regex.as` manual typing | Supported as the adapter-shaped `fromMagicAs<Pattern, Context>(magic)`. |
| ArkRegex zero-runtime type layer | Supported; built `regex-wand` JavaScript is guarded against runtime `arkregex` imports. |
| ArkRegex 100% native `RegExp` syntax parity | Supported when the pattern can be produced by Magic Regex and inferred by ArkRegex; otherwise use `fromMagicAs`. |
| ArkType regex literals and `x/.../` capture parsing | Documented interop path; use ArkType directly for schema-level parsing. |

## Release Rule

Before calling the package feature-complete for a new area, the repo should have:

- a runtime test for behavior,
- a type test when the feature affects TypeScript inference,
- a docs entry in `support.md` or this roadmap,
- and packed-package verification if the feature affects published files.
