import type { ComponentProps } from "react"
import { cn } from "../../lib/utils"

type ButtonProps = ComponentProps<"button"> & {
	variant?: "default" | "ghost" | "outline"
	size?: "default" | "icon"
}

export function Button({
	className,
	variant = "default",
	size = "default",
	...props
}: ButtonProps) {
	return (
		<button
			className={cn(
				"inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:pointer-events-none disabled:opacity-50",
				variant === "default" &&
					"bg-[var(--accent)] text-white shadow-sm hover:bg-[var(--accent-strong)]",
				variant === "outline" &&
					"border border-[var(--line)] bg-[var(--panel)] text-[var(--ink)] shadow-sm hover:bg-[var(--panel-soft)]",
				variant === "ghost" && "text-[var(--ink)] hover:bg-[var(--panel-soft)]",
				size === "default" && "h-9 px-4 py-2",
				size === "icon" && "h-9 w-9",
				className,
			)}
			{...props}
		/>
	)
}
