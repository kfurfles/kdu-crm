import { cn } from "@/lib/utils";

interface TagBadgeProps {
	name: string;
	color: string;
	className?: string;
}

export function TagBadge({ name, color, className }: TagBadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700 text-xs",
				className
			)}
		>
			<span
				className="h-2 w-2 rounded-full"
				style={{ backgroundColor: color }}
			/>
			{name}
		</span>
	);
}
