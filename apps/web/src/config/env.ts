// biome-ignore lint/performance/noNamespaceImport: <explanation>
import * as envalid from "envalid";

export const env = envalid.cleanEnv(
	// biome-ignore lint/suspicious/noExplicitAny: Vite injects env at build time
	(import.meta as any).env,
	{
		VITE_SERVER_URL: envalid.url({
			desc: "Backend server URL",
		}),
	}
);
