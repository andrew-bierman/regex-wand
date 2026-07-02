import { readFile } from "node:fs/promises"
import { join } from "node:path"

const root = process.cwd()
const packageJson = JSON.parse(
	await readFile(join(root, "packages/regex-wand/package.json"), "utf8"),
) as { version: string }
const lockfile = await readFile(join(root, "bun.lock"), "utf8")
const workspaceBlock = findObjectBlock(lockfile, '"packages/regex-wand":')
const lockfileVersion = workspaceBlock?.match(/"version":\s*"([^"]+)"/)?.[1]

if (!lockfileVersion) {
	console.error("Could not find packages/regex-wand workspace version in bun.lock.")
	process.exit(1)
}

if (lockfileVersion !== packageJson.version) {
	console.error(
		`bun.lock package version mismatch: packages/regex-wand is ${packageJson.version}, bun.lock has ${lockfileVersion}.`,
	)
	process.exit(1)
}

function findObjectBlock(source: string, marker: string) {
	const markerIndex = source.indexOf(marker)
	if (markerIndex < 0) return undefined

	const blockStart = source.indexOf("{", markerIndex + marker.length)
	if (blockStart < 0) return undefined

	let depth = 0
	for (let index = blockStart; index < source.length; index += 1) {
		const character = source[index]
		if (character === "{") depth += 1
		if (character === "}") depth -= 1
		if (depth === 0) return source.slice(blockStart, index + 1)
	}

	return undefined
}
