/** biome-ignore-all lint/performance/noNamespaceImport: <explanation> */
import "dotenv/config";
import * as envalid from "envalid";
export const env = envalid.cleanEnv(process.env, {
	HTTP_HOST: envalid.str({
		desc: "HTTP server host",
		default: "0.0.0.0",
	}),
	HTTP_PORT: envalid.port({
		desc: "HTTP server port",
		devDefault: 4200,
		default: 8080,
	}),
	BACKEND_URL: envalid.url({
		desc: "Backend API URL",
		devDefault: "http://localhost:3000",
	}),
	VITE_URL: envalid.url({
		desc: "Vite dev server URL",
		devDefault: "http://localhost:3001",
		default: undefined,
	}),
	NODE_ENV: envalid.str({
		choices: ["development", "production", "test"],
		default: "development",
	}),
});
