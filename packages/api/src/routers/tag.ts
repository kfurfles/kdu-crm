import { ORPCError } from "@orpc/server";

import { publicProcedure } from "../index";
import {
	createTagSchema,
	deleteTagSchema,
	linkClientTagSchema,
	unlinkClientTagSchema,
	updateTagSchema,
} from "../schemas/tag";

export const tagRouter = {
	/**
	 * Lista todas as tags com contagem de clientes
	 */
	list: publicProcedure
		.route({
			method: "GET",
			path: "/tags",
			summary: "Listar tags",
			description:
				"Retorna todas as tags do sistema com contagem de clientes vinculados.",
			tags: ["Tag"],
		})
		.handler(async ({ context }) => {
			const tags = await context.prisma.tag.findMany({
				include: {
					_count: {
						select: { clients: true },
					},
				},
				orderBy: { name: "asc" },
			});
			return tags;
		}),

	/**
	 * Cria uma nova tag
	 */
	create: publicProcedure
		.route({
			method: "POST",
			path: "/tags",
			summary: "Criar tag",
			description:
				"Cria uma nova tag. O nome deve ser único (case insensitive).",
			tags: ["Tag"],
		})
		.input(createTagSchema)
		.handler(async ({ context, input }) => {
			// Verificar duplicidade case insensitive
			const existing = await context.prisma.tag.findFirst({
				where: {
					name: { equals: input.name, mode: "insensitive" },
				},
			});

			if (existing) {
				throw new ORPCError("CONFLICT", {
					message: `Já existe uma tag com o nome "${input.name}"`,
				});
			}

			const tag = await context.prisma.tag.create({
				data: {
					name: input.name,
					color: input.color,
					createdBy: input.userId,
				},
			});

			return tag;
		}),

	/**
	 * Atualiza uma tag existente
	 */
	update: publicProcedure
		.route({
			method: "PATCH",
			path: "/tags/{id}",
			summary: "Editar tag",
			description: "Altera nome ou cor de uma tag existente.",
			tags: ["Tag"],
		})
		.input(updateTagSchema)
		.handler(async ({ context, input }) => {
			const { id, name, color } = input;

			// Verificar se tag existe
			const currentTag = await context.prisma.tag.findUnique({
				where: { id },
			});

			if (!currentTag) {
				throw new ORPCError("NOT_FOUND", {
					message: "Tag não encontrada",
				});
			}

			// Verificar duplicidade de nome (case insensitive), exceto a própria tag
			if (name !== undefined) {
				const existing = await context.prisma.tag.findFirst({
					where: {
						name: { equals: name, mode: "insensitive" },
						id: { not: id },
					},
				});

				if (existing) {
					throw new ORPCError("CONFLICT", {
						message: `Já existe uma tag com o nome "${name}"`,
					});
				}
			}

			const tag = await context.prisma.tag.update({
				where: { id },
				data: {
					...(name !== undefined && { name }),
					...(color !== undefined && { color }),
				},
			});

			return tag;
		}),

	/**
	 * Remove uma tag
	 */
	delete: publicProcedure
		.route({
			method: "DELETE",
			path: "/tags/{id}",
			summary: "Remover tag",
			description:
				"Remove uma tag do sistema. Clientes vinculados são desvinculados automaticamente.",
			tags: ["Tag"],
		})
		.input(deleteTagSchema)
		.handler(async ({ context, input }) => {
			const { id } = input;

			// Verificar se tag existe
			const tag = await context.prisma.tag.findUnique({
				where: { id },
			});

			if (!tag) {
				throw new ORPCError("NOT_FOUND", {
					message: "Tag não encontrada",
				});
			}

			// Deletar tag (ClientTag é removido via onDelete: Cascade)
			await context.prisma.tag.delete({
				where: { id },
			});

			return { success: true };
		}),

	/**
	 * Vincula uma tag a um cliente
	 */
	linkClient: publicProcedure
		.route({
			method: "POST",
			path: "/tags/{tagId}/clients/{clientId}",
			summary: "Vincular tag a cliente",
			description: "Adiciona uma tag a um cliente específico.",
			tags: ["Tag"],
		})
		.input(linkClientTagSchema)
		.handler(async ({ context, input }) => {
			const { tagId, clientId } = input;

			// Verificar se tag existe
			const tag = await context.prisma.tag.findUnique({
				where: { id: tagId },
			});

			if (!tag) {
				throw new ORPCError("NOT_FOUND", {
					message: "Tag não encontrada",
				});
			}

			// Verificar se cliente existe
			const client = await context.prisma.client.findUnique({
				where: { id: clientId },
			});

			if (!client) {
				throw new ORPCError("NOT_FOUND", {
					message: "Cliente não encontrado",
				});
			}

			// Criar vínculo (upsert para idempotência)
			await context.prisma.clientTag.upsert({
				where: {
					clientId_tagId: { clientId, tagId },
				},
				create: { clientId, tagId },
				update: {},
			});

			return { success: true };
		}),

	/**
	 * Desvincula uma tag de um cliente
	 */
	unlinkClient: publicProcedure
		.route({
			method: "DELETE",
			path: "/tags/{tagId}/clients/{clientId}",
			summary: "Desvincular tag de cliente",
			description: "Remove uma tag de um cliente específico.",
			tags: ["Tag"],
		})
		.input(unlinkClientTagSchema)
		.handler(async ({ context, input }) => {
			const { tagId, clientId } = input;

			// deleteMany para idempotência (não falha se não existe)
			await context.prisma.clientTag.deleteMany({
				where: { clientId, tagId },
			});

			return { success: true };
		}),
};
