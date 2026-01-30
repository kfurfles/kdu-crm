import { call } from "@orpc/server";
import { describe, expect, it } from "vitest";
import { appointmentRouter } from "../routers/appointment";
import { clientRouter } from "../routers/client";
import { createTestContext, createTestUser, prisma } from "./setup";

describe("E2E - Fluxo 5: Reassignação de Cliente e Impacto em Appointments", () => {
	it("deve transferir appointment OPEN automaticamente ao reatribuir cliente", async () => {
		const context = createTestContext();
		const userA = await createTestUser();
		const userB = await createTestUser();

		// === ETAPA 1: Criar cliente atribuído ao User A ===
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(14, 0, 0, 0);

		const client = await call(
			clientRouter.create,
			{
				whatsapp: "+5511999990001",
				assignedTo: userA.id,
				userId: userA.id,
				scheduledAt: tomorrow.toISOString(),
				fieldValues: [],
				tagIds: [],
			},
			{ context }
		);

		expect(client?.id).toBeDefined();
		expect(client?.assignedTo).toBe(userA.id);

		// === ETAPA 2: Verificar que appointment OPEN foi criado para User A ===
		const appointmentsBefore = await prisma.appointment.findMany({
			where: { clientId: client!.id, status: "OPEN" },
		});

		expect(appointmentsBefore).toHaveLength(1);
		expect(appointmentsBefore[0]?.assignedTo).toBe(userA.id);

		// === ETAPA 3: Reatribuir cliente ao User B ===
		const updatedClient = await call(
			clientRouter.transfer,
			{
				id: client!.id,
				newAssigneeId: userB.id,
			},
			{ context }
		);

		expect(updatedClient?.assignedTo).toBe(userB.id);

		// === ETAPA 4: Verificar que appointment OPEN foi transferido para User B ===
		const appointmentsAfter = await prisma.appointment.findMany({
			where: { clientId: client!.id, status: "OPEN" },
		});

		expect(appointmentsAfter).toHaveLength(1);
		expect(appointmentsAfter[0]?.assignedTo).toBe(userB.id);

		// === ETAPA 5: Verificar que User A não tem mais esse appointment ===
		const userAAppointments = await prisma.appointment.findMany({
			where: { assignedTo: userA.id, status: "OPEN" },
		});

		expect(userAAppointments).toHaveLength(0);
	});

	it("deve criar próximo appointment para novo responsável após finalização", async () => {
		const context = createTestContext();
		const userA = await createTestUser();
		const userB = await createTestUser();

		// Criar cliente para User A
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		const client = await call(
			clientRouter.create,
			{
				whatsapp: "+5511999990002",
				assignedTo: userA.id,
				userId: userA.id,
				scheduledAt: tomorrow.toISOString(),
				fieldValues: [],
				tagIds: [],
			},
			{ context }
		);

		// Reatribuir para User B
		await call(
			clientRouter.transfer,
			{
				id: client!.id,
				newAssigneeId: userB.id,
			},
			{ context }
		);

		// Buscar appointment (agora de User B)
		const appointments = await prisma.appointment.findMany({
			where: { clientId: client!.id, status: "OPEN" },
		});

		expect(appointments[0]?.assignedTo).toBe(userB.id);

		// Finalizar appointment
		const nextWeek = new Date();
		nextWeek.setDate(nextWeek.getDate() + 7);

		const result = await call(
			appointmentRouter.finalize,
			{
				id: appointments[0]!.id,
				userId: userB.id,
				startedAt: new Date().toISOString(),
				summary: "Atendimento realizado por User B",
				outcome: "OK",
				nextAppointmentDate: nextWeek.toISOString(),
			},
			{ context }
		);

		// Próximo appointment deve ser para User B
		expect(result.nextAppointment.assignedTo).toBe(userB.id);
	});

	it("não deve transferir appointments DONE ou CANCELLED ao reatribuir cliente", async () => {
		const context = createTestContext();
		const userA = await createTestUser();
		const userB = await createTestUser();

		// Criar cliente para User A
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		const client = await call(
			clientRouter.create,
			{
				whatsapp: "+5511999990003",
				assignedTo: userA.id,
				userId: userA.id,
				scheduledAt: tomorrow.toISOString(),
				fieldValues: [],
				tagIds: [],
			},
			{ context }
		);

		// Buscar appointment OPEN
		const openAppointment = await prisma.appointment.findFirst({
			where: { clientId: client!.id, status: "OPEN" },
		});

		// Finalizar para criar um DONE e novo OPEN
		const nextWeek = new Date();
		nextWeek.setDate(nextWeek.getDate() + 7);

		await call(
			appointmentRouter.finalize,
			{
				id: openAppointment!.id,
				userId: userA.id,
				startedAt: new Date().toISOString(),
				summary: "Atendimento",
				outcome: "OK",
				nextAppointmentDate: nextWeek.toISOString(),
			},
			{ context }
		);

		// Agora temos 1 DONE (User A) e 1 OPEN (User A)
		const appointmentsBeforeReassign = await prisma.appointment.findMany({
			where: { clientId: client!.id },
			orderBy: { createdAt: "asc" },
		});

		expect(appointmentsBeforeReassign[0]?.status).toBe("DONE");
		expect(appointmentsBeforeReassign[0]?.assignedTo).toBe(userA.id);
		expect(appointmentsBeforeReassign[1]?.status).toBe("OPEN");
		expect(appointmentsBeforeReassign[1]?.assignedTo).toBe(userA.id);

		// Reatribuir cliente para User B
		await call(
			clientRouter.transfer,
			{
				id: client!.id,
				newAssigneeId: userB.id,
			},
			{ context }
		);

		// Verificar: DONE permanece com User A, OPEN foi para User B
		const appointmentsAfterReassign = await prisma.appointment.findMany({
			where: { clientId: client!.id },
			orderBy: { createdAt: "asc" },
		});

		expect(appointmentsAfterReassign[0]?.status).toBe("DONE");
		expect(appointmentsAfterReassign[0]?.assignedTo).toBe(userA.id); // Não mudou
		expect(appointmentsAfterReassign[1]?.status).toBe("OPEN");
		expect(appointmentsAfterReassign[1]?.assignedTo).toBe(userB.id); // Mudou
	});

	it("deve funcionar corretamente com múltiplos clientes do mesmo usuário", async () => {
		const context = createTestContext();
		const userA = await createTestUser();
		const userB = await createTestUser();

		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		// Criar 3 clientes para User A
		await call(
			clientRouter.create,
			{
				whatsapp: "+5511999990004",
				assignedTo: userA.id,
				userId: userA.id,
				scheduledAt: tomorrow.toISOString(),
				fieldValues: [],
				tagIds: [],
			},
			{ context }
		);

		const client2 = await call(
			clientRouter.create,
			{
				whatsapp: "+5511999990005",
				assignedTo: userA.id,
				userId: userA.id,
				scheduledAt: tomorrow.toISOString(),
				fieldValues: [],
				tagIds: [],
			},
			{ context }
		);

		await call(
			clientRouter.create,
			{
				whatsapp: "+5511999990006",
				assignedTo: userA.id,
				userId: userA.id,
				scheduledAt: tomorrow.toISOString(),
				fieldValues: [],
				tagIds: [],
			},
			{ context }
		);

		// User A tem 3 appointments
		const userABefore = await prisma.appointment.findMany({
			where: { assignedTo: userA.id, status: "OPEN" },
		});
		expect(userABefore).toHaveLength(3);

		// Reatribuir apenas client2 para User B
		await call(
			clientRouter.transfer,
			{
				id: client2!.id,
				newAssigneeId: userB.id,
			},
			{ context }
		);

		// User A agora tem 2 appointments
		const userAAfter = await prisma.appointment.findMany({
			where: { assignedTo: userA.id, status: "OPEN" },
		});
		expect(userAAfter).toHaveLength(2);

		// User B tem 1 appointment
		const userBAfter = await prisma.appointment.findMany({
			where: { assignedTo: userB.id, status: "OPEN" },
		});
		expect(userBAfter).toHaveLength(1);
		expect(userBAfter[0]?.clientId).toBe(client2?.id);
	});
});
