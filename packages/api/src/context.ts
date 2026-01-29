import type { IncomingHttpHeaders } from "node:http";

import { auth } from "@crm-kdu/auth";
import prisma, { type PrismaClient } from "@crm-kdu/db";
import { fromNodeHeaders } from "better-auth/node";

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

export interface Context {
	session: Session;
	prisma: PrismaClient;
}

export async function createContext(
	req: IncomingHttpHeaders
): Promise<Context> {
	const session = await auth.api.getSession({
		headers: fromNodeHeaders(req),
	});
	return {
		session,
		prisma,
	};
}
