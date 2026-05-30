import type { ComponentProps } from "react"
import { cn } from "../../lib/utils"

export function Badge({ className, ...props }: ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--panel-soft)] px-2.5 py-1 text-xs font-medium text-[var(--ink)]",
				className,
			)}
			{...props}
		/>
	)
}
