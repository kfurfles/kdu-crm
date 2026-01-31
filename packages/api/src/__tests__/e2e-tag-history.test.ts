import { call } from "@orpc/server";
import { describe, expect, it } from "vitest";
import { appointmentRouter } from "../routers/appointment";
import { clientRouter } from "../routers/client";
import { tagRouter } from "../routers/tag";
import { createTestContext, createTestUser } from "./setup";

describe("E2E - Fluxo 4: Tag Removida Permanece no Histórico", () => {
	it("deve preservar tag no snapshot mesmo após ser desvinculada do cliente", async () => {
		const context = createTestContext();
		const user = await createTestUser();

		// === ETAPA 1: Criar tag "VIP" ===
		const tag = await call(
			tagRouter.create,
			{ name: "VIP", color: "#FFD700", userId: user.id },
			{ context }
		);

		expect(tag.id).toBeDefined();
		expect(tag.name).toBe("VIP");

		// === ETAPA 2: Criar cliente com tag "VIP" ===
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
				tagIds: [tag.id],
			},
			{ context }
		);

		expect(client?.id).toBeDefined();

		// Verificar que cliente tem a tag
		const clientData = await call(
			clientRouter.getById,
			{ id: client!.id },
			{ context }
		);
		expect(clientData.tags).toHaveLength(1);
		expect(clientData.tags[0]?.tag.name).toBe("VIP");

		// === ETAPA 3: Finalizar atendimento (snapshot inclui tag VIP) ===
		const appointments = await call(
			appointmentRouter.list,
			{ status: "OPEN" },
			{ context }
		);

		const nextWeek = new Date();
		nextWeek.setDate(nextWeek.getDate() + 7);

		const result = await call(
			appointmentRouter.finalize,
			{
				id: appointments.data[0]!.id,
				userId: user.id,
				startedAt: new Date().toISOString(),
				summary: "Atendimento VIP",
				outcome: "Cliente satisfeito",
				nextAppointmentDate: nextWeek.toISOString(),
			},
			{ context }
		);

		// Verificar snapshot contém tag VIP
		const snapshot = result.interaction.snapshot as {
			tags: Array<{ name: string; color: string }>;
		};
		expect(snapshot.tags).toHaveLength(1);
		expect(snapshot.tags[0]?.name).toBe("VIP");
		expect(snapshot.tags[0]?.color).toBe("#FFD700");

		// === ETAPA 4: Desvincular tag do cliente ===
		await call(
			tagRouter.unlinkClient,
			{ tagId: tag.id, clientId: client!.id },
			{ context }
		);

		// Verificar que cliente não tem mais a tag
		const clientAfterUnlink = await call(
			clientRouter.getById,
			{ id: client!.id },
			{ context }
		);
		expect(clientAfterUnlink.tags).toHaveLength(0);

		// === ETAPA 5: Verificar que snapshot ainda mostra tag "VIP" ===
		const history = await call(
			clientRouter.history,
			{ clientId: client!.id },
			{ context }
		);

		expect(history.data).toHaveLength(1);
		const historySnapshot = history.data[0]?.snapshot as {
			tags: Array<{ name: string; color: string }>;
		};
		expect(historySnapshot.tags).toHaveLength(1);
		expect(historySnapshot.tags[0]?.name).toBe("VIP");
		expect(historySnapshot.tags[0]?.color).toBe("#FFD700");
	});

	it("deve preservar tag no snapshot mesmo após a tag ser deletada completamente", async () => {
		const context = createTestContext();
		const user = await createTestUser();

		// Criar tag
		const tag = await call(
			tagRouter.create,
			{ name: "Premium", color: "#FF5733", userId: user.id },
			{ context }
		);

		// Criar cliente com tag
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
				tagIds: [tag.id],
			},
			{ context }
		);

		// Finalizar atendimento
		const appointments = await call(
			appointmentRouter.list,
			{ status: "OPEN" },
			{ context }
		);

		const nextWeek = new Date();
		nextWeek.setDate(nextWeek.getDate() + 7);

		await call(
			appointmentRouter.finalize,
			{
				id: appointments.data[0]!.id,
				userId: user.id,
				startedAt: new Date().toISOString(),
				summary: "Atendimento Premium",
				outcome: "OK",
				nextAppointmentDate: nextWeek.toISOString(),
			},
			{ context }
		);

		// Deletar a tag completamente
		await call(tagRouter.delete, { id: tag.id }, { context });

		// Verificar que tag não existe mais
		const tags = await call(tagRouter.list, undefined, { context });
		expect(tags.find((t) => t.name === "Premium")).toBeUndefined();

		// Verificar que snapshot AINDA mostra tag "Premium"
		const history = await call(
			clientRouter.history,
			{ clientId: client!.id },
			{ context }
		);

		expect(history.data).toHaveLength(1);
		const historySnapshot = history.data[0]?.snapshot as {
			tags: Array<{ name: string; color: string }>;
		};
		expect(historySnapshot.tags).toHaveLength(1);
		expect(historySnapshot.tags[0]?.name).toBe("Premium");
		expect(historySnapshot.tags[0]?.color).toBe("#FF5733");
	});

	it("deve mostrar tags diferentes em snapshots diferentes após alterações", async () => {
		const context = createTestContext();
		const user = await createTestUser();

		// Criar duas tags
		const vipTag = await call(
			tagRouter.create,
			{ name: "VIP", userId: user.id },
			{ context }
		);

		const goldTag = await call(
			tagRouter.create,
			{ name: "Gold", userId: user.id },
			{ context }
		);

		// Criar cliente com tag VIP
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);

		const client = await call(
			clientRouter.create,
			{
				whatsapp: "+5511999990003",
				assignedTo: user.id,
				userId: user.id,
				scheduledAt: tomorrow.toISOString(),
				fieldValues: [],
				tagIds: [vipTag.id],
			},
			{ context }
		);

		// Finalizar primeiro atendimento (snapshot com VIP)
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

		// Remover VIP e adicionar Gold
		await call(
			tagRouter.unlinkClient,
			{ tagId: vipTag.id, clientId: client!.id },
			{ context }
		);
		await call(
			tagRouter.linkClient,
			{ tagId: goldTag.id, clientId: client!.id },
			{ context }
		);

		// Finalizar segundo atendimento (snapshot com Gold)
		const nextMonth = new Date();
		nextMonth.setDate(nextMonth.getDate() + 30);

		await call(
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

		// Verificar histórico
		const history = await call(
			clientRouter.history,
			{ clientId: client!.id },
			{ context }
		);

		expect(history.data).toHaveLength(2);

		// Mais recente (Gold)
		const snapshot2 = history.data[0]?.snapshot as {
			tags: Array<{ name: string }>;
		};
		expect(snapshot2.tags).toHaveLength(1);
		expect(snapshot2.tags[0]?.name).toBe("Gold");

		// Mais antigo (VIP)
		const snapshot1 = history.data[1]?.snapshot as {
			tags: Array<{ name: string }>;
		};
		expect(snapshot1.tags).toHaveLength(1);
		expect(snapshot1.tags[0]?.name).toBe("VIP");
	});
});
