import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/**/*.test.ts"],
		testTimeout: 60_000, // 60s for Testcontainers startup
		hookTimeout: 120_000,
		pool: "forks", // Better isolation for DB tests
		poolOptions: {
			forks: {
				singleFork: true, // Run all tests in a single fork to share container
			},
		},
		sequence: {
			concurrent: false, // Run tests sequentially
		},
	},
});
