import { call } from "@orpc/server";
import { describe, expect, it } from "vitest";
import { appointmentRouter } from "../routers/appointment";
import { createTestContext, createTestUser, prisma } from "./setup";

describe("E2E - Fluxo 8: Múltiplos Atendimentos no Mesmo Horário (Comportamento Permitido)", () => {
	it("deve permitir criar múltiplos atendimentos no mesmo horário para o mesmo usuário", async () => {
		const context = createTestContext();
		const user = await createTestUser();

		// Criar 3 clientes
		const client1 = await prisma.client.create({
			data: { whatsapp: "+5511999990001", assignedTo: user.id },
		});
		const client2 = await prisma.client.create({
			data: { whatsapp: "+5511999990002", assignedTo: user.id },
		});
		const client3 = await prisma.client.create({
			data: { whatsapp: "+5511999990003", assignedTo: user.id },
		});

		// Mesmo horário para todos
		const tomorrow10h = new Date();
		tomorrow10h.setDate(tomorrow10h.getDate() + 1);
		tomorrow10h.setHours(10, 0, 0, 0);

		// Criar 3 atendimentos no mesmo horário - DEVE funcionar
		const appointment1 = await call(
			appointmentRouter.create,
			{
				clientId: client1.id,
				scheduledAt: tomorrow10h.toISOString(),
				userId: user.id,
			},
			{ context }
		);

		const appointment2 = await call(
			appointmentRouter.create,
			{
				clientId: client2.id,
				scheduledAt: tomorrow10h.toISOString(),
				userId: user.id,
			},
			{ context }
		);

		const appointment3 = await call(
			appointmentRouter.create,
			{
				clientId: client3.id,
				scheduledAt: tomorrow10h.toISOString(),
				userId: user.id,
			},
			{ context }
		);

		// Todos devem existir
		expect(appointment1.id).toBeDefined();
		expect(appointment2.id).toBeDefined();
		expect(appointment3.id).toBeDefined();

		// Todos devem ter o mesmo horário
		expect(new Date(appointment1.scheduledAt).getTime()).toBe(
			tomorrow10h.getTime()
		);
		expect(new Date(appointment2.scheduledAt).getTime()).toBe(
			tomorrow10h.getTime()
		);
		expect(new Date(appointment3.scheduledAt).getTime()).toBe(
			tomorrow10h.getTime()
		);

		// Todos devem pertencer ao mesmo usuário
		expect(appointment1.assignedTo).toBe(user.id);
		expect(appointment2.assignedTo).toBe(user.id);
		expect(appointment3.assignedTo).toBe(user.id);
	});

	it("deve listar todos os atendimentos do mesmo horário corretamente", async () => {
		const context = createTestContext();
		const user = await createTestUser();

		// Criar 2 clientes
		const client1 = await prisma.client.create({
			data: { whatsapp: "+5511999990004", assignedTo: user.id },
		});
		const client2 = await prisma.client.create({
			data: { whatsapp: "+5511999990005", assignedTo: user.id },
		});

		// Mesmo horário
		const tomorrow14h = new Date();
		tomorrow14h.setDate(tomorrow14h.getDate() + 1);
		tomorrow14h.setHours(14, 0, 0, 0);

		await call(
			appointmentRouter.create,
			{
				clientId: client1.id,
				scheduledAt: tomorrow14h.toISOString(),
				userId: user.id,
			},
			{ context }
		);

		await call(
			appointmentRouter.create,
			{
				clientId: client2.id,
				scheduledAt: tomorrow14h.toISOString(),
				userId: user.id,
			},
			{ context }
		);

		// Buscar atendimentos do período
		const startDate = new Date(tomorrow14h);
		startDate.setHours(0, 0, 0, 0);
		const endDate = new Date(tomorrow14h);
		endDate.setHours(23, 59, 59, 999);

		const result = await call(
			appointmentRouter.list,
			{
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
			},
			{ context }
		);

		// Ambos aparecem na listagem
		expect(result.data).toHaveLength(2);

		// Ambos têm o mesmo horário
		const scheduledTimes = result.data.map((a) =>
			new Date(a.scheduledAt).getTime()
		);
		expect(scheduledTimes[0]).toBe(scheduledTimes[1]);
	});

	it("deve permitir diferentes usuários terem atendimentos no mesmo horário", async () => {
		const context = createTestContext();
		const userA = await createTestUser();
		const userB = await createTestUser();

		// Criar clientes para cada usuário
		const clientA = await prisma.client.create({
			data: { whatsapp: "+5511999990006", assignedTo: userA.id },
		});
		const clientB = await prisma.client.create({
			data: { whatsapp: "+5511999990007", assignedTo: userB.id },
		});

		// Mesmo horário para ambos
		const tomorrow11h = new Date();
		tomorrow11h.setDate(tomorrow11h.getDate() + 1);
		tomorrow11h.setHours(11, 0, 0, 0);

		const appointmentA = await call(
			appointmentRouter.create,
			{
				clientId: clientA.id,
				scheduledAt: tomorrow11h.toISOString(),
				userId: userA.id,
			},
			{ context }
		);

		const appointmentB = await call(
			appointmentRouter.create,
			{
				clientId: clientB.id,
				scheduledAt: tomorrow11h.toISOString(),
				userId: userB.id,
			},
			{ context }
		);

		// Ambos foram criados
		expect(appointmentA.id).toBeDefined();
		expect(appointmentB.id).toBeDefined();

		// Pertencem a usuários diferentes
		expect(appointmentA.assignedTo).toBe(userA.id);
		expect(appointmentB.assignedTo).toBe(userB.id);

		// Mesmo horário
		expect(new Date(appointmentA.scheduledAt).getTime()).toBe(
			new Date(appointmentB.scheduledAt).getTime()
		);
	});

	it("deve permitir grande volume de atendimentos no mesmo horário", async () => {
		const context = createTestContext();
		const user = await createTestUser();

		// Horário único
		const tomorrow9h = new Date();
		tomorrow9h.setDate(tomorrow9h.getDate() + 1);
		tomorrow9h.setHours(9, 0, 0, 0);

		// Criar 10 clientes e atendimentos no mesmo horário
		const appointments: Array<{ id: string }> = [];
		for (let i = 0; i < 10; i++) {
			const client = await prisma.client.create({
				data: {
					whatsapp: `+55119999901${i.toString().padStart(2, "0")}`,
					assignedTo: user.id,
				},
			});

			const appointment = await call(
				appointmentRouter.create,
				{
					clientId: client.id,
					scheduledAt: tomorrow9h.toISOString(),
					userId: user.id,
				},
				{ context }
			);

			appointments.push(appointment);
		}

		// Todos os 10 foram criados
		expect(appointments).toHaveLength(10);
		expect(appointments.every((a) => a.id)).toBe(true);

		// Verificar na listagem
		const startDate = new Date(tomorrow9h);
		startDate.setHours(0, 0, 0, 0);
		const endDate = new Date(tomorrow9h);
		endDate.setHours(23, 59, 59, 999);

		const result = await call(
			appointmentRouter.list,
			{
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
			},
			{ context }
		);

		expect(result.data).toHaveLength(10);
	});
});
