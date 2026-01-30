import { call } from "@orpc/server";
import { describe, expect, it } from "vitest";
import { appointmentRouter } from "../routers/appointment";
import {
	createTestAppointment,
	createTestContext,
	createTestUser,
	prisma,
} from "./setup";

describe("E2E - Fluxo 1: Cancelamento de Atendimento", () => {
	describe("cancel - Cancelar atendimento", () => {
		it("deve cancelar atendimento OPEN com motivo obrigatório", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			tomorrow.setHours(14, 0, 0, 0);

			const appointment = await createTestAppointment(
				client.id,
				user.id,
				user.id,
				tomorrow,
				"OPEN"
			);

			const context = createTestContext();
			const result = await call(
				appointmentRouter.cancel,
				{
					id: appointment.id,
					reason: "Cliente solicitou não ser contactado",
				},
				{ context }
			);

			expect(result.id).toBe(appointment.id);
			expect(result.status).toBe("CANCELLED");
			expect(result.cancelReason).toBe("Cliente solicitou não ser contactado");
			expect(result.cancelledAt).toBeDefined();
		});

		it("deve rejeitar cancelamento sem motivo", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);

			const appointment = await createTestAppointment(
				client.id,
				user.id,
				user.id,
				tomorrow,
				"OPEN"
			);

			const context = createTestContext();

			// Motivo vazio deve falhar na validação do schema
			await expect(
				call(
					appointmentRouter.cancel,
					{
						id: appointment.id,
						reason: "",
					},
					{ context }
				)
			).rejects.toThrow();
		});

		it("deve rejeitar cancelamento de atendimento DONE", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			const appointment = await prisma.appointment.create({
				data: {
					clientId: client.id,
					assignedTo: user.id,
					scheduledAt: yesterday,
					status: "DONE",
					createdBy: user.id,
				},
			});

			const context = createTestContext();

			await expect(
				call(
					appointmentRouter.cancel,
					{
						id: appointment.id,
						reason: "Tentando cancelar",
					},
					{ context }
				)
			).rejects.toThrow("Atendimento concluído não pode ser cancelado");
		});

		it("deve rejeitar cancelamento de atendimento já CANCELLED", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);

			const appointment = await createTestAppointment(
				client.id,
				user.id,
				user.id,
				tomorrow,
				"CANCELLED"
			);

			const context = createTestContext();

			await expect(
				call(
					appointmentRouter.cancel,
					{
						id: appointment.id,
						reason: "Tentando cancelar novamente",
					},
					{ context }
				)
			).rejects.toThrow("Atendimento já está cancelado");
		});

		it("deve verificar que cliente fica sem atendimento OPEN após cancelamento", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);

			const appointment = await createTestAppointment(
				client.id,
				user.id,
				user.id,
				tomorrow,
				"OPEN"
			);

			const context = createTestContext();

			// Cancelar o atendimento
			await call(
				appointmentRouter.cancel,
				{
					id: appointment.id,
					reason: "Cliente desistiu",
				},
				{ context }
			);

			// Verificar que não há mais atendimentos OPEN para o cliente
			const openAppointments = await prisma.appointment.findMany({
				where: {
					clientId: client.id,
					status: "OPEN",
				},
			});

			expect(openAppointments).toHaveLength(0);
		});

		it("deve retornar erro quando atendimento não existe", async () => {
			const context = createTestContext();

			await expect(
				call(
					appointmentRouter.cancel,
					{
						id: "non-existent-id",
						reason: "Motivo qualquer",
					},
					{ context }
				)
			).rejects.toThrow("Atendimento não encontrado");
		});

		it("deve registrar cancelReason e cancelledAt corretamente", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);

			const appointment = await createTestAppointment(
				client.id,
				user.id,
				user.id,
				tomorrow,
				"OPEN"
			);

			const beforeCancel = new Date();

			const context = createTestContext();
			await call(
				appointmentRouter.cancel,
				{
					id: appointment.id,
					reason: "Número incorreto",
				},
				{ context }
			);

			// Verificar no banco de dados
			const cancelledAppointment = await prisma.appointment.findUnique({
				where: { id: appointment.id },
			});

			expect(cancelledAppointment?.cancelReason).toBe("Número incorreto");
			expect(cancelledAppointment?.cancelledAt).toBeDefined();
			expect(
				new Date(cancelledAppointment!.cancelledAt!).getTime()
			).toBeGreaterThanOrEqual(beforeCancel.getTime());
		});
	});
});
