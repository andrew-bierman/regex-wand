import type { LucideIcon } from "lucide-react"

export type CopyTarget = "code" | "config" | "install" | "npm" | "regex" | "share"

export type PlaygroundExample = {
	id: string
	title: string
	icon: LucideIcon
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

export type PatternEvaluation = {
	isMatch: boolean
	match: RegExpExecArray | null
}
