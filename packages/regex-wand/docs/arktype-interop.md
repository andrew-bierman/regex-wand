# ArkType Interop

`regex-wand` adapts Magic Regex-built `RegExp` values to an ArkRegex-powered
type surface. ArkType sits one layer higher: it validates data shapes and can use
ArkRegex syntax directly inside schemas.

Use `regex-wand` when regex construction is the primary problem:

```ts
import { defineRegex, digit } from "regex-wand"

const userRoute = defineRegex({
	match: "exact",
	pattern: ["/users/", digit.times.atLeast(1).as("userId")],
})

userRoute.inferNamedCaptures.userId satisfies `${number}`
```

Use ArkType directly when schema validation is the primary problem:

```ts
import { type } from "arktype"

const UserRoute = type("/^\\/users\\/(?<userId>\\d{1,})$/")

const result = UserRoute("/users/42")
```

Use ArkType's `x/.../` form directly when you want schema-level capture parsing
from a raw regex literal. `regex-wand` does not wrap this because it would need
to leave the Magic Regex authoring layer and become an ArkType schema builder.

```ts
import { type } from "arktype"

const RouteMatch = type("x/^\\/users\\/(?<userId>\\d{1,})$/")

const result = RouteMatch("/users/42")
```

## Combining Both

For apps that use both libraries, keep the boundary explicit:

- `regex-wand` for authored `RegExp` values used by runtime matching,
  string helpers, routing, parsing, or editor tooling.
- ArkType for validating object schemas, request bodies, config, and
  schema-level regex parsing.

If you already have a raw regex string and want ArkType validation, use ArkType.
If you are composing the regex from Magic Regex inputs and want ArkRegex-style
result types on the final `RegExp`, use `regex-wand`.
