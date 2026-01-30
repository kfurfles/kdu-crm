import { call } from "@orpc/server";
import { describe, expect, it } from "vitest";
import { appointmentRouter } from "../routers/appointment";
import { clientRouter } from "../routers/client";
import { createTestContext, createTestUser, prisma } from "./setup";

describe("E2E - Fluxo 10: Soft Delete de Cliente e Preservação de Histórico", () => {
	it("deve deletar cliente via soft delete (definir deletedAt)", async () => {
		const context = createTestContext();
		const user = await createTestUser();

		// Criar cliente
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		const client = await call(
			clientRouter.create,
			{
				whatsapp: "+5511999990001",
				assignedTo: user.id,
				userId: user.id,
				scheduledAt: tomorrow.toISOString(),
				fieldValues: [],
				tagIds: [],
			},
			{ context }
		);

		expect(client?.deletedAt).toBeNull();

		// Desativar (soft delete)
		const deactivated = await call(
			clientRouter.deactivate,
			{ id: client!.id },
			{ context }
		);

		expect(deactivated.deletedAt).not.toBeNull();

		// Verificar no banco
		const clientInDb = await prisma.client.findUnique({
			where: { id: client!.id },
		});
		expect(clientInDb?.deletedAt).not.toBeNull();
	});

	it("deve excluir cliente deletado da listagem normal", async () => {
		const context = createTestContext();
		const user = await createTestUser();

		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		// Criar 2 clientes
		const activeClient = await call(
			clientRouter.create,
			{
				whatsapp: "+5511999990002",
				assignedTo: user.id,
				userId: user.id,
				scheduledAt: tomorrow.toISOString(),
				fieldValues: [],
				tagIds: [],
			},
			{ context }
		);

		const clientToDelete = await call(
			clientRouter.create,
			{
				whatsapp: "+5511999990003",
				assignedTo: user.id,
				userId: user.id,
				scheduledAt: tomorrow.toISOString(),
				fieldValues: [],
				tagIds: [],
			},
			{ context }
		);

		// Deletar um deles
		await call(
			clientRouter.deactivate,
			{ id: clientToDelete!.id },
			{ context }
		);

		// Listar clientes - apenas o ativo deve aparecer
		const result = await call(clientRouter.list, {}, { context });

		expect(result.data).toHaveLength(1);
		expect(result.data[0]?.id).toBe(activeClient?.id);
	});

	it("deve preservar histórico de interações de cliente deletado", async () => {
		const context = createTestContext();
		const user = await createTestUser();

		// Criar cliente
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		const client = await call(
			clientRouter.create,
			{
				whatsapp: "+5511999990004",
				assignedTo: user.id,
				userId: user.id,
				scheduledAt: tomorrow.toISOString(),
				fieldValues: [],
				tagIds: [],
			},
			{ context }
		);

		// Buscar appointment e finalizar para criar interação
		const appointments = await prisma.appointment.findMany({
			where: { clientId: client!.id, status: "OPEN" },
		});

		const nextWeek = new Date();
		nextWeek.setDate(nextWeek.getDate() + 7);

		await call(
			appointmentRouter.finalize,
			{
				id: appointments[0]!.id,
				userId: user.id,
				startedAt: new Date().toISOString(),
				summary: "Atendimento realizado",
				outcome: "OK",
				nextAppointmentDate: nextWeek.toISOString(),
			},
			{ context }
		);

		// Deletar cliente
		await call(clientRouter.deactivate, { id: client!.id }, { context });

		// Histórico ainda deve ser acessível
		const history = await call(
			clientRouter.history,
			{ clientId: client!.id },
			{ context }
		);

		expect(history.data).toHaveLength(1);
		expect(history.data[0]?.summary).toBe("Atendimento realizado");
	});

	it("deve rejeitar criação de atendimento para cliente deletado", async () => {
		const context = createTestContext();
		const user = await createTestUser();

		// Criar cliente
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		const client = await call(
			clientRouter.create,
			{
				whatsapp: "+5511999990005",
				assignedTo: user.id,
				userId: user.id,
				scheduledAt: tomorrow.toISOString(),
				fieldValues: [],
				tagIds: [],
			},
			{ context }
		);

		// Deletar cliente
		await call(clientRouter.deactivate, { id: client!.id }, { context });

		// Tentar criar novo atendimento - deve falhar
		const dayAfter = new Date();
		dayAfter.setDate(dayAfter.getDate() + 2);

		await expect(
			call(
				appointmentRouter.create,
				{
					clientId: client!.id,
					scheduledAt: dayAfter.toISOString(),
					userId: user.id,
				},
				{ context }
			)
		).rejects.toThrow("Cliente não encontrado");
	});

	it("deve retornar NOT_FOUND ao buscar cliente deletado por ID", async () => {
		const context = createTestContext();
		const user = await createTestUser();

		// Criar e deletar cliente
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		const client = await call(
			clientRouter.create,
			{
				whatsapp: "+5511999990006",
				assignedTo: user.id,
				userId: user.id,
				scheduledAt: tomorrow.toISOString(),
				fieldValues: [],
				tagIds: [],
			},
			{ context }
		);

		await call(clientRouter.deactivate, { id: client!.id }, { context });

		// Tentar buscar - deve falhar
		await expect(
			call(clientRouter.getById, { id: client!.id }, { context })
		).rejects.toThrow();
	});

	it("deve preservar múltiplas interações no histórico após soft delete", async () => {
		const context = createTestContext();
		const user = await createTestUser();

		// Criar cliente
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		const client = await call(
			clientRouter.create,
			{
				whatsapp: "+5511999990007",
				assignedTo: user.id,
				userId: user.id,
				scheduledAt: tomorrow.toISOString(),
				fieldValues: [],
				tagIds: [],
			},
			{ context }
		);

		// Criar 3 interações
		let currentAppointmentId = (await prisma.appointment.findFirst({
			where: { clientId: client!.id, status: "OPEN" },
		}))!.id;

		for (let i = 1; i <= 3; i++) {
			const nextDate = new Date();
			nextDate.setDate(nextDate.getDate() + i * 7);

			const result = await call(
				appointmentRouter.finalize,
				{
					id: currentAppointmentId,
					userId: user.id,
					startedAt: new Date().toISOString(),
					summary: `Atendimento ${i}`,
					outcome: `Resultado ${i}`,
					nextAppointmentDate: nextDate.toISOString(),
				},
				{ context }
			);

			currentAppointmentId = result.nextAppointment.id;
		}

		// Deletar cliente
		await call(clientRouter.deactivate, { id: client!.id }, { context });

		// Histórico ainda tem 3 interações
		const history = await call(
			clientRouter.history,
			{ clientId: client!.id },
			{ context }
		);

		expect(history.data).toHaveLength(3);
		expect(history.data[0]?.summary).toBe("Atendimento 3");
		expect(history.data[1]?.summary).toBe("Atendimento 2");
		expect(history.data[2]?.summary).toBe("Atendimento 1");
	});

	it("deve ser idempotente ao tentar deletar cliente já deletado", async () => {
		const context = createTestContext();
		const user = await createTestUser();

		// Criar cliente
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		const client = await call(
			clientRouter.create,
			{
				whatsapp: "+5511999990008",
				assignedTo: user.id,
				userId: user.id,
				scheduledAt: tomorrow.toISOString(),
				fieldValues: [],
				tagIds: [],
			},
			{ context }
		);

		// Deletar primeira vez
		await call(clientRouter.deactivate, { id: client!.id }, { context });

		// Deletar segunda vez - não deve dar erro
		const secondDelete = await call(
			clientRouter.deactivate,
			{ id: client!.id },
			{ context }
		);

		expect(secondDelete.deletedAt).not.toBeNull();
	});

	it("deve rejeitar atualização de cliente deletado", async () => {
		const context = createTestContext();
		const user = await createTestUser();

		// Criar e deletar cliente
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		const client = await call(
			clientRouter.create,
			{
				whatsapp: "+5511999990009",
				assignedTo: user.id,
				userId: user.id,
				scheduledAt: tomorrow.toISOString(),
				fieldValues: [],
				tagIds: [],
			},
			{ context }
		);

		await call(clientRouter.deactivate, { id: client!.id }, { context });

		// Tentar atualizar - deve falhar
		await expect(
			call(
				clientRouter.update,
				{ id: client!.id, notes: "Nova nota" },
				{ context }
			)
		).rejects.toThrow("Não é possível atualizar um cliente desativado");
	});
});
