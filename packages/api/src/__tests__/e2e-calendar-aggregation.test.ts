import { call } from "@orpc/server";
import { describe, expect, it } from "vitest";
import { appointmentRouter } from "../routers/appointment";
import {
	createTestAppointment,
	createTestContext,
	createTestUser,
	prisma,
} from "./setup";

describe("E2E - Fluxo 7: Múltiplos Atendimentos no Calendário (Agregação)", () => {
	it("deve listar atendimentos de diferentes dias ordenados por horário", async () => {
		const context = createTestContext();
		const user = await createTestUser();

		// Criar clientes
		const client1 = await prisma.client.create({
			data: { whatsapp: "+5511999990001", assignedTo: user.id },
		});
		const client2 = await prisma.client.create({
			data: { whatsapp: "+5511999990002", assignedTo: user.id },
		});
		const client3 = await prisma.client.create({
			data: { whatsapp: "+5511999990003", assignedTo: user.id },
		});

		// Criar atendimentos em dias diferentes
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const day1 = new Date(today);
		day1.setDate(today.getDate() + 1);

		const day2 = new Date(today);
		day2.setDate(today.getDate() + 2);

		const day3 = new Date(today);
		day3.setDate(today.getDate() + 3);

		// Dia 1: 2 atendimentos (10h e 14h)
		await createTestAppointment(
			client1.id,
			user.id,
			user.id,
			new Date(day1.getTime() + 10 * 60 * 60 * 1000) // 10:00
		);
		await createTestAppointment(
			client2.id,
			user.id,
			user.id,
			new Date(day1.getTime() + 14 * 60 * 60 * 1000) // 14:00
		);

		// Dia 2: 1 atendimento (11h)
		await createTestAppointment(
			client3.id,
			user.id,
			user.id,
			new Date(day2.getTime() + 11 * 60 * 60 * 1000) // 11:00
		);

		// Listar atendimentos do período
		const startDate = day1.toISOString();
		const endDate = new Date(
			day3.getTime() + 24 * 60 * 60 * 1000
		).toISOString();

		const result = await call(
			appointmentRouter.list,
			{ startDate, endDate },
			{ context }
		);

		expect(result.data).toHaveLength(3);
		// Verificar ordenação por data/hora
		expect(result.data[0]?.scheduledAt.getTime()).toBeLessThan(
			result.data[1]!.scheduledAt.getTime()
		);
		expect(result.data[1]?.scheduledAt.getTime()).toBeLessThan(
			result.data[2]!.scheduledAt.getTime()
		);
	});

	it("deve filtrar por status corretamente na listagem", async () => {
		const context = createTestContext();
		const user = await createTestUser();

		// Criar clientes
		const client1 = await prisma.client.create({
			data: { whatsapp: "+5511999990004", assignedTo: user.id },
		});
		const client2 = await prisma.client.create({
			data: { whatsapp: "+5511999990005", assignedTo: user.id },
		});
		const client3 = await prisma.client.create({
			data: { whatsapp: "+5511999990006", assignedTo: user.id },
		});

		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(10, 0, 0, 0);

		// Criar atendimentos com diferentes status
		await createTestAppointment(client1.id, user.id, user.id, tomorrow, "OPEN");
		await createTestAppointment(
			client2.id,
			user.id,
			user.id,
			new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000),
			"DONE"
		);
		await createTestAppointment(
			client3.id,
			user.id,
			user.id,
			new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000),
			"CANCELLED"
		);

		// Filtrar apenas OPEN
		const openOnly = await call(
			appointmentRouter.list,
			{ status: "OPEN" },
			{ context }
		);
		expect(openOnly.data).toHaveLength(1);
		expect(openOnly.data[0]?.status).toBe("OPEN");

		// Filtrar apenas DONE
		const doneOnly = await call(
			appointmentRouter.list,
			{ status: "DONE" },
			{ context }
		);
		expect(doneOnly.data).toHaveLength(1);
		expect(doneOnly.data[0]?.status).toBe("DONE");

		// Filtrar apenas CANCELLED
		const cancelledOnly = await call(
			appointmentRouter.list,
			{ status: "CANCELLED" },
			{ context }
		);
		expect(cancelledOnly.data).toHaveLength(1);
		expect(cancelledOnly.data[0]?.status).toBe("CANCELLED");

		// Sem filtro retorna todos
		const all = await call(appointmentRouter.list, {}, { context });
		expect(all.data).toHaveLength(3);
	});

	it("deve paginar corretamente grande volume de atendimentos", async () => {
		const context = createTestContext();
		const user = await createTestUser();

		// Criar 30 clientes e atendimentos
		const baseDate = new Date();
		baseDate.setDate(baseDate.getDate() + 1);
		baseDate.setHours(8, 0, 0, 0);

		for (let i = 0; i < 30; i++) {
			const client = await prisma.client.create({
				data: {
					whatsapp: `+55119999900${i.toString().padStart(2, "0")}`,
					assignedTo: user.id,
				},
			});
			await createTestAppointment(
				client.id,
				user.id,
				user.id,
				new Date(baseDate.getTime() + i * 30 * 60 * 1000) // A cada 30 min
			);
		}

		// Página 1 (10 itens)
		const page1 = await call(
			appointmentRouter.list,
			{ page: 1, pageSize: 10 },
			{ context }
		);
		expect(page1.data).toHaveLength(10);
		expect(page1.total).toBe(30);
		expect(page1.page).toBe(1);

		// Página 2 (10 itens)
		const page2 = await call(
			appointmentRouter.list,
			{ page: 2, pageSize: 10 },
			{ context }
		);
		expect(page2.data).toHaveLength(10);

		// Página 3 (10 itens)
		const page3 = await call(
			appointmentRouter.list,
			{ page: 3, pageSize: 10 },
			{ context }
		);
		expect(page3.data).toHaveLength(10);

		// Página 4 (0 itens)
		const page4 = await call(
			appointmentRouter.list,
			{ page: 4, pageSize: 10 },
			{ context }
		);
		expect(page4.data).toHaveLength(0);
	});

	it("deve combinar filtros de período e status", async () => {
		const context = createTestContext();
		const user = await createTestUser();

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const thisWeek = new Date(today);
		const nextWeek = new Date(today);
		nextWeek.setDate(today.getDate() + 7);

		// Criar clientes
		const client1 = await prisma.client.create({
			data: { whatsapp: "+5511999990010", assignedTo: user.id },
		});
		const client2 = await prisma.client.create({
			data: { whatsapp: "+5511999990011", assignedTo: user.id },
		});
		const client3 = await prisma.client.create({
			data: { whatsapp: "+5511999990012", assignedTo: user.id },
		});
		const client4 = await prisma.client.create({
			data: { whatsapp: "+5511999990013", assignedTo: user.id },
		});

		// Esta semana: 2 OPEN, 1 DONE
		await createTestAppointment(
			client1.id,
			user.id,
			user.id,
			new Date(
				thisWeek.getTime() + 1 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000
			),
			"OPEN"
		);
		await createTestAppointment(
			client2.id,
			user.id,
			user.id,
			new Date(
				thisWeek.getTime() + 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000
			),
			"OPEN"
		);
		await createTestAppointment(
			client3.id,
			user.id,
			user.id,
			new Date(
				thisWeek.getTime() + 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000
			),
			"DONE"
		);

		// Próxima semana: 1 OPEN
		await createTestAppointment(
			client4.id,
			user.id,
			user.id,
			new Date(
				nextWeek.getTime() + 1 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000
			),
			"OPEN"
		);

		// Filtrar OPEN desta semana
		const result = await call(
			appointmentRouter.list,
			{
				startDate: thisWeek.toISOString(),
				endDate: nextWeek.toISOString(),
				status: "OPEN",
			},
			{ context }
		);

		expect(result.data).toHaveLength(2);
		expect(result.data.every((a) => a.status === "OPEN")).toBe(true);
	});
});
