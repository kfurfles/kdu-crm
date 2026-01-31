import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/types/common.types";

interface StatusBadgeProps {
	status: AppointmentStatus;
	className?: string;
}

const statusConfig: Record<
	AppointmentStatus,
	{ label: string; className: string }
> = {
	OPEN: {
		label: "Aberto",
		className: "bg-brand-50 text-brand-700 border-brand-200",
	},
	DONE: {
		label: "Concluído",
		className: "bg-gray-100 text-gray-700 border-gray-200",
	},
	CANCELLED: {
		label: "Cancelado",
		className: "bg-error-50 text-error-700 border-error-200",
	},
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
	const config = statusConfig[status];

	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full border px-2 py-0.5 font-medium text-xs",
				config.className,
				className
			)}
		>
			{config.label}
		</span>
	);
}
