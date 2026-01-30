import { call } from "@orpc/server";
import { describe, expect, it } from "vitest";
import type { Context } from "../context";
import { appointmentRouter } from "../routers/appointment";
import { clientRouter } from "../routers/client";
import { userRouter } from "../routers/user";
import { createTestContext, createTestUser, prisma } from "./setup";

/**
 * Create a test context with a session (authenticated user).
 */
function createAuthenticatedContext(userId: string): Context {
	return {
		session: {
			session: {
				id: "test-session-id",
				createdAt: new Date(),
				updatedAt: new Date(),
				userId,
				expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
				token: "test-token",
				ipAddress: null,
				userAgent: null,
			},
			user: {
				id: userId,
				name: "Test User",
				email: "test@example.com",
				emailVerified: true,
				image: null,
				banned: false,
				banReason: null,
				banExpires: null,
				role: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		},
		prisma,
	};
}

describe("E2E - Fluxo 6: Usuário Desativado com Atendimentos Pendentes", () => {
	it("deve manter clientes atribuídos após desativar usuário", async () => {
		const context = createTestContext();
		const userToDeactivate = await createTestUser();
		const adminUser = await createTestUser();

		// Criar clientes para o usuário
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		await call(
			clientRouter.create,
			{
				whatsapp: "+5511999990001",
				assignedTo: userToDeactivate.id,
				userId: userToDeactivate.id,
				scheduledAt: tomorrow.toISOString(),
				fieldValues: [],
				tagIds: [],
			},
			{ context }
		);

		await call(
			clientRouter.create,
			{
				whatsapp: "+5511999990002",
				assignedTo: userToDeactivate.id,
				userId: userToDeactivate.id,
				scheduledAt: tomorrow.toISOString(),
				fieldValues: [],
				tagIds: [],
			},
			{ context }
		);

		// Desativar usuário
		const authContext = createAuthenticatedContext(adminUser.id);
		await call(
			userRouter.deactivate,
			{ userId: userToDeactivate.id, reason: "Saiu da empresa" },
			{ context: authContext }
		);

		// Verificar que clientes ainda estão atribuídos
		const clientsAfter = await prisma.client.findMany({
			where: { assignedTo: userToDeactivate.id },
		});

		expect(clientsAfter).toHaveLength(2);
	});

	it("deve manter atendimentos OPEN acessíveis após desativar usuário", async () => {
		const context = createTestContext();
		const userToDeactivate = await createTestUser();
		const adminUser = await createTestUser();

		// Criar cliente com appointment
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		const client = await call(
			clientRouter.create,
			{
				whatsapp: "+5511999990003",
				assignedTo: userToDeactivate.id,
				userId: userToDeactivate.id,
				scheduledAt: tomorrow.toISOString(),
				fieldValues: [],
				tagIds: [],
			},
			{ context }
		);

		// Buscar appointment criado
		const appointmentsBefore = await prisma.appointment.findMany({
			where: { clientId: client!.id, status: "OPEN" },
		});
		expect(appointmentsBefore).toHaveLength(1);
		const appointmentId = appointmentsBefore[0]!.id;

		// Desativar usuário
		const authContext = createAuthenticatedContext(adminUser.id);
		await call(
			userRouter.deactivate,
			{ userId: userToDeactivate.id },
			{ context: authContext }
		);

		// Appointment ainda deve estar acessível via API
		const appointment = await call(
			appointmentRouter.getById,
			{ id: appointmentId },
			{ context }
		);

		expect(appointment.id).toBe(appointmentId);
		expect(appointment.status).toBe("OPEN");
		expect(appointment.assignedTo).toBe(userToDeactivate.id);
	});

	it("deve permitir reatribuir clientes de usuário desativado para outro usuário", async () => {
		const context = createTestContext();
		const userToDeactivate = await createTestUser();
		const adminUser = await createTestUser();
		const newUser = await createTestUser();

		// Criar cliente
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		const client = await call(
			clientRouter.create,
			{
				whatsapp: "+5511999990004",
				assignedTo: userToDeactivate.id,
				userId: userToDeactivate.id,
				scheduledAt: tomorrow.toISOString(),
				fieldValues: [],
				tagIds: [],
			},
			{ context }
		);

		// Desativar usuário
		const authContext = createAuthenticatedContext(adminUser.id);
		await call(
			userRouter.deactivate,
			{ userId: userToDeactivate.id },
			{ context: authContext }
		);

		// Reatribuir cliente para novo usuário
		const updatedClient = await call(
			clientRouter.transfer,
			{
				id: client!.id,
				newAssigneeId: newUser.id,
			},
			{ context }
		);

		expect(updatedClient?.assignedTo).toBe(newUser.id);

		// Appointment também foi transferido
		const appointments = await prisma.appointment.findMany({
			where: { clientId: client!.id, status: "OPEN" },
		});
		expect(appointments[0]?.assignedTo).toBe(newUser.id);
	});

	it("deve listar appointments de usuário desativado na listagem geral", async () => {
		const context = createTestContext();
		const userToDeactivate = await createTestUser();
		const adminUser = await createTestUser();

		// Criar cliente com appointment
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(10, 0, 0, 0);

		await call(
			clientRouter.create,
			{
				whatsapp: "+5511999990005",
				assignedTo: userToDeactivate.id,
				userId: userToDeactivate.id,
				scheduledAt: tomorrow.toISOString(),
				fieldValues: [],
				tagIds: [],
			},
			{ context }
		);

		// Desativar usuário
		const authContext = createAuthenticatedContext(adminUser.id);
		await call(
			userRouter.deactivate,
			{ userId: userToDeactivate.id },
			{ context: authContext }
		);

		// Listar todos os appointments OPEN
		const appointments = await call(
			appointmentRouter.list,
			{ status: "OPEN" },
			{ context }
		);

		// O appointment do usuário desativado ainda deve aparecer
		expect(appointments.data.length).toBeGreaterThanOrEqual(1);
		expect(
			appointments.data.some((a) => a.assignedTo === userToDeactivate.id)
		).toBe(true);
	});

	it("deve permitir finalizar appointment de usuário desativado", async () => {
		const context = createTestContext();
		const userToDeactivate = await createTestUser();
		const adminUser = await createTestUser();
		const newUser = await createTestUser();

		// Criar cliente com appointment
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		const client = await call(
			clientRouter.create,
			{
				whatsapp: "+5511999990006",
				assignedTo: userToDeactivate.id,
				userId: userToDeactivate.id,
				scheduledAt: tomorrow.toISOString(),
				fieldValues: [],
				tagIds: [],
			},
			{ context }
		);

		// Buscar appointment
		const appointments = await prisma.appointment.findMany({
			where: { clientId: client!.id, status: "OPEN" },
		});

		// Desativar usuário
		const authContext = createAuthenticatedContext(adminUser.id);
		await call(
			userRouter.deactivate,
			{ userId: userToDeactivate.id },
			{ context: authContext }
		);

		// Reatribuir cliente para novo usuário (transfere appointment)
		await call(
			clientRouter.transfer,
			{
				id: client!.id,
				newAssigneeId: newUser.id,
			},
			{ context }
		);

		// Novo usuário finaliza o appointment
		const nextWeek = new Date();
		nextWeek.setDate(nextWeek.getDate() + 7);

		const result = await call(
			appointmentRouter.finalize,
			{
				id: appointments[0]!.id,
				userId: newUser.id,
				startedAt: new Date().toISOString(),
				summary: "Atendimento realizado pelo novo responsável",
				outcome: "OK",
				nextAppointmentDate: nextWeek.toISOString(),
			},
			{ context }
		);

		expect(result.appointment.status).toBe("DONE");
		expect(result.nextAppointment.assignedTo).toBe(newUser.id);
	});
});
