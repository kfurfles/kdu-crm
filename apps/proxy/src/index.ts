import { buildApp } from "./app";
import { env } from "./config/env";

const start = async () => {
	try {
		const app = await buildApp();

		await app.listen({
			host: env.HTTP_HOST,
			port: env.HTTP_PORT,
		});

		app.log.info(
			`Proxy server running at http://${env.HTTP_HOST}:${env.HTTP_PORT}`
		);
		app.log.info(`Backend: ${env.BACKEND_URL}`);
		if (env.VITE_URL) {
			app.log.info(`Frontend: ${env.VITE_URL}`);
		}
	} catch (err) {
		console.error("Failed to start proxy server:", err);
		process.exit(1);
	}
};

start();
