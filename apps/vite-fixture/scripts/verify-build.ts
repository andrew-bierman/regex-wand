import { readFile } from "node:fs/promises"

const output = await readFile("dist/regex-wand-vite-fixture.js", "utf8")

const expected = ["/^\\/users\\/(?<userId>\\d{1,})$/", "Object.assign", "toRegExp"]
const forbidden = ["createExactRegExp(", 'from "regex-wand"', 'from "magic-regexp"']

for (const text of expected) {
	if (!output.includes(text)) {
		console.error(`Expected Vite build output to include ${JSON.stringify(text)}.`)
		process.exit(1)
	}
}

for (const text of forbidden) {
	if (output.includes(text)) {
		console.error(`Expected Vite build output not to include ${JSON.stringify(text)}.`)
		process.exit(1)
	}
}
