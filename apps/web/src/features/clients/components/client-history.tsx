import { Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	ChevronDown,
	ChevronRight,
	Clock,
	User,
} from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { TagBadge } from "@/components/tag-badge";
import { Button } from "@/components/ui/button";
import {
	getClientName,
	getInteractionsByClient,
	mockClients,
} from "@/lib/mock-data";
import type { FieldType, Interaction } from "@/types/common.types";
import {
	formatDateTime,
	formatDuration,
	getRelativeTime,
} from "@/utils/format";

function formatFieldValue(
	fieldType: FieldType,
	value: string | number | boolean | null
): string {
	if (fieldType === "CHECKBOX") {
		return value ? "Sim" : "Não";
	}
	return String(value);
}

interface ClientHistoryProps {
	clientId: string;
}

export function ClientHistory({ clientId }: ClientHistoryProps) {
	const client = mockClients.find((c) => c.id === clientId);
	const interactions = getInteractionsByClient(clientId);

	if (!client) {
		return (
			<div className="p-6">
				<p>Cliente não encontrado</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6 p-6">
			<div className="flex items-center gap-4">
				<Button asChild size="sm" variant="ghost">
					<Link params={{ id: clientId }} to="/clients/$id/edit">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Voltar
					</Link>
				</Button>
			</div>

			<PageHeader
				description={`${interactions.length} interação${interactions.length !== 1 ? "ões" : ""} registrada${interactions.length !== 1 ? "s" : ""}`}
				title={`Histórico de ${getClientName(client)}`}
			/>

			<div className="space-y-4">
				{interactions.length === 0 ? (
					<div className="rounded-lg border border-border bg-card p-8 text-center">
						<p className="text-muted-foreground">
							Nenhuma interação registrada.
						</p>
					</div>
				) : (
					<div className="relative">
						<div className="absolute top-0 left-4 h-full w-0.5 bg-border" />
						<div className="space-y-6">
							{interactions.map((interaction) => (
								<InteractionCard
									interaction={interaction}
									key={interaction.id}
								/>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function InteractionCard({ interaction }: { interaction: Interaction }) {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<div className="relative ml-8">
			<div className="absolute top-4 -left-[1.625rem] h-3 w-3 rounded-full border-2 border-brand-500 bg-background" />

			<div className="rounded-lg border border-border bg-card">
				<div className="p-4">
					<div className="mb-2 flex items-center justify-between">
						<div className="flex items-center gap-3 text-muted-foreground text-sm">
							<span className="font-medium text-foreground">
								{formatDateTime(interaction.createdAt)}
							</span>
							<span>{getRelativeTime(interaction.createdAt)}</span>
						</div>
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<User className="h-4 w-4" />
							{interaction.userName}
							{interaction.duration && (
								<>
									<Clock className="ml-2 h-4 w-4" />
									{formatDuration(interaction.duration)}
								</>
							)}
						</div>
					</div>

					<p className="mb-2 text-foreground">{interaction.summary}</p>

					<div className="flex items-center gap-2">
						<span className="font-medium text-muted-foreground text-sm">
							Resultado:
						</span>
						<span className="text-foreground text-sm">
							{interaction.outcome}
						</span>
					</div>
				</div>

				<div className="border-border border-t">
					<button
						className="flex w-full items-center justify-between px-4 py-2 text-muted-foreground text-sm hover:bg-accent/50"
						onClick={() => setIsExpanded(!isExpanded)}
						type="button"
					>
						<span>Dados do cliente no momento</span>
						{isExpanded ? (
							<ChevronDown className="h-4 w-4" />
						) : (
							<ChevronRight className="h-4 w-4" />
						)}
					</button>

					{isExpanded && (
						<div className="border-border border-t bg-muted/30 p-4">
							<div className="space-y-3">
								<div>
									<span className="font-medium text-muted-foreground text-sm">
										WhatsApp:
									</span>
									<span className="ml-2 text-sm">
										{interaction.clientSnapshot.whatsapp}
									</span>
								</div>

								{interaction.clientSnapshot.notes && (
									<div>
										<span className="font-medium text-muted-foreground text-sm">
											Notas:
										</span>
										<p className="mt-1 text-sm">
											{interaction.clientSnapshot.notes}
										</p>
									</div>
								)}

								{interaction.clientSnapshot.tags.length > 0 && (
									<div>
										<span className="font-medium text-muted-foreground text-sm">
											Tags:
										</span>
										<div className="mt-1 flex flex-wrap gap-1">
											{interaction.clientSnapshot.tags.map((tag) => (
												<TagBadge
													color={tag.color}
													key={tag.id}
													name={tag.name}
												/>
											))}
										</div>
									</div>
								)}

								{interaction.clientSnapshot.fieldValues.length > 0 && (
									<div>
										<span className="font-medium text-muted-foreground text-sm">
											Campos:
										</span>
										<div className="mt-1 space-y-1">
											{interaction.clientSnapshot.fieldValues.map((fv) => (
												<div className="text-sm" key={fv.fieldId}>
													<span className="text-muted-foreground">
														{fv.fieldName}:
													</span>
													<span className="ml-2">
														{formatFieldValue(fv.fieldType, fv.value)}
													</span>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
