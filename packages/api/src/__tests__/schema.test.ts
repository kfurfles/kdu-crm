import { describe, expect, it } from "vitest";
import { prisma } from "./setup";

describe("Schema Base - Estrutura de Dados", () => {
	describe("ClientField (Campo Customizável)", () => {
		it("deve criar campo do tipo TEXT", async () => {
			const field = await prisma.clientField.create({
				data: {
					name: "Nome Completo",
					type: "TEXT",
					required: true,
					order: 1,
				},
			});

			expect(field.id).toBeDefined();
			expect(field.name).toBe("Nome Completo");
			expect(field.type).toBe("TEXT");
			expect(field.required).toBe(true);
			expect(field.active).toBe(true);
			expect(field.order).toBe(1);
		});

		it("deve criar campo do tipo SELECT com opções", async () => {
			const field = await prisma.clientField.create({
				data: {
					name: "Estado Civil",
					type: "SELECT",
					options: ["Solteiro", "Casado", "Divorciado", "Viúvo"],
					order: 2,
				},
			});

			expect(field.type).toBe("SELECT");
			expect(field.options).toEqual([
				"Solteiro",
				"Casado",
				"Divorciado",
				"Viúvo",
			]);
		});

		it("deve criar campo do tipo NUMBER", async () => {
			const field = await prisma.clientField.create({
				data: {
					name: "Renda Mensal",
					type: "NUMBER",
					order: 3,
				},
			});

			expect(field.type).toBe("NUMBER");
		});

		it("deve criar campo do tipo DATE", async () => {
			const field = await prisma.clientField.create({
				data: {
					name: "Data de Nascimento",
					type: "DATE",
					order: 4,
				},
			});

			expect(field.type).toBe("DATE");
		});

		it("deve criar campo do tipo CHECKBOX", async () => {
			const field = await prisma.clientField.create({
				data: {
					name: "Aceita Marketing",
					type: "CHECKBOX",
					order: 5,
				},
			});

			expect(field.type).toBe("CHECKBOX");
		});
	});

	describe("Tag", () => {
		it("deve criar tag com relação ao usuário criador", async () => {
			// Primeiro criar um usuário
			const user = await prisma.user.create({
				data: {
					id: "user-1",
					name: "Admin",
					email: "admin@test.com",
					emailVerified: true,
				},
			});

			const tag = await prisma.tag.create({
				data: {
					name: "VIP",
					color: "#FFD700",
					createdBy: user.id,
				},
			});

			expect(tag.id).toBeDefined();
			expect(tag.name).toBe("VIP");
			expect(tag.color).toBe("#FFD700");
			expect(tag.createdBy).toBe(user.id);
		});

		it("deve impedir tags com mesmo nome (unique)", async () => {
			const user = await prisma.user.create({
				data: {
					id: "user-2",
					name: "User",
					email: "user@test.com",
					emailVerified: true,
				},
			});

			await prisma.tag.create({
				data: {
					name: "Importante",
					createdBy: user.id,
				},
			});

			await expect(
				prisma.tag.create({
					data: {
						name: "Importante",
						createdBy: user.id,
					},
				})
			).rejects.toThrow();
		});
	});

	describe("Client", () => {
		it("deve criar cliente com WhatsApp", async () => {
			const client = await prisma.client.create({
				data: {
					whatsapp: "+5511999999999",
					notes: "Cliente potencial",
				},
			});

			expect(client.id).toBeDefined();
			expect(client.whatsapp).toBe("+5511999999999");
			expect(client.notes).toBe("Cliente potencial");
		});

		it("deve criar cliente atribuído a um usuário", async () => {
			const user = await prisma.user.create({
				data: {
					id: "user-3",
					name: "Corretor",
					email: "corretor@test.com",
					emailVerified: true,
				},
			});

			const client = await prisma.client.create({
				data: {
					whatsapp: "+5511888888888",
					assignedTo: user.id,
				},
			});

			expect(client.assignedTo).toBe(user.id);
		});
	});

	describe("ClientFieldValue", () => {
		it("deve associar valor de campo ao cliente", async () => {
			const field = await prisma.clientField.create({
				data: {
					name: "Profissão",
					type: "TEXT",
					order: 1,
				},
			});

			const client = await prisma.client.create({
				data: {
					whatsapp: "+5511777777777",
				},
			});

			const fieldValue = await prisma.clientFieldValue.create({
				data: {
					clientId: client.id,
					fieldId: field.id,
					value: "Engenheiro",
				},
			});

			expect(fieldValue.value).toBe("Engenheiro");
			expect(fieldValue.clientId).toBe(client.id);
			expect(fieldValue.fieldId).toBe(field.id);
		});

		it("deve impedir valores duplicados para mesmo cliente/campo", async () => {
			const field = await prisma.clientField.create({
				data: {
					name: "CPF",
					type: "TEXT",
					order: 1,
				},
			});

			const client = await prisma.client.create({
				data: {
					whatsapp: "+5511666666666",
				},
			});

			await prisma.clientFieldValue.create({
				data: {
					clientId: client.id,
					fieldId: field.id,
					value: "123.456.789-00",
				},
			});

			await expect(
				prisma.clientFieldValue.create({
					data: {
						clientId: client.id,
						fieldId: field.id,
						value: "outro-valor",
					},
				})
			).rejects.toThrow();
		});
	});

	describe("ClientTag", () => {
		it("deve associar tags ao cliente", async () => {
			const user = await prisma.user.create({
				data: {
					id: "user-4",
					name: "Admin",
					email: "admin4@test.com",
					emailVerified: true,
				},
			});

			const tag = await prisma.tag.create({
				data: {
					name: "Premium",
					createdBy: user.id,
				},
			});

			const client = await prisma.client.create({
				data: {
					whatsapp: "+5511555555555",
				},
			});

			const clientTag = await prisma.clientTag.create({
				data: {
					clientId: client.id,
					tagId: tag.id,
				},
			});

			expect(clientTag.clientId).toBe(client.id);
			expect(clientTag.tagId).toBe(tag.id);
		});

		it("deve buscar cliente com suas tags", async () => {
			const user = await prisma.user.create({
				data: {
					id: "user-5",
					name: "Admin",
					email: "admin5@test.com",
					emailVerified: true,
				},
			});

			const tag1 = await prisma.tag.create({
				data: { name: "Tag1", createdBy: user.id },
			});

			const tag2 = await prisma.tag.create({
				data: { name: "Tag2", createdBy: user.id },
			});

			const client = await prisma.client.create({
				data: {
					whatsapp: "+5511444444444",
					tags: {
						create: [{ tagId: tag1.id }, { tagId: tag2.id }],
					},
				},
				include: {
					tags: {
						include: { tag: true },
					},
				},
			});

			expect(client.tags).toHaveLength(2);
			expect(client.tags.map((t) => t.tag.name)).toContain("Tag1");
			expect(client.tags.map((t) => t.tag.name)).toContain("Tag2");
		});
	});

	describe("Appointment (Atendimento)", () => {
		it("deve criar atendimento vinculado a cliente e usuário", async () => {
			const user = await prisma.user.create({
				data: {
					id: "user-6",
					name: "Corretor",
					email: "corretor6@test.com",
					emailVerified: true,
				},
			});

			const client = await prisma.client.create({
				data: {
					whatsapp: "+5511333333333",
				},
			});

			const scheduledAt = new Date("2025-02-01T10:00:00Z");

			const appointment = await prisma.appointment.create({
				data: {
					clientId: client.id,
					assignedTo: user.id,
					scheduledAt,
					createdBy: user.id,
				},
			});

			expect(appointment.id).toBeDefined();
			expect(appointment.clientId).toBe(client.id);
			expect(appointment.assignedTo).toBe(user.id);
			expect(appointment.status).toBe("OPEN");
			expect(appointment.scheduledAt).toEqual(scheduledAt);
		});

		it("deve atualizar status para DONE", async () => {
			const user = await prisma.user.create({
				data: {
					id: "user-7",
					name: "Corretor",
					email: "corretor7@test.com",
					emailVerified: true,
				},
			});

			const client = await prisma.client.create({
				data: {
					whatsapp: "+5511222222222",
				},
			});

			const appointment = await prisma.appointment.create({
				data: {
					clientId: client.id,
					assignedTo: user.id,
					scheduledAt: new Date(),
					createdBy: user.id,
				},
			});

			const updated = await prisma.appointment.update({
				where: { id: appointment.id },
				data: { status: "DONE" },
			});

			expect(updated.status).toBe("DONE");
		});

		it("deve atualizar status para CANCELLED com motivo", async () => {
			const user = await prisma.user.create({
				data: {
					id: "user-8",
					name: "Corretor",
					email: "corretor8@test.com",
					emailVerified: true,
				},
			});

			const client = await prisma.client.create({
				data: {
					whatsapp: "+5511111111111",
				},
			});

			const appointment = await prisma.appointment.create({
				data: {
					clientId: client.id,
					assignedTo: user.id,
					scheduledAt: new Date(),
					createdBy: user.id,
				},
			});

			const updated = await prisma.appointment.update({
				where: { id: appointment.id },
				data: {
					status: "CANCELLED",
					cancelReason: "Cliente não atendeu",
				},
			});

			expect(updated.status).toBe("CANCELLED");
			expect(updated.cancelReason).toBe("Cliente não atendeu");
		});
	});

	describe("Interaction", () => {
		it("deve criar interação com snapshot JSON", async () => {
			const user = await prisma.user.create({
				data: {
					id: "user-9",
					name: "Corretor",
					email: "corretor9@test.com",
					emailVerified: true,
				},
			});

			const client = await prisma.client.create({
				data: {
					whatsapp: "+5511000000000",
				},
			});

			const appointment = await prisma.appointment.create({
				data: {
					clientId: client.id,
					assignedTo: user.id,
					scheduledAt: new Date(),
					createdBy: user.id,
				},
			});

			const startedAt = new Date("2025-01-29T10:00:00Z");
			const endedAt = new Date("2025-01-29T10:30:00Z");

			const snapshot = {
				client: {
					whatsapp: "+5511000000000",
				},
				fields: [{ name: "Profissão", value: "Médico" }],
				tags: ["VIP", "Premium"],
			};

			const interaction = await prisma.interaction.create({
				data: {
					appointmentId: appointment.id,
					clientId: client.id,
					userId: user.id,
					startedAt,
					endedAt,
					summary: "Conversamos sobre plano de saúde",
					outcome: "Cliente interessado, aguardando proposta",
					snapshot,
				},
			});

			expect(interaction.id).toBeDefined();
			expect(interaction.summary).toBe("Conversamos sobre plano de saúde");
			expect(interaction.outcome).toBe(
				"Cliente interessado, aguardando proposta"
			);
			expect(interaction.snapshot).toEqual(snapshot);
		});

		it("deve garantir relação 1:1 com appointment (unique)", async () => {
			const user = await prisma.user.create({
				data: {
					id: "user-10",
					name: "Corretor",
					email: "corretor10@test.com",
					emailVerified: true,
				},
			});

			const client = await prisma.client.create({
				data: {
					whatsapp: "+5511999888777",
				},
			});

			const appointment = await prisma.appointment.create({
				data: {
					clientId: client.id,
					assignedTo: user.id,
					scheduledAt: new Date(),
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
					summary: "Primeira interação",
					outcome: "OK",
					snapshot: {},
				},
			});

			// Tentar criar segunda interação para o mesmo appointment deve falhar
			await expect(
				prisma.interaction.create({
					data: {
						appointmentId: appointment.id,
						clientId: client.id,
						userId: user.id,
						startedAt: new Date(),
						endedAt: new Date(),
						summary: "Segunda interação",
						outcome: "Erro",
						snapshot: {},
					},
				})
			).rejects.toThrow();
		});
	});

	describe("Cascade Delete", () => {
		it("ao remover cliente, deve remover field values", async () => {
			const field = await prisma.clientField.create({
				data: {
					name: "Teste",
					type: "TEXT",
					order: 1,
				},
			});

			const client = await prisma.client.create({
				data: {
					whatsapp: "+5511123456789",
					fieldValues: {
						create: {
							fieldId: field.id,
							value: "valor-teste",
						},
					},
				},
			});

			// Verificar que o valor existe
			const valuesBefore = await prisma.clientFieldValue.findMany({
				where: { clientId: client.id },
			});
			expect(valuesBefore).toHaveLength(1);

			// Deletar cliente
			await prisma.client.delete({ where: { id: client.id } });

			// Verificar que o valor foi removido
			const valuesAfter = await prisma.clientFieldValue.findMany({
				where: { clientId: client.id },
			});
			expect(valuesAfter).toHaveLength(0);
		});

		it("ao remover cliente, deve remover tags associadas", async () => {
			const user = await prisma.user.create({
				data: {
					id: "user-11",
					name: "Admin",
					email: "admin11@test.com",
					emailVerified: true,
				},
			});

			const tag = await prisma.tag.create({
				data: {
					name: "TagParaCascade",
					createdBy: user.id,
				},
			});

			const client = await prisma.client.create({
				data: {
					whatsapp: "+5511987654321",
					tags: {
						create: { tagId: tag.id },
					},
				},
			});

			// Verificar que a associação existe
			const tagsBefore = await prisma.clientTag.findMany({
				where: { clientId: client.id },
			});
			expect(tagsBefore).toHaveLength(1);

			// Deletar cliente
			await prisma.client.delete({ where: { id: client.id } });

			// Verificar que a associação foi removida (mas a tag ainda existe)
			const tagsAfter = await prisma.clientTag.findMany({
				where: { clientId: client.id },
			});
			expect(tagsAfter).toHaveLength(0);

			// Tag ainda deve existir
			const tagStillExists = await prisma.tag.findUnique({
				where: { id: tag.id },
			});
			expect(tagStillExists).not.toBeNull();
		});

		it("ao remover cliente, deve remover appointments", async () => {
			const user = await prisma.user.create({
				data: {
					id: "user-12",
					name: "Corretor",
					email: "corretor12@test.com",
					emailVerified: true,
				},
			});

			const client = await prisma.client.create({
				data: {
					whatsapp: "+5511111222333",
					appointments: {
						create: {
							assignedTo: user.id,
							scheduledAt: new Date(),
							createdBy: user.id,
						},
					},
				},
			});

			// Verificar que o appointment existe
			const appointmentsBefore = await prisma.appointment.findMany({
				where: { clientId: client.id },
			});
			expect(appointmentsBefore).toHaveLength(1);

			// Deletar cliente
			await prisma.client.delete({ where: { id: client.id } });

			// Verificar que o appointment foi removido
			const appointmentsAfter = await prisma.appointment.findMany({
				where: { clientId: client.id },
			});
			expect(appointmentsAfter).toHaveLength(0);
		});
	});
});
