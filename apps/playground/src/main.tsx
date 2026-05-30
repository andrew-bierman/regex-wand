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
import { Badge } from "./components/ui/badge"
import { Button } from "./components/ui/button"
import { Card } from "./components/ui/card"
import { Input } from "./components/ui/input"
import { regexWandTypes } from "./monaco-types"
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
		<main className="app-shell">
			<section className="workspace">
				<header className="topbar">
					<div className="brand">
						<Regex size={22} />
						<div>
							<h1>regex-wand</h1>
							<p>Magic Regex authoring, ArkRegex result types.</p>
						</div>
					</div>
					<Badge className="status-pill">
						<Sparkles size={16} />
						<span>typed RegExp playground</span>
					</Badge>
				</header>

				<div className="layout">
					<nav className="sidebar" aria-label="Examples">
						{examples.map((example) => {
							const ExampleIcon = example.icon
							return (
								<Button
									type="button"
									variant="ghost"
									className={example.id === selected.id ? "example active" : "example"}
									key={example.id}
									onClick={() => setSelectedId(example.id)}
								>
									<ExampleIcon size={18} />
									<span>{example.title}</span>
									<ChevronRight size={16} />
								</Button>
							)
						})}
					</nav>

					<section className="editor-pane" aria-label={`${selected.title} example`}>
						<div className="pane-title">
							<Icon size={18} />
							<h2>{selected.title}</h2>
							<code>{String(selected.pattern)}</code>
						</div>
						<div className="monaco-shell">
							<Editor
								key={selected.id}
								height="260px"
								language="typescript"
								path={`file:///${selected.id}.ts`}
								theme="regex-wand-dark"
								value={selected.editorCode}
								beforeMount={configureMonaco}
								onMount={(editor, monaco) =>
									void readQuickInfo(editor, monaco, selected.hoverTarget, setQuickInfo)
								}
								options={{
									fontSize: 13,
									fontLigatures: true,
									minimap: { enabled: false },
									scrollBeyondLastLine: false,
									tabSize: 2,
									wordWrap: "on",
								}}
							/>
						</div>
						<Card className="quick-info">
							<span>Monaco quick info</span>
							<code>{quickInfo}</code>
						</Card>
						<pre className="code-block compact">
							<code>{selected.code}</code>
						</pre>
						<Card className="tester">
							<div className="tester-header">
								<label htmlFor="sample-input">Sample input</label>
								<Badge className={isMatch ? "result ok" : "result nope"}>
									{isMatch ? "match" : "no match"}
								</Badge>
							</div>
							<div className="input-row">
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
									<BadgeCheck size={16} />
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
									<Copy size={16} />
								</Button>
							</div>
							<div className="match-output">
								<div>
									<span>captures</span>
									<code>{JSON.stringify(match?.slice(1) ?? [])}</code>
								</div>
								<div>
									<span>groups</span>
									<code>{JSON.stringify(match?.groups ?? {})}</code>
								</div>
							</div>
						</Card>
					</section>

					<aside className="types-pane" aria-label="Inferred types">
						<div className="pane-title">
							<Code2 size={18} />
							<h2>Inferred surface</h2>
						</div>
						<TypeRow label="infer" value={selected.types.infer} />
						<TypeRow label="inferCaptures" value={selected.types.captures} />
						<TypeRow label="inferNamedCaptures" value={selected.types.namedCaptures} />
						<TypeRow label="flags" value={selected.types.flags} />
						<div className="note">
							<Braces size={16} />
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
		module: monaco.languages.typescript.ModuleKind.ESNext,
		moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
		noEmit: true,
		strict: true,
		target: monaco.languages.typescript.ScriptTarget.ES2022,
	})

	monaco.languages.typescript.typescriptDefaults.addExtraLib(
		regexWandTypes,
		"file:///node_modules/regex-wand/index.d.ts",
	)
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
		<Card className="type-row">
			<span>{label}</span>
			<code>{value}</code>
		</Card>
	)
}

createRoot(document.getElementById("root") as HTMLElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
