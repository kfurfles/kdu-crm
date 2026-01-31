import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		tailwindcss(),
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
			routesDirectory: "./src/app/routes",
			generatedRouteTree: "./src/routeTree.gen.ts",
		}),
		react(),
		VitePWA({
			registerType: "autoUpdate",
			manifest: {
				name: "crm-kdu",
				short_name: "crm-kdu",
				description: "crm-kdu - PWA Application",
				theme_color: "#0c0c0c",
			},
			pwaAssets: { disabled: false, config: true },
			devOptions: { enabled: true },
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	server: {
		port: 3001,
		host: "localhost",
		// Proxy para o backend quando rodando sem o frontend-proxy
		proxy: {
			"/api": {
				target: "http://127.0.0.1:3000",
				secure: false,
			},
			"/rpc": {
				target: "http://127.0.0.1:3000",
				secure: false,
			},
		},
	},
});
