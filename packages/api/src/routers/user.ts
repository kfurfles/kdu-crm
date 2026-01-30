import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { ORPCError } from "@orpc/server";

import { publicProcedure } from "../index";
import {
	createUserSchema,
	deactivateUserSchema,
	getUserSchema,
	reactivateUserSchema,
	resetPasswordSchema,
	updateUserSchema,
} from "../schemas/user";

const scryptAsync = promisify(scrypt);

/**
 * Hash a password using scrypt (same algorithm as Better Auth).
 */
async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16).toString("hex");
	const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
	return `${salt}:${derivedKey.toString("hex")}`;
}

export const userRouter = {
	/**
	 * Lista todos os usuários com métricas
	 */
	list: publicProcedure
		.route({
			method: "GET",
			path: "/users",
			summary: "Listar usuários",
			description:
				"Retorna todos os usuários com contagem de clientes e atendimentos pendentes (OPEN).",
			tags: ["User"],
		})
		.handler(async ({ context }) => {
			const users = await context.prisma.user.findMany({
				include: {
					_count: {
						select: {
							clients: true,
							appointmentsAssigned: {
								where: { status: "OPEN" },
							},
						},
					},
				},
				orderBy: { name: "asc" },
			});
			return users;
		}),

	/**
	 * Busca um usuário por ID
	 */
	getById: publicProcedure
		.route({
			method: "GET",
			path: "/users/{id}",
			summary: "Buscar usuário",
			description:
				"Retorna dados do usuário com clientes atribuídos e atendimentos pendentes.",
			tags: ["User"],
		})
		.input(getUserSchema)
		.handler(async ({ context, input }) => {
			const user = await context.prisma.user.findUnique({
				where: { id: input.id },
				include: {
					clients: {
						where: { deletedAt: null },
						select: {
							id: true,
							whatsapp: true,
							notes: true,
							createdAt: true,
						},
					},
					appointmentsAssigned: {
						where: { status: "OPEN" },
						select: {
							id: true,
							clientId: true,
							scheduledAt: true,
							status: true,
						},
					},
				},
			});

			if (!user) {
				throw new ORPCError("NOT_FOUND", {
					message: "Usuário não encontrado",
				});
			}

			return user;
		}),

	/**
	 * Cria um novo usuário
	 */
	create: publicProcedure
		.route({
			method: "POST",
			path: "/users",
			summary: "Criar usuário",
			description:
				"Cria um novo usuário com email e senha. Email deve ser único.",
			tags: ["User"],
		})
		.input(createUserSchema)
		.handler(async ({ context, input }) => {
			// Verificar se email já existe
			const existing = await context.prisma.user.findUnique({
				where: { email: input.email },
			});

			if (existing) {
				throw new ORPCError("CONFLICT", {
					message: "Email já está em uso",
				});
			}

			// Hash da senha
			const hashedPassword = await hashPassword(input.password);

			// Criar usuário e account em transação
			const result = await context.prisma.$transaction(async (tx) => {
				const userId = crypto.randomUUID();

				const user = await tx.user.create({
					data: {
						id: userId,
						name: input.name,
						email: input.email,
					},
				});

				// Criar account para login via email/password
				await tx.account.create({
					data: {
						id: crypto.randomUUID(),
						accountId: userId,
						providerId: "credential",
						userId,
						password: hashedPassword,
					},
				});

				return user;
			});

			return result;
		}),

	/**
	 * Atualiza um usuário existente
	 */
	update: publicProcedure
		.route({
			method: "PATCH",
			path: "/users/{id}",
			summary: "Editar usuário",
			description: "Atualiza nome e/ou email de um usuário.",
			tags: ["User"],
		})
		.input(updateUserSchema)
		.handler(async ({ context, input }) => {
			const { id, name, email } = input;

			// Verificar se usuário existe
			const currentUser = await context.prisma.user.findUnique({
				where: { id },
			});

			if (!currentUser) {
				throw new ORPCError("NOT_FOUND", {
					message: "Usuário não encontrado",
				});
			}

			// Verificar duplicidade de email (exceto o próprio usuário)
			if (email !== undefined && email !== currentUser.email) {
				const existing = await context.prisma.user.findUnique({
					where: { email },
				});

				if (existing) {
					throw new ORPCError("CONFLICT", {
						message: "Email já está em uso",
					});
				}
			}

			const user = await context.prisma.user.update({
				where: { id },
				data: {
					...(name !== undefined && { name }),
					...(email !== undefined && { email }),
				},
			});

			return user;
		}),

	/**
	 * Reseta a senha de um usuário
	 */
	resetPassword: publicProcedure
		.route({
			method: "POST",
			path: "/users/{userId}/reset-password",
			summary: "Resetar senha",
			description: "Define uma nova senha para o usuário.",
			tags: ["User"],
		})
		.input(resetPasswordSchema)
		.handler(async ({ context, input }) => {
			const { userId, newPassword } = input;

			// Verificar se usuário existe
			const user = await context.prisma.user.findUnique({
				where: { id: userId },
			});

			if (!user) {
				throw new ORPCError("NOT_FOUND", {
					message: "Usuário não encontrado",
				});
			}

			// Hash da nova senha
			const hashedPassword = await hashPassword(newPassword);

			// Atualizar senha no account
			await context.prisma.account.updateMany({
				where: {
					userId,
					providerId: "credential",
				},
				data: {
					password: hashedPassword,
				},
			});

			return { success: true };
		}),

	/**
	 * Desativa um usuário (ban)
	 */
	deactivate: publicProcedure
		.route({
			method: "POST",
			path: "/users/{userId}/deactivate",
			summary: "Desativar usuário",
			description:
				"Desativa um usuário, impedindo-o de fazer login. Clientes permanecem atribuídos.",
			tags: ["User"],
		})
		.input(deactivateUserSchema)
		.handler(async ({ context, input }) => {
			const { userId, reason } = input;

			// Verificar se usuário existe
			const user = await context.prisma.user.findUnique({
				where: { id: userId },
			});

			if (!user) {
				throw new ORPCError("NOT_FOUND", {
					message: "Usuário não encontrado",
				});
			}

			// Impedir auto-desativação
			if (context.session?.user?.id === userId) {
				throw new ORPCError("BAD_REQUEST", {
					message: "Você não pode desativar a si mesmo",
				});
			}

			// Desativar usuário
			const updatedUser = await context.prisma.user.update({
				where: { id: userId },
				data: {
					banned: true,
					banReason: reason ?? null,
				},
			});

			return updatedUser;
		}),

	/**
	 * Reativa um usuário (unban)
	 */
	reactivate: publicProcedure
		.route({
			method: "POST",
			path: "/users/{userId}/reactivate",
			summary: "Reativar usuário",
			description: "Reativa um usuário desativado, permitindo login novamente.",
			tags: ["User"],
		})
		.input(reactivateUserSchema)
		.handler(async ({ context, input }) => {
			const { userId } = input;

			// Verificar se usuário existe
			const user = await context.prisma.user.findUnique({
				where: { id: userId },
			});

			if (!user) {
				throw new ORPCError("NOT_FOUND", {
					message: "Usuário não encontrado",
				});
			}

			// Reativar usuário
			const updatedUser = await context.prisma.user.update({
				where: { id: userId },
				data: {
					banned: false,
					banReason: null,
					banExpires: null,
				},
			});

			return updatedUser;
		}),
};
