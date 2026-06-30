import { BadgeCheck, CircleX } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { PatternEvaluation, PlaygroundExample } from "@/playground-types"

export function SamplePanel({
	evaluation,
	input,
	onInputChange,
	onUseSample,
	selected,
}: {
	evaluation: PatternEvaluation
	input: string
	onInputChange: (value: string) => void
	onUseSample: (value: string) => void
	selected: PlaygroundExample
}) {
	return (
		<Card className="gap-3 p-4 py-4">
			<div className="flex items-center justify-between gap-3">
				<label
					htmlFor="sample-input"
					className="text-sm font-medium text-muted-foreground"
				>
					Sample input
				</label>
				<Badge variant={evaluation.isMatch ? "default" : "destructive"}>
					{evaluation.isMatch ? "match" : "no match"}
				</Badge>
			</div>
			<div className="flex items-center gap-2">
				<Input
					id="sample-input"
					value={input}
					onChange={(event) => onInputChange(event.target.value)}
				/>
				<Button
					type="button"
					variant="outline"
					size="icon"
					title="Use matching sample"
					onClick={() => onUseSample(selected.defaultInput)}
				>
					<BadgeCheck className="size-4" />
				</Button>
				<Button
					type="button"
					variant="outline"
					size="icon"
					title="Use non-matching sample"
					onClick={() => onUseSample(selected.invalidInput)}
				>
					<CircleX className="size-4" />
				</Button>
			</div>
			<div className="grid gap-2 sm:grid-cols-2">
				<div className="min-w-0 rounded-md bg-muted p-3">
					<span className="text-xs font-medium uppercase text-muted-foreground">
						captures
					</span>
					<code className="mt-2 block overflow-auto text-xs leading-5">
						{JSON.stringify(evaluation.match?.slice(1) ?? [])}
					</code>
				</div>
				<div className="min-w-0 rounded-md bg-muted p-3">
					<span className="text-xs font-medium uppercase text-muted-foreground">
						groups
					</span>
					<code className="mt-2 block overflow-auto text-xs leading-5">
						{JSON.stringify(evaluation.match?.groups ?? {})}
					</code>
				</div>
			</div>
		</Card>
	)
}
