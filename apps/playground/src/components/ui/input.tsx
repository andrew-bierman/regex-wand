import type { ComponentProps } from "react"
import { cn } from "../../lib/utils"

export function Input({ className, ...props }: ComponentProps<"input">) {
	return (
		<input
			className={cn(
				"flex h-10 w-full rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm text-[var(--ink)] shadow-sm transition-colors placeholder:text-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	)
}
