import { call } from "@orpc/server";
import { describe, expect, it } from "vitest";
import { clientRouter } from "../routers/client";
import {
	createTestClientField,
	createTestContext,
	createTestTag,
	createTestUser,
	prisma,
} from "./setup";

describe("Client API", () => {
	describe("list - Listar clientes", () => {
		it("deve retornar lista vazia quando não há clientes", async () => {
			const context = createTestContext();
			const result = await call(clientRouter.list, {}, { context });

			expect(result.data).toEqual([]);
			expect(result.total).toBe(0);
			expect(result.page).toBe(1);
			expect(result.pageSize).toBe(20);
		});

		it("deve retornar clientes com paginação", async () => {
			const user = await createTestUser();

			// Criar 25 clientes
			for (let i = 0; i < 25; i++) {
				await prisma.client.create({
					data: {
						whatsapp: `+5511999990${i.toString().padStart(3, "0")}`,
						assignedTo: user.id,
					},
				});
			}

			const context = createTestContext();

			// Primeira página
			const page1 = await call(
				clientRouter.list,
				{ page: 1, pageSize: 10 },
				{ context }
			);
			expect(page1.data).toHaveLength(10);
			expect(page1.total).toBe(25);
			expect(page1.page).toBe(1);

			// Terceira página
			const page3 = await call(
				clientRouter.list,
				{ page: 3, pageSize: 10 },
				{ context }
			);
			expect(page3.data).toHaveLength(5);
		});

		it("deve buscar por campo Nome", async () => {
			const user = await createTestUser();

			// Criar campo Nome
			const nomeField = await createTestClientField("Nome", "TEXT", true);

			// Criar clientes com valores de Nome
			const client1 = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});
			await prisma.clientFieldValue.create({
				data: {
					clientId: client1.id,
					fieldId: nomeField.id,
					value: "João Silva",
				},
			});

			const client2 = await prisma.client.create({
				data: { whatsapp: "+5511999990002", assignedTo: user.id },
			});
			await prisma.clientFieldValue.create({
				data: {
					clientId: client2.id,
					fieldId: nomeField.id,
					value: "Maria Santos",
				},
			});

			const context = createTestContext();

			// Buscar por "João"
			const result = await call(
				clientRouter.list,
				{ search: "João" },
				{ context }
			);

			expect(result.data).toHaveLength(1);
			expect(result.data[0]?.id).toBe(client1.id);
		});

		it("deve buscar por campo Empresa", async () => {
			const user = await createTestUser();

			// Criar campo Empresa
			const empresaField = await createTestClientField(
				"Empresa",
				"TEXT",
				false
			);

			// Criar clientes com valores de Empresa
			const client1 = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});
			await prisma.clientFieldValue.create({
				data: {
					clientId: client1.id,
					fieldId: empresaField.id,
					value: "Tech Corp",
				},
			});

			const client2 = await prisma.client.create({
				data: { whatsapp: "+5511999990002", assignedTo: user.id },
			});
			await prisma.clientFieldValue.create({
				data: {
					clientId: client2.id,
					fieldId: empresaField.id,
					value: "Startup Inc",
				},
			});

			const context = createTestContext();

			// Buscar por "Tech"
			const result = await call(
				clientRouter.list,
				{ search: "Tech" },
				{ context }
			);

			expect(result.data).toHaveLength(1);
			expect(result.data[0]?.id).toBe(client1.id);
		});

		it("deve filtrar por tags", async () => {
			const user = await createTestUser();
			const tag = await createTestTag(user.id, "VIP");

			// Criar clientes
			const client1 = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});
			await prisma.clientTag.create({
				data: { clientId: client1.id, tagId: tag.id },
			});

			// Criar cliente sem tag
			await prisma.client.create({
				data: { whatsapp: "+5511999990002", assignedTo: user.id },
			});

			const context = createTestContext();

			// Filtrar por tag VIP
			const result = await call(
				clientRouter.list,
				{ tagIds: [tag.id] },
				{ context }
			);

			expect(result.data).toHaveLength(1);
			expect(result.data[0]?.id).toBe(client1.id);
		});

		it("deve excluir clientes deletados", async () => {
			const user = await createTestUser();

			// Criar cliente ativo
			const activeClient = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			// Criar cliente deletado
			await prisma.client.create({
				data: {
					whatsapp: "+5511999990002",
					assignedTo: user.id,
					deletedAt: new Date(),
				},
			});

			const context = createTestContext();
			const result = await call(clientRouter.list, {}, { context });

			expect(result.data).toHaveLength(1);
			expect(result.data[0]?.id).toBe(activeClient.id);
		});

		it("deve retornar clientes com tags e fieldValues incluídos", async () => {
			const user = await createTestUser();
			const tag = await createTestTag(user.id, "Premium");
			const nomeField = await createTestClientField("Nome", "TEXT", true);

			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});
			await prisma.clientTag.create({
				data: { clientId: client.id, tagId: tag.id },
			});
			await prisma.clientFieldValue.create({
				data: {
					clientId: client.id,
					fieldId: nomeField.id,
					value: "Test User",
				},
			});

			const context = createTestContext();
			const result = await call(clientRouter.list, {}, { context });

			expect(result.data[0]?.tags).toHaveLength(1);
			expect(result.data[0]?.tags[0]?.tag.name).toBe("Premium");
			expect(result.data[0]?.fieldValues).toHaveLength(1);
			expect(result.data[0]?.fieldValues[0]?.value).toBe("Test User");
		});

		it("deve incluir próximo appointment OPEN na resposta", async () => {
			const user = await createTestUser();

			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
			await prisma.appointment.create({
				data: {
					clientId: client.id,
					assignedTo: user.id,
					scheduledAt,
					status: "OPEN",
					createdBy: user.id,
				},
			});

			const context = createTestContext();
			const result = await call(clientRouter.list, {}, { context });

			expect(result.data[0]?.appointments).toHaveLength(1);
			expect(result.data[0]?.appointments[0]?.status).toBe("OPEN");
		});

		it("deve ordenar por próximo appointment (mais urgente primeiro)", async () => {
			const user = await createTestUser();

			// Criar 3 clientes com appointments em datas diferentes
			const clientUrgent = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});
			await prisma.appointment.create({
				data: {
					clientId: clientUrgent.id,
					assignedTo: user.id,
					scheduledAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hora
					status: "OPEN",
					createdBy: user.id,
				},
			});

			const clientLater = await prisma.client.create({
				data: { whatsapp: "+5511999990002", assignedTo: user.id },
			});
			await prisma.appointment.create({
				data: {
					clientId: clientLater.id,
					assignedTo: user.id,
					scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 horas
					status: "OPEN",
					createdBy: user.id,
				},
			});

			const clientMedium = await prisma.client.create({
				data: { whatsapp: "+5511999990003", assignedTo: user.id },
			});
			await prisma.appointment.create({
				data: {
					clientId: clientMedium.id,
					assignedTo: user.id,
					scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
					status: "OPEN",
					createdBy: user.id,
				},
			});

			const context = createTestContext();
			const result = await call(clientRouter.list, {}, { context });

			expect(result.data).toHaveLength(3);
			// Ordenação: urgente -> medium -> later
			expect(result.data[0]?.id).toBe(clientUrgent.id);
			expect(result.data[1]?.id).toBe(clientMedium.id);
			expect(result.data[2]?.id).toBe(clientLater.id);
		});

		it("deve colocar clientes sem appointment no final", async () => {
			const user = await createTestUser();

			// Cliente SEM appointment
			const clientNoAppointment = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			// Cliente COM appointment
			const clientWithAppointment = await prisma.client.create({
				data: { whatsapp: "+5511999990002", assignedTo: user.id },
			});
			await prisma.appointment.create({
				data: {
					clientId: clientWithAppointment.id,
					assignedTo: user.id,
					scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
					status: "OPEN",
					createdBy: user.id,
				},
			});

			const context = createTestContext();
			const result = await call(clientRouter.list, {}, { context });

			expect(result.data).toHaveLength(2);
			// Cliente com appointment primeiro
			expect(result.data[0]?.id).toBe(clientWithAppointment.id);
			// Cliente sem appointment por último
			expect(result.data[1]?.id).toBe(clientNoAppointment.id);
		});

		it("deve ignorar appointments não-OPEN na ordenação", async () => {
			const user = await createTestUser();

			// Cliente com appointment DONE (deve ir pro final)
			const clientDone = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});
			await prisma.appointment.create({
				data: {
					clientId: clientDone.id,
					assignedTo: user.id,
					scheduledAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // Urgente mas DONE
					status: "DONE",
					createdBy: user.id,
				},
			});

			// Cliente com appointment OPEN
			const clientOpen = await prisma.client.create({
				data: { whatsapp: "+5511999990002", assignedTo: user.id },
			});
			await prisma.appointment.create({
				data: {
					clientId: clientOpen.id,
					assignedTo: user.id,
					scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // Menos urgente mas OPEN
					status: "OPEN",
					createdBy: user.id,
				},
			});

			const context = createTestContext();
			const result = await call(clientRouter.list, {}, { context });

			expect(result.data).toHaveLength(2);
			// Cliente com OPEN primeiro (mesmo que menos urgente)
			expect(result.data[0]?.id).toBe(clientOpen.id);
			// Cliente com DONE no final (como se não tivesse appointment)
			expect(result.data[1]?.id).toBe(clientDone.id);
		});
	});

	describe("getById - Buscar cliente por ID", () => {
		it("deve retornar cliente com dados completos", async () => {
			const user = await createTestUser();
			const tag = await createTestTag(user.id, "VIP");
			const nomeField = await createTestClientField("Nome", "TEXT", true);

			const client = await prisma.client.create({
				data: {
					whatsapp: "+5511999990001",
					notes: "Cliente importante",
					assignedTo: user.id,
				},
			});
			await prisma.clientTag.create({
				data: { clientId: client.id, tagId: tag.id },
			});
			await prisma.clientFieldValue.create({
				data: {
					clientId: client.id,
					fieldId: nomeField.id,
					value: "João Silva",
				},
			});

			const context = createTestContext();
			const result = await call(
				clientRouter.getById,
				{ id: client.id },
				{ context }
			);

			expect(result.id).toBe(client.id);
			expect(result.whatsapp).toBe("+5511999990001");
			expect(result.notes).toBe("Cliente importante");
			expect(result.tags).toHaveLength(1);
			expect(result.tags[0]?.tag.name).toBe("VIP");
			expect(result.fieldValues).toHaveLength(1);
			expect(result.fieldValues[0]?.value).toBe("João Silva");
		});

		it("deve retornar NOT_FOUND para cliente inexistente", async () => {
			const context = createTestContext();

			await expect(
				call(clientRouter.getById, { id: "inexistente" }, { context })
			).rejects.toThrow();
		});

		it("deve retornar NOT_FOUND para cliente deletado", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: {
					whatsapp: "+5511999990001",
					assignedTo: user.id,
					deletedAt: new Date(),
				},
			});

			const context = createTestContext();

			await expect(
				call(clientRouter.getById, { id: client.id }, { context })
			).rejects.toThrow();
		});
	});

	describe("create - Criar cliente", () => {
		it("deve criar cliente com campos obrigatórios preenchidos", async () => {
			const user = await createTestUser();
			const nomeField = await createTestClientField("Nome", "TEXT", true);
			const cpfField = await createTestClientField("CPF", "TEXT", true);

			const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Amanhã

			const context = createTestContext();
			const result = await call(
				clientRouter.create,
				{
					whatsapp: "+5511999990001",
					notes: "Novo cliente",
					assignedTo: user.id,
					userId: user.id,
					scheduledAt: scheduledAt.toISOString(),
					fieldValues: [
						{ fieldId: nomeField.id, value: "João Silva" },
						{ fieldId: cpfField.id, value: "123.456.789-00" },
					],
				},
				{ context }
			);

			expect(result?.id).toBeDefined();
			expect(result?.whatsapp).toBe("+5511999990001");
			expect(result?.notes).toBe("Novo cliente");
			expect(result?.assignedTo).toBe(user.id);
		});

		it("deve falhar se campo obrigatório não for preenchido", async () => {
			const user = await createTestUser();
			await createTestClientField("Nome", "TEXT", true);
			await createTestClientField("CPF", "TEXT", true);

			const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

			const context = createTestContext();

			// Tentar criar sem o campo CPF (obrigatório)
			await expect(
				call(
					clientRouter.create,
					{
						whatsapp: "+5511999990001",
						assignedTo: user.id,
						userId: user.id,
						scheduledAt: scheduledAt.toISOString(),
						fieldValues: [], // Sem campos preenchidos
					},
					{ context }
				)
			).rejects.toThrow();
		});

		it("deve criar primeiro appointment automaticamente", async () => {
			const user = await createTestUser();

			const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

			const context = createTestContext();
			const result = await call(
				clientRouter.create,
				{
					whatsapp: "+5511999990001",
					assignedTo: user.id,
					userId: user.id,
					scheduledAt: scheduledAt.toISOString(),
					fieldValues: [],
				},
				{ context }
			);

			// Verificar que appointment foi criado
			const appointment = await prisma.appointment.findFirst({
				where: { clientId: result?.id },
			});

			expect(appointment).not.toBeNull();
			expect(appointment?.status).toBe("OPEN");
			expect(appointment?.assignedTo).toBe(user.id);
			expect(appointment?.createdBy).toBe(user.id);
			expect(
				appointment?.scheduledAt
					? new Date(appointment.scheduledAt).toISOString()
					: null
			).toBe(scheduledAt.toISOString());
		});

		it("deve registrar evento CREATED no histórico", async () => {
			const user = await createTestUser();

			const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

			const context = createTestContext();
			const result = await call(
				clientRouter.create,
				{
					whatsapp: "+5511999990001",
					assignedTo: user.id,
					userId: user.id,
					scheduledAt: scheduledAt.toISOString(),
					fieldValues: [],
				},
				{ context }
			);

			// Verificar que evento CREATED foi registrado
			const history = await prisma.clientHistory.findFirst({
				where: { clientId: result?.id, type: "CREATED" },
			});

			expect(history).not.toBeNull();
			expect(history?.createdBy).toBe(user.id);
		});

		it("deve vincular tags se informadas", async () => {
			const user = await createTestUser();
			const tag1 = await createTestTag(user.id, "VIP");
			const tag2 = await createTestTag(user.id, "Premium");

			const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

			const context = createTestContext();
			const result = await call(
				clientRouter.create,
				{
					whatsapp: "+5511999990001",
					assignedTo: user.id,
					userId: user.id,
					scheduledAt: scheduledAt.toISOString(),
					fieldValues: [],
					tagIds: [tag1.id, tag2.id],
				},
				{ context }
			);

			// Verificar que tags foram vinculadas
			const clientTags = await prisma.clientTag.findMany({
				where: { clientId: result?.id },
			});

			expect(clientTags).toHaveLength(2);
		});

		it("deve rejeitar WhatsApp em formato inválido", async () => {
			const user = await createTestUser();

			const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

			const context = createTestContext();

			await expect(
				call(
					clientRouter.create,
					{
						whatsapp: "11999990001", // Sem o +
						assignedTo: user.id,
						userId: user.id,
						scheduledAt: scheduledAt.toISOString(),
						fieldValues: [],
					},
					{ context }
				)
			).rejects.toThrow();
		});

		it("deve criar cliente com campos opcionais não preenchidos", async () => {
			const user = await createTestUser();
			const nomeField = await createTestClientField("Nome", "TEXT", true);
			await createTestClientField("Observação", "TEXT", false); // Opcional

			const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

			const context = createTestContext();
			const result = await call(
				clientRouter.create,
				{
					whatsapp: "+5511999990001",
					assignedTo: user.id,
					userId: user.id,
					scheduledAt: scheduledAt.toISOString(),
					fieldValues: [
						{ fieldId: nomeField.id, value: "João Silva" },
						// Observação não preenchida (opcional)
					],
				},
				{ context }
			);

			expect(result?.id).toBeDefined();
		});
	});

	describe("update - Editar cliente", () => {
		it("deve atualizar whatsapp e notes", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: {
					whatsapp: "+5511999990001",
					notes: "Nota antiga",
					assignedTo: user.id,
				},
			});

			const context = createTestContext();
			const result = await call(
				clientRouter.update,
				{
					id: client.id,
					whatsapp: "+5511999990002",
					notes: "Nota nova",
				},
				{ context }
			);

			expect(result?.whatsapp).toBe("+5511999990002");
			expect(result?.notes).toBe("Nota nova");
		});

		it("deve transferir cliente para outro usuário", async () => {
			const user1 = await createTestUser();
			const user2 = await createTestUser();
			const client = await prisma.client.create({
				data: {
					whatsapp: "+5511999990001",
					assignedTo: user1.id,
				},
			});

			const context = createTestContext();
			const result = await call(
				clientRouter.transfer,
				{
					id: client.id,
					newAssigneeId: user2.id,
				},
				{ context }
			);

			expect(result?.assignedTo).toBe(user2.id);
		});

		it("deve atualizar fieldValues", async () => {
			const user = await createTestUser();
			const nomeField = await createTestClientField("Nome", "TEXT", true);

			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});
			await prisma.clientFieldValue.create({
				data: {
					clientId: client.id,
					fieldId: nomeField.id,
					value: "Nome Antigo",
				},
			});

			const context = createTestContext();
			await call(
				clientRouter.update,
				{
					id: client.id,
					fieldValues: [{ fieldId: nomeField.id, value: "Nome Novo" }],
				},
				{ context }
			);

			const fieldValue = await prisma.clientFieldValue.findFirst({
				where: { clientId: client.id, fieldId: nomeField.id },
			});

			expect(fieldValue?.value).toBe("Nome Novo");
		});

		it("deve rejeitar atualização de cliente deletado", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: {
					whatsapp: "+5511999990001",
					assignedTo: user.id,
					deletedAt: new Date(),
				},
			});

			const context = createTestContext();

			await expect(
				call(
					clientRouter.update,
					{ id: client.id, notes: "Nova nota" },
					{ context }
				)
			).rejects.toThrow();
		});

		it("deve retornar NOT_FOUND para cliente inexistente", async () => {
			const context = createTestContext();

			await expect(
				call(
					clientRouter.update,
					{ id: "inexistente", notes: "Nova nota" },
					{ context }
				)
			).rejects.toThrow();
		});
	});

	describe("deactivate - Desativar cliente", () => {
		it("deve definir deletedAt no cliente", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const context = createTestContext();
			const result = await call(
				clientRouter.deactivate,
				{ id: client.id },
				{ context }
			);

			expect(result.deletedAt).not.toBeNull();

			// Verificar no banco
			const clientAfter = await prisma.client.findUnique({
				where: { id: client.id },
			});
			expect(clientAfter?.deletedAt).not.toBeNull();
		});

		it("deve retornar NOT_FOUND para cliente inexistente", async () => {
			const context = createTestContext();

			await expect(
				call(clientRouter.deactivate, { id: "inexistente" }, { context })
			).rejects.toThrow();
		});

		it("deve ser idempotente para cliente já deletado", async () => {
			const user = await createTestUser();
			const deletedAt = new Date();
			const client = await prisma.client.create({
				data: {
					whatsapp: "+5511999990001",
					assignedTo: user.id,
					deletedAt,
				},
			});

			const context = createTestContext();
			const result = await call(
				clientRouter.deactivate,
				{ id: client.id },
				{ context }
			);

			// Deve manter o deletedAt original ou atualizar para novo
			expect(result.deletedAt).not.toBeNull();
		});
	});

	describe("history - Histórico de interações do cliente", () => {
		it("deve retornar lista vazia quando não há interações", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const context = createTestContext();
			const result = await call(
				clientRouter.history,
				{ clientId: client.id },
				{ context }
			);

			expect(result.data).toEqual([]);
			expect(result.total).toBe(0);
		});

		it("deve retornar interações ordenadas por data decrescente", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			// Criar appointments e interações em ordem cronológica
			const appointment1 = await prisma.appointment.create({
				data: {
					clientId: client.id,
					assignedTo: user.id,
					scheduledAt: new Date("2024-01-01"),
					status: "DONE",
					createdBy: user.id,
				},
			});
			await prisma.interaction.create({
				data: {
					appointmentId: appointment1.id,
					clientId: client.id,
					userId: user.id,
					startedAt: new Date("2024-01-01T10:00:00Z"),
					endedAt: new Date("2024-01-01T10:30:00Z"),
					summary: "Primeiro contato",
					outcome: "Cliente interessado",
					snapshot: { whatsapp: "+5511999990001" },
				},
			});

			const appointment2 = await prisma.appointment.create({
				data: {
					clientId: client.id,
					assignedTo: user.id,
					scheduledAt: new Date("2024-01-02"),
					status: "DONE",
					createdBy: user.id,
				},
			});
			await prisma.interaction.create({
				data: {
					appointmentId: appointment2.id,
					clientId: client.id,
					userId: user.id,
					startedAt: new Date("2024-01-02T10:00:00Z"),
					endedAt: new Date("2024-01-02T10:30:00Z"),
					summary: "Segundo contato",
					outcome: "Fechou negócio",
					snapshot: { whatsapp: "+5511999990001" },
				},
			});

			const context = createTestContext();
			const result = await call(
				clientRouter.history,
				{ clientId: client.id },
				{ context }
			);

			expect(result.data).toHaveLength(2);
			// Mais recente primeiro
			expect(result.data[0]?.summary).toBe("Segundo contato");
			expect(result.data[1]?.summary).toBe("Primeiro contato");
		});

		it("deve incluir snapshot na interação", async () => {
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

			const snapshot = {
				whatsapp: "+5511999990001",
				fields: [{ name: "Nome", value: "João Silva" }],
				tags: ["VIP"],
			};

			await prisma.interaction.create({
				data: {
					appointmentId: appointment.id,
					clientId: client.id,
					userId: user.id,
					startedAt: new Date(),
					endedAt: new Date(),
					summary: "Contato realizado",
					outcome: "OK",
					snapshot,
				},
			});

			const context = createTestContext();
			const result = await call(
				clientRouter.history,
				{ clientId: client.id },
				{ context }
			);

			expect(result.data[0]?.snapshot).toEqual(snapshot);
		});

		it("deve paginar resultados", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			// Criar 15 interações
			for (let i = 0; i < 15; i++) {
				const appointment = await prisma.appointment.create({
					data: {
						clientId: client.id,
						assignedTo: user.id,
						scheduledAt: new Date(Date.now() + i * 1000),
						status: "DONE",
						createdBy: user.id,
					},
				});
				await prisma.interaction.create({
					data: {
						appointmentId: appointment.id,
						clientId: client.id,
						userId: user.id,
						startedAt: new Date(Date.now() + i * 1000),
						endedAt: new Date(Date.now() + i * 1000 + 1000),
						summary: `Interação ${i}`,
						outcome: "OK",
						snapshot: {},
					},
				});
			}

			const context = createTestContext();

			// Primeira página
			const page1 = await call(
				clientRouter.history,
				{ clientId: client.id, page: 1, pageSize: 10 },
				{ context }
			);
			expect(page1.data).toHaveLength(10);
			expect(page1.total).toBe(15);

			// Segunda página
			const page2 = await call(
				clientRouter.history,
				{ clientId: client.id, page: 2, pageSize: 10 },
				{ context }
			);
			expect(page2.data).toHaveLength(5);
		});

		it("deve retornar NOT_FOUND para cliente inexistente", async () => {
			const context = createTestContext();

			await expect(
				call(clientRouter.history, { clientId: "inexistente" }, { context })
			).rejects.toThrow();
		});

		it("deve funcionar para cliente deletado (preservar histórico)", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: {
					whatsapp: "+5511999990001",
					assignedTo: user.id,
					deletedAt: new Date(),
				},
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
			await prisma.interaction.create({
				data: {
					appointmentId: appointment.id,
					clientId: client.id,
					userId: user.id,
					startedAt: new Date(),
					endedAt: new Date(),
					summary: "Contato realizado",
					outcome: "OK",
					snapshot: { whatsapp: "+5511999990001" },
				},
			});

			const context = createTestContext();
			const result = await call(
				clientRouter.history,
				{ clientId: client.id },
				{ context }
			);

			expect(result.data).toHaveLength(1);
		});

		it("deve incluir dados do usuário e appointment na interação", async () => {
			const user = await createTestUser();
			const client = await prisma.client.create({
				data: { whatsapp: "+5511999990001", assignedTo: user.id },
			});

			const scheduledAt = new Date("2024-01-15T14:00:00Z");
			const appointment = await prisma.appointment.create({
				data: {
					clientId: client.id,
					assignedTo: user.id,
					scheduledAt,
					status: "DONE",
					createdBy: user.id,
				},
			});

			await prisma.interaction.create({
				data: {
					appointmentId: appointment.id,
					clientId: client.id,
					userId: user.id,
					startedAt: new Date(),
					endedAt: new Date(),
					summary: "Contato",
					outcome: "OK",
					snapshot: {},
				},
			});

			const context = createTestContext();
			const result = await call(
				clientRouter.history,
				{ clientId: client.id },
				{ context }
			);

			expect(result.data[0]?.user).toBeDefined();
			expect(result.data[0]?.user.id).toBe(user.id);
			expect(result.data[0]?.appointment).toBeDefined();
			expect(result.data[0]?.appointment.id).toBe(appointment.id);
		});
	});
});
