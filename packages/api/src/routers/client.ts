import { ORPCError } from "@orpc/server";

import { publicProcedure } from "../index";
import {
	createClientSchema,
	deactivateClientSchema,
	getClientHistorySchema,
	getClientSchema,
	listClientsSchema,
	transferClientSchema,
	updateClientSchema,
} from "../schemas/client";

export const clientRouter = {
	/**
	 * Lista clientes com paginação, busca e filtro por tags
	 */
	list: publicProcedure
		.route({
			method: "GET",
			path: "/clients",
			summary: "Listar clientes",
			description:
				"Retorna clientes com paginação. Permite busca por Nome/Empresa e filtro por tags.",
			tags: ["Client"],
		})
		.input(listClientsSchema)
		.handler(async ({ context, input }) => {
			const { page, pageSize, search, tagIds } = input;

			// Construir where clause
			const where: {
				deletedAt: null;
				AND?: Array<{
					fieldValues?: {
						some: {
							field: { name: { in: string[] } };
							value: { contains: string; mode: "insensitive" };
						};
					};
					tags?: { some: { tagId: { in: string[] } } };
				}>;
			} = {
				deletedAt: null,
			};

			const andConditions: Array<{
				fieldValues?: {
					some: {
						field: { name: { in: string[] } };
						value: { contains: string; mode: "insensitive" };
					};
				};
				tags?: { some: { tagId: { in: string[] } } };
			}> = [];

			// Busca por Nome ou Empresa
			if (search) {
				andConditions.push({
					fieldValues: {
						some: {
							field: { name: { in: ["Nome", "Empresa"] } },
							value: { contains: search, mode: "insensitive" },
						},
					},
				});
			}

			// Filtro por tags (lógica OR - clientes com ALGUMA das tags)
			if (tagIds && tagIds.length > 0) {
				andConditions.push({
					tags: {
						some: {
							tagId: { in: tagIds },
						},
					},
				});
			}

			if (andConditions.length > 0) {
				where.AND = andConditions;
			}

			// Buscar todos os clientes que correspondem ao filtro
			// (precisamos ordenar em memória pelo próximo appointment)
			const allClients = await context.prisma.client.findMany({
				where,
				include: {
					tags: {
						include: { tag: true },
					},
					fieldValues: {
						include: { field: true },
					},
					assignee: {
						select: { id: true, name: true, email: true },
					},
					appointments: {
						where: { status: "OPEN" },
						orderBy: { scheduledAt: "asc" },
						take: 1,
					},
				},
			});

			// Ordenar por próximo appointment (mais urgente primeiro, sem appointment no final)
			const sortedClients = allClients.sort((a, b) => {
				const aNextAppointment = a.appointments[0]?.scheduledAt;
				const bNextAppointment = b.appointments[0]?.scheduledAt;

				// Clientes sem appointment vão pro final
				if (!(aNextAppointment || bNextAppointment)) {
					return 0;
				}
				if (!aNextAppointment) {
					return 1;
				}
				if (!bNextAppointment) {
					return -1;
				}

				// Ordenar por data (mais próximo primeiro)
				return (
					new Date(aNextAppointment).getTime() -
					new Date(bNextAppointment).getTime()
				);
			});

			// Aplicar paginação manualmente
			const total = sortedClients.length;
			const skip = (page - 1) * pageSize;
			const paginatedClients = sortedClients.slice(skip, skip + pageSize);

			return {
				data: paginatedClients,
				total,
				page,
				pageSize,
			};
		}),

	/**
	 * Busca cliente por ID
	 */
	getById: publicProcedure
		.route({
			method: "GET",
			path: "/clients/{id}",
			summary: "Buscar cliente por ID",
			description:
				"Retorna dados completos do cliente com campos customizáveis e tags.",
			tags: ["Client"],
		})
		.input(getClientSchema)
		.handler(async ({ context, input }) => {
			const { id } = input;

			const client = await context.prisma.client.findUnique({
				where: { id },
				include: {
					tags: {
						include: { tag: true },
					},
					fieldValues: {
						include: { field: true },
					},
					assignee: {
						select: { id: true, name: true, email: true },
					},
				},
			});

			if (!client) {
				throw new ORPCError("NOT_FOUND", {
					message: "Cliente não encontrado",
				});
			}

			if (client.deletedAt) {
				throw new ORPCError("NOT_FOUND", {
					message: "Cliente não encontrado",
				});
			}

			return client;
		}),

	/**
	 * Cria um novo cliente
	 */
	create: publicProcedure
		.route({
			method: "POST",
			path: "/clients",
			summary: "Criar cliente",
			description:
				"Cria um novo cliente com campos customizáveis. Cria automaticamente o primeiro atendimento.",
			tags: ["Client"],
		})
		.input(createClientSchema)
		.handler(async ({ context, input }) => {
			const {
				whatsapp,
				notes,
				assignedTo,
				userId,
				scheduledAt,
				fieldValues,
				tagIds,
			} = input;

			// Buscar campos obrigatórios ativos
			const requiredFields = await context.prisma.clientField.findMany({
				where: { required: true, active: true },
			});

			// Validar que todos os campos obrigatórios estão preenchidos
			const providedFieldIds = new Set(fieldValues.map((fv) => fv.fieldId));
			const missingFields = requiredFields.filter(
				(field) => !providedFieldIds.has(field.id)
			);

			if (missingFields.length > 0) {
				const fieldNames = missingFields.map((f) => f.name).join(", ");
				throw new ORPCError("BAD_REQUEST", {
					message: `Campos obrigatórios não preenchidos: ${fieldNames}`,
				});
			}

			// Criar cliente em uma transação
			const client = await context.prisma.$transaction(async (tx) => {
				// 1. Criar cliente
				const newClient = await tx.client.create({
					data: {
						whatsapp,
						notes,
						assignedTo,
					},
				});

				// 2. Criar valores de campos customizáveis
				if (fieldValues.length > 0) {
					await tx.clientFieldValue.createMany({
						data: fieldValues.map((fv) => ({
							clientId: newClient.id,
							fieldId: fv.fieldId,
							value: fv.value,
						})),
					});
				}

				// 3. Vincular tags
				if (tagIds.length > 0) {
					await tx.clientTag.createMany({
						data: tagIds.map((tagId) => ({
							clientId: newClient.id,
							tagId,
						})),
					});
				}

				// 4. Criar primeiro appointment
				await tx.appointment.create({
					data: {
						clientId: newClient.id,
						assignedTo,
						scheduledAt: new Date(scheduledAt),
						status: "OPEN",
						createdBy: userId,
					},
				});

				// 5. Registrar evento CREATED no histórico
				await tx.clientHistory.create({
					data: {
						clientId: newClient.id,
						type: "CREATED",
						data: {
							whatsapp,
							notes,
							assignedTo,
							fieldValues,
							tagIds,
							scheduledAt,
						},
						createdBy: userId,
					},
				});

				return newClient;
			});

			// Retornar cliente com includes
			return context.prisma.client.findUnique({
				where: { id: client.id },
				include: {
					tags: {
						include: { tag: true },
					},
					fieldValues: {
						include: { field: true },
					},
					assignee: {
						select: { id: true, name: true, email: true },
					},
				},
			});
		}),

	/**
	 * Atualiza um cliente existente
	 */
	update: publicProcedure
		.route({
			method: "PATCH",
			path: "/clients/{id}",
			summary: "Editar cliente",
			description:
				"Atualiza WhatsApp, notas, responsável ou campos customizáveis.",
			tags: ["Client"],
		})
		.input(updateClientSchema)
		.handler(async ({ context, input }) => {
			const { id, whatsapp, notes, fieldValues } = input;

			// Verificar se cliente existe e não está deletado
			const currentClient = await context.prisma.client.findUnique({
				where: { id },
			});

			if (!currentClient) {
				throw new ORPCError("NOT_FOUND", {
					message: "Cliente não encontrado",
				});
			}

			if (currentClient.deletedAt) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Não é possível atualizar um cliente desativado",
				});
			}

			// Atualizar cliente em transação
			await context.prisma.$transaction(async (tx) => {
				// 1. Atualizar dados básicos (exceto assignedTo - usar rota transfer)
				await tx.client.update({
					where: { id },
					data: {
						...(whatsapp !== undefined && { whatsapp }),
						...(notes !== undefined && { notes }),
					},
				});

				// 2. Atualizar fieldValues (upsert)
				if (fieldValues && fieldValues.length > 0) {
					for (const fv of fieldValues) {
						await tx.clientFieldValue.upsert({
							where: {
								clientId_fieldId: {
									clientId: id,
									fieldId: fv.fieldId,
								},
							},
							create: {
								clientId: id,
								fieldId: fv.fieldId,
								value: fv.value,
							},
							update: {
								value: fv.value,
							},
						});
					}
				}
			});

			// Retornar cliente atualizado
			return context.prisma.client.findUnique({
				where: { id },
				include: {
					tags: {
						include: { tag: true },
					},
					fieldValues: {
						include: { field: true },
					},
					assignee: {
						select: { id: true, name: true, email: true },
					},
				},
			});
		}),

	/**
	 * Desativa um cliente (soft delete)
	 */
	deactivate: publicProcedure
		.route({
			method: "POST",
			path: "/clients/{id}/deactivate",
			summary: "Desativar cliente",
			description:
				"Desativa um cliente (soft delete). O histórico é preservado.",
			tags: ["Client"],
		})
		.input(deactivateClientSchema)
		.handler(async ({ context, input }) => {
			const { id } = input;

			// Verificar se cliente existe
			const client = await context.prisma.client.findUnique({
				where: { id },
			});

			if (!client) {
				throw new ORPCError("NOT_FOUND", {
					message: "Cliente não encontrado",
				});
			}

			// Definir deletedAt
			const updatedClient = await context.prisma.client.update({
				where: { id },
				data: {
					deletedAt: client.deletedAt ?? new Date(),
				},
			});

			return updatedClient;
		}),

	/**
	 * Lista interações do cliente (histórico com snapshot)
	 */
	history: publicProcedure
		.route({
			method: "GET",
			path: "/clients/{clientId}/history",
			summary: "Histórico de interações do cliente",
			description:
				"Lista interações do cliente com paginação. Cada interação contém snapshot dos dados no momento do registro.",
			tags: ["Client"],
		})
		.input(getClientHistorySchema)
		.handler(async ({ context, input }) => {
			const { clientId, page, pageSize } = input;
			const skip = (page - 1) * pageSize;

			// Verificar se cliente existe (mesmo deletado, histórico é acessível)
			const client = await context.prisma.client.findUnique({
				where: { id: clientId },
			});

			if (!client) {
				throw new ORPCError("NOT_FOUND", {
					message: "Cliente não encontrado",
				});
			}

			// Buscar interações (histórico real com snapshot)
			const [interactions, total] = await Promise.all([
				context.prisma.interaction.findMany({
					where: { clientId },
					skip,
					take: pageSize,
					orderBy: { endedAt: "desc" },
					include: {
						user: {
							select: { id: true, name: true, email: true },
						},
						appointment: {
							select: { id: true, scheduledAt: true },
						},
					},
				}),
				context.prisma.interaction.count({ where: { clientId } }),
			]);

			return {
				data: interactions,
				total,
				page,
				pageSize,
			};
		}),

	/**
	 * Transfere um cliente para outro usuário
	 * Também transfere os appointments OPEN para o novo responsável
	 */
	transfer: publicProcedure
		.route({
			method: "POST",
			path: "/clients/{id}/transfer",
			summary: "Transferir cliente",
			description:
				"Transfere um cliente para outro usuário. Todos os atendimentos OPEN também são transferidos.",
			tags: ["Client"],
		})
		.input(transferClientSchema)
		.handler(async ({ context, input }) => {
			const { id, newAssigneeId } = input;

			// Verificar se cliente existe e não está deletado
			const client = await context.prisma.client.findUnique({
				where: { id },
			});

			if (!client) {
				throw new ORPCError("NOT_FOUND", {
					message: "Cliente não encontrado",
				});
			}

			if (client.deletedAt) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Não é possível transferir um cliente desativado",
				});
			}

			// Verificar se novo responsável existe
			const newAssignee = await context.prisma.user.findUnique({
				where: { id: newAssigneeId },
			});

			if (!newAssignee) {
				throw new ORPCError("NOT_FOUND", {
					message: "Novo responsável não encontrado",
				});
			}

			// Verificar se é o mesmo responsável
			if (client.assignedTo === newAssigneeId) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Cliente já está atribuído a este usuário",
				});
			}

			// Executar transferência em transação
			await context.prisma.$transaction(async (tx) => {
				// 1. Atualizar responsável do cliente
				await tx.client.update({
					where: { id },
					data: { assignedTo: newAssigneeId },
				});

				// 2. Transferir todos os appointments OPEN
				await tx.appointment.updateMany({
					where: {
						clientId: id,
						status: "OPEN",
					},
					data: {
						assignedTo: newAssigneeId,
					},
				});
			});

			// Retornar cliente atualizado
			return context.prisma.client.findUnique({
				where: { id },
				include: {
					tags: {
						include: { tag: true },
					},
					fieldValues: {
						include: { field: true },
					},
					assignee: {
						select: { id: true, name: true, email: true },
					},
				},
			});
		}),
};
