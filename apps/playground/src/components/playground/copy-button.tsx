import { Check, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"

export function CopyButton({
	copied,
	onClick,
	title,
}: {
	copied: boolean
	onClick: () => void
	title: string
}) {
	return (
		<Button
			type="button"
			variant="outline"
			size="icon-sm"
			title={title}
			onClick={onClick}
		>
			{copied ? <Check className="size-4" /> : <Copy className="size-4" />}
		</Button>
	)
}
