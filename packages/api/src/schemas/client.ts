import { z } from "zod";

/**
 * Regex para validação de WhatsApp em formato internacional
 * Formato: +[código país][número] (7-15 dígitos após o +)
 */
const whatsappRegex = /^\+[1-9]\d{6,14}$/;

/**
 * Schema para valores de campos customizáveis
 */
export const fieldValueSchema = z.object({
	fieldId: z.string().min(1, "fieldId é obrigatório"),
	value: z.string(),
});

/**
 * Schema para criar um cliente
 */
export const createClientSchema = z.object({
	whatsapp: z
		.string()
		.regex(
			whatsappRegex,
			"WhatsApp deve estar no formato internacional (+55119999999999)"
		),
	notes: z.string().optional(),
	assignedTo: z.string().min(1, "assignedTo é obrigatório"),
	userId: z.string().min(1, "userId é obrigatório"),
	scheduledAt: z
		.string()
		.datetime({ message: "scheduledAt deve ser uma data ISO válida" }),
	fieldValues: z.array(fieldValueSchema).default([]),
	tagIds: z.array(z.string()).default([]),
});

/**
 * Schema para atualizar um cliente
 * Nota: Para transferir cliente, use a rota transfer
 */
export const updateClientSchema = z.object({
	id: z.string().min(1, "ID é obrigatório"),
	whatsapp: z
		.string()
		.regex(
			whatsappRegex,
			"WhatsApp deve estar no formato internacional (+55119999999999)"
		)
		.optional(),
	notes: z.string().optional(),
	fieldValues: z.array(fieldValueSchema).optional(),
});

/**
 * Schema para listar clientes
 */
export const listClientsSchema = z.object({
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(20),
	search: z.string().optional(),
	tagIds: z.array(z.string()).optional(),
});

/**
 * Schema para buscar cliente por ID
 */
export const getClientSchema = z.object({
	id: z.string().min(1, "ID é obrigatório"),
});

/**
 * Schema para desativar cliente
 */
export const deactivateClientSchema = z.object({
	id: z.string().min(1, "ID é obrigatório"),
});

/**
 * Schema para buscar histórico do cliente
 */
export const getClientHistorySchema = z.object({
	clientId: z.string().min(1, "clientId é obrigatório"),
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(100).default(20),
});

/**
 * Schema para transferir cliente para outro usuário
 */
export const transferClientSchema = z.object({
	id: z.string().min(1, "ID do cliente é obrigatório"),
	newAssigneeId: z.string().min(1, "ID do novo responsável é obrigatório"),
});

/**
 * Tipos inferidos dos schemas
 */
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ListClientsInput = z.infer<typeof listClientsSchema>;
export type GetClientInput = z.infer<typeof getClientSchema>;
export type DeactivateClientInput = z.infer<typeof deactivateClientSchema>;
export type GetClientHistoryInput = z.infer<typeof getClientHistorySchema>;
export type TransferClientInput = z.infer<typeof transferClientSchema>;
export type FieldValueInput = z.infer<typeof fieldValueSchema>;
