import { z } from "zod";

/**
 * Schema para criar um usuário
 */
export const createUserSchema = z.object({
	name: z.string().min(1, "Nome é obrigatório"),
	email: z.string().email("Email inválido"),
	password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

/**
 * Schema para atualizar um usuário
 */
export const updateUserSchema = z.object({
	id: z.string().min(1, "ID é obrigatório"),
	name: z.string().min(1, "Nome é obrigatório").optional(),
	email: z.string().email("Email inválido").optional(),
});

/**
 * Schema para resetar senha de usuário
 */
export const resetPasswordSchema = z.object({
	userId: z.string().min(1, "userId é obrigatório"),
	newPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

/**
 * Schema para buscar usuário por ID
 */
export const getUserSchema = z.object({
	id: z.string().min(1, "ID é obrigatório"),
});

/**
 * Schema para desativar usuário
 */
export const deactivateUserSchema = z.object({
	userId: z.string().min(1, "userId é obrigatório"),
	reason: z.string().optional(),
});

/**
 * Schema para reativar usuário
 */
export const reactivateUserSchema = z.object({
	userId: z.string().min(1, "userId é obrigatório"),
});

/**
 * Tipos inferidos dos schemas
 */
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type GetUserInput = z.infer<typeof getUserSchema>;
export type DeactivateUserInput = z.infer<typeof deactivateUserSchema>;
export type ReactivateUserInput = z.infer<typeof reactivateUserSchema>;
