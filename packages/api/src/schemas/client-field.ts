import { z } from "zod";

/**
 * Enum para tipos de campo customizável
 */
export const FieldTypeSchema = z.enum([
	"TEXT",
	"NUMBER",
	"DATE",
	"SELECT",
	"CHECKBOX",
]);

/**
 * Schema para criar um campo customizável
 */
export const createClientFieldSchema = z
	.object({
		name: z.string().min(1, "Nome é obrigatório"),
		type: FieldTypeSchema,
		required: z.boolean().default(false),
		options: z.array(z.string()).default([]),
		order: z.number().int().min(0).default(0),
	})
	.refine(
		(data) => {
			// Se o tipo for SELECT, deve ter pelo menos uma opção
			if (data.type === "SELECT" && data.options.length === 0) {
				return false;
			}
			return true;
		},
		{
			message: "Campos do tipo SELECT devem ter pelo menos uma opção",
			path: ["options"],
		}
	);

/**
 * Schema para atualizar um campo customizável
 * Nota: type não é permitido (imutável)
 */
export const updateClientFieldSchema = z.object({
	id: z.string().min(1, "ID é obrigatório"),
	name: z.string().min(1).optional(),
	required: z.boolean().optional(),
	order: z.number().int().min(0).optional(),
	options: z.array(z.string()).optional(),
});

/**
 * Schema para desativar um campo
 */
export const deactivateClientFieldSchema = z.object({
	id: z.string().min(1, "ID é obrigatório"),
});

/**
 * Schema para reordenar campos
 */
export const reorderClientFieldsSchema = z.object({
	fields: z
		.array(
			z.object({
				id: z.string().min(1),
				order: z.number().int().min(0),
			})
		)
		.min(1, "Deve informar pelo menos um campo"),
});

/**
 * Tipos inferidos dos schemas
 */
export type CreateClientFieldInput = z.infer<typeof createClientFieldSchema>;
export type UpdateClientFieldInput = z.infer<typeof updateClientFieldSchema>;
export type DeactivateClientFieldInput = z.infer<
	typeof deactivateClientFieldSchema
>;
export type ReorderClientFieldsInput = z.infer<
	typeof reorderClientFieldsSchema
>;
