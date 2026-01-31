import { call } from "@orpc/server";
import { describe, expect, it } from "vitest";
import { appointmentRouter } from "../routers/appointment";
import {
	createTestAppointment,
	createTestClientField,
	createTestContext,
	createTestTag,
	createTestUser,
	prisma,
} from "./setup";

describe("Appointment API", () => {
	describe("list - Listar atendimentos", () => {
		it("deve retornar lista vazia quando não há atendimentos", async () => {
			const context = createTestContext();
			const result = await call(appointmentRouter.list, {}, { context });

			expect(result.data).toEqual([]);
			expect(result.total).toBe(0);
			expect(result.page).toBe(1);
			expect(result.pageSize).toBe(20);
		});

		it("deve listar atendimentos do dia ordenados por horário", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const today = new Date();
			today.setHours(0, 0, 0, 0);

			// Criar atendimentos em horários diferentes
			const appointment1 = await createTestAppointment(
				client.id,
				user.id,
				user.id,
				new Date(today.getTime() + 14 * 60 * 60 * 1000) // 14:00
			);
			const appointment2 = await createTestAppointment(
				client.id,
				user.id,
				user.id,
				new Date(today.getTime() + 10 * 60 * 60 * 1000), // 10:00
				"DONE"
			);
			const appointment3 = await createTestAppointment(
				client.id,
				user.id,
				user.id,
				new Date(today.getTime() + 16 * 60 * 60 * 1000), // 16:00
				"CANCELLED"
			);

			const context = createTestContext();
			const startDate = today.toISOString();
			const endDate = new Date(
				today.getTime() + 24 * 60 * 60 * 1000
			).toISOString();

			const result = await call(
				appointmentRouter.list,
				{ startDate, endDate },
				{ context }
			);

			expect(result.data).toHaveLength(3);
			// Deve estar ordenado por horário
			expect(result.data[0]?.id).toBe(appointment2.id); // 10:00
			expect(result.data[1]?.id).toBe(appointment1.id); // 14:00
			expect(result.data[2]?.id).toBe(appointment3.id); // 16:00
		});

		it("deve filtrar por status OPEN", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			tomorrow.setHours(10, 0, 0, 0);

			await createTestAppointment(
				client.id,
				user.id,
				user.id,
				tomorrow,
				"OPEN"
			);
			await createTestAppointment(
				client.id,
				user.id,
				user.id,
				new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000),
				"DONE"
			);

			const context = createTestContext();
			const result = await call(
				appointmentRouter.list,
				{ status: "OPEN" },
				{ context }
			);

			expect(result.data).toHaveLength(1);
			expect(result.data[0]?.status).toBe("OPEN");
		});

		it("deve filtrar por período", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const today = new Date();
			today.setHours(10, 0, 0, 0);

			const tomorrow = new Date(today);
			tomorrow.setDate(tomorrow.getDate() + 1);

			const nextWeek = new Date(today);
			nextWeek.setDate(nextWeek.getDate() + 7);

			await createTestAppointment(
				client.id,
				user.id,
				user.id,
				tomorrow,
				"DONE"
			);
			await createTestAppointment(
				client.id,
				user.id,
				user.id,
				nextWeek,
				"DONE"
			);

			const context = createTestContext();

			// Filtrar apenas amanhã
			const startDate = today.toISOString();
			const endDate = new Date(
				tomorrow.getTime() + 24 * 60 * 60 * 1000
			).toISOString();

			const result = await call(
				appointmentRouter.list,
				{ startDate, endDate },
				{ context }
			);

			expect(result.data).toHaveLength(1);
		});

		it("deve retornar atendimentos com paginação", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const baseDate = new Date();
			baseDate.setDate(baseDate.getDate() + 1);
			baseDate.setHours(10, 0, 0, 0);

			// Criar 15 atendimentos
			for (let i = 0; i < 15; i++) {
				await createTestAppointment(
					client.id,
					user.id,
					user.id,
					new Date(baseDate.getTime() + i * 60 * 60 * 1000),
					"DONE"
				);
			}

			const context = createTestContext();

			const page1 = await call(
				appointmentRouter.list,
				{ page: 1, pageSize: 10 },
				{ context }
			);
			expect(page1.data).toHaveLength(10);
			expect(page1.total).toBe(15);

			const page2 = await call(
				appointmentRouter.list,
				{ page: 2, pageSize: 10 },
				{ context }
			);
			expect(page2.data).toHaveLength(5);
		});
	});

	describe("getById - Buscar atendimento por ID", () => {
		it("deve retornar atendimento com dados do cliente", async () => {
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
				tomorrow
			);

			const context = createTestContext();
			const result = await call(
				appointmentRouter.getById,
				{ id: appointment.id },
				{ context }
			);

			expect(result.id).toBe(appointment.id);
			expect(result.client).toBeDefined();
			expect(result.client.id).toBe(client.id);
			expect(result.assignee).toBeDefined();
			expect(result.assignee.id).toBe(user.id);
		});

		it("deve retornar atendimento com interação quando houver", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			yesterday.setHours(14, 0, 0, 0);

			const appointment = await prisma.appointment.create({
				data: {
					clientId: client.id,
					assignedTo: user.id,
					scheduledAt: yesterday,
					status: "DONE",
					createdBy: user.id,
				},
			});

			// Criar interação associada
			await prisma.interaction.create({
				data: {
					appointmentId: appointment.id,
					clientId: client.id,
					userId: user.id,
					startedAt: yesterday,
					endedAt: new Date(yesterday.getTime() + 30 * 60 * 1000),
					summary: "Reunião de acompanhamento",
					outcome: "Cliente interessado em renovação",
					snapshot: { whatsapp: client.whatsapp },
				},
			});

			const context = createTestContext();
			const result = await call(
				appointmentRouter.getById,
				{ id: appointment.id },
				{ context }
			);

			expect(result.interaction).toBeDefined();
			expect(result.interaction?.summary).toBe("Reunião de acompanhamento");
		});

		it("deve retornar erro quando atendimento não existe", async () => {
			const context = createTestContext();

			await expect(
				call(appointmentRouter.getById, { id: "non-existent-id" }, { context })
			).rejects.toThrow("Atendimento não encontrado");
		});
	});

	describe("create - Criar atendimento", () => {
		it("deve criar atendimento com status OPEN", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			tomorrow.setHours(14, 0, 0, 0);

			const context = createTestContext();
			const result = await call(
				appointmentRouter.create,
				{
					clientId: client.id,
					scheduledAt: tomorrow.toISOString(),
					userId: user.id,
				},
				{ context }
			);

			expect(result.id).toBeDefined();
			expect(result.status).toBe("OPEN");
			expect(result.clientId).toBe(client.id);
			expect(result.assignedTo).toBe(user.id);
		});

		it("deve usar o responsável do cliente como assignedTo", async () => {
			const creator = await createTestUser();
			const assignee = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: assignee.id },
			});

			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			tomorrow.setHours(14, 0, 0, 0);

			const context = createTestContext();
			const result = await call(
				appointmentRouter.create,
				{
					clientId: client.id,
					scheduledAt: tomorrow.toISOString(),
					userId: creator.id,
				},
				{ context }
			);

			// Deve usar assignee do cliente, não o creator
			expect(result.assignedTo).toBe(assignee.id);
			expect(result.createdBy).toBe(creator.id);
		});

		it("deve recusar criação para data passada", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			const context = createTestContext();

			await expect(
				call(
					appointmentRouter.create,
					{
						clientId: client.id,
						scheduledAt: yesterday.toISOString(),
						userId: user.id,
					},
					{ context }
				)
			).rejects.toThrow("data deve ser futura");
		});

		it("deve recusar criação quando cliente já tem atendimento OPEN", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			tomorrow.setHours(14, 0, 0, 0);

			// Criar primeiro atendimento OPEN
			await createTestAppointment(
				client.id,
				user.id,
				user.id,
				tomorrow,
				"OPEN"
			);

			const context = createTestContext();

			// Tentar criar segundo atendimento
			const dayAfter = new Date(tomorrow);
			dayAfter.setDate(dayAfter.getDate() + 1);

			await expect(
				call(
					appointmentRouter.create,
					{
						clientId: client.id,
						scheduledAt: dayAfter.toISOString(),
						userId: user.id,
					},
					{ context }
				)
			).rejects.toThrow("Já existe atendimento pendente para este cliente");
		});

		it("deve recusar criação quando cliente não tem responsável", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001" }, // Sem assignedTo
			});

			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);

			const context = createTestContext();

			await expect(
				call(
					appointmentRouter.create,
					{
						clientId: client.id,
						scheduledAt: tomorrow.toISOString(),
						userId: user.id,
					},
					{ context }
				)
			).rejects.toThrow("Cliente não possui responsável");
		});

		it("deve recusar criação quando cliente não existe", async () => {
			const user = await createTestUser();

			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);

			const context = createTestContext();

			await expect(
				call(
					appointmentRouter.create,
					{
						clientId: "non-existent-id",
						scheduledAt: tomorrow.toISOString(),
						userId: user.id,
					},
					{ context }
				)
			).rejects.toThrow("Cliente não encontrado");
		});

		it("deve recusar criação quando cliente está deletado", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: {
					whatsapp: "+5511999990001",
					assignedTo: user.id,
					deletedAt: new Date(),
				},
			});

			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);

			const context = createTestContext();

			await expect(
				call(
					appointmentRouter.create,
					{
						clientId: client.id,
						scheduledAt: tomorrow.toISOString(),
						userId: user.id,
					},
					{ context }
				)
			).rejects.toThrow("Cliente não encontrado");
		});
	});

	describe("reschedule - Reagendar atendimento", () => {
		it("deve reagendar atendimento com sucesso", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			tomorrow.setHours(10, 0, 0, 0);

			const appointment = await createTestAppointment(
				client.id,
				user.id,
				user.id,
				tomorrow,
				"OPEN"
			);

			const newDate = new Date(tomorrow);
			newDate.setDate(newDate.getDate() + 1);
			newDate.setHours(15, 0, 0, 0);

			const context = createTestContext();
			const result = await call(
				appointmentRouter.reschedule,
				{
					id: appointment.id,
					scheduledAt: newDate.toISOString(),
				},
				{ context }
			);

			expect(result.id).toBe(appointment.id);
			expect(new Date(result.scheduledAt).getTime()).toBe(newDate.getTime());
			expect(result.status).toBe("OPEN"); // Status permanece OPEN
		});

		it("deve recusar reagendamento para data passada", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			tomorrow.setHours(10, 0, 0, 0);

			const appointment = await createTestAppointment(
				client.id,
				user.id,
				user.id,
				tomorrow,
				"OPEN"
			);

			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			const context = createTestContext();

			await expect(
				call(
					appointmentRouter.reschedule,
					{
						id: appointment.id,
						scheduledAt: yesterday.toISOString(),
					},
					{ context }
				)
			).rejects.toThrow("data deve ser futura");
		});

		it("deve recusar reagendamento de atendimento concluído", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			yesterday.setHours(10, 0, 0, 0);

			const appointment = await prisma.appointment.create({
				data: {
					clientId: client.id,
					assignedTo: user.id,
					scheduledAt: yesterday,
					status: "DONE",
					createdBy: user.id,
				},
			});

			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);

			const context = createTestContext();

			await expect(
				call(
					appointmentRouter.reschedule,
					{
						id: appointment.id,
						scheduledAt: tomorrow.toISOString(),
					},
					{ context }
				)
			).rejects.toThrow("Atendimento concluído não pode ser reagendado");
		});

		it("deve recusar reagendamento de atendimento cancelado", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			tomorrow.setHours(10, 0, 0, 0);

			const appointment = await createTestAppointment(
				client.id,
				user.id,
				user.id,
				tomorrow,
				"CANCELLED"
			);

			const newDate = new Date(tomorrow);
			newDate.setDate(newDate.getDate() + 1);

			const context = createTestContext();

			await expect(
				call(
					appointmentRouter.reschedule,
					{
						id: appointment.id,
						scheduledAt: newDate.toISOString(),
					},
					{ context }
				)
			).rejects.toThrow("Apenas atendimentos abertos podem ser reagendados");
		});

		it("deve retornar erro quando atendimento não existe", async () => {
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);

			const context = createTestContext();

			await expect(
				call(
					appointmentRouter.reschedule,
					{
						id: "non-existent-id",
						scheduledAt: tomorrow.toISOString(),
					},
					{ context }
				)
			).rejects.toThrow("Atendimento não encontrado");
		});
	});

	describe("finalize - Finalizar atendimento", () => {
		it("deve finalizar atendimento com sucesso (criar interaction, marcar DONE, criar próximo OPEN)", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: {
					whatsapp: "+5511999990001",
					notes: "Cliente importante",
					assignedTo: user.id,
				},
			});

			const now = new Date();
			const scheduledAt = new Date(now.getTime() - 60 * 60 * 1000); // 1h atrás

			const appointment = await prisma.appointment.create({
				data: {
					clientId: client.id,
					assignedTo: user.id,
					scheduledAt,
					status: "OPEN",
					createdBy: user.id,
				},
			});

			const startedAt = new Date(now.getTime() - 30 * 60 * 1000); // 30 min atrás
			const nextAppointmentDate = new Date();
			nextAppointmentDate.setDate(nextAppointmentDate.getDate() + 7);
			nextAppointmentDate.setHours(14, 0, 0, 0);

			const context = createTestContext();
			const result = await call(
				appointmentRouter.finalize,
				{
					id: appointment.id,
					userId: user.id,
					startedAt: startedAt.toISOString(),
					summary: "Discussão sobre renovação de contrato",
					outcome: "Cliente vai pensar e retornar",
					nextAppointmentDate: nextAppointmentDate.toISOString(),
				},
				{ context }
			);

			// Verifica interação criada
			expect(result.interaction).toBeDefined();
			expect(result.interaction.summary).toBe(
				"Discussão sobre renovação de contrato"
			);
			expect(result.interaction.outcome).toBe("Cliente vai pensar e retornar");
			expect(result.interaction.appointmentId).toBe(appointment.id);
			expect(result.interaction.clientId).toBe(client.id);
			expect(result.interaction.userId).toBe(user.id);

			// Verifica appointment original marcado como DONE
			expect(result.appointment).toBeDefined();
			expect(result.appointment.id).toBe(appointment.id);
			expect(result.appointment.status).toBe("DONE");

			// Verifica próximo appointment criado como OPEN
			expect(result.nextAppointment).toBeDefined();
			expect(result.nextAppointment.status).toBe("OPEN");
			expect(result.nextAppointment.clientId).toBe(client.id);
			expect(result.nextAppointment.assignedTo).toBe(user.id);
			expect(new Date(result.nextAppointment.scheduledAt).getTime()).toBe(
				nextAppointmentDate.getTime()
			);
		});

		it("deve recusar data do próximo atendimento no passado", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const appointment = await prisma.appointment.create({
				data: {
					clientId: client.id,
					assignedTo: user.id,
					scheduledAt: new Date(),
					status: "OPEN",
					createdBy: user.id,
				},
			});

			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			const context = createTestContext();

			await expect(
				call(
					appointmentRouter.finalize,
					{
						id: appointment.id,
						userId: user.id,
						startedAt: new Date().toISOString(),
						summary: "Resumo",
						outcome: "Resultado",
						nextAppointmentDate: yesterday.toISOString(),
					},
					{ context }
				)
			).rejects.toThrow("data do próximo atendimento deve ser futura");
		});

		it("deve capturar snapshot com dados do cliente, campos e tags", async () => {
			const user = await createTestUser();

			// Criar campo customizável
			const field = await createTestClientField("Renda", "NUMBER", false);

			// Criar tag
			const tag = await createTestTag(user.id, "VIP", "#FFD700");

			// Criar cliente com campo e tag
			const client = await prisma.client.create({
				data: {
					whatsapp: "+5511999990001",
					notes: "Cliente premium",
					assignedTo: user.id,
				},
			});

			// Associar valor do campo
			await prisma.clientFieldValue.create({
				data: {
					clientId: client.id,
					fieldId: field.id,
					value: "10000",
				},
			});

			// Associar tag
			await prisma.clientTag.create({
				data: {
					clientId: client.id,
					tagId: tag.id,
				},
			});

			const appointment = await prisma.appointment.create({
				data: {
					clientId: client.id,
					assignedTo: user.id,
					scheduledAt: new Date(),
					status: "OPEN",
					createdBy: user.id,
				},
			});

			const nextDate = new Date();
			nextDate.setDate(nextDate.getDate() + 7);

			const context = createTestContext();
			const result = await call(
				appointmentRouter.finalize,
				{
					id: appointment.id,
					userId: user.id,
					startedAt: new Date().toISOString(),
					summary: "Reunião",
					outcome: "OK",
					nextAppointmentDate: nextDate.toISOString(),
				},
				{ context }
			);

			// Verificar snapshot
			const snapshot = result.interaction.snapshot as {
				whatsapp: string;
				notes: string;
				fieldValues: Array<{
					fieldName: string;
					fieldType: string;
					value: string;
				}>;
				tags: Array<{ name: string; color: string | null }>;
			};

			expect(snapshot.whatsapp).toBe("+5511999990001");
			expect(snapshot.notes).toBe("Cliente premium");
			expect(snapshot.fieldValues).toHaveLength(1);
			expect(snapshot.fieldValues[0]?.fieldName).toBe("Renda");
			expect(snapshot.fieldValues[0]?.fieldType).toBe("NUMBER");
			expect(snapshot.fieldValues[0]?.value).toBe("10000");
			expect(snapshot.tags).toHaveLength(1);
			expect(snapshot.tags[0]?.name).toBe("VIP");
			expect(snapshot.tags[0]?.color).toBe("#FFD700");
		});

		it("deve registrar duração corretamente (endedAt - startedAt)", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const appointment = await prisma.appointment.create({
				data: {
					clientId: client.id,
					assignedTo: user.id,
					scheduledAt: new Date(),
					status: "OPEN",
					createdBy: user.id,
				},
			});

			const startedAt = new Date();
			startedAt.setMinutes(startedAt.getMinutes() - 25); // 25 min atrás

			const nextDate = new Date();
			nextDate.setDate(nextDate.getDate() + 7);

			const context = createTestContext();
			const result = await call(
				appointmentRouter.finalize,
				{
					id: appointment.id,
					userId: user.id,
					startedAt: startedAt.toISOString(),
					summary: "Reunião",
					outcome: "OK",
					nextAppointmentDate: nextDate.toISOString(),
				},
				{ context }
			);

			// endedAt deve ser próximo ao now (gerado automaticamente)
			const endedAt = new Date(result.interaction.endedAt);
			const interactionStartedAt = new Date(result.interaction.startedAt);

			// Duração deve ser aproximadamente 25 minutos
			const durationMs = endedAt.getTime() - interactionStartedAt.getTime();
			const durationMinutes = durationMs / (1000 * 60);

			expect(durationMinutes).toBeGreaterThanOrEqual(24);
			expect(durationMinutes).toBeLessThanOrEqual(26);
		});

		it("deve recusar finalização de atendimento DONE", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const appointment = await prisma.appointment.create({
				data: {
					clientId: client.id,
					assignedTo: user.id,
					scheduledAt: new Date(),
					status: "DONE",
					createdBy: user.id,
				},
			});

			const nextDate = new Date();
			nextDate.setDate(nextDate.getDate() + 7);

			const context = createTestContext();

			await expect(
				call(
					appointmentRouter.finalize,
					{
						id: appointment.id,
						userId: user.id,
						startedAt: new Date().toISOString(),
						summary: "Resumo",
						outcome: "Resultado",
						nextAppointmentDate: nextDate.toISOString(),
					},
					{ context }
				)
			).rejects.toThrow("Apenas atendimentos abertos podem ser finalizados");
		});

		it("deve recusar finalização de atendimento CANCELLED", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const appointment = await prisma.appointment.create({
				data: {
					clientId: client.id,
					assignedTo: user.id,
					scheduledAt: new Date(),
					status: "CANCELLED",
					createdBy: user.id,
				},
			});

			const nextDate = new Date();
			nextDate.setDate(nextDate.getDate() + 7);

			const context = createTestContext();

			await expect(
				call(
					appointmentRouter.finalize,
					{
						id: appointment.id,
						userId: user.id,
						startedAt: new Date().toISOString(),
						summary: "Resumo",
						outcome: "Resultado",
						nextAppointmentDate: nextDate.toISOString(),
					},
					{ context }
				)
			).rejects.toThrow("Apenas atendimentos abertos podem ser finalizados");
		});

		it("deve retornar erro quando atendimento não existe", async () => {
			const user = await createTestUser();
			const nextDate = new Date();
			nextDate.setDate(nextDate.getDate() + 7);

			const context = createTestContext();

			await expect(
				call(
					appointmentRouter.finalize,
					{
						id: "non-existent-id",
						userId: user.id,
						startedAt: new Date().toISOString(),
						summary: "Resumo",
						outcome: "Resultado",
						nextAppointmentDate: nextDate.toISOString(),
					},
					{ context }
				)
			).rejects.toThrow("Atendimento não encontrado");
		});

		it("deve recusar finalização quando já existe interação", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const appointment = await prisma.appointment.create({
				data: {
					clientId: client.id,
					assignedTo: user.id,
					scheduledAt: new Date(),
					status: "OPEN",
					createdBy: user.id,
				},
			});

			// Criar interação manualmente (simula duplicata)
			await prisma.interaction.create({
				data: {
					appointmentId: appointment.id,
					clientId: client.id,
					userId: user.id,
					startedAt: new Date(),
					endedAt: new Date(),
					summary: "Já finalizado",
					outcome: "OK",
					snapshot: {},
				},
			});

			const nextDate = new Date();
			nextDate.setDate(nextDate.getDate() + 7);

			const context = createTestContext();

			await expect(
				call(
					appointmentRouter.finalize,
					{
						id: appointment.id,
						userId: user.id,
						startedAt: new Date().toISOString(),
						summary: "Resumo",
						outcome: "Resultado",
						nextAppointmentDate: nextDate.toISOString(),
					},
					{ context }
				)
			).rejects.toThrow("Atendimento já foi finalizado");
		});

		it("deve executar operação atômica - se falhar, nada é salvo", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const appointment = await prisma.appointment.create({
				data: {
					clientId: client.id,
					assignedTo: user.id,
					scheduledAt: new Date(),
					status: "OPEN",
					createdBy: user.id,
				},
			});

			// Para testar atomicidade, tentamos finalizar com data inválida
			// O que deve impedir toda a operação
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			const context = createTestContext();

			await expect(
				call(
					appointmentRouter.finalize,
					{
						id: appointment.id,
						userId: user.id,
						startedAt: new Date().toISOString(),
						summary: "Resumo",
						outcome: "Resultado",
						nextAppointmentDate: yesterday.toISOString(),
					},
					{ context }
				)
			).rejects.toThrow();

			// Verificar que nada foi alterado
			const unchangedAppointment = await prisma.appointment.findUnique({
				where: { id: appointment.id },
			});
			expect(unchangedAppointment?.status).toBe("OPEN");

			const interactions = await prisma.interaction.findMany({
				where: { appointmentId: appointment.id },
			});
			expect(interactions).toHaveLength(0);
		});
	});
});
