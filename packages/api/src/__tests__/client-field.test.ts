import { call } from "@orpc/server";
import { describe, expect, it } from "vitest";
import { clientFieldRouter } from "../routers/client-field";
import { createTestContext, prisma } from "./setup";

describe("ClientField API", () => {
	describe("list - Listar campos", () => {
		it("deve retornar lista vazia quando não há campos", async () => {
			const context = createTestContext();
			const result = await call(clientFieldRouter.list, undefined, { context });

			expect(result).toEqual([]);
		});

		it("deve retornar campos ordenados por order", async () => {
			// Criar campos fora de ordem
			await prisma.clientField.create({
				data: { name: "Campo C", type: "TEXT", order: 3 },
			});
			await prisma.clientField.create({
				data: { name: "Campo A", type: "TEXT", order: 1 },
			});
			await prisma.clientField.create({
				data: { name: "Campo B", type: "TEXT", order: 2 },
			});

			const context = createTestContext();
			const result = await call(clientFieldRouter.list, undefined, { context });

			expect(result).toHaveLength(3);
			expect(result[0].name).toBe("Campo A");
			expect(result[1].name).toBe("Campo B");
			expect(result[2].name).toBe("Campo C");
		});

		it("deve retornar apenas campos ativos", async () => {
			await prisma.clientField.create({
				data: { name: "Campo Ativo", type: "TEXT", active: true },
			});
			await prisma.clientField.create({
				data: { name: "Campo Inativo", type: "TEXT", active: false },
			});

			const context = createTestContext();
			const result = await call(clientFieldRouter.list, undefined, { context });

			expect(result).toHaveLength(1);
			expect(result[0].name).toBe("Campo Ativo");
		});
	});

	describe("create - Criar campo", () => {
		it("deve criar campo do tipo TEXT", async () => {
			const context = createTestContext();
			const result = await call(
				clientFieldRouter.create,
				{
					name: "Nome Completo",
					type: "TEXT",
					required: true,
					options: [],
					order: 1,
				},
				{ context }
			);

			expect(result.id).toBeDefined();
			expect(result.name).toBe("Nome Completo");
			expect(result.type).toBe("TEXT");
			expect(result.required).toBe(true);
			expect(result.active).toBe(true);
		});

		it("deve criar campo do tipo NUMBER", async () => {
			const context = createTestContext();
			const result = await call(
				clientFieldRouter.create,
				{
					name: "Renda Mensal",
					type: "NUMBER",
					required: false,
					options: [],
					order: 0,
				},
				{ context }
			);

			expect(result.type).toBe("NUMBER");
		});

		it("deve criar campo do tipo DATE", async () => {
			const context = createTestContext();
			const result = await call(
				clientFieldRouter.create,
				{
					name: "Data de Nascimento",
					type: "DATE",
					required: false,
					options: [],
					order: 0,
				},
				{ context }
			);

			expect(result.type).toBe("DATE");
		});

		it("deve criar campo do tipo CHECKBOX", async () => {
			const context = createTestContext();
			const result = await call(
				clientFieldRouter.create,
				{
					name: "Aceita Marketing",
					type: "CHECKBOX",
					required: false,
					options: [],
					order: 0,
				},
				{ context }
			);

			expect(result.type).toBe("CHECKBOX");
		});

		it("deve criar campo do tipo SELECT com opções", async () => {
			const context = createTestContext();
			const result = await call(
				clientFieldRouter.create,
				{
					name: "Estado Civil",
					type: "SELECT",
					required: false,
					options: ["Solteiro", "Casado", "Divorciado", "Viúvo"],
					order: 0,
				},
				{ context }
			);

			expect(result.type).toBe("SELECT");
			expect(result.options).toEqual([
				"Solteiro",
				"Casado",
				"Divorciado",
				"Viúvo",
			]);
		});

		it("deve rejeitar nome duplicado", async () => {
			const context = createTestContext();

			await call(
				clientFieldRouter.create,
				{
					name: "CPF",
					type: "TEXT",
					required: true,
					options: [],
					order: 0,
				},
				{ context }
			);

			await expect(
				call(
					clientFieldRouter.create,
					{
						name: "CPF",
						type: "TEXT",
						required: false,
						options: [],
						order: 1,
					},
					{ context }
				)
			).rejects.toThrow();
		});

		it("deve rejeitar SELECT sem opções", async () => {
			const context = createTestContext();

			await expect(
				call(
					clientFieldRouter.create,
					{
						name: "Campo Select",
						type: "SELECT",
						required: false,
						options: [],
						order: 0,
					},
					{ context }
				)
			).rejects.toThrow();
		});
	});

	describe("update - Editar campo", () => {
		it("deve atualizar nome do campo", async () => {
			const field = await prisma.clientField.create({
				data: { name: "Nome Antigo", type: "TEXT", order: 1 },
			});

			const context = createTestContext();
			const result = await call(
				clientFieldRouter.update,
				{ id: field.id, name: "Nome Novo" },
				{ context }
			);

			expect(result.name).toBe("Nome Novo");
		});

		it("deve atualizar obrigatoriedade do campo", async () => {
			const field = await prisma.clientField.create({
				data: { name: "Campo", type: "TEXT", required: false },
			});

			const context = createTestContext();
			const result = await call(
				clientFieldRouter.update,
				{ id: field.id, required: true },
				{ context }
			);

			expect(result.required).toBe(true);
		});

		it("deve atualizar ordem do campo", async () => {
			const field = await prisma.clientField.create({
				data: { name: "Campo", type: "TEXT", order: 1 },
			});

			const context = createTestContext();
			const result = await call(
				clientFieldRouter.update,
				{ id: field.id, order: 5 },
				{ context }
			);

			expect(result.order).toBe(5);
		});

		it("deve adicionar novas opções a campo SELECT", async () => {
			const field = await prisma.clientField.create({
				data: {
					name: "Estado Civil",
					type: "SELECT",
					options: ["Solteiro", "Casado"],
				},
			});

			const context = createTestContext();
			const result = await call(
				clientFieldRouter.update,
				{
					id: field.id,
					options: ["Solteiro", "Casado", "Divorciado"],
				},
				{ context }
			);

			expect(result.options).toEqual(["Solteiro", "Casado", "Divorciado"]);
		});

		it("deve rejeitar remoção de opções de campo SELECT", async () => {
			const field = await prisma.clientField.create({
				data: {
					name: "Estado Civil",
					type: "SELECT",
					options: ["Solteiro", "Casado", "Divorciado"],
				},
			});

			const context = createTestContext();

			await expect(
				call(
					clientFieldRouter.update,
					{
						id: field.id,
						options: ["Solteiro", "Casado"], // Removeu "Divorciado"
					},
					{ context }
				)
			).rejects.toThrow();
		});

		it("deve rejeitar nome duplicado na atualização", async () => {
			await prisma.clientField.create({
				data: { name: "Campo Existente", type: "TEXT" },
			});
			const field = await prisma.clientField.create({
				data: { name: "Outro Campo", type: "TEXT" },
			});

			const context = createTestContext();

			await expect(
				call(
					clientFieldRouter.update,
					{ id: field.id, name: "Campo Existente" },
					{ context }
				)
			).rejects.toThrow();
		});
	});

	describe("deactivate - Desativar campo", () => {
		it("deve desativar campo não obrigatório", async () => {
			const field = await prisma.clientField.create({
				data: { name: "Campo Opcional", type: "TEXT", required: false },
			});

			const context = createTestContext();
			const result = await call(
				clientFieldRouter.deactivate,
				{ id: field.id },
				{ context }
			);

			expect(result.active).toBe(false);
		});

		it("deve desativar campo obrigatório se todos os clientes têm valor", async () => {
			const field = await prisma.clientField.create({
				data: { name: "Campo Obrigatório", type: "TEXT", required: true },
			});

			// Criar cliente com valor preenchido
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999999999" },
			});
			await prisma.clientFieldValue.create({
				data: {
					clientId: client.id,
					fieldId: field.id,
					value: "valor preenchido",
				},
			});

			const context = createTestContext();
			const result = await call(
				clientFieldRouter.deactivate,
				{ id: field.id },
				{ context }
			);

			expect(result.active).toBe(false);
		});

		it("deve rejeitar desativação de campo obrigatório se há clientes sem valor", async () => {
			const field = await prisma.clientField.create({
				data: { name: "Campo Obrigatório", type: "TEXT", required: true },
			});

			// Criar cliente SEM valor preenchido
			await prisma.client.create({
				data: { whatsapp: "+5511999999999" },
			});

			const context = createTestContext();

			await expect(
				call(clientFieldRouter.deactivate, { id: field.id }, { context })
			).rejects.toThrow();
		});

		it("deve permitir desativar campo obrigatório se não há clientes", async () => {
			const field = await prisma.clientField.create({
				data: { name: "Campo Obrigatório", type: "TEXT", required: true },
			});

			const context = createTestContext();
			const result = await call(
				clientFieldRouter.deactivate,
				{ id: field.id },
				{ context }
			);

			expect(result.active).toBe(false);
		});
	});

	describe("reorder - Reordenar campos", () => {
		it("deve reordenar múltiplos campos", async () => {
			const field1 = await prisma.clientField.create({
				data: { name: "Campo 1", type: "TEXT", order: 1 },
			});
			const field2 = await prisma.clientField.create({
				data: { name: "Campo 2", type: "TEXT", order: 2 },
			});
			const field3 = await prisma.clientField.create({
				data: { name: "Campo 3", type: "TEXT", order: 3 },
			});

			const context = createTestContext();
			const result = await call(
				clientFieldRouter.reorder,
				{
					fields: [
						{ id: field1.id, order: 3 },
						{ id: field2.id, order: 1 },
						{ id: field3.id, order: 2 },
					],
				},
				{ context }
			);

			expect(result).toHaveLength(3);

			// Verificar que a ordem foi atualizada
			const updatedFields = await prisma.clientField.findMany({
				orderBy: { order: "asc" },
			});

			expect(updatedFields[0].name).toBe("Campo 2");
			expect(updatedFields[1].name).toBe("Campo 3");
			expect(updatedFields[2].name).toBe("Campo 1");
		});
	});
});
