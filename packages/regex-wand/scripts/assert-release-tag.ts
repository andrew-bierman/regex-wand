import { readFile } from "node:fs/promises"
import { join } from "node:path"

const tag = process.argv[2] ?? process.env.GITHUB_REF_NAME

if (!tag) {
	console.error("Expected a release tag from GITHUB_REF_NAME or the first argument.")
	process.exit(1)
}

const packageJson = JSON.parse(
	await readFile(join(process.cwd(), "package.json"), "utf8"),
)
const expectedTag = `v${packageJson.version}`

if (tag !== expectedTag) {
	console.error(
		`Release tag ${tag} does not match package version ${packageJson.version}.`,
	)
	console.error(`Expected tag: ${expectedTag}`)
	process.exit(1)
}
