import type { Regex, regex } from "arkregex"
import {
	createRegExp as createMagicRegExp,
	type Flag,
	type Input,
	type MagicRegExp,
	exactly as magicExactly,
} from "magic-regexp"

export type { Flag, Input, MagicRegExp } from "magic-regexp"
export {
	anyOf,
	carriageReturn,
	caseInsensitive,
	char,
	charIn,
	charNotIn,
	digit,
	dotAll,
	exactly,
	global,
	letter,
	linefeed,
	maybe,
	multiline,
	not,
	oneOrMore,
	sticky,
	tab,
	unicode,
	whitespace,
	withIndices,
	word,
	wordBoundary,
	wordChar,
} from "magic-regexp"

type MagicInput = string | Input<string, string, (string | undefined)[]>
type RegexFlag = "d" | "g" | "i" | "m" | "s" | "u" | "v" | "y"
type ArkFlags =
	`${"d" | ""}${"g" | ""}${"i" | ""}${"m" | ""}${"s" | ""}${"u" | "v" | ""}${"y" | ""}`

type MagicFromInputs<Inputs extends readonly MagicInput[]> = ReturnType<
	typeof createMagicRegExp<[...Inputs]>
>

type MagicLiteral<R> =
	R extends MagicRegExp<infer Value, string, (string | undefined)[], string>
		? Value
		: never

type SplitMagicBody<
	Rest extends string,
	Source extends string = "",
> = Rest extends `${infer Before}\\/${infer After}`
	? SplitMagicBody<After, `${Source}${Before}/`>
	: Rest extends `${infer Before}/${infer Flags}`
		? [NormalizeRegexFlags<Flags>] extends [never]
			? never
			: NormalizeRegexFlags<Flags> extends infer NormalizedFlags extends ArkFlags
				? [source: `${Source}${Before}`, flags: NormalizedFlags]
				: never
		: never

type AreRegexFlags<Flags extends string> = Flags extends ""
	? true
	: Flags extends `${infer First}${infer Rest}`
		? First extends RegexFlag
			? AreRegexFlags<Rest>
			: false
		: false

type FlagTextIfPresent<
	Flags extends string,
	Candidate extends RegexFlag,
> = Flags extends `${string}${Candidate}${string}` ? Candidate : ""

type NormalizeRegexFlags<Flags extends string> =
	AreRegexFlags<Flags> extends true
		? `${FlagTextIfPresent<Flags, "d">}${FlagTextIfPresent<Flags, "g">}${FlagTextIfPresent<Flags, "i">}${FlagTextIfPresent<Flags, "m">}${FlagTextIfPresent<Flags, "s">}${FlagTextIfPresent<Flags, "u">}${FlagTextIfPresent<Flags, "v">}${FlagTextIfPresent<Flags, "y">}`
		: never

/**
 * Splits Magic Regex's type-level literal form into the source and flags that
 * ArkRegex expects.
 *
 * Magic Regex models compiled values as strings like `"/source/flags"`. This
 * helper preserves escaped forward slashes in the source so adapter types do not
 * split on `\/` inside a pattern.
 */
export type RegexParts<Value extends string> = Value extends `/${infer Body}`
	? SplitMagicBody<Body>
	: never

/**
 * Readable strict-mode marker returned when a Magic Regex value cannot be
 * converted into an ArkRegex-typed value.
 *
 * The adapter still works at runtime for native `RegExp` syntax supported by the
 * JavaScript engine. This type exists so library users do not silently lose the
 * ArkRegex type benefit when the type-level parser cannot prove compatibility.
 */
export type WandCompatibilityError<
	Reason extends string,
	Pattern extends string = string,
> = {
	readonly __regexWandCompatibilityError__: `${Reason}: ${Pattern}`
}

type WandExtractionError<R> = WandCompatibilityError<
	"Expected Magic Regex literal /source/flags",
	MagicLiteral<R>
>

type WandParseError<Source extends string> = WandCompatibilityError<
	"ArkRegex could not infer this pattern",
	Source
>

type ArkFromMagic<R> = [RegexParts<MagicLiteral<R>>] extends [never]
	? WandExtractionError<R>
	: RegexParts<MagicLiteral<R>> extends [
				infer Source extends string,
				infer FlagText extends ArkFlags,
			]
		? regex.parse<Source, FlagText> extends Regex
			? regex.parse<Source, FlagText>
			: WandParseError<Source>
		: WandExtractionError<R>

type FlagIfPresent<Flags extends readonly Flag[], Candidate extends string> =
	Extract<Flags[number], Candidate> extends never ? "" : Candidate

type CanonicalFlags<Flags extends readonly Flag[]> =
	`${FlagIfPresent<Flags, "d">}${FlagIfPresent<Flags, "g">}${FlagIfPresent<Flags, "i">}${FlagIfPresent<Flags, "m">}${FlagIfPresent<Flags, "s">}${FlagIfPresent<Flags, "u">}${FlagIfPresent<Flags, "v">}${FlagIfPresent<Flags, "y">}`

type WithFlags<R, Flags extends readonly Flag[]> =
	R extends MagicRegExp<
		`/${infer Source}/`,
		infer Groups extends string,
		infer Captures extends (string | undefined)[],
		string
	>
		? MagicRegExp<`/${Source}/${CanonicalFlags<Flags>}`, Groups, Captures, Flags[number]>
		: never

type Anchored<R> =
	R extends MagicRegExp<
		`/${infer Source}/`,
		infer Groups extends string,
		infer Captures extends (string | undefined)[],
		string
	>
		? MagicRegExp<`/^${Source}$/`, Groups, Captures, never>
		: never

export type WandRegExp<
	R extends MagicRegExp<string, string, (string | undefined)[], string>,
> = ArkFromMagic<R> & {
	/** The original Magic Regex value used to produce this adapter result. */
	readonly magic: R
	/** Alias to the ArkRegex-powered result for explicit interop. */
	readonly ark: ArkFromMagic<R>
	/** Create a plain native `RegExp` with the same source and flags. */
	toRegExp(): RegExp
}

/**
 * Adapt an existing Magic Regex value into a `WandRegExp`.
 *
 * Prefer `createRegExp` or `createExactRegExp` for new code. Use this when a
 * project already has a Magic Regex value and wants ArkRegex-powered types at
 * the final compiled boundary.
 */
export function fromMagic<
	const R extends MagicRegExp<string, string, (string | undefined)[], string>,
>(magic: R): WandRegExp<R> {
	const ark = new RegExp(magic.source, magic.flags) as unknown as ArkFromMagic<R>

	return Object.assign(ark, {
		magic,
		ark,
		toRegExp: () => new RegExp(magic.source, magic.flags),
	}) as WandRegExp<R>
}

/**
 * Compile Magic Regex inputs into an ArkRegex-powered contains-style `RegExp`.
 *
 * This mirrors Magic Regex authoring: strings are escaped by Magic Regex, and
 * Magic Regex fragments keep their original composition behavior.
 */
export function createRegExp<const Inputs extends readonly MagicInput[]>(
	...inputs: Inputs
): WandRegExp<MagicFromInputs<Inputs>>
export function createRegExp<const Inputs extends readonly MagicInput[]>(
	...inputs: Inputs
) {
	return fromMagic(createMagicRegExp(...inputs))
}

/**
 * Compile Magic Regex inputs with explicit flags.
 *
 * `inputs` is a tuple so the remaining parameters can stay reserved for Magic
 * Regex flag helpers while preserving literal flag order in the return type.
 */
export function createRegExpWithFlags<
	const Inputs extends readonly MagicInput[],
	const Flags extends readonly Flag[],
>(
	inputs: Inputs,
	...flags: Flags
): WandRegExp<WithFlags<MagicFromInputs<Inputs>, Flags>> {
	const magic = createMagicRegExp(...inputs, [...flags])
	return fromMagic(magic as unknown as WithFlags<MagicFromInputs<Inputs>, Flags>)
}

/**
 * Compile Magic Regex inputs into an ArkRegex-powered exact-match `RegExp`.
 *
 * Use this when `test()` should narrow the tested string to the inferred pattern
 * type without surrounding `${string}`.
 */
export function createExactRegExp<const Inputs extends readonly MagicInput[]>(
	...inputs: Inputs
): WandRegExp<Anchored<MagicFromInputs<Inputs>>>
export function createExactRegExp<const Inputs extends readonly MagicInput[]>(
	...inputs: Inputs
) {
	return fromMagic(
		createMagicRegExp(
			magicExactly(...inputs)
				.at.lineStart()
				.at.lineEnd(),
		),
	)
}

/**
 * Compile Magic Regex inputs into an exact-match `RegExp` with explicit flags.
 */
export function createExactRegExpWithFlags<
	const Inputs extends readonly MagicInput[],
	const Flags extends readonly Flag[],
>(
	inputs: Inputs,
	...flags: Flags
): WandRegExp<WithFlags<Anchored<MagicFromInputs<Inputs>>, Flags>> {
	const anchored = magicExactly(...inputs)
		.at.lineStart()
		.at.lineEnd()
	const unflagged = createMagicRegExp(anchored)
	const magic = createMagicRegExp(anchored, [...flags])

	return fromMagic(magic as unknown as WithFlags<typeof unflagged, Flags>) as WandRegExp<
		WithFlags<Anchored<MagicFromInputs<Inputs>>, Flags>
	>
}
