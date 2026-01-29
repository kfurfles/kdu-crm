import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.test.ts"],
		testTimeout: 60_000, // 60s for Testcontainers startup
		hookTimeout: 60_000,
		pool: "forks", // Better isolation for DB tests
		isolate: false, // Share container across tests
		sequence: {
			concurrent: false, // Run tests sequentially
		},
	},
});
