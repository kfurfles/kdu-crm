import { call } from "@orpc/server";
import { describe, expect, it } from "vitest";
import { tagRouter } from "../routers/tag";
import {
	createTestClient,
	createTestContext,
	createTestUser,
	prisma,
} from "./setup";

describe("Tag API", () => {
	describe("list - Listar tags", () => {
		it("deve retornar lista vazia quando não há tags", async () => {
			const context = createTestContext();
			const result = await call(tagRouter.list, undefined, { context });

			expect(result).toEqual([]);
		});

		it("deve retornar tags com contagem de clientes", async () => {
			const user = await createTestUser();
			const client = await createTestClient();

			// Criar tag
			const tag = await prisma.tag.create({
				data: { name: "VIP", createdBy: user.id },
			});

			// Vincular cliente à tag
			await prisma.clientTag.create({
				data: { clientId: client.id, tagId: tag.id },
			});

			const context = createTestContext();
			const result = await call(tagRouter.list, undefined, { context });

			expect(result).toHaveLength(1);
			expect(result[0]?.name).toBe("VIP");
			expect(result[0]?._count.clients).toBe(1);
		});

		it("deve retornar contagem correta após vincular múltiplos clientes", async () => {
			const user = await createTestUser();
			const client1 = await createTestClient();
			const client2 = await createTestClient();
			const client3 = await createTestClient();

			const tag = await prisma.tag.create({
				data: { name: "Premium", createdBy: user.id },
			});

			await prisma.clientTag.createMany({
				data: [
					{ clientId: client1.id, tagId: tag.id },
					{ clientId: client2.id, tagId: tag.id },
					{ clientId: client3.id, tagId: tag.id },
				],
			});

			const context = createTestContext();
			const result = await call(tagRouter.list, undefined, { context });

			expect(result[0]?._count.clients).toBe(3);
		});
	});

	describe("create - Criar tag", () => {
		it("deve criar tag com nome e cor", async () => {
			const user = await createTestUser();
			const context = createTestContext();

			const result = await call(
				tagRouter.create,
				{ name: "VIP", color: "#3B82F6", userId: user.id },
				{ context }
			);

			expect(result.id).toBeDefined();
			expect(result.name).toBe("VIP");
			expect(result.color).toBe("#3B82F6");
			expect(result.createdBy).toBe(user.id);
		});

		it("deve criar tag sem cor (opcional)", async () => {
			const user = await createTestUser();
			const context = createTestContext();

			const result = await call(
				tagRouter.create,
				{ name: "Novo", userId: user.id },
				{ context }
			);

			expect(result.name).toBe("Novo");
			expect(result.color).toBeNull();
		});

		it("deve rejeitar nome duplicado (case insensitive)", async () => {
			const user = await createTestUser();
			const context = createTestContext();

			// Criar tag "VIP"
			await call(
				tagRouter.create,
				{ name: "VIP", userId: user.id },
				{ context }
			);

			// Tentar criar "vip" (minúsculo) - deve falhar
			await expect(
				call(tagRouter.create, { name: "vip", userId: user.id }, { context })
			).rejects.toThrow();
		});

		it("deve rejeitar nome duplicado com espaços e case diferente", async () => {
			const user = await createTestUser();
			const context = createTestContext();

			await call(
				tagRouter.create,
				{ name: "Cliente VIP", userId: user.id },
				{ context }
			);

			await expect(
				call(
					tagRouter.create,
					{ name: "CLIENTE VIP", userId: user.id },
					{ context }
				)
			).rejects.toThrow();
		});
	});

	describe("update - Editar tag", () => {
		it("deve atualizar nome da tag", async () => {
			const user = await createTestUser();
			const tag = await prisma.tag.create({
				data: { name: "Antigo", createdBy: user.id },
			});

			const context = createTestContext();
			const result = await call(
				tagRouter.update,
				{ id: tag.id, name: "Novo" },
				{ context }
			);

			expect(result.name).toBe("Novo");
		});

		it("deve atualizar cor da tag", async () => {
			const user = await createTestUser();
			const tag = await prisma.tag.create({
				data: { name: "Tag", color: "#FF0000", createdBy: user.id },
			});

			const context = createTestContext();
			const result = await call(
				tagRouter.update,
				{ id: tag.id, color: "#00FF00" },
				{ context }
			);

			expect(result.color).toBe("#00FF00");
		});

		it("deve rejeitar nome duplicado na atualização (case insensitive)", async () => {
			const user = await createTestUser();
			await prisma.tag.create({
				data: { name: "Existente", createdBy: user.id },
			});
			const tag = await prisma.tag.create({
				data: { name: "Outra", createdBy: user.id },
			});

			const context = createTestContext();

			await expect(
				call(tagRouter.update, { id: tag.id, name: "existente" }, { context })
			).rejects.toThrow();
		});

		it("deve retornar NOT_FOUND para tag inexistente", async () => {
			const context = createTestContext();

			await expect(
				call(tagRouter.update, { id: "inexistente", name: "Novo" }, { context })
			).rejects.toThrow();
		});

		it("deve permitir atualizar para o mesmo nome (própria tag)", async () => {
			const user = await createTestUser();
			const tag = await prisma.tag.create({
				data: { name: "Minha Tag", createdBy: user.id },
			});

			const context = createTestContext();
			const result = await call(
				tagRouter.update,
				{ id: tag.id, name: "Minha Tag", color: "#000000" },
				{ context }
			);

			expect(result.name).toBe("Minha Tag");
			expect(result.color).toBe("#000000");
		});
	});

	describe("delete - Remover tag", () => {
		it("deve remover tag existente", async () => {
			const user = await createTestUser();
			const tag = await prisma.tag.create({
				data: { name: "Para Remover", createdBy: user.id },
			});

			const context = createTestContext();
			await call(tagRouter.delete, { id: tag.id }, { context });

			const tagAfterDelete = await prisma.tag.findUnique({
				where: { id: tag.id },
			});
			expect(tagAfterDelete).toBeNull();
		});

		it("deve desvincular automaticamente dos clientes (cascade)", async () => {
			const user = await createTestUser();
			const client = await createTestClient();
			const tag = await prisma.tag.create({
				data: { name: "Antigo", createdBy: user.id },
			});

			await prisma.clientTag.create({
				data: { clientId: client.id, tagId: tag.id },
			});

			const context = createTestContext();
			await call(tagRouter.delete, { id: tag.id }, { context });

			// Verificar que ClientTag foi removido
			const clientTags = await prisma.clientTag.findMany({
				where: { clientId: client.id },
			});
			expect(clientTags).toHaveLength(0);

			// Verificar que Client ainda existe
			const clientAfterDelete = await prisma.client.findUnique({
				where: { id: client.id },
			});
			expect(clientAfterDelete).not.toBeNull();
		});

		it("deve retornar NOT_FOUND para tag inexistente", async () => {
			const context = createTestContext();

			await expect(
				call(tagRouter.delete, { id: "inexistente" }, { context })
			).rejects.toThrow();
		});
	});

	describe("linkClient - Vincular tag a cliente", () => {
		it("deve vincular tag a cliente", async () => {
			const user = await createTestUser();
			const client = await createTestClient();
			const tag = await prisma.tag.create({
				data: { name: "VIP", createdBy: user.id },
			});

			const context = createTestContext();
			await call(
				tagRouter.linkClient,
				{ tagId: tag.id, clientId: client.id },
				{ context }
			);

			const clientTag = await prisma.clientTag.findUnique({
				where: {
					clientId_tagId: { clientId: client.id, tagId: tag.id },
				},
			});
			expect(clientTag).not.toBeNull();
		});

		it("deve rejeitar se tag não existe", async () => {
			const client = await createTestClient();
			const context = createTestContext();

			await expect(
				call(
					tagRouter.linkClient,
					{ tagId: "inexistente", clientId: client.id },
					{ context }
				)
			).rejects.toThrow();
		});

		it("deve rejeitar se cliente não existe", async () => {
			const user = await createTestUser();
			const tag = await prisma.tag.create({
				data: { name: "VIP", createdBy: user.id },
			});

			const context = createTestContext();

			await expect(
				call(
					tagRouter.linkClient,
					{ tagId: tag.id, clientId: "inexistente" },
					{ context }
				)
			).rejects.toThrow();
		});

		it("deve ser idempotente se já está vinculado", async () => {
			const user = await createTestUser();
			const client = await createTestClient();
			const tag = await prisma.tag.create({
				data: { name: "VIP", createdBy: user.id },
			});

			await prisma.clientTag.create({
				data: { clientId: client.id, tagId: tag.id },
			});

			const context = createTestContext();

			// Não deve lançar erro ao vincular novamente
			await expect(
				call(
					tagRouter.linkClient,
					{ tagId: tag.id, clientId: client.id },
					{ context }
				)
			).resolves.not.toThrow();

			// Deve continuar com apenas um vínculo
			const clientTags = await prisma.clientTag.findMany({
				where: { clientId: client.id, tagId: tag.id },
			});
			expect(clientTags).toHaveLength(1);
		});
	});

	describe("unlinkClient - Desvincular tag de cliente", () => {
		it("deve desvincular tag de cliente", async () => {
			const user = await createTestUser();
			const client = await createTestClient();
			const tag = await prisma.tag.create({
				data: { name: "VIP", createdBy: user.id },
			});

			await prisma.clientTag.create({
				data: { clientId: client.id, tagId: tag.id },
			});

			const context = createTestContext();
			await call(
				tagRouter.unlinkClient,
				{ tagId: tag.id, clientId: client.id },
				{ context }
			);

			const clientTag = await prisma.clientTag.findUnique({
				where: {
					clientId_tagId: { clientId: client.id, tagId: tag.id },
				},
			});
			expect(clientTag).toBeNull();
		});

		it("deve ser idempotente se não está vinculado", async () => {
			const user = await createTestUser();
			const client = await createTestClient();
			const tag = await prisma.tag.create({
				data: { name: "VIP", createdBy: user.id },
			});

			const context = createTestContext();

			// Não deve lançar erro ao desvincular algo que não existe
			await expect(
				call(
					tagRouter.unlinkClient,
					{ tagId: tag.id, clientId: client.id },
					{ context }
				)
			).resolves.not.toThrow();
		});
	});
});
