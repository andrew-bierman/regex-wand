import type { BeforeMount, OnMount } from "@monaco-editor/react"
import {
	AtSign,
	BadgeCheck,
	BookOpen,
	Braces,
	CalendarDays,
	Code2,
	ExternalLink,
	Fingerprint,
	Github,
	Hash,
	Link,
	Package,
	Regex,
	Route,
	Search,
	ShieldCheck,
	Sparkles,
	Tag,
	Terminal,
	WandSparkles,
} from "lucide-react"
import { createRegExp as createMagicRegExp } from "magic-regexp"
import { lazy, StrictMode, Suspense, useEffect, useMemo, useState } from "react"
import { createRoot } from "react-dom/client"
import {
	anyOf,
	caseInsensitive,
	charIn,
	defineRegex,
	digit,
	fromMagic,
	fromMagicAs,
	global,
	oneOrMore,
} from "regex-wand"
import { CopyButton } from "@/components/playground/copy-button"
import { ExampleNav } from "@/components/playground/example-nav"
import { SamplePanel } from "@/components/playground/sample-panel"
import { TypeRow } from "@/components/playground/type-row"
import { UseItPanel } from "@/components/playground/use-it-panel"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import type { CopyTarget, PatternEvaluation, PlaygroundExample } from "@/playground-types"
import { monacoExtraLibs } from "./generated/monaco-extra-libs"
import "./styles.css"

const Editor = lazy(() => import("@monaco-editor/react"))

const templateSlot = (name: string) => `$${`{${name}}`}`
const templateType = (...parts: string[]) => `\`${parts.join("")}\``
const numberSlot = templateSlot("number")
const stringSlot = templateSlot("string")

const identifierChar = charIn
	.from("a", "z")
	.orChar.from("A", "Z")
	.orChar.from("0", "9")
	.orChar("_")

const namedIdentifier = <K extends string>(key: K) => oneOrMore(identifierChar).as(key)
const lowerAlpha = charIn.from("a", "z")
const slugChar = lowerAlpha.orChar.from("0", "9").orChar("-")
const hexChar = charIn.from("0", "9").orChar.from("a", "f").orChar.from("A", "F")

const examples: PlaygroundExample[] = [
	{
		id: "semver",
		title: "Semver",
		icon: Hash,
		pattern: defineRegex({
			match: "exact",
			pattern: [
				digit.times.any().grouped(),
				".",
				digit.times.any().grouped(),
				".",
				digit.times.any().grouped(),
			],
		}),
		defaultInput: "1.24.3",
		invalidInput: "v1.24.3",
		code: `const semver = defineRegex({
  match: "exact",
  pattern: [
    digit.times.any().grouped(),
    ".",
    digit.times.any().grouped(),
    ".",
    digit.times.any().grouped(),
  ],
})`,
		editorCode: `import { defineRegex, digit } from "regex-wand"

const semver = defineRegex({
  match: "exact",
  pattern: [
    digit.times.any().grouped(),
    ".",
    digit.times.any().grouped(),
    ".",
    digit.times.any().grouped(),
  ],
})

semver.infer`,
		hoverTarget: "semver.infer",
		types: {
			infer: templateType(numberSlot, ".", numberSlot, ".", numberSlot),
			captures: `[${templateType(numberSlot)}, ${templateType(numberSlot)}, ${templateType(numberSlot)}]`,
			namedCaptures: "{}",
			flags: '""',
		},
	},
	{
		id: "email",
		title: "Email parts",
		icon: AtSign,
		pattern: defineRegex({
			match: "exact",
			pattern: [
				namedIdentifier("name"),
				"@",
				namedIdentifier("domain"),
				".",
				namedIdentifier("tld"),
			],
		}),
		defaultInput: "me@example.com",
		invalidInput: "me@example",
		code: `const email = defineRegex({
  match: "exact",
  pattern: [
    namedIdentifier("name"),
    "@",
    namedIdentifier("domain"),
    ".",
    namedIdentifier("tld"),
  ],
})`,
		editorCode: `import { charIn, defineRegex, oneOrMore } from "regex-wand"

const identifierChar = charIn
  .from("a", "z")
  .orChar.from("A", "Z")
  .orChar.from("0", "9")
  .orChar("_")

const email = defineRegex({
  match: "exact",
  pattern: [
    oneOrMore(identifierChar).as("name"),
    "@",
    oneOrMore(identifierChar).as("domain"),
    ".",
    oneOrMore(identifierChar).as("tld"),
  ],
})

email.inferNamedCaptures.domain`,
		hoverTarget: "email.inferNamedCaptures.domain",
		types: {
			infer: templateType(stringSlot, "@", stringSlot, ".", stringSlot),
			captures:
				'["(?<name>[a-zA-Z0-9_]+)", "(?<domain>[a-zA-Z0-9_]+)", "(?<tld>[a-zA-Z0-9_]+)"]',
			namedCaptures: "{ name: string; domain: string; tld: string }",
			flags: '""',
		},
	},
	{
		id: "route",
		title: "Route id",
		icon: Route,
		pattern: defineRegex({
			match: "exact",
			pattern: ["/users/", digit.times.atLeast(1).as("userId")],
		}),
		defaultInput: "/users/42",
		invalidInput: "/teams/42",
		code: `const userRoute = defineRegex({
  match: "exact",
  pattern: ["/users/", digit.times.atLeast(1).as("userId")],
})`,
		comparisonCode: `// Raw Magic Regex: readable construction, plain RegExp result.
const rawMagic = createMagicRegExp(
  "/users/",
  magicDigit.times.atLeast(1).as("userId"),
)

// Raw ArkRegex: strong types, raw regex string authoring.
const rawArk = regex("^/users/(?<userId>\\\\d{1,})$")
rawArk.inferNamedCaptures.userId satisfies \`\${number}\`

// regex-wand: readable object params + ArkRegex result types.
const wand = defineRegex({
  match: "exact",
  pattern: ["/users/", digit.times.atLeast(1).as("userId")],
})
wand.inferNamedCaptures.userId satisfies \`\${number}\``,
		editorCode: `import { defineRegex, digit } from "regex-wand"

const userRoute = defineRegex({
  match: "exact",
  pattern: ["/users/", digit.times.atLeast(1).as("userId")],
})

userRoute.infer`,
		hoverTarget: "userRoute.infer",
		types: {
			infer: templateType("/users/", numberSlot),
			captures: '["(?<userId>\\\\d{1,})"]',
			namedCaptures: `{ userId: ${templateType(numberSlot)} }`,
			flags: '""',
		},
	},
	{
		id: "case",
		title: "Case flags",
		icon: BadgeCheck,
		pattern: defineRegex({
			flags: caseInsensitive,
			match: "exact",
			pattern: [anyOf("ok", "yes")],
		}),
		defaultInput: "YES",
		invalidInput: "nah",
		code: `const accepted = defineRegex({
  flags: caseInsensitive,
  match: "exact",
  pattern: [anyOf("ok", "yes")],
})`,
		editorCode: `import {
  anyOf,
  caseInsensitive,
  defineRegex,
} from "regex-wand"

const accepted = defineRegex({
  flags: caseInsensitive,
  match: "exact",
  pattern: [anyOf("ok", "yes")],
})

accepted.flags`,
		hoverTarget: "accepted.flags",
		types: {
			infer: '"ok" | "oK" | "Ok" | "OK" | "yes" | "yeS" | ...',
			captures: "[]",
			namedCaptures: "{}",
			flags: '"i"',
		},
	},
	{
		id: "iso-date",
		title: "ISO date",
		icon: CalendarDays,
		pattern: defineRegex({
			match: "exact",
			pattern: [
				digit.times.atLeast(4).as("year"),
				"-",
				digit.times.atLeast(2).as("month"),
				"-",
				digit.times.atLeast(2).as("day"),
			],
		}),
		defaultInput: "2026-06-30",
		invalidInput: "06/30/2026",
		code: `const isoDate = defineRegex({
  match: "exact",
  pattern: [
    digit.times.atLeast(4).as("year"),
    "-",
    digit.times.atLeast(2).as("month"),
    "-",
    digit.times.atLeast(2).as("day"),
  ],
})`,
		editorCode: `import { defineRegex, digit } from "regex-wand"

const isoDate = defineRegex({
  match: "exact",
  pattern: [
    digit.times.atLeast(4).as("year"),
    "-",
    digit.times.atLeast(2).as("month"),
    "-",
    digit.times.atLeast(2).as("day"),
  ],
})

isoDate.inferNamedCaptures.year`,
		hoverTarget: "isoDate.inferNamedCaptures.year",
		types: {
			infer: templateType(numberSlot, "-", numberSlot, "-", numberSlot),
			captures: '["(?<year>\\\\d{4,})", "(?<month>\\\\d{2,})", "(?<day>\\\\d{2,})"]',
			namedCaptures: `{ year: ${templateType(numberSlot)}; month: ${templateType(numberSlot)}; day: ${templateType(numberSlot)} }`,
			flags: '""',
		},
	},
	{
		id: "hex-color",
		title: "Hex color",
		icon: Tag,
		pattern: defineRegex({
			match: "exact",
			pattern: ["#", oneOrMore(hexChar).as("hex")],
		}),
		defaultInput: "#38BDF8",
		invalidInput: "38BDF8",
		code: `const hexChar = charIn
  .from("0", "9")
  .orChar.from("a", "f")
  .orChar.from("A", "F")

const hexColor = defineRegex({
  match: "exact",
  pattern: ["#", oneOrMore(hexChar).as("hex")],
})`,
		editorCode: `import { charIn, defineRegex, oneOrMore } from "regex-wand"

const hexChar = charIn
  .from("0", "9")
  .orChar.from("a", "f")
  .orChar.from("A", "F")

const hexColor = defineRegex({
  match: "exact",
  pattern: ["#", oneOrMore(hexChar).as("hex")],
})

hexColor.inferNamedCaptures.hex`,
		hoverTarget: "hexColor.inferNamedCaptures.hex",
		types: {
			infer: templateType("#", stringSlot),
			captures: '["(?<hex>[0-9a-fA-F]+)"]',
			namedCaptures: "{ hex: string }",
			flags: '""',
		},
	},
	{
		id: "slug",
		title: "Slug",
		icon: Link,
		pattern: defineRegex({
			match: "exact",
			pattern: [oneOrMore(slugChar).as("slug")],
		}),
		defaultInput: "typed-regex-playground",
		invalidInput: "Typed Regex Playground",
		code: `const slugChar = charIn
  .from("a", "z")
  .orChar.from("0", "9")
  .orChar("-")

const slug = defineRegex({
  match: "exact",
  pattern: [oneOrMore(slugChar).as("slug")],
})`,
		editorCode: `import { charIn, defineRegex, oneOrMore } from "regex-wand"

const slugChar = charIn
  .from("a", "z")
  .orChar.from("0", "9")
  .orChar("-")

const slug = defineRegex({
  match: "exact",
  pattern: [oneOrMore(slugChar).as("slug")],
})

slug.inferNamedCaptures.slug`,
		hoverTarget: "slug.inferNamedCaptures.slug",
		types: {
			infer: templateType(stringSlot),
			captures: '["(?<slug>[a-z0-9\\\\-]+)"]',
			namedCaptures: "{ slug: string }",
			flags: '""',
		},
	},
	{
		id: "feature-key",
		title: "Feature key",
		icon: Fingerprint,
		pattern: defineRegex({
			match: "exact",
			pattern: [
				anyOf("prod", "staging", "dev").as("env"),
				":",
				namedIdentifier("feature"),
			],
		}),
		defaultInput: "prod:checkout_v2",
		invalidInput: "local:checkout_v2",
		code: `const featureKey = defineRegex({
  match: "exact",
  pattern: [
    anyOf("prod", "staging", "dev").as("env"),
    ":",
    oneOrMore(identifierChar).as("feature"),
  ],
})`,
		editorCode: `import { anyOf, charIn, defineRegex, oneOrMore } from "regex-wand"

const identifierChar = charIn
  .from("a", "z")
  .orChar.from("A", "Z")
  .orChar.from("0", "9")
  .orChar("_")

const featureKey = defineRegex({
  match: "exact",
  pattern: [
    anyOf("prod", "staging", "dev").as("env"),
    ":",
    oneOrMore(identifierChar).as("feature"),
  ],
})

featureKey.inferNamedCaptures.env`,
		hoverTarget: "featureKey.inferNamedCaptures.env",
		types: {
			infer: templateType('"prod" | "staging" | "dev"', ":", stringSlot),
			captures: '["(?<env>prod|staging|dev)", "(?<feature>[a-zA-Z0-9_]+)"]',
			namedCaptures: '{ env: "prod" | "staging" | "dev"; feature: string }',
			flags: '""',
		},
	},
	{
		id: "contains",
		title: "Text search",
		icon: Search,
		pattern: defineRegex({
			pattern: ["id:", digit.times.atLeast(1).grouped()],
		}),
		defaultInput: "ticket id:8042 is ready",
		invalidInput: "ticket id: is ready",
		code: `const idInsideText = defineRegex({
  pattern: ["id:", digit.times.atLeast(1).grouped()],
})`,
		editorCode: `import { defineRegex, digit } from "regex-wand"

const idInsideText = defineRegex({
  pattern: ["id:", digit.times.atLeast(1).grouped()],
})

idInsideText.infer`,
		hoverTarget: "idInsideText.infer",
		types: {
			infer: templateType(stringSlot, "id:", numberSlot, stringSlot),
			captures: `[${templateType(numberSlot)}]`,
			namedCaptures: "{}",
			flags: '""',
		},
	},
	{
		id: "comparison",
		title: "Library comparison",
		icon: Braces,
		pattern: defineRegex({
			match: "exact",
			pattern: ["/users/", digit.times.atLeast(1).as("userId")],
		}),
		defaultInput: "/users/42",
		invalidInput: "users/42",
		code: `// Magic Regex: composable authoring.
// ArkRegex: typed raw regex strings.
// regex-wand: readable object params + ArkRegex result types.`,
		comparisonCode: `import { regex } from "arkregex"
import { createRegExp as createMagicRegExp, digit as magicDigit } from "magic-regexp"
import { defineRegex, digit } from "regex-wand"

const rawMagic = createMagicRegExp(
  "/users/",
  magicDigit.times.atLeast(1).as("userId"),
)
rawMagic.test("/users/42")

const rawArk = regex("^/users/(?<userId>\\\\d{1,})$")
rawArk.inferNamedCaptures.userId satisfies \`\${number}\`

const wand = defineRegex({
  match: "exact",
  pattern: ["/users/", digit.times.atLeast(1).as("userId")],
})
wand.inferNamedCaptures.userId satisfies \`\${number}\`
wand.test("/users/42")`,
		editorCode: `import { regex } from "arkregex"
import { createRegExp as createMagicRegExp, digit as magicDigit } from "magic-regexp"
import { defineRegex, digit } from "regex-wand"

const rawArkRegex = regex("^/users/(?<userId>\\\\d{1,})$")
rawArkRegex.inferNamedCaptures.userId

const rawMagicRegex = createMagicRegExp(
  "/users/",
  magicDigit.times.atLeast(1).as("userId"),
)
rawMagicRegex.test("/users/42")

const wand = defineRegex({
  match: "exact",
  pattern: ["/users/", digit.times.atLeast(1).as("userId")],
})
wand.inferNamedCaptures.userId`,
		hoverTarget: "wand.inferNamedCaptures.userId",
		types: {
			infer: templateType("/users/", numberSlot),
			captures: '["(?<userId>\\\\d{1,})"]',
			namedCaptures: `{ userId: ${templateType(numberSlot)} }`,
			flags: '""',
		},
	},
	{
		id: "transform",
		title: "Build-time transform",
		icon: Code2,
		pattern: defineRegex({
			match: "exact",
			pattern: ["/users/", digit.times.atLeast(1).as("userId")],
		}),
		defaultInput: "/users/42",
		invalidInput: "/users/me",
		code: `// vite.config.ts
plugins: [RegexWandTransformPlugin.vite()]

// Static defineRegex calls compile to native RegExp literals.`,
		editorCode: `import { defineRegex, digit } from "regex-wand"

const route = defineRegex({
  match: "exact",
  pattern: ["/users/", digit.times.atLeast(1).as("userId")],
})

route.toRegExp()`,
		hoverTarget: "route.toRegExp",
		types: {
			infer: templateType("/users/", numberSlot),
			captures: '["(?<userId>\\\\d{1,})"]',
			namedCaptures: `{ userId: ${templateType(numberSlot)} }`,
			flags: '""',
		},
	},
	{
		id: "from-magic",
		title: "Existing Magic Regex",
		icon: WandSparkles,
		pattern: fromMagic(createMagicRegExp("ok", [caseInsensitive, global])),
		defaultInput: "queued: OK",
		invalidInput: "queued: no",
		code: `const magic = createMagicRegExp("ok", [
  caseInsensitive,
  global,
])

const adapted = fromMagic(magic)`,
		editorCode: `import { createRegExp as createMagicRegExp } from "magic-regexp"
import { caseInsensitive, fromMagic, global } from "regex-wand"

const magic = createMagicRegExp("ok", [
  caseInsensitive,
  global,
])

const adapted = fromMagic(magic)

adapted.flags`,
		hoverTarget: "adapted.flags",
		types: {
			infer:
				`${templateType(stringSlot, "ok", stringSlot)} | ` +
				`${templateType(stringSlot, "oK", stringSlot)} | ` +
				`${templateType(stringSlot, "Ok", stringSlot)} | ...`,
			captures: "[]",
			namedCaptures: "{}",
			flags: '"gi"',
		},
	},
	{
		id: "manual-type",
		title: "Manual typing",
		icon: Sparkles,
		pattern: fromMagicAs<
			`${string}feature:${number}${string}`,
			{ names: { id: `${number}` } }
		>(createMagicRegExp("feature:", digit.times.atLeast(1).as("id"))),
		defaultInput: "rollout feature:42",
		invalidInput: "rollout feature:x",
		code: `const manual = fromMagicAs<
  \`\${string}feature:\${number}\${string}\`,
  { names: { id: \`\${number}\` } }
>(magic)`,
		editorCode: `import { createRegExp as createMagicRegExp } from "magic-regexp"
import { digit, fromMagicAs } from "regex-wand"

const magic = createMagicRegExp(
  "feature:",
  digit.times.atLeast(1).as("id"),
)

const manual = fromMagicAs<
  \`\${string}feature:\${number}\${string}\`,
  { names: { id: \`\${number}\` } }
>(magic)

manual.inferNamedCaptures.id`,
		hoverTarget: "manual.inferNamedCaptures.id",
		types: {
			infer: templateType(stringSlot, "feature:", numberSlot, stringSlot),
			captures: "[]",
			namedCaptures: `{ id: ${templateType(numberSlot)} }`,
			flags: '""',
		},
	},
]

function App() {
	const [selectedId, setSelectedId] = useState(() => getInitialExampleId())
	const selected = examples.find((example) => example.id === selectedId) ?? examples[0]
	const [inputById, setInputById] = useState<Record<string, string>>({})
	const [detailView, setDetailView] = useState<"code" | "compare">("code")
	const [quickInfo, setQuickInfo] = useState("Hover-ready type info appears here.")
	const [copiedTarget, setCopiedTarget] = useState<CopyTarget | null>(null)
	const input = inputById[selected.id] ?? selected.defaultInput
	const detailCode =
		detailView === "compare" && selected.comparisonCode
			? selected.comparisonCode
			: selected.code
	const evaluation = useMemo(
		() => evaluatePattern(selected.pattern, input),
		[input, selected],
	)
	const Icon = selected.icon
	const shareUrl = useMemo(() => createShareUrl(selected.id), [selected.id])

	useEffect(() => {
		if (typeof window === "undefined") return

		const url = new URL(window.location.href)
		url.searchParams.set("example", selected.id)
		window.history.replaceState(null, "", url)
	}, [selected.id])

	useEffect(() => {
		if (!copiedTarget) return

		const timeout = window.setTimeout(() => setCopiedTarget(null), 1600)
		return () => window.clearTimeout(timeout)
	}, [copiedTarget])

	const selectExample = (exampleId: string) => {
		setQuickInfo("Loading quick info...")
		setDetailView("code")
		setSelectedId(exampleId)
	}

	const copyValue = async (target: CopyTarget, value: string) => {
		await copyText(value)
		setCopiedTarget(target)
	}

	return (
		<main className="min-h-screen bg-[#f6f7f2] p-3 text-foreground md:p-4 lg:p-6">
			<section className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1500px] flex-col overflow-hidden rounded-xl border bg-background shadow-sm md:min-h-[calc(100vh-2rem)] lg:min-h-[calc(100vh-3rem)]">
				<header className="border-b bg-background">
					<div className="flex flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
						<div className="min-w-0">
							<div className="mb-3 flex flex-wrap items-center gap-2">
								<Badge variant="secondary" className="gap-1.5">
									<Regex className="size-3" />
									<span>regex-wand</span>
								</Badge>
								<Badge variant="outline" className="gap-1.5">
									<ShieldCheck className="size-3" />
									<span>native RegExp runtime</span>
								</Badge>
								<Badge variant="outline" className="gap-1.5">
									<Sparkles className="size-3" />
									<span>{examples.length} typed examples</span>
								</Badge>
							</div>
							<h1 className="max-w-3xl text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
								Write readable regexes. Keep the TypeScript inference.
							</h1>
							<p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
								Compose with Magic Regex primitives and get ArkRegex-powered `.infer`,
								captures, named groups, flags, `exec()`, and `test()` narrowing on the
								final native `RegExp`.
							</p>
						</div>
						<div className="flex flex-wrap gap-2 lg:justify-end">
							<button
								type="button"
								className="inline-flex h-9 items-center gap-2 rounded-md border bg-card px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent"
								onClick={() => copyValue("install", "bun add regex-wand")}
							>
								{copiedTarget === "install" ? (
									<BadgeCheck className="size-4" />
								) : (
									<Terminal className="size-4" />
								)}
								<span>bun add regex-wand</span>
							</button>
							<a
								className="inline-flex h-9 items-center gap-2 rounded-md border bg-card px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent"
								href="https://www.npmjs.com/package/regex-wand"
								target="_blank"
								rel="noreferrer"
							>
								<Package className="size-4" />
								<span>npm</span>
								<ExternalLink className="size-3" />
							</a>
							<a
								className="inline-flex h-9 items-center gap-2 rounded-md border bg-card px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent"
								href="https://github.com/andrew-bierman/regex-wand"
								target="_blank"
								rel="noreferrer"
							>
								<Github className="size-4" />
								<span>GitHub</span>
							</a>
							<a
								className="inline-flex h-9 items-center gap-2 rounded-md border bg-card px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent"
								href="https://github.com/andrew-bierman/regex-wand/tree/main/packages/regex-wand#readme"
								target="_blank"
								rel="noreferrer"
							>
								<BookOpen className="size-4" />
								<span>Docs</span>
							</a>
						</div>
					</div>
				</header>

				<div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[220px_minmax(420px,1.35fr)_minmax(320px,0.8fr)]">
					<ExampleNav
						examples={examples}
						onSelect={selectExample}
						selectedId={selected.id}
					/>

					<section
						className="flex min-w-0 flex-col gap-4 border-b p-4 lg:border-b-0 lg:border-r"
						aria-label={`${selected.title} example`}
					>
						<div className="flex min-h-8 items-center gap-2">
							<Icon className="size-4 text-muted-foreground" />
							<h2 className="text-sm font-semibold">{selected.title}</h2>
							<code className="ml-auto max-w-[42%] truncate rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground md:max-w-[52%]">
								{String(selected.pattern)}
							</code>
							<CopyButton
								title="Copy regex"
								copied={copiedTarget === "regex"}
								onClick={() => copyValue("regex", String(selected.pattern))}
							/>
						</div>
						<div className="min-w-0 overflow-hidden rounded-lg border bg-zinc-950">
							<Suspense
								fallback={
									<div className="flex h-[260px] items-center justify-center text-sm text-zinc-400">
										Loading editor...
									</div>
								}
							>
								<Editor
									key={selected.id}
									width="100%"
									height="260px"
									language="typescript"
									path={`file:///${selected.id}.ts`}
									theme="regex-wand-dark"
									value={selected.editorCode}
									beforeMount={configureMonaco}
									onMount={(editor, monaco) =>
										void handleEditorMount(
											editor,
											monaco,
											selected.hoverTarget,
											setQuickInfo,
										)
									}
									options={{
										automaticLayout: true,
										folding: false,
										fontSize: 13,
										fontLigatures: true,
										lineNumbersMinChars: 3,
										minimap: { enabled: false },
										overviewRulerLanes: 0,
										renderLineHighlight: "none",
										scrollBeyondLastLine: false,
										scrollbar: {
											alwaysConsumeMouseWheel: false,
											horizontalScrollbarSize: 8,
											verticalScrollbarSize: 8,
										},
										tabSize: 2,
										wordWrap: "on",
									}}
								/>
							</Suspense>
						</div>
						<Card className="grid gap-0 overflow-hidden py-0 sm:grid-cols-[150px_minmax(0,1fr)]">
							<span className="flex items-center border-b bg-muted px-3 py-2 text-xs font-medium uppercase text-muted-foreground sm:border-b-0 sm:border-r">
								Monaco quick info
							</span>
							<code className="overflow-auto bg-card px-3 py-2 text-xs leading-5">
								{quickInfo}
							</code>
						</Card>
						<div className="overflow-hidden rounded-lg border bg-zinc-950">
							{selected.comparisonCode ? (
								<div className="flex border-b border-white/10 bg-zinc-900 p-1">
									<button
										type="button"
										className={`h-8 rounded-md px-3 text-xs font-medium transition-colors ${
											detailView === "code"
												? "bg-white text-zinc-950"
												: "text-zinc-300 hover:bg-white/10"
										}`}
										onClick={() => setDetailView("code")}
									>
										Example
									</button>
									<button
										type="button"
										className={`h-8 rounded-md px-3 text-xs font-medium transition-colors ${
											detailView === "compare"
												? "bg-white text-zinc-950"
												: "text-zinc-300 hover:bg-white/10"
										}`}
										onClick={() => setDetailView("compare")}
									>
										Compare
									</button>
								</div>
							) : null}
							<pre className="min-h-28 overflow-auto p-4 text-xs leading-6 text-zinc-100">
								<code>{detailCode}</code>
							</pre>
						</div>
						<SamplePanel
							evaluation={evaluation}
							input={input}
							onInputChange={(value) =>
								setInputById((current) => ({
									...current,
									[selected.id]: value,
								}))
							}
							onUseSample={(value) =>
								setInputById((current) => ({
									...current,
									[selected.id]: value,
								}))
							}
							selected={selected}
						/>
					</section>

					<aside
						className="flex min-w-0 flex-col gap-3 bg-muted/20 p-4"
						aria-label="Inferred types"
					>
						<div className="flex min-h-8 items-center gap-2">
							<Code2 className="size-4 text-muted-foreground" />
							<h2 className="text-sm font-semibold">Inferred surface</h2>
						</div>
						<p className="text-sm leading-6 text-muted-foreground">
							These are the types `regex-wand` exposes on the final `RegExp`. Hover the
							highlighted expression in Monaco to inspect the same surface through
							TypeScript.
						</p>
						<TypeRow label="infer" value={selected.types.infer} />
						<TypeRow label="inferCaptures" value={selected.types.captures} />
						<TypeRow label="inferNamedCaptures" value={selected.types.namedCaptures} />
						<TypeRow label="flags" value={selected.types.flags} />
						<UseItPanel
							copiedTarget={copiedTarget}
							onCopy={copyValue}
							shareUrl={shareUrl}
							typescriptCode={selected.editorCode}
						/>
						<div className="mt-auto grid gap-2">
							<div className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm text-muted-foreground">
								<Braces className="size-4" />
								<span>Displayed types are backed by package `tsd` tests.</span>
							</div>
							<div className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm text-muted-foreground">
								<ShieldCheck className="size-4" />
								<span>Build checks verify the published tarball and Vite transform.</span>
							</div>
						</div>
					</aside>
				</div>
			</section>
		</main>
	)
}

function getInitialExampleId() {
	if (typeof window === "undefined") return examples[0]?.id ?? ""

	const requestedId = new URLSearchParams(window.location.search).get("example")
	return examples.some((example) => example.id === requestedId)
		? requestedId
		: (examples[0]?.id ?? "")
}

function evaluatePattern(pattern: RegExp, input: string): PatternEvaluation {
	const matcher = new RegExp(pattern.source, pattern.flags)
	const match = matcher.exec(input)

	return {
		isMatch: match !== null,
		match,
	}
}

function createShareUrl(exampleId: string) {
	if (typeof window === "undefined") return `?example=${exampleId}`

	const url = new URL(window.location.href)
	url.searchParams.set("example", exampleId)
	return url.toString()
}

async function copyText(value: string) {
	if (navigator.clipboard) {
		await navigator.clipboard.writeText(value)
		return
	}

	const textarea = document.createElement("textarea")
	textarea.value = value
	textarea.setAttribute("readonly", "")
	textarea.style.position = "fixed"
	textarea.style.top = "-1000px"
	document.body.append(textarea)
	textarea.select()
	document.execCommand("copy")
	textarea.remove()
}

const configureMonaco: BeforeMount = (monaco) => {
	monaco.editor.defineTheme("regex-wand-dark", {
		base: "vs-dark",
		inherit: true,
		rules: [],
		colors: {
			"editor.background": "#101820",
			"editorLineNumber.foreground": "#6d7f93",
		},
	})

	monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
		allowNonTsExtensions: true,
		allowSyntheticDefaultImports: true,
		lib: ["es2022", "dom", "dom.iterable"],
		module: monaco.languages.typescript.ModuleKind.ESNext,
		moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
		noEmit: true,
		strict: true,
		target: monaco.languages.typescript.ScriptTarget.ES2022,
	})

	for (const lib of monacoExtraLibs) {
		monaco.languages.typescript.typescriptDefaults.addExtraLib(lib.content, lib.filePath)
	}
}

const handleEditorMount = async (
	editor: Parameters<OnMount>[0],
	monaco: Parameters<BeforeMount>[0],
	target: string,
	setQuickInfo: (value: string) => void,
) => {
	requestAnimationFrame(() => editor.layout())
	await readQuickInfo(editor, monaco, target, setQuickInfo)
}

const readQuickInfo = async (
	editor: Parameters<OnMount>[0],
	monaco: Parameters<BeforeMount>[0],
	target: string,
	setQuickInfo: (value: string) => void,
) => {
	const model = editor.getModel()
	if (!model) return

	const offset = model.getValue().indexOf(target)
	if (offset < 0) {
		setQuickInfo("Target expression was not found in this example.")
		return
	}

	const workerFactory = await monaco.languages.typescript.getTypeScriptWorker()
	const worker = await workerFactory(model.uri)
	const propertyOffset = target.lastIndexOf(".") + 1
	const info = await worker.getQuickInfoAtPosition(
		model.uri.toString(),
		offset + propertyOffset + 1,
	)
	const display = info?.displayParts?.map((part: { text: string }) => part.text).join("")
	setQuickInfo(display || "No quick info returned yet. Try hovering in the editor.")
}

createRoot(document.getElementById("root") as HTMLElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
