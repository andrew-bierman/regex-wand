import type { ComponentProps } from "react"
import { cn } from "../../lib/utils"

export function Card({ className, ...props }: ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"rounded-lg border border-[var(--line)] bg-[var(--panel)] text-[var(--ink)]",
				className,
			)}
			{...props}
		/>
	)
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
	return <div className={cn("flex items-center gap-2 p-4", className)} {...props} />
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
	return <div className={cn("p-4 pt-0", className)} {...props} />
}
