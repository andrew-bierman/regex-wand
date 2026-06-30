# Changelog

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
