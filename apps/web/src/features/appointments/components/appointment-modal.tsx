import { Link } from "@tanstack/react-router";
import { Calendar, Clock, MessageCircle, Pencil, User, X } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { TagBadge } from "@/components/tag-badge";
import { Button } from "@/components/ui/button";
import { getInteractionsByClient, mockClients } from "@/lib/mock-data";
import type { Appointment } from "@/types/common.types";
import {
	formatDateTime,
	formatDuration,
	getWhatsAppLink,
} from "@/utils/format";

interface AppointmentModalProps {
	appointment: Appointment;
	onClose: () => void;
}

export function AppointmentModal({
	appointment,
	onClose,
}: AppointmentModalProps) {
	const client = mockClients.find((c) => c.id === appointment.clientId);
	const interactions = client
		? getInteractionsByClient(client.id).slice(0, 5)
		: [];

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-background shadow-xl">
				<div className="sticky top-0 flex items-center justify-between border-border border-b bg-background p-4">
					<div className="flex items-center gap-3">
						<StatusBadge status={appointment.status} />
						<span className="text-muted-foreground text-sm">
							{formatDateTime(appointment.scheduledAt)}
						</span>
					</div>
					<Button onClick={onClose} size="sm" variant="ghost">
						<X className="h-4 w-4" />
					</Button>
				</div>

				<div className="space-y-6 p-6">
					<section>
						<h3 className="mb-3 font-semibold text-foreground">
							Dados do Cliente
						</h3>
						<div className="space-y-3 rounded-lg border border-border p-4">
							<div className="flex items-center justify-between">
								<span className="font-medium text-lg">
									{appointment.clientName}
								</span>
								<div className="flex gap-2">
									<a
										className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 font-medium text-sm hover:bg-muted hover:text-foreground"
										href={getWhatsAppLink(appointment.clientWhatsapp)}
										rel="noopener noreferrer"
										target="_blank"
									>
										<MessageCircle className="mr-2 h-4 w-4" />
										WhatsApp
									</a>
									<Link
										className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 font-medium text-sm hover:bg-muted hover:text-foreground"
										params={{ id: appointment.clientId }}
										to="/clients/$id/edit"
									>
										<Pencil className="mr-2 h-4 w-4" />
										Editar
									</Link>
								</div>
							</div>

							{appointment.clientTags.length > 0 && (
								<div className="flex flex-wrap gap-1">
									{appointment.clientTags.map((tag) => (
										<TagBadge color={tag.color} key={tag.id} name={tag.name} />
									))}
								</div>
							)}

							{client?.notes && (
								<div>
									<span className="font-medium text-muted-foreground text-sm">
										Notas:
									</span>
									<p className="mt-1 text-sm">{client.notes}</p>
								</div>
							)}
						</div>
					</section>

					<section>
						<div className="mb-3 flex items-center justify-between">
							<h3 className="font-semibold text-foreground">
								Histórico de Interações
							</h3>
							{interactions.length > 0 && (
								<Link
									className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm hover:bg-muted hover:text-foreground"
									params={{ id: appointment.clientId }}
									to="/clients/$id/history"
								>
									Ver histórico completo
								</Link>
							)}
						</div>

						{interactions.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								Nenhuma interação registrada.
							</p>
						) : (
							<div className="space-y-2">
								{interactions.map((interaction) => (
									<div
										className="rounded-lg border border-border p-3"
										key={interaction.id}
									>
										<div className="mb-1 flex items-center justify-between">
											<span className="font-medium text-sm">
												{formatDateTime(interaction.createdAt)}
											</span>
											<div className="flex items-center gap-2 text-muted-foreground text-sm">
												<User className="h-3 w-3" />
												{interaction.userName}
												{interaction.duration && (
													<>
														<Clock className="ml-1 h-3 w-3" />
														{formatDuration(interaction.duration)}
													</>
												)}
											</div>
										</div>
										<p className="text-sm">{interaction.summary}</p>
										<p className="mt-1 text-muted-foreground text-sm">
											Resultado: {interaction.outcome}
										</p>
									</div>
								))}
							</div>
						)}
					</section>

					<section>
						<h3 className="mb-3 font-semibold text-foreground">Ações</h3>
						{appointment.status === "OPEN" && (
							<div className="flex flex-wrap gap-2">
								<Button>Iniciar Atendimento</Button>
								<Button variant="outline">Reagendar</Button>
								<Button
									className="text-error-600 hover:text-error-700"
									variant="outline"
								>
									Cancelar
								</Button>
							</div>
						)}

						{appointment.status === "DONE" && (
							<div className="rounded-lg border border-border bg-muted/30 p-4">
								<p className="text-muted-foreground text-sm">
									Atendimento concluído em{" "}
									{formatDateTime(appointment.scheduledAt)}
								</p>
							</div>
						)}

						{appointment.status === "CANCELLED" && (
							<div className="rounded-lg border border-error-200 bg-error-50 p-4">
								<p className="text-error-700 text-sm">Atendimento cancelado</p>
							</div>
						)}
					</section>

					{client?.nextAppointmentDate && appointment.status !== "OPEN" && (
						<div className="rounded-lg border border-border bg-brand-50 p-4">
							<div className="flex items-center gap-2">
								<Calendar className="h-4 w-4 text-brand-700" />
								<span className="font-medium text-brand-700 text-sm">
									Próximo atendimento:{" "}
									{formatDateTime(client.nextAppointmentDate)}
								</span>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
