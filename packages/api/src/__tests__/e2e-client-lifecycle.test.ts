import { call } from "@orpc/server";
import { describe, expect, it } from "vitest";
import { appointmentRouter } from "../routers/appointment";
import { clientRouter } from "../routers/client";
import {
	createTestClientField,
	createTestContext,
	createTestTag,
	createTestUser,
} from "./setup";

describe("E2E - Fluxo 2: Ciclo Completo do Cliente (Onboarding to Follow-up)", () => {
	it("deve executar ciclo completo: criar cliente → finalizar atendimento → próximo follow-up → histórico", async () => {
		const context = createTestContext();
		const user = await createTestUser();

		// Setup: criar campo e tag
		const nomeField = await createTestClientField("Nome", "TEXT", true);
		const vipTag = await createTestTag(user.id, "VIP", "#FFD700");

		// === ETAPA 1: Criar cliente com campos, tags e primeiro appointment ===
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(14, 0, 0, 0);

		const client = await call(
			clientRouter.create,
			{
				whatsapp: "+5511999990001",
				notes: "Cliente potencial",
				assignedTo: user.id,
				userId: user.id,
				scheduledAt: tomorrow.toISOString(),
				fieldValues: [{ fieldId: nomeField.id, value: "João Silva" }],
				tagIds: [vipTag.id],
			},
			{ context }
		);

		expect(client?.id).toBeDefined();
		expect(client?.whatsapp).toBe("+5511999990001");

		// === ETAPA 2: Verificar que primeiro appointment foi criado ===
		const appointments = await call(
			appointmentRouter.list,
			{ status: "OPEN" },
			{ context }
		);

		expect(appointments.data).toHaveLength(1);
		expect(appointments.data[0]?.clientId).toBe(client?.id);
		expect(appointments.data[0]?.status).toBe("OPEN");
		expect(appointments.data[0]?.assignedTo).toBe(user.id);

		const firstAppointmentId = appointments.data[0]?.id;

		// === ETAPA 3: Finalizar primeiro atendimento ===
		const startedAt = new Date();
		const nextWeek = new Date();
		nextWeek.setDate(nextWeek.getDate() + 7);
		nextWeek.setHours(10, 0, 0, 0);

		const result1 = await call(
			appointmentRouter.finalize,
			{
				id: firstAppointmentId!,
				userId: user.id,
				startedAt: startedAt.toISOString(),
				summary: "Primeiro contato realizado com sucesso",
				outcome: "Cliente interessado em proposta",
				nextAppointmentDate: nextWeek.toISOString(),
			},
			{ context }
		);

		// Verificar interação criada
		expect(result1.interaction).toBeDefined();
		expect(result1.interaction.summary).toBe(
			"Primeiro contato realizado com sucesso"
		);
		expect(result1.interaction.outcome).toBe("Cliente interessado em proposta");

		// Verificar snapshot contém dados do cliente
		const snapshot1 = result1.interaction.snapshot as {
			whatsapp: string;
			notes: string;
			fieldValues: Array<{ fieldName: string; value: string }>;
			tags: Array<{ name: string; color: string }>;
		};
		expect(snapshot1.whatsapp).toBe("+5511999990001");
		expect(snapshot1.notes).toBe("Cliente potencial");
		expect(snapshot1.fieldValues[0]?.fieldName).toBe("Nome");
		expect(snapshot1.fieldValues[0]?.value).toBe("João Silva");
		expect(snapshot1.tags[0]?.name).toBe("VIP");

		// Verificar appointment original marcado como DONE
		expect(result1.appointment.status).toBe("DONE");

		// Verificar próximo appointment criado
		expect(result1.nextAppointment).toBeDefined();
		expect(result1.nextAppointment.status).toBe("OPEN");
		expect(result1.nextAppointment.clientId).toBe(client?.id);

		// === ETAPA 4: Finalizar segundo atendimento ===
		const startedAt2 = new Date();
		const nextMonth = new Date();
		nextMonth.setDate(nextMonth.getDate() + 30);
		nextMonth.setHours(15, 0, 0, 0);

		const result2 = await call(
			appointmentRouter.finalize,
			{
				id: result1.nextAppointment.id,
				userId: user.id,
				startedAt: startedAt2.toISOString(),
				summary: "Segundo contato - envio de proposta",
				outcome: "Cliente vai analisar e retornar",
				nextAppointmentDate: nextMonth.toISOString(),
			},
			{ context }
		);

		expect(result2.interaction.summary).toBe(
			"Segundo contato - envio de proposta"
		);
		expect(result2.appointment.status).toBe("DONE");
		expect(result2.nextAppointment.status).toBe("OPEN");

		// === ETAPA 5: Verificar histórico do cliente ===
		const history = await call(
			clientRouter.history,
			{ clientId: client!.id },
			{ context }
		);

		expect(history.data).toHaveLength(2);
		// Mais recente primeiro
		expect(history.data[0]?.summary).toBe(
			"Segundo contato - envio de proposta"
		);
		expect(history.data[1]?.summary).toBe(
			"Primeiro contato realizado com sucesso"
		);

		// Verificar snapshots estão íntegros
		const historySnapshot1 = history.data[1]?.snapshot as {
			fieldValues: Array<{ fieldName: string; value: string }>;
		};
		expect(historySnapshot1.fieldValues[0]?.fieldName).toBe("Nome");
		expect(historySnapshot1.fieldValues[0]?.value).toBe("João Silva");
	});

	it("deve garantir que sempre existe um appointment OPEN após cada finalização", async () => {
		const context = createTestContext();
		const user = await createTestUser();

		// Criar cliente com appointment
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		const client = await call(
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

		// Buscar appointment criado
		const initial = await call(
			appointmentRouter.list,
			{ status: "OPEN" },
			{ context }
		);
		expect(initial.data).toHaveLength(1);

		// Finalizar 3 vezes seguidas
		let currentAppointmentId = initial.data[0]!.id;

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

			// Sempre deve ter próximo appointment OPEN
			expect(result.nextAppointment.status).toBe("OPEN");
			currentAppointmentId = result.nextAppointment.id;
		}

		// Verificar histórico tem 3 interações
		const history = await call(
			clientRouter.history,
			{ clientId: client!.id },
			{ context }
		);
		expect(history.data).toHaveLength(3);

		// Verificar que ainda existe 1 appointment OPEN
		const finalAppointments = await call(
			appointmentRouter.list,
			{ status: "OPEN" },
			{ context }
		);
		expect(finalAppointments.data).toHaveLength(1);
		expect(finalAppointments.data[0]?.clientId).toBe(client?.id);
	});
});
