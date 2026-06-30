# Contributing

Thanks for helping improve `regex-wand`.

## Setup

```sh
bun install
```

## Checks

Run the CI gate before opening a pull request:

```sh
bun run ci:check
```

For release preparation, run the stricter publish-aware gate:

```sh
bun run release:check
```

`release:check` includes npm registry operations and may require publish
credentials locally.

## Project Layout

- `packages/regex-wand` contains the published npm package.
- `apps/playground` contains the static GitHub Pages playground.
- `.github/workflows/ci.yml` runs the unauthenticated CI gate.
- `.github/workflows/release.yml` publishes npm releases.
- `.github/workflows/pages.yml` deploys the playground.

## Pull Request Expectations

- Keep changes focused.
- Add or update runtime tests for behavior changes.
- Add or update `tsd` tests for type-surface changes.
- Update docs when behavior, commands, or release flow changes.
- Do not commit generated build output from `dist` or coverage artifacts.
