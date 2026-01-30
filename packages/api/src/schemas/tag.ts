import { z } from "zod";

/**
 * Schema para criar uma tag
 */
export const createTagSchema = z.object({
	name: z.string().min(1, "Nome é obrigatório"),
	color: z.string().optional(),
	userId: z.string().min(1, "userId é obrigatório"),
});

/**
 * Schema para atualizar uma tag
 */
export const updateTagSchema = z.object({
	id: z.string().min(1, "ID é obrigatório"),
	name: z.string().min(1).optional(),
	color: z.string().optional(),
});

/**
 * Schema para deletar uma tag
 */
export const deleteTagSchema = z.object({
	id: z.string().min(1, "ID é obrigatório"),
});

/**
 * Schema para vincular tag a cliente
 */
export const linkClientTagSchema = z.object({
	tagId: z.string().min(1, "tagId é obrigatório"),
	clientId: z.string().min(1, "clientId é obrigatório"),
});

/**
 * Schema para desvincular tag de cliente
 */
export const unlinkClientTagSchema = z.object({
	tagId: z.string().min(1, "tagId é obrigatório"),
	clientId: z.string().min(1, "clientId é obrigatório"),
});

/**
 * Tipos inferidos dos schemas
 */
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type DeleteTagInput = z.infer<typeof deleteTagSchema>;
export type LinkClientTagInput = z.infer<typeof linkClientTagSchema>;
export type UnlinkClientTagInput = z.infer<typeof unlinkClientTagSchema>;
