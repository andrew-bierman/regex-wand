export const regexWandTypes = `
declare module "regex-wand" {
	type WandRegExp<
		Infer extends string,
		Captures extends readonly unknown[] = [],
		NamedCaptures extends Record<string, unknown> = {},
		Flags extends string = ""
	> = Omit<RegExp, "exec" | "flags" | "test"> & {
		readonly infer: Infer
		readonly inferCaptures: Captures
		readonly inferNamedCaptures: NamedCaptures
		readonly flags: Flags
		test(value: string): value is Infer
		exec(value: string): (RegExpExecArray & { groups: NamedCaptures }) | null
	}

	type NumberCapture = { readonly __regexWandKind: "number-capture" }
	type NamedNumberCapture<Key extends string> = {
		readonly __regexWandKind: "named-number-capture"
		readonly key: Key
	}

	type DigitInput = {
		grouped(): NumberCapture
		as<Key extends string>(key: Key): NamedNumberCapture<Key>
		readonly times: {
			any(): { grouped(): NumberCapture }
			atLeast(count: number): {
				grouped(): NumberCapture
				as<Key extends string>(key: Key): NamedNumberCapture<Key>
			}
		}
	}

	export const digit: DigitInput
	export const caseInsensitive: "i"
	export function anyOf<const Values extends readonly string[]>(
		...values: Values
	): Values[number]

	export function createExactRegExp(
		major: NumberCapture,
		firstDot: ".",
		minor: NumberCapture,
		secondDot: ".",
		patch: NumberCapture
	): WandRegExp<
		\`\${number}.\${number}.\${number}\`,
		[\`\${number}\`, \`\${number}\`, \`\${number}\`]
	>

	export function createExactRegExp<Key extends string>(
		prefix: "/users/",
		id: NamedNumberCapture<Key>
	): WandRegExp<
		\`/users/\${number}\`,
		[],
		{ [K in Key]: \`\${number}\` }
	>

	export function createExactRegExpWithFlags<const Value extends string>(
		inputs: [Value],
		flag: "i"
	): WandRegExp<Lowercase<Value> | Uppercase<Value>, [], {}, "i">
}
`
