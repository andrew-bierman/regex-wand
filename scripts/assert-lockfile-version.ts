import { readFile } from "node:fs/promises"
import { join } from "node:path"

const root = process.cwd()
const packageJson = JSON.parse(
	await readFile(join(root, "packages/regex-wand/package.json"), "utf8"),
) as { version: string }
const lockfile = await readFile(join(root, "bun.lock"), "utf8")

const workspaceMatch = lockfile.match(
	/"packages\/regex-wand":\s*\{[\s\S]*?"version":\s*"([^"]+)"/,
)

if (!workspaceMatch) {
	console.error("Could not find packages/regex-wand workspace version in bun.lock.")
	process.exit(1)
}

const lockfileVersion = workspaceMatch[1]
if (lockfileVersion !== packageJson.version) {
	console.error(
		`bun.lock package version mismatch: packages/regex-wand is ${packageJson.version}, bun.lock has ${lockfileVersion}.`,
	)
	process.exit(1)
}
