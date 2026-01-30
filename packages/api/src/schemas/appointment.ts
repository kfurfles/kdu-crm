import { z } from "zod";

/**
 * Schema para listar atendimentos
 */
export const listAppointmentsSchema = z.object({
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(20),
	startDate: z
		.string()
		.datetime({ message: "startDate deve ser uma data ISO válida" })
		.optional(),
	endDate: z
		.string()
		.datetime({ message: "endDate deve ser uma data ISO válida" })
		.optional(),
	status: z.enum(["OPEN", "DONE", "CANCELLED"]).optional(),
});

/**
 * Schema para buscar atendimento por ID
 */
export const getAppointmentSchema = z.object({
	id: z.string().min(1, "ID é obrigatório"),
});

/**
 * Schema para criar um atendimento
 */
export const createAppointmentSchema = z.object({
	clientId: z.string().min(1, "clientId é obrigatório"),
	scheduledAt: z
		.string()
		.datetime({ message: "scheduledAt deve ser uma data ISO válida" }),
	userId: z.string().min(1, "userId é obrigatório"),
});

/**
 * Schema para reagendar um atendimento
 */
export const rescheduleAppointmentSchema = z.object({
	id: z.string().min(1, "ID é obrigatório"),
	scheduledAt: z
		.string()
		.datetime({ message: "scheduledAt deve ser uma data ISO válida" }),
});

/**
 * Schema para finalizar um atendimento
 * Cria interação, marca como DONE e agenda próximo follow-up
 */
export const finalizeAppointmentSchema = z.object({
	id: z.string().min(1, "ID é obrigatório"),
	userId: z.string().min(1, "userId é obrigatório"),
	startedAt: z
		.string()
		.datetime({ message: "startedAt deve ser uma data ISO válida" }),
	summary: z.string().min(1, "Resumo é obrigatório"),
	outcome: z.string().min(1, "Resultado é obrigatório"),
	nextAppointmentDate: z
		.string()
		.datetime({ message: "Data do próximo atendimento deve ser ISO válida" }),
});

/**
 * Tipos inferidos dos schemas
 */
export type ListAppointmentsInput = z.infer<typeof listAppointmentsSchema>;
export type GetAppointmentInput = z.infer<typeof getAppointmentSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type RescheduleAppointmentInput = z.infer<
	typeof rescheduleAppointmentSchema
>;
export type FinalizeAppointmentInput = z.infer<
	typeof finalizeAppointmentSchema
>;
