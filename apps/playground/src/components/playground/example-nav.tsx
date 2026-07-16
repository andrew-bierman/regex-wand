import { ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { PlaygroundExample } from "@/playground-types"

export function ExampleNav({
	examples,
	onSelect,
	selectedId,
}: {
	examples: PlaygroundExample[]
	onSelect: (exampleId: string) => void
	selectedId: string
}) {
	return (
		<nav
			className="flex gap-1 overflow-x-auto border-b bg-muted/30 p-2 lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r"
			aria-label="Examples"
		>
			<div className="hidden px-2 pb-2 pt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground lg:block">
				Examples
			</div>
			{examples.map((example) => {
				const ExampleIcon = example.icon
				return (
					<Button
						type="button"
						variant={example.id === selectedId ? "secondary" : "ghost"}
						className="h-10 min-w-max justify-start gap-2 px-3 lg:min-w-0"
						key={example.id}
						onClick={() => onSelect(example.id)}
					>
						<ExampleIcon className="size-4 text-muted-foreground" />
						<span className="min-w-0 truncate">{example.title}</span>
						<ChevronRight className="ml-auto size-4 text-muted-foreground" />
					</Button>
				)
			})}
		</nav>
	)
}
