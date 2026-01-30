import { call } from "@orpc/server";
import { describe, expect, it } from "vitest";
import { userRouter } from "../routers/user";
import { createTestContext, createTestUser, prisma } from "./setup";

/**
 * Create a test context with a session (authenticated user).
 * Used to test operations that require authentication.
 */
function createAuthenticatedContext(userId: string) {
	return {
		session: { user: { id: userId } },
		prisma,
	};
}

describe("User API", () => {
	describe("list - Listar usuários", () => {
		it("deve retornar lista vazia quando não há usuários", async () => {
			const context = createTestContext();
			const result = await call(userRouter.list, undefined, { context });

			expect(result).toEqual([]);
		});

		it("deve retornar usuários com contagem de clientes e atendimentos", async () => {
			const user = await createTestUser();

			// Criar clientes atribuídos ao usuário
			const client1 = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});
			const client2 = await prisma.client.create({
				data: { whatsapp: "+5511999990002", assignedTo: user.id },
			});

			// Criar atendimentos pendentes (OPEN)
			await prisma.appointment.create({
				data: {
					clientId: client1.id,
					assignedTo: user.id,
					scheduledAt: new Date(),
					status: "OPEN",
					createdBy: user.id,
				},
			});
			await prisma.appointment.create({
				data: {
					clientId: client2.id,
					assignedTo: user.id,
					scheduledAt: new Date(),
					status: "OPEN",
					createdBy: user.id,
				},
			});

			// Criar atendimento já finalizado (não deve contar)
			await prisma.appointment.create({
				data: {
					clientId: client1.id,
					assignedTo: user.id,
					scheduledAt: new Date(),
					status: "DONE",
					createdBy: user.id,
				},
			});

			const context = createTestContext();
			const result = await call(userRouter.list, undefined, { context });

			expect(result).toHaveLength(1);
			expect(result[0]?.id).toBe(user.id);
			expect(result[0]?._count.clients).toBe(2);
			expect(result[0]?._count.appointmentsAssigned).toBe(2); // Apenas OPEN
		});

		it("deve retornar múltiplos usuários ordenados por nome", async () => {
			await createTestUser();
			await prisma.user.create({
				data: {
					id: crypto.randomUUID(),
					name: "Alice",
					email: "alice@example.com",
				},
			});
			await prisma.user.create({
				data: {
					id: crypto.randomUUID(),
					name: "Zara",
					email: "zara@example.com",
				},
			});

			const context = createTestContext();
			const result = await call(userRouter.list, undefined, { context });

			expect(result).toHaveLength(3);
			// Verificar que Alice vem antes de Zara
			const aliceIndex = result.findIndex(
				(u: { name: string }) => u.name === "Alice"
			);
			const zaraIndex = result.findIndex(
				(u: { name: string }) => u.name === "Zara"
			);
			expect(aliceIndex).toBeLessThan(zaraIndex);
		});
	});

	describe("getById - Buscar usuário por ID", () => {
		it("deve retornar usuário com clientes e atendimentos", async () => {
			const user = await createTestUser();

			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			await prisma.appointment.create({
				data: {
					clientId: client.id,
					assignedTo: user.id,
					scheduledAt: new Date(),
					status: "OPEN",
					createdBy: user.id,
				},
			});

			const context = createTestContext();
			const result = await call(
				userRouter.getById,
				{ id: user.id },
				{ context }
			);

			expect(result.id).toBe(user.id);
			expect(result.name).toBe(user.name);
			expect(result.clients).toHaveLength(1);
			expect(result.appointmentsAssigned).toHaveLength(1);
		});

		it("deve retornar NOT_FOUND para usuário inexistente", async () => {
			const context = createTestContext();

			await expect(
				call(userRouter.getById, { id: "inexistente" }, { context })
			).rejects.toThrow();
		});
	});

	describe("create - Criar usuário", () => {
		it("deve criar usuário com nome, email e senha", async () => {
			const context = createTestContext();

			const result = await call(
				userRouter.create,
				{
					name: "Maria Silva",
					email: "maria@empresa.com",
					password: "senha123",
				},
				{ context }
			);

			expect(result.id).toBeDefined();
			expect(result.name).toBe("Maria Silva");
			expect(result.email).toBe("maria@empresa.com");

			// Verificar que usuário foi criado no banco
			const userInDb = await prisma.user.findUnique({
				where: { id: result.id },
			});
			expect(userInDb).not.toBeNull();
			expect(userInDb?.name).toBe("Maria Silva");
		});

		it("deve rejeitar email duplicado", async () => {
			// Criar usuário existente
			await prisma.user.create({
				data: {
					id: crypto.randomUUID(),
					name: "Joao",
					email: "joao@empresa.com",
				},
			});

			const context = createTestContext();

			await expect(
				call(
					userRouter.create,
					{
						name: "Outro Joao",
						email: "joao@empresa.com",
						password: "senha123",
					},
					{ context }
				)
			).rejects.toThrow();
		});

		it("deve rejeitar email inválido", async () => {
			const context = createTestContext();

			await expect(
				call(
					userRouter.create,
					{
						name: "Test",
						email: "email-invalido",
						password: "senha123",
					},
					{ context }
				)
			).rejects.toThrow();
		});

		it("deve rejeitar senha muito curta", async () => {
			const context = createTestContext();

			await expect(
				call(
					userRouter.create,
					{
						name: "Test",
						email: "test@email.com",
						password: "123",
					},
					{ context }
				)
			).rejects.toThrow();
		});
	});

	describe("update - Editar usuário", () => {
		it("deve atualizar nome do usuário", async () => {
			const user = await createTestUser();
			const context = createTestContext();

			const result = await call(
				userRouter.update,
				{ id: user.id, name: "Novo Nome" },
				{ context }
			);

			expect(result.name).toBe("Novo Nome");
		});

		it("deve atualizar email do usuário", async () => {
			const user = await createTestUser();
			const context = createTestContext();

			const result = await call(
				userRouter.update,
				{ id: user.id, email: "novo@email.com" },
				{ context }
			);

			expect(result.email).toBe("novo@email.com");
		});

		it("deve rejeitar email duplicado na atualização", async () => {
			const user1 = await createTestUser();
			await prisma.user.create({
				data: {
					id: crypto.randomUUID(),
					name: "Outro",
					email: "ocupado@email.com",
				},
			});

			const context = createTestContext();

			await expect(
				call(
					userRouter.update,
					{ id: user1.id, email: "ocupado@email.com" },
					{ context }
				)
			).rejects.toThrow();
		});

		it("deve permitir atualizar para o mesmo email (próprio usuário)", async () => {
			const user = await createTestUser();
			const context = createTestContext();

			const result = await call(
				userRouter.update,
				{ id: user.id, email: user.email, name: "Nome Atualizado" },
				{ context }
			);

			expect(result.email).toBe(user.email);
			expect(result.name).toBe("Nome Atualizado");
		});

		it("deve retornar NOT_FOUND para usuário inexistente", async () => {
			const context = createTestContext();

			await expect(
				call(
					userRouter.update,
					{ id: "inexistente", name: "Novo" },
					{ context }
				)
			).rejects.toThrow();
		});
	});

	describe("resetPassword - Resetar senha", () => {
		it("deve resetar senha do usuário", async () => {
			// Criar usuário com account (necessário para ter senha)
			const userId = crypto.randomUUID();
			await prisma.user.create({
				data: { id: userId, name: "Test", email: "test@email.com" },
			});
			await prisma.account.create({
				data: {
					id: crypto.randomUUID(),
					accountId: userId,
					providerId: "credential",
					userId,
					password: "hash-antigo",
				},
			});

			const context = createTestContext();

			const result = await call(
				userRouter.resetPassword,
				{ userId, newPassword: "novaSenha123" },
				{ context }
			);

			expect(result.success).toBe(true);

			// Verificar que senha foi atualizada no account
			const account = await prisma.account.findFirst({
				where: { userId },
			});
			expect(account?.password).not.toBe("hash-antigo");
		});

		it("deve rejeitar senha muito curta", async () => {
			const user = await createTestUser();
			const context = createTestContext();

			await expect(
				call(
					userRouter.resetPassword,
					{ userId: user.id, newPassword: "123" },
					{ context }
				)
			).rejects.toThrow();
		});

		it("deve retornar NOT_FOUND para usuário inexistente", async () => {
			const context = createTestContext();

			await expect(
				call(
					userRouter.resetPassword,
					{ userId: "inexistente", newPassword: "senha123" },
					{ context }
				)
			).rejects.toThrow();
		});
	});

	describe("deactivate - Desativar usuário", () => {
		it("deve desativar usuário (marcar como banned)", async () => {
			const user = await createTestUser();
			const adminUser = await prisma.user.create({
				data: {
					id: crypto.randomUUID(),
					name: "Admin",
					email: "admin@empresa.com",
				},
			});

			const context = createAuthenticatedContext(adminUser.id);

			const result = await call(
				userRouter.deactivate,
				{ userId: user.id, reason: "Desligamento" },
				{ context }
			);

			expect(result.banned).toBe(true);
			expect(result.banReason).toBe("Desligamento");
		});

		it("deve desativar usuário sem motivo (opcional)", async () => {
			const user = await createTestUser();
			const adminUser = await prisma.user.create({
				data: {
					id: crypto.randomUUID(),
					name: "Admin",
					email: "admin@empresa.com",
				},
			});

			const context = createAuthenticatedContext(adminUser.id);

			const result = await call(
				userRouter.deactivate,
				{ userId: user.id },
				{ context }
			);

			expect(result.banned).toBe(true);
		});

		it("deve impedir auto-desativação (usuário não pode desativar a si mesmo)", async () => {
			const user = await createTestUser();
			const context = createAuthenticatedContext(user.id);

			await expect(
				call(userRouter.deactivate, { userId: user.id }, { context })
			).rejects.toThrow();
		});

		it("deve manter clientes atribuídos ao desativar usuário", async () => {
			const user = await createTestUser();
			const adminUser = await prisma.user.create({
				data: {
					id: crypto.randomUUID(),
					name: "Admin",
					email: "admin@empresa.com",
				},
			});

			// Criar clientes atribuídos ao usuário
			const client1 = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});
			const client2 = await prisma.client.create({
				data: { whatsapp: "+5511999990002", assignedTo: user.id },
			});

			const context = createAuthenticatedContext(adminUser.id);
			await call(userRouter.deactivate, { userId: user.id }, { context });

			// Verificar que clientes ainda estão atribuídos
			const clientsAfter = await prisma.client.findMany({
				where: { assignedTo: user.id },
			});
			expect(clientsAfter).toHaveLength(2);
			expect(clientsAfter.map((c) => c.id).sort()).toEqual(
				[client1.id, client2.id].sort()
			);
		});

		it("deve retornar NOT_FOUND para usuário inexistente", async () => {
			const adminUser = await createTestUser();
			const context = createAuthenticatedContext(adminUser.id);

			await expect(
				call(userRouter.deactivate, { userId: "inexistente" }, { context })
			).rejects.toThrow();
		});
	});

	describe("reactivate - Reativar usuário", () => {
		it("deve reativar usuário banido", async () => {
			// Criar usuário desativado
			const user = await prisma.user.create({
				data: {
					id: crypto.randomUUID(),
					name: "Desativado",
					email: "desativado@empresa.com",
					banned: true,
					banReason: "Motivo antigo",
				},
			});

			const context = createTestContext();

			const result = await call(
				userRouter.reactivate,
				{ userId: user.id },
				{ context }
			);

			expect(result.banned).toBe(false);
			expect(result.banReason).toBeNull();
		});

		it("deve ser idempotente para usuário já ativo", async () => {
			const user = await createTestUser();
			const context = createTestContext();

			const result = await call(
				userRouter.reactivate,
				{ userId: user.id },
				{ context }
			);

			expect(result.banned).toBeFalsy();
		});

		it("deve retornar NOT_FOUND para usuário inexistente", async () => {
			const context = createTestContext();

			await expect(
				call(userRouter.reactivate, { userId: "inexistente" }, { context })
			).rejects.toThrow();
		});
	});
});
