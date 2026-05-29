import { createRegExp as createMagicRegExp } from "magic-regexp"
import { describe, expect, it } from "vitest"
import {
	anyOf,
	carriageReturn,
	caseInsensitive,
	char,
	charIn,
	charNotIn,
	createExactRegExp,
	createExactRegExpWithFlags,
	createRegExp,
	createRegExpWithFlags,
	digit,
	dotAll,
	exactly,
	fromMagic,
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
} from "../src/index.js"

describe("regex-wand", () => {
	const runtimeOnly = (value: unknown) => value as RegExp

	it("preserves Magic Regex source and exposes ArkRegex behavior", () => {
		const semver = createExactRegExp(
			digit.times.any().grouped(),
			".",
			digit.times.any().grouped(),
			".",
			digit.times.any().grouped(),
		)

		expect(String(semver)).toBe("/^(\\d*)\\.(\\d*)\\.(\\d*)$/")
		expect(semver.test("1.2.3")).toBe(true)
		expect(semver.test("v1.2.3")).toBe(false)
		expect(semver.exec("1.2.3")?.slice(1)).toEqual(["1", "2", "3"])
		expect(semver.magic).toBeInstanceOf(RegExp)
		expect(semver.ark).toBe(semver)
		expect(semver.toRegExp()).toBeInstanceOf(RegExp)
	})

	it("supports contains-style regexes", () => {
		const idInsideText = createRegExp("id:", digit.times.atLeast(1).grouped())

		expect(String(idInsideText)).toBe("/id:(\\d{1,})/")
		expect(idInsideText.test("prefix id:123 suffix")).toBe(true)
		expect(idInsideText.test("prefix id: suffix")).toBe(false)
	})

	it("supports named groups authored with Magic Regex fragments", () => {
		const identifierChar = oneOrMore(digit).or("name")
		const keyed = identifierChar.as("key")
		const pattern = createExactRegExp(keyed, "=", digit.times.atLeast(1).as("id"))

		const match = pattern.exec("name=42")

		expect(match?.groups).toEqual({ key: "name", id: "42" })
	})

	it("supports flags through helper APIs", () => {
		const loose = createRegExpWithFlags(["ok"], caseInsensitive)
		const exact = createExactRegExpWithFlags(["ok"], caseInsensitive)
		const globalInsensitive = createRegExpWithFlags(["ok"], global, caseInsensitive)

		expect(loose.flags).toBe("i")
		expect(loose.test("OK then")).toBe(true)
		expect(exact.flags).toBe("i")
		expect(exact.test("OK")).toBe(true)
		expect(exact.test("OK then")).toBe(false)
		expect(globalInsensitive.flags).toBe("gi")
		expect([..."ok OK".matchAll(globalInsensitive)].map((match) => match[0])).toEqual([
			"ok",
			"OK",
		])
	})

	it("passes through native RegExp flag behavior", () => {
		const indices = createRegExpWithFlags([digit.times.atLeast(1).grouped()], withIndices)
		expect(indices.exec("id 42")?.indices?.[1]).toEqual([3, 5])

		const globalDigits = createRegExpWithFlags([digit.grouped()], global)
		expect([..."a1b2".matchAll(globalDigits)].map((match) => match[1])).toEqual([
			"1",
			"2",
		])

		const multilineStart = createRegExpWithFlags(
			[exactly("ok").at.lineStart()],
			multiline,
		)
		expect(multilineStart.test("no\nok")).toBe(true)

		const dotAcrossLines = createRegExpWithFlags(["a", char, "b"], dotAll)
		expect(dotAcrossLines.test("a\nb")).toBe(true)

		const unicodeWord = createRegExpWithFlags([wordChar], unicode)
		expect(unicodeWord.flags).toBe("u")

		const stickyDigit = createRegExpWithFlags([digit], sticky)
		stickyDigit.lastIndex = 1
		expect(stickyDigit.test("a1")).toBe(true)
		stickyDigit.lastIndex = 0
		expect(stickyDigit.test("a1")).toBe(false)
	})

	it("keeps Magic Regex primitive composition available from one import", () => {
		expect(createExactRegExp(anyOf("cat", "dog")).test("dog")).toBe(true)
		expect(createExactRegExp(maybe("pre"), "fix").test("prefix")).toBe(true)
		expect(createExactRegExp(charIn("abc")).test("b")).toBe(true)
		expect(createExactRegExp(charIn.from("a", "c")).test("b")).toBe(true)
		expect(createExactRegExp(charNotIn("abc")).test("z")).toBe(true)
		expect(createExactRegExp(oneOrMore("ha")).test("hahaha")).toBe(true)
		expect(createExactRegExp(letter.lowercase).test("a")).toBe(true)
		expect(createExactRegExp(letter.uppercase).test("A")).toBe(true)
		expect(createExactRegExp(whitespace).test(" ")).toBe(true)
		expect(runtimeOnly(createExactRegExp(tab)).test("\t")).toBe(true)
		expect(runtimeOnly(createExactRegExp(linefeed)).test("\n")).toBe(true)
		expect(runtimeOnly(createExactRegExp(carriageReturn)).test("\r")).toBe(true)
		expect(createExactRegExp(word).test("hello")).toBe(true)
		expect(createExactRegExp(wordBoundary, "hi", wordBoundary).test("hi")).toBe(true)
		expect(createExactRegExp(wordChar).test("_")).toBe(true)
		expect(createExactRegExp(not.digit).test("a")).toBe(true)
	})

	it("supports Magic Regex lookarounds at runtime", () => {
		const before = createRegExp(exactly("foo").before("bar"))
		const notBefore = createRegExp(exactly("foo").notBefore("bar"))
		const after = createRegExp(exactly("bar").after("foo"))
		const notAfter = createRegExp(exactly("bar").notAfter("foo"))

		expect(runtimeOnly(before).test("foobar")).toBe(true)
		expect(runtimeOnly(before).test("foobaz")).toBe(false)
		expect(runtimeOnly(notBefore).test("foobaz")).toBe(true)
		expect(runtimeOnly(notBefore).test("foobar")).toBe(false)
		expect(runtimeOnly(after).test("foobar")).toBe(true)
		expect(runtimeOnly(after).test("bazbar")).toBe(false)
		expect(runtimeOnly(notAfter).test("bazbar")).toBe(true)
		expect(runtimeOnly(notAfter).test("foobar")).toBe(false)
	})

	it("supports Magic Regex backreferences at runtime", () => {
		const repeatedWord = createExactRegExp(
			oneOrMore(letter.lowercase).as("word").and.referenceTo("word"),
		)

		expect(runtimeOnly(repeatedWord).test("haha")).toBe(true)
		expect(runtimeOnly(repeatedWord).test("haho")).toBe(false)
		expect(repeatedWord.exec("haha")?.groups).toEqual({ word: "ha" })
	})

	it("supports optional anonymous captures at runtime", () => {
		const optionalAreaCode = createExactRegExp(
			maybe(digit.times(3).grouped(), "-"),
			digit.times(3).grouped(),
			"-",
			digit.times(4).grouped(),
		)

		expect(optionalAreaCode.test("555-1212")).toBe(true)
		expect(optionalAreaCode.test("303-555-1212")).toBe(true)
		expect(optionalAreaCode.exec("303-555-1212")?.slice(1)).toEqual([
			"303",
			"555",
			"1212",
		])
		expect(optionalAreaCode.exec("555-1212")?.slice(1)).toEqual([
			undefined,
			"555",
			"1212",
		])
	})

	it("adapts existing Magic Regex values", () => {
		const magic = createMagicRegExp("a/b")
		const wand = fromMagic(magic)

		expect(String(wand)).toBe("/a\\/b/")
		expect(wand.test("a/b")).toBe(true)
		expect(wand.magic).toBe(magic)
	})

	it("handles escaped slash sources in Magic Regex output", () => {
		const slashy = createExactRegExp("api/v1", "/", "users")

		expect(String(slashy)).toBe("/^api\\/v1\\/users$/")
		expect(slashy.test("api/v1/users")).toBe(true)
		expect(slashy.test("api/v1/projects")).toBe(false)
	})

	it("keeps toRegExp source and flags independent from the adapted object", () => {
		const wand = createRegExpWithFlags([digit.grouped()], global)
		const plain = wand.toRegExp()

		expect(plain).not.toBe(wand)
		expect(plain.source).toBe(wand.source)
		expect(plain.flags).toBe(wand.flags)
		expect([..."a1b2".matchAll(plain)].map((match) => match[0])).toEqual(["1", "2"])
	})
})
