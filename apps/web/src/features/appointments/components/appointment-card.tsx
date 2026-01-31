import { Clock, MessageCircle } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { TagBadge } from "@/components/tag-badge";
import { Button } from "@/components/ui/button";
import type { Appointment } from "@/types/common.types";
import { formatTime, getWhatsAppLink, isOverdue } from "@/utils/format";

interface AppointmentCardProps {
	appointment: Appointment;
	onClick?: () => void;
	compact?: boolean;
}

export function AppointmentCard({
	appointment,
	onClick,
	compact = false,
}: AppointmentCardProps) {
	const isLate =
		appointment.status === "OPEN" && isOverdue(appointment.scheduledAt);

	const cardClassName = `flex items-center justify-between rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent/50 ${
		isLate ? "border-error-300 bg-error-50/50" : "border-border"
	}`;

	const cardContent = (
		<>
			<div className="flex flex-col gap-1">
				<div className="flex items-center gap-2">
					<Clock className="h-4 w-4 text-muted-foreground" />
					<span className={`font-medium ${isLate ? "text-error-700" : ""}`}>
						{formatTime(appointment.scheduledAt)}
					</span>
					<span className="text-foreground">{appointment.clientName}</span>
					<StatusBadge status={appointment.status} />
					{isLate && (
						<span className="font-medium text-error-600 text-xs">ATRASADO</span>
					)}
				</div>

				{!compact && (
					<>
						{appointment.clientTags.length > 0 && (
							<div className="flex flex-wrap gap-1">
								{appointment.clientTags.map((tag) => (
									<TagBadge color={tag.color} key={tag.id} name={tag.name} />
								))}
							</div>
						)}

						{appointment.lastOutcome && (
							<p className="line-clamp-1 text-muted-foreground text-sm">
								Último: {appointment.lastOutcome}
							</p>
						)}
					</>
				)}
			</div>

			<Button
				asChild
				onClick={(e) => e.stopPropagation()}
				size="sm"
				variant="ghost"
			>
				<a
					href={getWhatsAppLink(appointment.clientWhatsapp)}
					rel="noopener noreferrer"
					target="_blank"
				>
					<MessageCircle className="h-4 w-4" />
				</a>
			</Button>
		</>
	);

	if (onClick) {
		return (
			<button className={cardClassName} onClick={onClick} type="button">
				{cardContent}
			</button>
		);
	}

	return <div className={cardClassName}>{cardContent}</div>;
}
