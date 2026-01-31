import "dotenv/config";
// biome-ignore lint/performance/noNamespaceImport: <explanation>
import * as envalid from "envalid";

export const env = envalid.cleanEnv(process.env, {
	DATABASE_URL: envalid.str({
		desc: "PostgreSQL connection string",
	}),
	BETTER_AUTH_SECRET: envalid.str({
		desc: "Better Auth secret key (min 32 chars)",
	}),
	BETTER_AUTH_URL: envalid.url({
		desc: "Better Auth base URL",
	}),
	CORS_ORIGIN: envalid.url({
		desc: "CORS allowed origin",
	}),
	NODE_ENV: envalid.str({
		choices: ["development", "production", "test"],
		default: "development",
	}),
});
