import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { appointmentRouter } from "./appointment";
import { clientRouter } from "./client";
import { clientFieldRouter } from "./client-field";
import { tagRouter } from "./tag";
import { userRouter } from "./user";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: "This is private",
			user: context.session?.user,
		};
	}),
	appointment: appointmentRouter,
	client: clientRouter,
	clientField: clientFieldRouter,
	tag: tagRouter,
	user: userRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
