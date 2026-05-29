import type { MagicRegExp } from "magic-regexp"
import {
	anyOf,
	caseInsensitive,
	createExactRegExp,
	createExactRegExpWithFlags,
	createRegExp,
	createRegExpWithFlags,
	digit,
	global,
	maybe,
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

const maybeVersion = "1.2.3" as string
if (semver.test(maybeVersion)) {
	expectType<`${number}.${number}.${number}`>(maybeVersion)
}

const ok = createExactRegExpWithFlags(["ok"], caseInsensitive)
expectType<"ok" | "oK" | "Ok" | "OK">(ok.infer)
expectType<"i">(ok.flags)

const answer = createExactRegExp(anyOf("yes", "no"))
expectType<"yes" | "no">(answer.infer)

const repeated = createRegExpWithFlags([digit.grouped()], global)
expectType<`${number}`>(repeated.infer)
expectType<"g">(repeated.flags)
expectType<[`${number}`]>(repeated.inferCaptures)

const indexed = createRegExpWithFlags([digit.grouped()], withIndices)
expectType<"d">(indexed.flags)

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

const optionalNamed = createExactRegExp(maybe(digit.as("maybeDigit")))
const optionalMatch = optionalNamed.exec("")
if (optionalMatch?.groups) {
	expectAssignable<string | undefined>(optionalMatch.groups.maybeDigit)
	expectError(optionalMatch.groups.nope)
}

const idInsideText = createRegExp("id:", digit.times.atLeast(1).grouped())
expectType<`${string}id:${number}${string}`>(idInsideText.infer)

const slashy = createExactRegExp("api/v1")
expectType<"api/v1">(slashy.infer)
expectType<[source: "a/b", flags: "i"]>(null as never as RegexParts<"/a\\/b/i">)

type InvalidArkRegex = WandRegExp<MagicRegExp<"/(/", never, [], never>>
expectAssignable<WandCompatibilityError<"ArkRegex could not infer this pattern", "(">>(
	null as never as InvalidArkRegex,
)
expectError((null as never as InvalidArkRegex).test("nope"))

type InvalidMagicLiteral = WandRegExp<
	MagicRegExp<"not-a-regex-literal", never, [], never>
>
expectAssignable<
	WandCompatibilityError<
		"Expected Magic Regex literal /source/flags",
		"not-a-regex-literal"
	>
>(null as never as InvalidMagicLiteral)
