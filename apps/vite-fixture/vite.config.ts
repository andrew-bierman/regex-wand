import { RegexWandTransformPlugin } from "regex-wand/transform"
import { defineConfig } from "vite"

export default defineConfig({
	plugins: [RegexWandTransformPlugin.vite()],
	build: {
		emptyOutDir: true,
		lib: {
			entry: "src/main.ts",
			formats: ["es"],
			fileName: () => "regex-wand-vite-fixture.js",
		},
		minify: false,
		rollupOptions: {
			external: [],
		},
	},
})
