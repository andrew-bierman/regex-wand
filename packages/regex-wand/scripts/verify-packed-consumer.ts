import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
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
					"@types/node": "^24.10.1",
					"regex-wand": tarball,
					typescript: "^5.9.3",
					vite: "^8.1.2",
				},
				scripts: {
					check:
						"tsc --noEmit && bun run index.ts && vite build && bun run verify-transform.ts",
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
				include: ["index.ts", "src/**/*.ts", "verify-transform.ts", "vite.config.ts"],
			},
			null,
			2,
		),
	)

	await mkdir(join(workspace, "src"))

	await writeFile(
		join(workspace, "index.ts"),
		[
			'import { defineRegex, digit } from "regex-wand"',
			"",
			"const semver = defineRegex({",
			'\tmatch: "exact",',
			'\tpattern: [digit.grouped(), ".", digit.grouped(), ".", digit.grouped()],',
			"})",
			`const inferred: ${semverType} = semver.infer`,
			"void inferred",
			'if (!semver.test("1.2.3")) throw new Error("packed package did not match")',
			'if (semver.test("v1.2.3")) throw new Error("packed package did not anchor")',
			"",
		].join("\n"),
	)

	await writeFile(
		join(workspace, "src/entry.ts"),
		[
			'import { defineRegex, digit } from "regex-wand"',
			"",
			"export const route = defineRegex({",
			'\tmatch: "exact",',
			'\tpattern: ["/users/", digit.times.atLeast(1).as("userId")],',
			"})",
			'export const acceptsUserRoute = route.test("/users/42")',
			"",
		].join("\n"),
	)

	await writeFile(
		join(workspace, "vite.config.ts"),
		[
			'import { defineConfig } from "vite"',
			'import { RegexWandTransformPlugin } from "regex-wand/transform"',
			"",
			"export default defineConfig({",
			"\tplugins: [RegexWandTransformPlugin.vite()],",
			"\tbuild: {",
			'\t\tlib: { entry: "src/entry.ts", formats: ["es"], fileName: () => "regex-wand-packed.js" },',
			"\t\tminify: false,",
			"\t},",
			"})",
			"",
		].join("\n"),
	)

	await writeFile(
		join(workspace, "verify-transform.ts"),
		[
			'import { readFile } from "node:fs/promises"',
			"",
			'const built = await readFile("dist/regex-wand-packed.js", "utf8")',
			'if (!built.includes("/^\\\\/users\\\\/(?<userId>\\\\d{1,})$/")) throw new Error("packed transform did not emit the route literal")',
			'if (!built.includes("Object.assign")) throw new Error("packed transform did not preserve adapter shape")',
			'if (built.includes("defineRegex(")) throw new Error("packed transform left a static builder call behind")',
			'if (built.includes("from \\"regex-wand\\"")) throw new Error("packed transform left a root regex-wand import behind")',
			"",
		].join("\n"),
	)

	await $`bun install`.cwd(workspace).quiet()
	await $`bun run check`.cwd(workspace)
} finally {
	await rm(workspace, { recursive: true, force: true })
}
