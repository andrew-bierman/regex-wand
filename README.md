# regex-wand monorepo

Magic Regex authoring with ArkRegex-powered type inference.

This repo contains the published npm package and a static playground that shows
the inferred TypeScript surface in Monaco.

## Workspaces

- `packages/regex-wand` - npm package published as `regex-wand`.
- `apps/playground` - static React playground for examples and type inspection.

## Development

```sh
bun install
bun run check
bun run dev
```

Useful commands:

```sh
bun run build
bun run test
bun run test:coverage
bun run release:check
bun run publish:dry-run
```

`bun run release:check` is the required pre-release gate. It runs lint,
TypeScript, package build, runtime tests, type tests, intent validation, publish
file assertions, packed-consumer verification, playground checks, coverage, an
npm publish dry-run, and a registry lookup.

## Versioning

`regex-wand` uses semver.

- Patch: docs, test hardening, release automation, and compatible bug fixes.
- Minor: new compatible APIs or broader supported Magic Regex/ArkRegex behavior.
- Major: breaking runtime API changes or intentional type-surface breaks.

The package version lives in `packages/regex-wand/package.json`. Update
`packages/regex-wand/CHANGELOG.md` in the same PR as the version bump.

## Release Flow

Automated releases are tag-driven.

1. Update `packages/regex-wand/package.json` to the next version.
2. Update `packages/regex-wand/CHANGELOG.md`.
3. Run:

   ```sh
   bun run release:check
   ```

4. Merge the release PR to `main`.
5. Create and push a matching version tag:

   ```sh
   git checkout main
   git pull --ff-only origin main
   git tag v0.1.1
   git push origin v0.1.1
   ```

The `Release` GitHub Actions workflow runs when a GitHub Release is published.
It verifies that the release tag matches the package version, runs the Bun check
suite, verifies the npm package contents with an npm dry-run, and publishes the
package to npm with provenance. This follows the same trusted-publishing pattern
used in the other package repos: Bun owns install/build/test, npm 11 owns the
final provenance publish in GitHub Actions.

Manual publishing from a local machine should only be a fallback:

```sh
bun run publish:regex-wand
```

## Required GitHub Secrets And Settings

Configure npm trusted publishing for `regex-wand`:

- Publisher: GitHub Actions
- Organization/user: `andrew-bierman`
- Repository: `regex-wand`
- Workflow: `release.yml`

The release workflow uses GitHub OIDC permissions for npm provenance, so it does
not require a long-lived npm token. The package also has
`"publishConfig": { "provenance": true }`.

For the playground, enable GitHub Pages with source set to **GitHub Actions**.
The `Pages` workflow builds `apps/playground/dist` and deploys it automatically
on pushes to `main` that affect the playground, package, lockfile, or workflow.

## Playground / Examples

Yes, the examples can be static GitHub Pages. The playground build emits plain
static files:

```sh
bun run --filter './apps/playground' build
```

The output is `apps/playground/dist`, and the Pages workflow uploads that
directory. The app uses relative asset paths, so it works under the repository
Pages URL path.

## Package Docs

Package-level usage and type-safety docs live in:

- `packages/regex-wand/README.md`
- `packages/regex-wand/docs/type-safety.md`
