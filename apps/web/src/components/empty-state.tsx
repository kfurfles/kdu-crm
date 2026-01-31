import { cn } from "@/lib/utils";

interface EmptyStateProps {
	icon?: React.ReactNode;
	title: string;
	description?: string;
	action?: React.ReactNode;
	className?: string;
}

export function EmptyState({
	icon,
	title,
	description,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center px-4 py-12 text-center",
				className
			)}
		>
			{icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
			<h3 className="font-semibold text-foreground text-lg">{title}</h3>
			{description && (
				<p className="mt-1 max-w-sm text-muted-foreground text-sm">
					{description}
				</p>
			)}
			{action && <div className="mt-4">{action}</div>}
		</div>
	);
}
