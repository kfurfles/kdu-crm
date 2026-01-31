import { ORPCError } from "@orpc/server";

import { publicProcedure } from "../index";
import {
	createClientFieldSchema,
	deactivateClientFieldSchema,
	reorderClientFieldsSchema,
	updateClientFieldSchema,
} from "../schemas/client-field";

export const clientFieldRouter = {
	/**
	 * Lista todos os campos customizáveis ativos, ordenados por order
	 */
	list: publicProcedure
		.route({
			method: "GET",
			path: "/client-fields",
			summary: "Listar campos customizáveis",
			description:
				"Retorna todos os campos configurados ordenados pela ordem de exibição. Apenas campos ativos são retornados.",
			tags: ["ClientField"],
		})
		.handler(async ({ context }) => {
			const fields = await context.prisma.clientField.findMany({
				where: { active: true },
				orderBy: { order: "asc" },
			});
			return fields;
		}),

	/**
	 * Cria um novo campo customizável
	 */
	create: publicProcedure
		.route({
			method: "POST",
			path: "/client-fields",
			summary: "Criar campo customizável",
			description:
				"Cria um novo campo para clientes. O nome deve ser único. Campos do tipo SELECT devem ter pelo menos uma opção.",
			tags: ["ClientField"],
		})
		.input(createClientFieldSchema)
		.handler(async ({ context, input }) => {
			try {
				const field = await context.prisma.clientField.create({
					data: {
						name: input.name,
						type: input.type,
						required: input.required,
						options: input.options,
						order: input.order,
					},
				});
				return field;
			} catch (error) {
				// Verificar se é erro de unique constraint
				if (
					error instanceof Error &&
					error.message.includes("Unique constraint")
				) {
					throw new ORPCError("CONFLICT", {
						message: `Já existe um campo com o nome "${input.name}"`,
					});
				}
				throw error;
			}
		}),

	/**
	 * Atualiza um campo customizável existente
	 * O tipo do campo não pode ser alterado
	 */
	update: publicProcedure
		.route({
			method: "PATCH",
			path: "/client-fields/{id}",
			summary: "Editar campo customizável",
			description:
				"Altera nome, obrigatoriedade, ordem ou opções de um campo. O tipo não pode ser alterado. Opções de SELECT não podem ser removidas, apenas adicionadas.",
			tags: ["ClientField"],
		})
		.input(updateClientFieldSchema)
		.handler(async ({ context, input }) => {
			const { id, options, name, ...updateData } = input;

			// Buscar campo atual
			const currentField = await context.prisma.clientField.findUnique({
				where: { id },
			});

			if (!currentField) {
				throw new ORPCError("NOT_FOUND", {
					message: "Campo não encontrado",
				});
			}

			// Verificar se está tentando remover opções de SELECT
			if (options !== undefined && currentField.type === "SELECT") {
				const removedOptions = currentField.options.filter(
					(opt) => !options.includes(opt)
				);

				if (removedOptions.length > 0) {
					throw new ORPCError("BAD_REQUEST", {
						message: `Não é permitido remover opções de campos SELECT. Opções removidas: ${removedOptions.join(", ")}`,
					});
				}
			}

			// Verificar nome duplicado
			if (name !== undefined && name !== currentField.name) {
				const existingField = await context.prisma.clientField.findFirst({
					where: { name },
				});

				if (existingField) {
					throw new ORPCError("CONFLICT", {
						message: `Já existe um campo com o nome "${name}"`,
					});
				}
			}

			const field = await context.prisma.clientField.update({
				where: { id },
				data: {
					...updateData,
					...(name !== undefined && { name }),
					...(options !== undefined && { options }),
				},
			});

			return field;
		}),

	/**
	 * Desativa um campo customizável
	 */
	deactivate: publicProcedure
		.route({
			method: "POST",
			path: "/client-fields/{id}/deactivate",
			summary: "Desativar campo customizável",
			description:
				"Desativa um campo para que não apareça em novos cadastros. Campos obrigatórios só podem ser desativados se todos os clientes têm valor preenchido.",
			tags: ["ClientField"],
		})
		.input(deactivateClientFieldSchema)
		.handler(async ({ context, input }) => {
			const { id } = input;

			// Buscar campo atual
			const currentField = await context.prisma.clientField.findUnique({
				where: { id },
			});

			if (!currentField) {
				throw new ORPCError("NOT_FOUND", {
					message: "Campo não encontrado",
				});
			}

			// Se o campo é obrigatório, verificar se todos os clientes têm valor
			if (currentField.required) {
				// Contar total de clientes
				const totalClients = await context.prisma.client.count();

				if (totalClients > 0) {
					// Contar clientes com valor preenchido para este campo
					const clientsWithValue = await context.prisma.clientFieldValue.count({
						where: { fieldId: id },
					});

					if (clientsWithValue < totalClients) {
						throw new ORPCError("BAD_REQUEST", {
							message:
								"Não é possível desativar um campo obrigatório enquanto houver clientes sem valor preenchido",
						});
					}
				}
			}

			const field = await context.prisma.clientField.update({
				where: { id },
				data: { active: false },
			});

			return field;
		}),

	/**
	 * Reordena múltiplos campos
	 */
	reorder: publicProcedure
		.route({
			method: "PUT",
			path: "/client-fields/reorder",
			summary: "Reordenar campos customizáveis",
			description: "Altera a ordem de exibição de múltiplos campos de uma vez.",
			tags: ["ClientField"],
		})
		.input(reorderClientFieldsSchema)
		.handler(async ({ context, input }) => {
			const { fields } = input;

			// Atualizar cada campo em uma transação
			await context.prisma.$transaction(
				fields.map((field) =>
					context.prisma.clientField.update({
						where: { id: field.id },
						data: { order: field.order },
					})
				)
			);

			// Retornar todos os campos atualizados ordenados
			const updatedFields = await context.prisma.clientField.findMany({
				where: {
					id: { in: fields.map((f) => f.id) },
				},
				orderBy: { order: "asc" },
			});

			return updatedFields;
		}),
};
