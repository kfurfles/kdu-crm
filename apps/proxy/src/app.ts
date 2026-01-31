import crypto from "node:crypto";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fastifyHttpProxy from "@fastify/http-proxy";
import fastifyStatic from "@fastify/static";
import fastify from "fastify";
import { env } from "./config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = env.NODE_ENV === "development";
/**
 * In dev mode, proxy @ URLs directly to Vite bypassing Fastify entirely
 * This is critical for Vite's module resolution and HMR
 */
const devServerFactory = () => {
	if (!isDev) {
		return undefined;
	}
	return (handler) => {
		return http.createServer((req, res) => {
			if (req.url?.includes("@")) {
				const viteUrl = new URL(req.url, env.VITE_URL);
				const proxyReq = http.request(
					viteUrl,
					{ method: req.method, headers: req.headers },
					(proxyRes) => {
						res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
						proxyRes.pipe(res);
					}
				);
				proxyReq.on("error", () => res.writeHead(502).end());
				req.pipe(proxyReq);
				return;
			}
			handler(req, res);
		});
	};
};
export const buildApp = async () => {
	const app = fastify({
		bodyLimit: 128 * 1024 * 1024,
		genReqId: (req) =>
			req.headers["x-datadog-trace-id"] ||
			req.headers["x-request-id"] ||
			crypto.randomUUID(),
		disableRequestLogging: true,
		logger: {
			level: isDev ? "info" : "warn",
			transport: isDev
				? {
						target: "pino-pretty",
						options: {
							colorize: true,
							ignore: "pid,hostname",
							translateTime: "HH:MM:ss",
						},
					}
				: undefined,
		},
		serverFactory: devServerFactory(),
	});
	// Proxy /api to backend
	await app.register(fastifyHttpProxy, {
		upstream: env.BACKEND_URL,
		prefix: "/api",
		rewritePrefix: "/api",
	});
	// Proxy /rpc to backend
	await app.register(fastifyHttpProxy, {
		upstream: env.BACKEND_URL,
		prefix: "/rpc",
		rewritePrefix: "/rpc",
	});
	if (isDev) {
		// Development: Proxy everything else to Vite dev server
		app.log.info(`DEV MODE: Proxying to Vite at ${env.VITE_URL}`);
		await app.register(fastifyHttpProxy, {
			upstream: env.VITE_URL,
			prefix: "/",
			websocket: true, // Critical for HMR!
		});
	} else {
		// Production: Serve static files
		app.log.info("PROD MODE: Serving static files from ./static");
		await app.register(fastifyStatic, {
			root: path.join(__dirname, "static"),
			prefix: "/",
		});
		// SPA fallback for client-side routing
		app.setNotFoundHandler((request, reply) => {
			if (request.url.startsWith("/api")) {
				reply.code(404).send({ error: "Not found" });
			} else {
				reply.sendFile("index.html");
			}
		});
	}
	await app.ready();
	return app;
};
