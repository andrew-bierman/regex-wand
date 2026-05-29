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
import { createExactRegExp, digit } from "regex-wand"

const version = createExactRegExp(
	digit.times.any().grouped(),
	".",
	digit.times.any().grouped(),
	".",
	digit.times.any().grouped(),
)

declare const input: string

if (version.test(input)) {
	input satisfies `${number}.${number}.${number}`
}
```
