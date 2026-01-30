import { ORPCError } from "@orpc/server";

import { publicProcedure } from "../index";
import {
	createAppointmentSchema,
	finalizeAppointmentSchema,
	getAppointmentSchema,
	listAppointmentsSchema,
	rescheduleAppointmentSchema,
} from "../schemas/appointment";

export const appointmentRouter = {
	/**
	 * Lista atendimentos com filtros (período, status) e paginação
	 */
	list: publicProcedure
		.route({
			method: "GET",
			path: "/appointments",
			summary: "Listar atendimentos",
			description:
				"Retorna atendimentos com paginação. Permite filtro por período e status.",
			tags: ["Appointment"],
		})
		.input(listAppointmentsSchema)
		.handler(async ({ context, input }) => {
			const { page, pageSize, startDate, endDate, status } = input;
			const skip = (page - 1) * pageSize;

			// Construir where clause
			const where: {
				scheduledAt?: { gte?: Date; lte?: Date };
				status?: "OPEN" | "DONE" | "CANCELLED";
			} = {};

			if (startDate || endDate) {
				where.scheduledAt = {};
				if (startDate) {
					where.scheduledAt.gte = new Date(startDate);
				}
				if (endDate) {
					where.scheduledAt.lte = new Date(endDate);
				}
			}

			if (status) {
				where.status = status;
			}

			const [appointments, total] = await Promise.all([
				context.prisma.appointment.findMany({
					where,
					skip,
					take: pageSize,
					orderBy: { scheduledAt: "asc" },
					include: {
						client: {
							include: {
								fieldValues: {
									include: { field: true },
								},
								tags: {
									include: { tag: true },
								},
							},
						},
						assignee: {
							select: { id: true, name: true, email: true },
						},
						creator: {
							select: { id: true, name: true, email: true },
						},
					},
				}),
				context.prisma.appointment.count({ where }),
			]);

			return {
				data: appointments,
				total,
				page,
				pageSize,
			};
		}),

	/**
	 * Busca atendimento por ID
	 */
	getById: publicProcedure
		.route({
			method: "GET",
			path: "/appointments/{id}",
			summary: "Buscar atendimento por ID",
			description:
				"Retorna dados completos do atendimento com cliente e interação (se houver).",
			tags: ["Appointment"],
		})
		.input(getAppointmentSchema)
		.handler(async ({ context, input }) => {
			const { id } = input;

			const appointment = await context.prisma.appointment.findUnique({
				where: { id },
				include: {
					client: {
						include: {
							fieldValues: {
								include: { field: true },
							},
							tags: {
								include: { tag: true },
							},
						},
					},
					assignee: {
						select: { id: true, name: true, email: true },
					},
					creator: {
						select: { id: true, name: true, email: true },
					},
					interaction: {
						include: {
							user: {
								select: { id: true, name: true, email: true },
							},
						},
					},
				},
			});

			if (!appointment) {
				throw new ORPCError("NOT_FOUND", {
					message: "Atendimento não encontrado",
				});
			}

			return appointment;
		}),

	/**
	 * Cria um novo atendimento
	 */
	create: publicProcedure
		.route({
			method: "POST",
			path: "/appointments",
			summary: "Criar atendimento",
			description:
				"Cria um novo atendimento para um cliente. O responsável é automaticamente o responsável do cliente.",
			tags: ["Appointment"],
		})
		.input(createAppointmentSchema)
		.handler(async ({ context, input }) => {
			const { clientId, scheduledAt, userId } = input;
			const scheduledDate = new Date(scheduledAt);

			// Validar data futura
			if (scheduledDate <= new Date()) {
				throw new ORPCError("BAD_REQUEST", {
					message: "A data deve ser futura",
				});
			}

			// Buscar cliente
			const client = await context.prisma.client.findUnique({
				where: { id: clientId },
			});

			if (!client || client.deletedAt) {
				throw new ORPCError("NOT_FOUND", {
					message: "Cliente não encontrado",
				});
			}

			// Validar que cliente tem responsável
			if (!client.assignedTo) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Cliente não possui responsável definido",
				});
			}

			// Verificar se já existe atendimento OPEN para o cliente
			const existingOpen = await context.prisma.appointment.findFirst({
				where: {
					clientId,
					status: "OPEN",
				},
			});

			if (existingOpen) {
				throw new ORPCError("CONFLICT", {
					message: "Já existe atendimento pendente para este cliente",
				});
			}

			// Criar atendimento
			const appointment = await context.prisma.appointment.create({
				data: {
					clientId,
					assignedTo: client.assignedTo,
					scheduledAt: scheduledDate,
					status: "OPEN",
					createdBy: userId,
				},
				include: {
					client: true,
					assignee: {
						select: { id: true, name: true, email: true },
					},
					creator: {
						select: { id: true, name: true, email: true },
					},
				},
			});

			return appointment;
		}),

	/**
	 * Reagenda um atendimento
	 */
	reschedule: publicProcedure
		.route({
			method: "PATCH",
			path: "/appointments/{id}/reschedule",
			summary: "Reagendar atendimento",
			description: "Altera a data e hora de um atendimento aberto.",
			tags: ["Appointment"],
		})
		.input(rescheduleAppointmentSchema)
		.handler(async ({ context, input }) => {
			const { id, scheduledAt } = input;
			const scheduledDate = new Date(scheduledAt);

			// Validar data futura
			if (scheduledDate <= new Date()) {
				throw new ORPCError("BAD_REQUEST", {
					message: "A data deve ser futura",
				});
			}

			// Buscar atendimento
			const appointment = await context.prisma.appointment.findUnique({
				where: { id },
			});

			if (!appointment) {
				throw new ORPCError("NOT_FOUND", {
					message: "Atendimento não encontrado",
				});
			}

			// Validar status
			if (appointment.status === "DONE") {
				throw new ORPCError("BAD_REQUEST", {
					message: "Atendimento concluído não pode ser reagendado",
				});
			}

			if (appointment.status === "CANCELLED") {
				throw new ORPCError("BAD_REQUEST", {
					message: "Apenas atendimentos abertos podem ser reagendados",
				});
			}

			// Atualizar data
			const updated = await context.prisma.appointment.update({
				where: { id },
				data: { scheduledAt: scheduledDate },
				include: {
					client: true,
					assignee: {
						select: { id: true, name: true, email: true },
					},
					creator: {
						select: { id: true, name: true, email: true },
					},
				},
			});

			return updated;
		}),

	/**
	 * Finaliza um atendimento
	 * Operação atômica: cria interação, marca DONE, cria próximo OPEN
	 */
	finalize: publicProcedure
		.route({
			method: "POST",
			path: "/appointments/{id}/finalize",
			summary: "Finalizar atendimento",
			description:
				"Finaliza um atendimento criando interação com snapshot, marcando como DONE e agendando próximo follow-up.",
			tags: ["Appointment"],
		})
		.input(finalizeAppointmentSchema)
		.handler(async ({ context, input }) => {
			const { id, userId, startedAt, summary, outcome, nextAppointmentDate } =
				input;
			const nextDate = new Date(nextAppointmentDate);
			const startedAtDate = new Date(startedAt);
			const endedAt = new Date();

			// Validar data futura para próximo atendimento
			if (nextDate <= new Date()) {
				throw new ORPCError("BAD_REQUEST", {
					message: "A data do próximo atendimento deve ser futura",
				});
			}

			// Buscar atendimento com dados do cliente
			const appointment = await context.prisma.appointment.findUnique({
				where: { id },
				include: {
					client: {
						include: {
							fieldValues: {
								include: { field: true },
							},
							tags: {
								include: { tag: true },
							},
						},
					},
					interaction: true,
				},
			});

			if (!appointment) {
				throw new ORPCError("NOT_FOUND", {
					message: "Atendimento não encontrado",
				});
			}

			// Validar status OPEN
			if (appointment.status !== "OPEN") {
				throw new ORPCError("BAD_REQUEST", {
					message: "Apenas atendimentos abertos podem ser finalizados",
				});
			}

			// Validar que não tem interação já
			if (appointment.interaction) {
				throw new ORPCError("CONFLICT", {
					message: "Atendimento já foi finalizado",
				});
			}

			// Construir snapshot
			const snapshot = {
				whatsapp: appointment.client.whatsapp,
				notes: appointment.client.notes,
				fieldValues: appointment.client.fieldValues.map((fv) => ({
					fieldName: fv.field.name,
					fieldType: fv.field.type,
					value: fv.value,
				})),
				tags: appointment.client.tags.map((ct) => ({
					name: ct.tag.name,
					color: ct.tag.color,
				})),
			};

			// Executar transação atômica
			const result = await context.prisma.$transaction(async (tx) => {
				// 1. Criar Interaction
				const interaction = await tx.interaction.create({
					data: {
						appointmentId: id,
						clientId: appointment.clientId,
						userId,
						startedAt: startedAtDate,
						endedAt,
						summary,
						outcome,
						snapshot,
					},
				});

				// 2. Marcar Appointment como DONE
				const updatedAppointment = await tx.appointment.update({
					where: { id },
					data: { status: "DONE" },
					include: {
						client: true,
						assignee: {
							select: { id: true, name: true, email: true },
						},
						creator: {
							select: { id: true, name: true, email: true },
						},
					},
				});

				// 3. Criar próximo Appointment OPEN
				const nextAppointment = await tx.appointment.create({
					data: {
						clientId: appointment.clientId,
						assignedTo: appointment.assignedTo,
						scheduledAt: nextDate,
						status: "OPEN",
						createdBy: userId,
					},
					include: {
						client: true,
						assignee: {
							select: { id: true, name: true, email: true },
						},
						creator: {
							select: { id: true, name: true, email: true },
						},
					},
				});

				return {
					interaction,
					appointment: updatedAppointment,
					nextAppointment,
				};
			});

			return result;
		}),
};
