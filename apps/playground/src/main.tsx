import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react"
import {
	AtSign,
	BadgeCheck,
	Braces,
	ChevronRight,
	Code2,
	Copy,
	Hash,
	Regex,
	Route,
	Search,
	Sparkles,
} from "lucide-react"
import { StrictMode, useMemo, useState } from "react"
import { createRoot } from "react-dom/client"
import {
	anyOf,
	caseInsensitive,
	charIn,
	createExactRegExp,
	createExactRegExpWithFlags,
	createRegExp,
	digit,
	oneOrMore,
} from "regex-wand"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { monacoExtraLibs } from "./generated/monaco-extra-libs"
import "./styles.css"

const templateSlot = (name: string) => `$${`{${name}}`}`
const templateType = (...parts: string[]) => `\`${parts.join("")}\``
const numberSlot = templateSlot("number")
const stringSlot = templateSlot("string")

type PlaygroundExample = {
	id: string
	title: string
	icon: typeof Hash
	code: string
	editorCode: string
	hoverTarget: string
	pattern: RegExp
	defaultInput: string
	invalidInput: string
	types: {
		infer: string
		captures: string
		namedCaptures: string
		flags: string
	}
}

const identifierChar = charIn
	.from("a", "z")
	.orChar.from("A", "Z")
	.orChar.from("0", "9")
	.orChar("_")

const namedIdentifier = <K extends string>(key: K) => oneOrMore(identifierChar).as(key)

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
		editorCode: `import { createExactRegExp, digit } from "regex-wand"

const userRoute = createExactRegExp(
  "/users/",
  digit.times.atLeast(1).as("userId"),
)

userRoute.inferNamedCaptures.userId`,
		hoverTarget: "userRoute.inferNamedCaptures.userId",
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
		editorCode: `import { createExactRegExp, digit } from "regex-wand"

const route = createExactRegExp(
  "/users/",
  digit.times.atLeast(1).as("userId"),
)

route.exec("/users/42")?.groups.userId`,
		hoverTarget: "groups.userId",
		types: {
			infer: templateType(stringSlot, "id:", numberSlot, stringSlot),
			captures: `[${templateType(numberSlot)}]`,
			namedCaptures: "{}",
			flags: '""',
		},
	},
]

function App() {
	const [selectedId, setSelectedId] = useState(examples[0]?.id ?? "")
	const selected = examples.find((example) => example.id === selectedId) ?? examples[0]
	const [inputById, setInputById] = useState<Record<string, string>>({})
	const [quickInfo, setQuickInfo] = useState("Hover-ready type info appears here.")
	const input = inputById[selected.id] ?? selected.defaultInput
	const match = useMemo(() => selected.pattern.exec(input), [input, selected])
	const isMatch = selected.pattern.test(input)
	const Icon = selected.icon

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
						<span>typed RegExp playground</span>
					</Badge>
				</header>

				<div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[220px_minmax(420px,1.35fr)_minmax(320px,0.8fr)]">
					<nav
						className="grid gap-1 border-b bg-muted/30 p-2 sm:grid-cols-2 lg:flex lg:flex-col lg:border-b-0 lg:border-r"
						aria-label="Examples"
					>
						{examples.map((example) => {
							const ExampleIcon = example.icon
							return (
								<Button
									type="button"
									variant={example.id === selected.id ? "secondary" : "ghost"}
									className="h-10 justify-start gap-2 px-3"
									key={example.id}
									onClick={() => setSelectedId(example.id)}
								>
									<ExampleIcon className="size-4 text-muted-foreground" />
									<span className="min-w-0 truncate">{example.title}</span>
									<ChevronRight className="ml-auto size-4 text-muted-foreground" />
								</Button>
							)
						})}
					</nav>

					<section
						className="flex min-w-0 flex-col gap-4 border-b p-4 lg:border-b-0 lg:border-r"
						aria-label={`${selected.title} example`}
					>
						<div className="flex min-h-8 items-center gap-2">
							<Icon className="size-4 text-muted-foreground" />
							<h2 className="text-sm font-semibold">{selected.title}</h2>
							<code className="ml-auto max-w-[52%] truncate rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
								{String(selected.pattern)}
							</code>
						</div>
						<div className="min-w-0 overflow-hidden rounded-lg border bg-zinc-950">
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
						<Card className="gap-3 p-4 py-4">
							<div className="flex items-center justify-between gap-3">
								<label
									htmlFor="sample-input"
									className="text-sm font-medium text-muted-foreground"
								>
									Sample input
								</label>
								<Badge variant={isMatch ? "default" : "destructive"}>
									{isMatch ? "match" : "no match"}
								</Badge>
							</div>
							<div className="flex items-center gap-2">
								<Input
									id="sample-input"
									value={input}
									onChange={(event) =>
										setInputById((current) => ({
											...current,
											[selected.id]: event.target.value,
										}))
									}
								/>
								<Button
									type="button"
									variant="outline"
									size="icon"
									title="Use matching sample"
									onClick={() =>
										setInputById((current) => ({
											...current,
											[selected.id]: selected.defaultInput,
										}))
									}
								>
									<BadgeCheck className="size-4" />
								</Button>
								<Button
									type="button"
									variant="outline"
									size="icon"
									title="Use non-matching sample"
									onClick={() =>
										setInputById((current) => ({
											...current,
											[selected.id]: selected.invalidInput,
										}))
									}
								>
									<Copy className="size-4" />
								</Button>
							</div>
							<div className="grid gap-2 sm:grid-cols-2">
								<div className="min-w-0 rounded-md bg-muted p-3">
									<span className="text-xs font-medium uppercase text-muted-foreground">
										captures
									</span>
									<code className="mt-2 block overflow-auto text-xs leading-5">
										{JSON.stringify(match?.slice(1) ?? [])}
									</code>
								</div>
								<div className="min-w-0 rounded-md bg-muted p-3">
									<span className="text-xs font-medium uppercase text-muted-foreground">
										groups
									</span>
									<code className="mt-2 block overflow-auto text-xs leading-5">
										{JSON.stringify(match?.groups ?? {})}
									</code>
								</div>
							</div>
						</Card>
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
	const info = await worker.getQuickInfoAtPosition(model.uri.toString(), offset + 1)
	const display = info?.displayParts?.map((part: { text: string }) => part.text).join("")
	setQuickInfo(display || "No quick info returned yet. Try hovering in the editor.")
}

function TypeRow({ label, value }: { label: string; value: string }) {
	return (
		<Card className="gap-2 p-4 py-4">
			<span className="text-xs font-medium uppercase text-muted-foreground">{label}</span>
			<code className="overflow-auto rounded-md bg-muted px-3 py-2 text-xs leading-5">
				{value}
			</code>
		</Card>
	)
}

createRoot(document.getElementById("root") as HTMLElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
