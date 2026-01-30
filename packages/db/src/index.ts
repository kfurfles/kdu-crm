// biome-ignore-all lint/performance/noBarrelFile: barrel file is intentional for package exports
import { env } from "@crm-kdu/env/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { type Prisma, PrismaClient } from "../prisma/generated/client";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export default prisma;

// Re-exportar tipos para uso em outros pacotes
export type { PrismaClient } from "../prisma/generated/client";

// Re-exportar enums do Prisma
export { FieldType } from "../prisma/generated/client";

// Tipos de modelos inferidos do Prisma
export type User = Prisma.UserGetPayload<object>;
export type Client = Prisma.ClientGetPayload<object>;
export type Tag = Prisma.TagGetPayload<object>;
export type ClientTag = Prisma.ClientTagGetPayload<object>;
export type ClientField = Prisma.ClientFieldGetPayload<object>;
