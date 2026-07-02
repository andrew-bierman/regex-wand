# Testing Strategy

`regex-wand` is a small adapter, so the test suite focuses on contracts rather
than implementation volume.

## Runtime Tests

Command:

```sh
bun run test:coverage
```

Runtime tests use Vitest and cover:

- `createRegExp` contains-style matching.
- `createExactRegExp` start/end anchoring.
- Flag helpers, duplicate flag errors, and native flag behavior.
- Anonymous captures, named captures, optional captures, and `groups`.
- Escaped plain strings and escaped slash sources.
- Existing Magic Regex values adapted with `fromMagic`.
- Native string regex protocols: `match`, `matchAll`, `replace`, and `split`.
- `lastIndex` behavior for global and sticky regexes.
- Magic Regex lookarounds and backreferences at runtime.
- `magic`, `ark`, and `toRegExp()` interop behavior.
- Static direct and namespaced `regex-wand` builder calls through
  `RegexWandTransformPlugin`.
- Executed transform output that still behaves like a native `RegExp` plus the
  `regex-wand` adapter shape.
- `RegexWandTransformPlugin.esbuild()` through a real esbuild bundle.
- Dynamic transform expressions are left unchanged instead of guessed.

Coverage is kept high, but line coverage is not the only quality bar here
because most of the package value is in TypeScript inference and published
package shape.

## Type Tests

Command:

```sh
bun run type-test
```

Type tests use `tsd` and cover:

- `.infer` for exact and contains-style regexes.
- `test()` narrowing from `string` to inferred template literal types.
- `.inferCaptures` for anonymous and optional captures.
- `.inferNamedCaptures` and typed `exec().groups`.
- Flag literal preservation and ordering.
- Escaped slash parsing through `RegexParts`.
- Compatibility errors when ArkRegex cannot infer a Magic Regex literal.

## Package Integrity Tests

Command:

```sh
bun run check
```

The package check adds:

- TypeScript `--noEmit` checking.
- Build verification with `tsup`.
- A runtime import guard proving built JavaScript does not import ArkRegex.
- TanStack Intent skill validation.
- npm publish file assertions.
- A packed-consumer test that installs the generated tarball into a temporary
  project and verifies TypeScript plus runtime behavior from the package that
  would be published.

From the monorepo root, use:

```sh
bun run release:check
```

That adds playground checks, coverage, npm dry-run, and registry lookup.
