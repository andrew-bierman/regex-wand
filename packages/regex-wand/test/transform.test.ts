import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { parse } from "acorn"
import { build } from "esbuild"
import { describe, expect, it } from "vitest"
import { RegexWandTransformPlugin } from "../src/transform.js"

type TransformHandler = (
	this: { parse: (code: string) => unknown },
	code: string,
	id: string,
) =>
	| Promise<{ code: string; map: null } | undefined>
	| { code: string; map: null }
	| undefined

const rawPlugin = RegexWandTransformPlugin.raw({}, { framework: "rollup", versions: {} })
if (Array.isArray(rawPlugin)) {
	throw new TypeError("RegexWandTransformPlugin should return a single plugin")
}

const transform = rawPlugin.transform
const transformInclude = rawPlugin.transformInclude
if (!transform) {
	throw new TypeError("RegexWandTransformPlugin must expose a transform hook")
}

const transformHandler: TransformHandler = (
	typeof transform === "function" ? transform : transform.handler
) as TransformHandler

describe("RegexWandTransformPlugin", () => {
	const context = {
		parse: (code: string) =>
			parse(code, {
				ecmaVersion: "latest",
				sourceType: "module",
			}),
	}

	it("compiles direct regex-wand builder calls while preserving adapter shape", async () => {
		const result = await transformHandler.call(
			context,
			`import { createExactRegExp, digit } from "regex-wand"

const route = createExactRegExp("/users/", digit.times.atLeast(1).as("userId"))
route.toRegExp()`,
			"route.ts",
		)

		expect(result?.code).toContain("Object.assign")
		expect(result?.code).toContain("ark: regex")
		expect(result?.code).toContain("toRegExp")
		expect(result?.code).toContain("/^\\/users\\/(?<userId>\\d{1,})$/")
		expect(result?.code).not.toContain("createExactRegExp(")
		expect(result?.code).not.toContain('from "regex-wand"')
	})

	it("emits executable adapters that preserve native RegExp behavior", async () => {
		const result = await transformHandler.call(
			context,
			`import { createExactRegExp, digit } from "regex-wand"

const route = createExactRegExp("/users/", digit.times.atLeast(1).as("userId"))`,
			"execute.ts",
		)

		expect(result?.code).toBeDefined()

		const executableCode = `${result?.code.replace(/^import .*$/m, "")}\nreturn route`
		const route = new Function(executableCode)() as RegExp & {
			ark: RegExp
			magic: RegExp
			toRegExp: () => RegExp
		}

		expect(route.test("/users/42")).toBe(true)
		expect(route.test("/teams/42")).toBe(false)
		expect(route.exec("/users/42")?.groups).toEqual({ userId: "42" })
		expect(route.ark).toBe(route)
		expect(route.magic).toBeInstanceOf(RegExp)
		expect(route.toRegExp()).not.toBe(route)
		expect(route.toRegExp().source).toBe(route.source)
	})

	it("runs through the esbuild host adapter", async () => {
		const workspace = await mkdtemp(join(tmpdir(), "regex-wand-esbuild-"))
		const entry = join(workspace, "entry.ts")

		try {
			await writeFile(
				entry,
				`import { createExactRegExp, digit } from "regex-wand"

export const route = createExactRegExp("/users/", digit.times.atLeast(1).as("userId"))
export const ok = route.test("/users/42")`,
			)

			const result = await build({
				entryPoints: [entry],
				bundle: true,
				format: "iife",
				globalName: "RegexWandBundle",
				platform: "node",
				write: false,
				plugins: [RegexWandTransformPlugin.esbuild()],
			})

			const bundled = result.outputFiles[0]?.text ?? ""
			const exports = new Function(`${bundled}\nreturn RegexWandBundle`)() as {
				ok: boolean
				route: RegExp & { ark: RegExp; magic: RegExp; toRegExp: () => RegExp }
			}

			expect(bundled).toContain("/^\\/users\\/(?<userId>\\d{1,})$/")
			expect(bundled).toContain("Object.assign")
			expect(bundled).not.toContain("createExactRegExp(")
			expect(exports.ok).toBe(true)
			expect(exports.route.exec("/users/42")?.groups).toEqual({ userId: "42" })
			expect(exports.route.ark).toBe(exports.route)
			expect(exports.route.toRegExp()).not.toBe(exports.route)
		} finally {
			await rm(workspace, { force: true, recursive: true })
		}
	})

	it("compiles namespaced builder calls", async () => {
		const result = await transformHandler.call(
			context,
			`import * as wand from "regex-wand"

const id = wand.createRegExp("id:", wand.digit.times.atLeast(1).grouped())`,
			"namespaced.ts",
		)

		expect(result?.code).toContain("/id:(\\d{1,})/")
		expect(result?.code).not.toContain("wand.createRegExp(")
		expect(result?.code).not.toContain('from "regex-wand"')
	})

	it("keeps mixed regex-wand imports when a runtime binding remains", async () => {
		const result = await transformHandler.call(
			context,
			`import { createRegExp, digit, fromMagic } from "regex-wand"

const id = createRegExp("id:", digit.times.atLeast(1).grouped())
export { fromMagic }`,
			"mixed.ts",
		)

		expect(result?.code).toContain('from "regex-wand"')
		expect(result?.code).toContain("fromMagic")
		expect(result?.code).not.toContain("createRegExp(")
	})

	it("compiles multiple calls from string-named import specifiers", async () => {
		const result = await transformHandler.call(
			context,
			`import { "createRegExp" as rx, digit } from "regex-wand"

const first = rx("id:", digit.times.atLeast(1).grouped())
const second = rx("slug")`,
			"multi.ts",
		)

		expect(result?.code.match(/Object\.assign/g)).toHaveLength(2)
		expect(result?.code).toContain("/id:(\\d{1,})/")
		expect(result?.code).toContain("/slug/")
	})

	it("leaves dynamic builder calls unchanged", async () => {
		const result = await transformHandler.call(
			context,
			`import { createRegExp } from "regex-wand"

const piece = "id:"
const id = createRegExp(piece)`,
			"dynamic.ts",
		)

		expect(result).toBeUndefined()
	})

	it("ignores files without regex-wand imports or supported builders", async () => {
		const noImport = await transformHandler.call(
			context,
			`const packageName = "regex-wand"`,
			"plain.ts",
		)
		const unsupportedImport = await transformHandler.call(
			context,
			`import nope, { WandCompatibilityError } from "regex-wand"

const value = "ok"`,
			"types.ts",
		)

		expect(noImport).toBeUndefined()
		expect(unsupportedImport).toBeUndefined()
	})

	it("matches script files and Vue script blocks", () => {
		expect(transformInclude?.("example.ts")).toBe(true)
		expect(transformInclude?.("example.vue")).toBe(true)
		expect(transformInclude?.("example.vue?type=script")).toBe(true)
		expect(transformInclude?.("example.vue?type=style")).toBe(false)
		expect(transformInclude?.("example.css")).toBe(false)
	})
})
