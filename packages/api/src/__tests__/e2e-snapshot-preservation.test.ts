import { call } from "@orpc/server";
import { describe, expect, it } from "vitest";
import { appointmentRouter } from "../routers/appointment";
import { clientRouter } from "../routers/client";
import { clientFieldRouter } from "../routers/client-field";
import { createTestContext, createTestUser, prisma } from "./setup";

describe("E2E - Fluxo 3: Preservação de Snapshot com Campo Removido", () => {
	it("deve preservar valor do campo no snapshot mesmo após campo ser desativado", async () => {
		const context = createTestContext();
		const user = await createTestUser();

		// === ETAPA 1: Criar campo "Renda" ativo ===
		const rendaField = await call(
			clientFieldRouter.create,
			{
				name: "Renda",
				type: "NUMBER",
				required: false,
				options: [],
				order: 1,
			},
			{ context }
		);

		expect(rendaField.id).toBeDefined();
		expect(rendaField.active).toBe(true);

		// === ETAPA 2: Criar cliente com valor de Renda = 10000 ===
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		const client = await call(
			clientRouter.create,
			{
				whatsapp: "+5511999990001",
				assignedTo: user.id,
				userId: user.id,
				scheduledAt: tomorrow.toISOString(),
				fieldValues: [{ fieldId: rendaField.id, value: "10000" }],
				tagIds: [],
			},
			{ context }
		);

		expect(client?.id).toBeDefined();

		// Buscar appointment criado
		const appointments = await call(
			appointmentRouter.list,
			{ status: "OPEN" },
			{ context }
		);

		// === ETAPA 3: Finalizar atendimento (snapshot inclui Renda: 10000) ===
		const nextWeek = new Date();
		nextWeek.setDate(nextWeek.getDate() + 7);

		const result = await call(
			appointmentRouter.finalize,
			{
				id: appointments.data[0]!.id,
				userId: user.id,
				startedAt: new Date().toISOString(),
				summary: "Atendimento realizado",
				outcome: "Cliente com boa renda",
				nextAppointmentDate: nextWeek.toISOString(),
			},
			{ context }
		);

		// Verificar snapshot contém o campo Renda
		const snapshot = result.interaction.snapshot as {
			fieldValues: Array<{
				fieldName: string;
				fieldType: string;
				value: string;
			}>;
		};
		expect(snapshot.fieldValues).toHaveLength(1);
		expect(snapshot.fieldValues[0]?.fieldName).toBe("Renda");
		expect(snapshot.fieldValues[0]?.fieldType).toBe("NUMBER");
		expect(snapshot.fieldValues[0]?.value).toBe("10000");

		// === ETAPA 4: Desativar campo "Renda" ===
		await call(
			clientFieldRouter.deactivate,
			{ id: rendaField.id },
			{ context }
		);

		// Verificar que campo foi desativado
		const fields = await call(clientFieldRouter.list, undefined, { context });
		expect(fields.find((f) => f.name === "Renda")).toBeUndefined();

		// === ETAPA 5: Verificar que snapshot ainda mostra "Renda: 10000" ===
		const history = await call(
			clientRouter.history,
			{ clientId: client!.id },
			{ context }
		);

		expect(history.data).toHaveLength(1);
		const historySnapshot = history.data[0]?.snapshot as {
			fieldValues: Array<{ fieldName: string; value: string }>;
		};
		expect(historySnapshot.fieldValues[0]?.fieldName).toBe("Renda");
		expect(historySnapshot.fieldValues[0]?.value).toBe("10000");
	});

	it("deve criar novo snapshot SEM campo desativado após nova finalização", async () => {
		const context = createTestContext();
		const user = await createTestUser();

		// Criar campo ativo
		const rendaField = await call(
			clientFieldRouter.create,
			{
				name: "Renda Mensal",
				type: "NUMBER",
				required: false,
				options: [],
				order: 1,
			},
			{ context }
		);

		// Criar cliente com valor
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		const client = await call(
			clientRouter.create,
			{
				whatsapp: "+5511999990002",
				assignedTo: user.id,
				userId: user.id,
				scheduledAt: tomorrow.toISOString(),
				fieldValues: [{ fieldId: rendaField.id, value: "5000" }],
				tagIds: [],
			},
			{ context }
		);

		// Buscar e finalizar primeiro appointment
		const appointments1 = await call(
			appointmentRouter.list,
			{ status: "OPEN" },
			{ context }
		);

		const nextWeek = new Date();
		nextWeek.setDate(nextWeek.getDate() + 7);

		const result1 = await call(
			appointmentRouter.finalize,
			{
				id: appointments1.data[0]!.id,
				userId: user.id,
				startedAt: new Date().toISOString(),
				summary: "Primeiro atendimento",
				outcome: "OK",
				nextAppointmentDate: nextWeek.toISOString(),
			},
			{ context }
		);

		// Snapshot 1 deve ter o campo
		const snapshot1 = result1.interaction.snapshot as {
			fieldValues: Array<{ fieldName: string }>;
		};
		expect(
			snapshot1.fieldValues.some((f) => f.fieldName === "Renda Mensal")
		).toBe(true);

		// Desativar campo
		await call(
			clientFieldRouter.deactivate,
			{ id: rendaField.id },
			{ context }
		);

		// Remover o valor do cliente (simula que o campo não existe mais)
		await prisma.clientFieldValue.deleteMany({
			where: { clientId: client!.id, fieldId: rendaField.id },
		});

		// Finalizar segundo appointment
		const nextMonth = new Date();
		nextMonth.setDate(nextMonth.getDate() + 30);

		const result2 = await call(
			appointmentRouter.finalize,
			{
				id: result1.nextAppointment.id,
				userId: user.id,
				startedAt: new Date().toISOString(),
				summary: "Segundo atendimento",
				outcome: "OK",
				nextAppointmentDate: nextMonth.toISOString(),
			},
			{ context }
		);

		// Snapshot 2 NÃO deve ter o campo (foi desativado e valor removido)
		const snapshot2 = result2.interaction.snapshot as {
			fieldValues: Array<{ fieldName: string }>;
		};
		expect(
			snapshot2.fieldValues.some((f) => f.fieldName === "Renda Mensal")
		).toBe(false);

		// Verificar histórico - primeiro tem campo, segundo não
		const history = await call(
			clientRouter.history,
			{ clientId: client!.id },
			{ context }
		);

		expect(history.data).toHaveLength(2);

		// Mais recente primeiro (sem campo)
		const historySnapshot2 = history.data[0]?.snapshot as {
			fieldValues: Array<{ fieldName: string }>;
		};
		expect(
			historySnapshot2.fieldValues.some((f) => f.fieldName === "Renda Mensal")
		).toBe(false);

		// Mais antigo (com campo)
		const historySnapshot1 = history.data[1]?.snapshot as {
			fieldValues: Array<{ fieldName: string }>;
		};
		expect(
			historySnapshot1.fieldValues.some((f) => f.fieldName === "Renda Mensal")
		).toBe(true);
	});
});
