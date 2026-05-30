import { rm } from "node:fs/promises"
import tailwind from "bun-plugin-tailwind"

await rm("./dist", { force: true, recursive: true })

const result = await Bun.build({
	entrypoints: ["./index.html"],
	outdir: "./dist",
	minify: true,
	plugins: [tailwind],
})

if (!result.success) {
	for (const log of result.logs) {
		console.error(log)
	}

	process.exit(1)
}
