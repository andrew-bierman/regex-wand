import { readFile } from "node:fs/promises"

const builtRuntime = await readFile(new URL("../dist/index.js", import.meta.url), "utf8")

if (builtRuntime.includes("arkregex")) {
	console.error("dist/index.js must not import arkregex at runtime.")
	process.exit(1)
}
