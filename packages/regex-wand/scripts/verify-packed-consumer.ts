import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { $ } from "bun"

const root = process.cwd()
const workspace = await mkdtemp(join(tmpdir(), "regex-wand-pack-"))
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"))
const tarballName = `${packageJson.name}-${packageJson.version}.tgz`
const semverType = [
	"`",
	"$",
	"{number}",
	".",
	"$",
	"{number}",
	".",
	"$",
	"{number}",
	"`",
].join("")

try {
	await $`bun pm pack --destination ${workspace}`.cwd(root).quiet()
	const tarball = join(workspace, tarballName)

	await writeFile(
		join(workspace, "package.json"),
		JSON.stringify(
			{
				type: "module",
				dependencies: {
					"regex-wand": tarball,
					typescript: "^5.9.3",
				},
				scripts: {
					check: "tsc --noEmit && bun run index.ts",
				},
			},
			null,
			2,
		),
	)

	await writeFile(
		join(workspace, "tsconfig.json"),
		JSON.stringify(
			{
				compilerOptions: {
					target: "ES2022",
					module: "NodeNext",
					moduleResolution: "NodeNext",
					strict: true,
					skipLibCheck: true,
				},
				include: ["index.ts"],
			},
			null,
			2,
		),
	)

	await writeFile(
		join(workspace, "index.ts"),
		[
			'import { createExactRegExp, digit } from "regex-wand"',
			"",
			'const semver = createExactRegExp(digit.grouped(), ".", digit.grouped(), ".", digit.grouped())',
			`const inferred: ${semverType} = semver.infer`,
			"void inferred",
			'if (!semver.test("1.2.3")) throw new Error("packed package did not match")',
			'if (semver.test("v1.2.3")) throw new Error("packed package did not anchor")',
			"",
		].join("\n"),
	)

	await $`bun install`.cwd(workspace).quiet()
	await $`bun run check`.cwd(workspace)
} finally {
	await rm(workspace, { recursive: true, force: true })
}
