import { Card } from "@/components/ui/card"

export function TypeRow({ label, value }: { label: string; value: string }) {
	return (
		<Card className="gap-2 p-4 py-4">
			<span className="text-xs font-medium uppercase text-muted-foreground">{label}</span>
			<code className="overflow-auto rounded-md bg-muted px-3 py-2 text-xs leading-5">
				{value}
			</code>
		</Card>
	)
}
