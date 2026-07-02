# Changelog

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
