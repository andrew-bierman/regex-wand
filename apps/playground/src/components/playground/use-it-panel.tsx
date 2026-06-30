import { Check, Copy, ExternalLink, Link, Package } from "lucide-react"

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
			</div>
		</Card>
	)
}
