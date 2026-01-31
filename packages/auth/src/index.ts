import "dotenv/config";
import prisma from "@crm-kdu/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";

const isProduction = process.env.NODE_ENV === "production";

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),

	trustedOrigins: process.env.CORS_ORIGIN
		? [process.env.CORS_ORIGIN]
		: ["http://localhost:4200"],
	emailAndPassword: {
		enabled: true,
	},
	advanced: {
		defaultCookieAttributes: {
			// In production with proxy, we can use strict same-site
			// In dev without proxy, use none for cross-origin
			sameSite: isProduction ? "strict" : "none",
			secure: true,
			httpOnly: true,
		},
	},
	plugins: [admin()],
});
