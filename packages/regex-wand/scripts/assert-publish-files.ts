import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { $ } from "bun"

const root = process.cwd()
const workspace = await mkdtemp(join(tmpdir(), "regex-wand-files-"))
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"))
const tarballName = `${packageJson.name}-${packageJson.version}.tgz`
const expectedFiles = [
	"package/CHANGELOG.md",
	"package/LICENSE",
	"package/README.md",
	"package/dist/index.d.ts",
	"package/dist/index.js",
	"package/dist/index.js.map",
	"package/docs/testing.md",
	"package/docs/type-safety.md",
	"package/package.json",
	"package/skills/core/SKILL.md",
]

try {
	await $`bun pm pack --destination ${workspace}`.cwd(root).quiet()

	const tarball = join(workspace, tarballName)
	const packedFiles = (await $`tar -tzf ${tarball}`.text()).trim().split("\n").sort()

	if (packedFiles.join("\n") !== expectedFiles.sort().join("\n")) {
		console.error("Unexpected npm package contents.")
		console.error("Expected:")
		console.error(expectedFiles.join("\n"))
		console.error("Actual:")
		console.error(packedFiles.join("\n"))
		process.exit(1)
	}
} finally {
	await rm(workspace, { recursive: true, force: true })
}
