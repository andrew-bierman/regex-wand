# Changelog

## 0.4.2

- Clarified the public API positioning: `defineRegex({ inputs, match, flags })`
  is the recommended object API, while `createRegExp(...inputs)` is the
  Magic-compatible positional builder.
- Updated the README, support matrix, roadmap, and packaged agent skill to avoid
  implying a new regex DSL or a raw-pattern API.

## 0.4.1

- Renamed the recommended `defineRegex` object field from `pattern` to `inputs`
  so the API matches Magic Regex terminology and does not imply raw regex string
  syntax.
- Kept `pattern` as a typed legacy alias for `inputs` so `0.4.0` callers remain
  compatible.
- Updated docs, playground examples, runtime tests, type tests, and packed
  consumer verification to lead with `inputs`.

## 0.4.0

- Added `defineRegex({ pattern, match, flags })` as the recommended
  object-shaped API for readable contains/exact regex definitions.
- Added build-time transform support for static direct and namespaced
  `defineRegex` calls.
- Expanded runtime, `tsd`, transform, and packed-consumer coverage for the
  object API.
- Updated the README, support matrix, roadmap, type-safety docs, testing docs,
  and playground examples to lead with `defineRegex`.

## 0.3.8

- Added CI compatibility coverage across Bun and TypeScript versions.
- Added runtime parity tests comparing representative `regex-wand` patterns
  against raw Magic Regex behavior.
- Added playground comparison snippets for raw Magic Regex, raw ArkRegex, and
  `regex-wand`.

## 0.3.7

- Updated package metadata and public descriptions to match the launch README.
- Added playground social preview metadata for cleaner shared links.

## 0.3.6

- Reworked the GitHub and npm README opening sections for public launch.
- Improved playground first-run experience with install, npm, GitHub, docs, and
  stronger inferred-type context.
- Added clearer public-facing examples for why to use `regex-wand` over raw
  Magic Regex or raw ArkRegex.

## 0.3.5

- Expanded packed-consumer verification to install the generated tarball and
  build a Vite fixture through the published `regex-wand/transform` subpath.
- Added runtime and type coverage for native string `"v"` flags.
- Aligned Bun versions across package metadata and GitHub Actions.
- Clarified transform, support, and testing docs for public-readiness.

## 0.3.4

- Added a Vite fixture app that builds `regex-wand/transform` through a real
  Vite production build and verifies compiled output.
- Added an ArkType interop guide documenting when to use ArkType regex schemas
  and `x/.../` parsing directly.
- Marked Magic Regex `further-magic` as an intentional non-goal with direct
  `magic-regexp/further-magic` usage as the escape hatch.
- Expanded the playground with build-time transform and manual typing examples,
  plus a copyable Vite config snippet.

## 0.3.3

- Removed fully-unused `regex-wand` imports after transform compilation so
  static-only modules do not keep a runtime package import.
- Added a lockfile consistency check to keep the Bun workspace package version
  aligned with `packages/regex-wand/package.json`.

## 0.3.2

- Fixed `regex-wand/transform` in esbuild hosts by falling back to Acorn when a
  host parser is unavailable.
- Added an esbuild host-adapter test for the transform.
- Documented that Magic Regex converter interop remains docs-only because the
  upstream API returns generated source text.

## 0.3.1

- Added a public roadmap documenting upstream Magic Regex, ArkRegex, and ArkType
  compatibility gaps.
- Added transform-output execution coverage so the build-time plugin is tested
  beyond emitted-code string checks.

## 0.3.0

- Added `regex-wand/transform` with `RegexWandTransformPlugin`, an unplugin
  compatible with Vite, Rollup, Webpack, Rspack, esbuild, and other unplugin
  hosts.
- The transform recognizes static direct and namespaced `regex-wand` builder
  calls and emits native `RegExp` literals while preserving the adapter runtime
  shape: `magic`, `ark`, and `toRegExp()`.
- Added transform tests for direct builder calls, namespaced calls, and dynamic
  expressions that must be left unchanged.

## 0.2.1

- Added an explicit support matrix covering direct support, escape hatches, and
  known technical gaps.

## 0.2.0

- Added `fromMagicAs<Pattern, Context>(magic)` as an ArkRegex-style manual type
  escape hatch for Magic Regex values that are valid at runtime but too complex
  or dynamic for type-level inference.
- Expanded `createRegExpWithFlags` and `createExactRegExpWithFlags` to accept
  Magic Regex's documented flag forms: rest flag helpers, flag arrays, flag
  strings, and flag Sets.
- Added runtime and `tsd` coverage for manual typing and expanded flag inputs.
- Documented Magic Regex build-time transform constraints and the
  build-time-friendly `fromMagic(createRegExp(...))` boundary pattern.

## 0.1.4

- Loosened direct dependency ranges to explicit compatibility windows:
  `arkregex >=0.0.5 <0.1.0` and `magic-regexp >=0.11.0 <0.12.0`.

## 0.1.3

- Moved `magic-regexp` and `arkregex` from peer dependencies to direct
  dependencies so consumers only need to install `regex-wand`.
- Updated install docs to show `bun add regex-wand` and
  `npm install regex-wand`.
- Hardened packed-consumer verification to prove the published tarball works
  without explicitly installing the underlying libraries.

## 0.1.2

- Normalized regex flag order at the type level so Magic Regex values using
  non-canonical flag order still preserve ArkRegex inference.
- Added runtime and `tsd` coverage for adapting existing Magic Regex values with
  flags through `fromMagic`.
- Added a package testing strategy doc and clarified release workflow, GitHub
  Pages, private-repo publishing, and provenance behavior in the monorepo docs.

## 0.1.1

- Expanded runtime coverage for escaping, exact matching, flags, indices,
  string `RegExp` protocols, and `lastIndex` behavior.
- Expanded `tsd` coverage for exact and contains inference, flags, named groups,
  optional captures, `RegexParts`, and compatibility errors.
- Added monorepo release and publish scripts.
- Improved package docs for usage, type safety, verification, and publishing.

## 0.1.0

- Initial Magic Regex to ArkRegex adapter.
- Added exact and flagged compile helpers.
- Added runtime tests, type tests, coverage, packed-consumer validation, and
  TanStack Intent package skill metadata.
