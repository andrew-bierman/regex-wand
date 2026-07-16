import { BookOpen, Check, Copy, ExternalLink, Github, Link, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { CopyTarget } from "@/playground-types"

export function UseItPanel({
	copiedTarget,
	onCopy,
	shareUrl,
	typescriptCode,
}: {
	copiedTarget: CopyTarget | null
	onCopy: (target: CopyTarget, value: string) => void
	shareUrl: string
	typescriptCode: string
}) {
	return (
		<Card className="gap-3 p-4 py-4">
			<div className="flex items-center gap-2">
				<Package className="size-4 text-muted-foreground" />
				<h2 className="text-sm font-semibold">Use it</h2>
			</div>
			<div className="grid gap-2">
				<Button
					type="button"
					variant="outline"
					className="justify-start"
					onClick={() => onCopy("install", "bun add regex-wand")}
				>
					{copiedTarget === "install" ? (
						<Check className="size-4" />
					) : (
						<Copy className="size-4" />
					)}
					<span>Copy install</span>
				</Button>
				<Button
					type="button"
					variant="outline"
					className="justify-start"
					onClick={() => onCopy("npm", "npm install regex-wand")}
				>
					{copiedTarget === "npm" ? (
						<Check className="size-4" />
					) : (
						<Copy className="size-4" />
					)}
					<span>Copy npm install</span>
				</Button>
				<Button
					type="button"
					variant="outline"
					className="justify-start"
					onClick={() => onCopy("code", typescriptCode)}
				>
					{copiedTarget === "code" ? (
						<Check className="size-4" />
					) : (
						<Copy className="size-4" />
					)}
					<span>Copy TypeScript</span>
				</Button>
				<Button
					type="button"
					variant="outline"
					className="justify-start"
					onClick={() =>
						onCopy(
							"config",
							`import { defineConfig } from "vite"
import { RegexWandTransformPlugin } from "regex-wand/transform"

export default defineConfig({
  plugins: [RegexWandTransformPlugin.vite()],
})`,
						)
					}
				>
					{copiedTarget === "config" ? (
						<Check className="size-4" />
					) : (
						<Copy className="size-4" />
					)}
					<span>Copy Vite config</span>
				</Button>
				<Button
					type="button"
					variant="outline"
					className="justify-start"
					onClick={() => onCopy("share", shareUrl)}
				>
					{copiedTarget === "share" ? (
						<Check className="size-4" />
					) : (
						<Link className="size-4" />
					)}
					<span>Copy share link</span>
				</Button>
				<Button asChild variant="outline" className="justify-start">
					<a href="https://www.typescriptlang.org/play" target="_blank" rel="noreferrer">
						<ExternalLink className="size-4" />
						<span>Open in TS Playground</span>
					</a>
				</Button>
				<Button asChild variant="outline" className="justify-start">
					<a
						href="https://github.com/andrew-bierman/regex-wand"
						target="_blank"
						rel="noreferrer"
					>
						<Github className="size-4" />
						<span>GitHub repo</span>
					</a>
				</Button>
				<Button asChild variant="outline" className="justify-start">
					<a
						href="https://github.com/andrew-bierman/regex-wand/tree/main/packages/regex-wand#readme"
						target="_blank"
						rel="noreferrer"
					>
						<BookOpen className="size-4" />
						<span>Read docs</span>
					</a>
				</Button>
			</div>
		</Card>
	)
}
