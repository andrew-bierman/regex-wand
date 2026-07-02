import type { BeforeMount, OnMount } from "@monaco-editor/react"
import {
	AtSign,
	BadgeCheck,
	Braces,
	CalendarDays,
	Code2,
	Fingerprint,
	Hash,
	Link,
	Regex,
	Route,
	Search,
	Sparkles,
	Tag,
	WandSparkles,
} from "lucide-react"
import { createRegExp as createMagicRegExp } from "magic-regexp"
import { lazy, StrictMode, Suspense, useEffect, useMemo, useState } from "react"
import { createRoot } from "react-dom/client"
import {
	anyOf,
	caseInsensitive,
	charIn,
	createExactRegExp,
	createExactRegExpWithFlags,
	createRegExp,
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
		pattern: createExactRegExp(
			digit.times.any().grouped(),
			".",
			digit.times.any().grouped(),
			".",
			digit.times.any().grouped(),
		),
		defaultInput: "1.24.3",
		invalidInput: "v1.24.3",
		code: `const semver = createExactRegExp(
  digit.times.any().grouped(),
  ".",
  digit.times.any().grouped(),
  ".",
  digit.times.any().grouped(),
)`,
		editorCode: `import { createExactRegExp, digit } from "regex-wand"

const semver = createExactRegExp(
  digit.times.any().grouped(),
  ".",
  digit.times.any().grouped(),
  ".",
  digit.times.any().grouped(),
)

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
		pattern: createExactRegExp(
			namedIdentifier("name"),
			"@",
			namedIdentifier("domain"),
			".",
			namedIdentifier("tld"),
		),
		defaultInput: "me@example.com",
		invalidInput: "me@example",
		code: `const email = createExactRegExp(
  namedIdentifier("name"),
  "@",
  namedIdentifier("domain"),
  ".",
  namedIdentifier("tld"),
)`,
		editorCode: `import { charIn, createExactRegExp, oneOrMore } from "regex-wand"

const identifierChar = charIn
  .from("a", "z")
  .orChar.from("A", "Z")
  .orChar.from("0", "9")
  .orChar("_")

const email = createExactRegExp(
  oneOrMore(identifierChar).as("name"),
  "@",
  oneOrMore(identifierChar).as("domain"),
  ".",
  oneOrMore(identifierChar).as("tld"),
)

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
		pattern: createExactRegExp("/users/", digit.times.atLeast(1).as("userId")),
		defaultInput: "/users/42",
		invalidInput: "/teams/42",
		code: `const userRoute = createExactRegExp(
  "/users/",
  digit.times.atLeast(1).as("userId"),
)`,
		editorCode: `import { createExactRegExp, digit } from "regex-wand"

const userRoute = createExactRegExp(
  "/users/",
  digit.times.atLeast(1).as("userId"),
)

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
		pattern: createExactRegExpWithFlags([anyOf("ok", "yes")], caseInsensitive),
		defaultInput: "YES",
		invalidInput: "nah",
		code: `const accepted = createExactRegExpWithFlags(
  [anyOf("ok", "yes")],
  caseInsensitive,
)`,
		editorCode: `import {
  anyOf,
  caseInsensitive,
  createExactRegExpWithFlags,
} from "regex-wand"

const accepted = createExactRegExpWithFlags(
  [anyOf("ok", "yes")],
  caseInsensitive,
)

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
		pattern: createExactRegExp(
			digit.times.atLeast(4).as("year"),
			"-",
			digit.times.atLeast(2).as("month"),
			"-",
			digit.times.atLeast(2).as("day"),
		),
		defaultInput: "2026-06-30",
		invalidInput: "06/30/2026",
		code: `const isoDate = createExactRegExp(
  digit.times.atLeast(4).as("year"),
  "-",
  digit.times.atLeast(2).as("month"),
  "-",
  digit.times.atLeast(2).as("day"),
)`,
		editorCode: `import { createExactRegExp, digit } from "regex-wand"

const isoDate = createExactRegExp(
  digit.times.atLeast(4).as("year"),
  "-",
  digit.times.atLeast(2).as("month"),
  "-",
  digit.times.atLeast(2).as("day"),
)

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
		pattern: createExactRegExp("#", oneOrMore(hexChar).as("hex")),
		defaultInput: "#38BDF8",
		invalidInput: "38BDF8",
		code: `const hexChar = charIn
  .from("0", "9")
  .orChar.from("a", "f")
  .orChar.from("A", "F")

const hexColor = createExactRegExp(
  "#",
  oneOrMore(hexChar).as("hex"),
)`,
		editorCode: `import { charIn, createExactRegExp, oneOrMore } from "regex-wand"

const hexChar = charIn
  .from("0", "9")
  .orChar.from("a", "f")
  .orChar.from("A", "F")

const hexColor = createExactRegExp(
  "#",
  oneOrMore(hexChar).as("hex"),
)

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
		pattern: createExactRegExp(oneOrMore(slugChar).as("slug")),
		defaultInput: "typed-regex-playground",
		invalidInput: "Typed Regex Playground",
		code: `const slugChar = charIn
  .from("a", "z")
  .orChar.from("0", "9")
  .orChar("-")

const slug = createExactRegExp(
  oneOrMore(slugChar).as("slug"),
)`,
		editorCode: `import { charIn, createExactRegExp, oneOrMore } from "regex-wand"

const slugChar = charIn
  .from("a", "z")
  .orChar.from("0", "9")
  .orChar("-")

const slug = createExactRegExp(
  oneOrMore(slugChar).as("slug"),
)

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
		pattern: createExactRegExp(
			anyOf("prod", "staging", "dev").as("env"),
			":",
			namedIdentifier("feature"),
		),
		defaultInput: "prod:checkout_v2",
		invalidInput: "local:checkout_v2",
		code: `const featureKey = createExactRegExp(
  anyOf("prod", "staging", "dev").as("env"),
  ":",
  oneOrMore(identifierChar).as("feature"),
)`,
		editorCode: `import { anyOf, charIn, createExactRegExp, oneOrMore } from "regex-wand"

const identifierChar = charIn
  .from("a", "z")
  .orChar.from("A", "Z")
  .orChar.from("0", "9")
  .orChar("_")

const featureKey = createExactRegExp(
  anyOf("prod", "staging", "dev").as("env"),
  ":",
  oneOrMore(identifierChar).as("feature"),
)

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
		pattern: createRegExp("id:", digit.times.atLeast(1).grouped()),
		defaultInput: "ticket id:8042 is ready",
		invalidInput: "ticket id: is ready",
		code: `const idInsideText = createRegExp(
  "id:",
  digit.times.atLeast(1).grouped(),
)`,
		editorCode: `import { createRegExp, digit } from "regex-wand"

const idInsideText = createRegExp(
  "id:",
  digit.times.atLeast(1).grouped(),
)

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
		pattern: createExactRegExp("/users/", digit.times.atLeast(1).as("userId")),
		defaultInput: "/users/42",
		invalidInput: "users/42",
		code: `// Magic Regex: composable authoring.
// ArkRegex: typed raw regex strings.
// regex-wand: Magic Regex authoring + ArkRegex result types.`,
		editorCode: `import { regex } from "arkregex"
import { createRegExp as createMagicRegExp, digit as magicDigit } from "magic-regexp"
import { createExactRegExp, digit } from "regex-wand"

const rawArkRegex = regex("^/users/(?<userId>\\\\d{1,})$")
rawArkRegex.inferNamedCaptures.userId

const rawMagicRegex = createMagicRegExp(
  "/users/",
  magicDigit.times.atLeast(1).as("userId"),
)
rawMagicRegex.test("/users/42")

const wand = createExactRegExp(
  "/users/",
  digit.times.atLeast(1).as("userId"),
)
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
		pattern: createExactRegExp("/users/", digit.times.atLeast(1).as("userId")),
		defaultInput: "/users/42",
		invalidInput: "/users/me",
		code: `// vite.config.ts
plugins: [RegexWandTransformPlugin.vite()]

// Static regex-wand builders compile to native RegExp literals.`,
		editorCode: `import { createExactRegExp, digit } from "regex-wand"

const route = createExactRegExp(
  "/users/",
  digit.times.atLeast(1).as("userId"),
)

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
	const [quickInfo, setQuickInfo] = useState("Hover-ready type info appears here.")
	const [copiedTarget, setCopiedTarget] = useState<CopyTarget | null>(null)
	const input = inputById[selected.id] ?? selected.defaultInput
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
		setSelectedId(exampleId)
	}

	const copyValue = async (target: CopyTarget, value: string) => {
		await copyText(value)
		setCopiedTarget(target)
	}

	return (
		<main className="min-h-screen bg-muted/40 p-4 text-foreground lg:p-6">
			<section className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1500px] flex-col overflow-hidden rounded-xl border bg-background shadow-sm lg:min-h-[calc(100vh-3rem)]">
				<header className="flex flex-col gap-4 border-b px-5 py-4 md:h-16 md:flex-row md:items-center md:justify-between">
					<div className="flex min-w-0 items-center gap-3">
						<Regex className="size-5 text-muted-foreground" />
						<div>
							<h1 className="font-semibold leading-none tracking-tight">regex-wand</h1>
							<p className="mt-1 text-sm text-muted-foreground">
								Magic Regex authoring, ArkRegex result types.
							</p>
						</div>
					</div>
					<Badge variant="secondary" className="w-fit gap-1.5">
						<Sparkles className="size-3" />
						<span>{examples.length} typed examples</span>
					</Badge>
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
						<pre className="min-h-28 overflow-auto rounded-lg border bg-zinc-950 p-4 text-xs leading-6 text-zinc-100">
							<code>{selected.code}</code>
						</pre>
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
						<div className="mt-auto flex items-center gap-2 rounded-lg border bg-card p-3 text-sm text-muted-foreground">
							<Braces className="size-4" />
							<span>Displayed types are curated from the package type tests.</span>
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
