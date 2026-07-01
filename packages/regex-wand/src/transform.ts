import { createContext, runInContext } from "node:vm"
import { createUnplugin } from "unplugin"
import * as regexWand from "./index.js"

type AstNode = {
	type: string
	start?: number
	end?: number
	[key: string]: unknown
}

type ImportSpecifierNode = AstNode & {
	imported?: { type: string; name?: string; value?: unknown }
	local?: { name?: string }
}

type ImportDeclarationNode = AstNode & {
	source?: { value?: unknown }
	specifiers?: ImportSpecifierNode[]
}

type CallExpressionNode = AstNode & {
	callee?: AstNode
}

type MemberExpressionNode = AstNode & {
	object?: AstNode & { name?: string }
	property?: AstNode & { name?: string }
}

type IdentifierNode = AstNode & { name?: string }

const REGEX_WAND_SPECIFIER = "regex-wand"
const WRAPPER_EXPORTS = new Set([
	"createRegExp",
	"createExactRegExp",
	"createRegExpWithFlags",
	"createExactRegExpWithFlags",
])
const REGEX_WAND_CONTEXT = { ...regexWand } as Record<string, unknown>

export const RegexWandTransformPlugin = createUnplugin(() => {
	return {
		name: "RegexWandTransformPlugin",
		enforce: "post",
		transformInclude(id) {
			const queryIndex = id.indexOf("?")
			const pathname = queryIndex >= 0 ? id.slice(0, queryIndex) : id
			const search = queryIndex >= 0 ? id.slice(queryIndex) : ""
			const type = search ? new URLSearchParams(search).get("type") : null

			if (pathname.endsWith(".vue") && (!search || type === "script")) return true
			return /\.((c|m)?j|t)sx?$/.test(pathname)
		},
		transform(code) {
			if (!code.includes(REGEX_WAND_SPECIFIER)) return

			const ast = this.parse(code) as AstNode
			const contextMap = { ...REGEX_WAND_CONTEXT }
			const wrapperNames = new Set<string>()
			const namespaceNames = new Set<string>()
			let hasRelevantImport = false

			walkAST(ast, (node) => {
				if (node.type !== "ImportDeclaration") return

				const declaration = node as ImportDeclarationNode
				if (declaration.source?.value !== REGEX_WAND_SPECIFIER) return

				hasRelevantImport = true
				for (const specifier of declaration.specifiers ?? []) {
					if (specifier.type === "ImportNamespaceSpecifier" && specifier.local?.name) {
						namespaceNames.add(specifier.local.name)
						contextMap[specifier.local.name] = regexWand
						continue
					}

					if (specifier.type !== "ImportSpecifier" || !specifier.local?.name) {
						continue
					}

					const importedName = getImportedName(specifier)
					if (!importedName || !(importedName in regexWand)) continue

					contextMap[specifier.local.name] = REGEX_WAND_CONTEXT[importedName]
					if (WRAPPER_EXPORTS.has(importedName)) {
						wrapperNames.add(specifier.local.name)
					}
				}
			})

			if (!hasRelevantImport) return

			const context = createContext(contextMap)
			const replacements: Array<{ end: number; start: number; value: string }> = []

			walkAST(ast, (node) => {
				if (node.type !== "CallExpression") return
				if (node.start == null || node.end == null) return

				const call = node as CallExpressionNode
				if (!isRegexWandBuilderCall(call, wrapperNames, namespaceNames)) return

				try {
					const value = runInContext(code.slice(node.start, node.end), context)
					if (!(value instanceof RegExp)) return

					replacements.push({
						start: node.start,
						end: node.end,
						value: createAdapterExpression(value),
					})
				} catch {
					// Match Magic Regex transform behavior: dynamic expressions are left alone.
				}
			})

			if (replacements.length === 0) return

			return {
				code: applyReplacements(code, replacements),
				map: null,
			}
		},
	}
})

export default RegexWandTransformPlugin

function walkAST(node: AstNode, enter: (node: AstNode) => void) {
	enter(node)

	for (const value of Object.values(node)) {
		if (!value || typeof value !== "object") continue

		if (Array.isArray(value)) {
			for (const child of value) {
				if (isAstNode(child)) walkAST(child, enter)
			}
			continue
		}

		if (isAstNode(value)) walkAST(value, enter)
	}
}

function isAstNode(value: unknown): value is AstNode {
	return (
		typeof value === "object" &&
		value !== null &&
		"type" in value &&
		typeof (value as { type?: unknown }).type === "string"
	)
}

function getImportedName(specifier: ImportSpecifierNode) {
	const imported = specifier.imported
	if (!imported) return undefined

	if (imported.type === "Identifier") return imported.name
	return typeof imported.value === "string" ? imported.value : undefined
}

function isRegexWandBuilderCall(
	call: CallExpressionNode,
	wrapperNames: Set<string>,
	namespaceNames: Set<string>,
) {
	const callee = call.callee
	if (!callee) return false

	if (callee.type === "Identifier") {
		return wrapperNames.has((callee as IdentifierNode).name ?? "")
	}

	if (callee.type !== "MemberExpression") return false

	const member = callee as MemberExpressionNode
	return (
		namespaceNames.has(member.object?.name ?? "") &&
		WRAPPER_EXPORTS.has(member.property?.name ?? "")
	)
}

function createAdapterExpression(value: RegExp) {
	const literal = value.toString()
	return `/*#__PURE__*/ (() => { const regex = ${literal}; return Object.assign(regex, { magic: ${literal}, ark: regex, toRegExp: () => new RegExp(regex.source, regex.flags) }) })()`
}

function applyReplacements(
	code: string,
	replacements: Array<{ end: number; start: number; value: string }>,
) {
	let result = code
	for (const replacement of replacements.sort(
		(left, right) => right.start - left.start,
	)) {
		result =
			result.slice(0, replacement.start) +
			replacement.value +
			result.slice(replacement.end)
	}
	return result
}
