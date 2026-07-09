import { createRegExp as createMagicRegExp, type MagicRegExp } from "magic-regexp"
import {
	anyOf,
	caseInsensitive,
	createExactRegExp,
	createExactRegExpWithFlags,
	createRegExp,
	createRegExpWithFlags,
	digit,
	dotAll,
	fromMagic,
	fromMagicAs,
	global,
	letter,
	maybe,
	multiline,
	oneOrMore,
	type RegexParts,
	type WandCompatibilityError,
	type WandRegExp,
	withIndices,
} from "regex-wand"
import { expectAssignable, expectError, expectType } from "tsd"

const semver = createExactRegExp(
	digit.times.any().grouped(),
	".",
	digit.times.any().grouped(),
	".",
	digit.times.any().grouped(),
)

expectType<`${number}.${number}.${number}`>(semver.infer)
expectType<`${number}.${number}.${number}`>(semver.ark.infer)
expectType<[`${number}`, `${number}`, `${number}`]>(semver.inferCaptures)
expectAssignable<RegExp>(semver)

const maybeVersion = "1.2.3" as string
if (semver.test(maybeVersion)) {
	expectType<`${number}.${number}.${number}`>(maybeVersion)
}

const ok = createExactRegExpWithFlags(["ok"], caseInsensitive)
expectType<"ok" | "oK" | "Ok" | "OK">(ok.infer)
expectType<"i">(ok.flags)

const exactGlobalInsensitive = createExactRegExpWithFlags(["ok"], global, caseInsensitive)
expectType<"gi">(exactGlobalInsensitive.flags)
expectType<"ok" | "oK" | "Ok" | "OK">(exactGlobalInsensitive.infer)

const exactInsensitiveGlobal = createExactRegExpWithFlags(["ok"], caseInsensitive, global)
expectType<"gi">(exactInsensitiveGlobal.flags)
expectType<"ok" | "oK" | "Ok" | "OK">(exactInsensitiveGlobal.infer)

const answer = createExactRegExp(anyOf("yes", "no"))
expectType<"yes" | "no">(answer.infer)

const repeated = createRegExpWithFlags([digit.grouped()], global)
expectType<`${number}`>(repeated.infer)
expectType<"g">(repeated.flags)
expectType<[`${number}`]>(repeated.inferCaptures)
expectAssignable<RegExp>(repeated.toRegExp())
expectType<typeof repeated.magic>(repeated.magic)
expectType<typeof repeated.ark>(repeated.ark)

const indexed = createRegExpWithFlags([digit.grouped()], withIndices)
expectType<"d">(indexed.flags)

const multilineDotAll = createRegExpWithFlags(["a", "b"], multiline, dotAll)
expectType<"ms">(multilineDotAll.flags)
expectType<`${string}ab${string}`>(multilineDotAll.infer)

const stringFlags = createRegExpWithFlags(["ok"], "ig")
expectType<"gi">(stringFlags.flags)

const unicodeSetFlags = createRegExpWithFlags(["ok"], "v")
expectType<"v">(unicodeSetFlags.flags)

const arrayFlags = createRegExpWithFlags(["ok"], [global, caseInsensitive])
expectType<"gi">(arrayFlags.flags)

const setFlags = createExactRegExpWithFlags(
	["ok"],
	new Set<typeof global | typeof caseInsensitive>([global, caseInsensitive]),
)
expectType<"gi">(setFlags.flags)

const namedIdentifier = <K extends string>(key: K) => oneOrMore(digit).or("name").as(key)

const email = createExactRegExp(
	namedIdentifier("name"),
	"@",
	namedIdentifier("domain"),
	".",
	namedIdentifier("tld"),
)

const emailMatch = email.exec("me@example.com")
if (emailMatch?.groups) {
	expectAssignable<string | undefined>(emailMatch.groups.name)
	expectAssignable<string | undefined>(emailMatch.groups.domain)
	expectAssignable<string | undefined>(emailMatch.groups.tld)
	expectError(emailMatch.groups.missing)
}
expectAssignable<"name" | "domain" | "tld">(
	null as never as keyof typeof email.inferNamedCaptures,
)

const optionalNamed = createExactRegExp(maybe(digit.as("maybeDigit")))
const optionalMatch = optionalNamed.exec("")
if (optionalMatch?.groups) {
	expectAssignable<string | undefined>(optionalMatch.groups.maybeDigit)
	expectError(optionalMatch.groups.nope)
}

const optionalAnonymous = createExactRegExp(maybe(digit.grouped()))
expectType<[undefined] | [`${number}`]>(optionalAnonymous.inferCaptures)

const idInsideText = createRegExp("id:", digit.times.atLeast(1).grouped())
expectType<`${string}id:${number}${string}`>(idInsideText.infer)

const userRoute = createExactRegExp("/users/", digit.times.atLeast(1).as("userId"))
expectType<`/users/${number}`>(userRoute.infer)
expectType<{ userId: `${number}` }>(userRoute.inferNamedCaptures)

const lowerWord = createExactRegExp(oneOrMore(letter.lowercase).as("word"))
const lowerWordMatch = lowerWord.exec("abc")
if (lowerWordMatch?.groups) {
	expectAssignable<string | undefined>(lowerWordMatch.groups.word)
	expectError(lowerWordMatch.groups.id)
}

const slashy = createExactRegExp("api/v1")
expectType<"api/v1">(slashy.infer)
expectType<[source: "a/b", flags: "i"]>(null as never as RegexParts<"/a\\/b/i">)
expectType<[source: "ok", flags: "gi"]>(null as never as RegexParts<"/ok/ig">)
expectType<[source: "api/v1/users", flags: "g"]>(
	null as never as RegexParts<"/api\\/v1\\/users/g">,
)
expectType<never>(null as never as RegexParts<"not-a-regex-literal">)

type InvalidArkRegex = WandRegExp<MagicRegExp<"/(/", never, [], never>>
expectAssignable<WandCompatibilityError<"ArkRegex could not infer this pattern", "(">>(
	null as never as InvalidArkRegex,
)
expectError((null as never as InvalidArkRegex).test("nope"))

type InvalidArkFlags = WandRegExp<MagicRegExp<"/a/z", never, [], never>>
expectAssignable<
	WandCompatibilityError<"Expected Magic Regex literal /source/flags", "/a/z">
>(null as never as InvalidArkFlags)
expectError((null as never as InvalidArkFlags).test("a"))

type InvalidMagicLiteral = WandRegExp<
	MagicRegExp<"not-a-regex-literal", never, [], never>
>
expectAssignable<
	WandCompatibilityError<
		"Expected Magic Regex literal /source/flags",
		"not-a-regex-literal"
	>
>(null as never as InvalidMagicLiteral)

const existingMagic = createMagicRegExp("id:", digit.times.atLeast(1).as("id"))
const adaptedMagic = fromMagic(existingMagic)
expectType<`${string}id:${number}${string}`>(adaptedMagic.infer)
expectType<{ id: `${number}` }>(adaptedMagic.inferNamedCaptures)
expectType<typeof existingMagic>(adaptedMagic.magic)
expectAssignable<RegExp>(adaptedMagic.toRegExp())

const existingMagicWithFlags = createMagicRegExp("ok", [caseInsensitive, global])
const adaptedMagicWithFlags = fromMagic(existingMagicWithFlags)
expectType<
	| `${string}ok${string}`
	| `${string}oK${string}`
	| `${string}Ok${string}`
	| `${string}OK${string}`
>(adaptedMagicWithFlags.infer)
expectType<"gi">(adaptedMagicWithFlags.flags)
expectAssignable<RegExp>(adaptedMagicWithFlags)

const manualMagic = createMagicRegExp("feature:", digit.times.atLeast(1).as("id"))
const manualWand = fromMagicAs<
	`${string}feature:${number}${string}`,
	{ names: { id: `${number}` } }
>(manualMagic)
expectType<`${string}feature:${number}${string}`>(manualWand.infer)
expectType<{ id: `${number}` }>(manualWand.inferNamedCaptures)
expectAssignable<string | undefined>(manualWand.exec("feature:42")?.groups.id)
