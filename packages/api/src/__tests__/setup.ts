import { execSync } from "node:child_process";
import path from "node:path";
import { PrismaClient } from "@crm-kdu/db/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
	PostgreSqlContainer,
	type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { Pool } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

const TEMPLATE_DB = "template_crm";
const TEST_DB = "test_crm";

const DB_PACKAGE_PATH = path.resolve(
	import.meta.dirname,
	"../../../../packages/db"
);

// Shared container instance
let container: StartedPostgreSqlContainer;
let adminPool: Pool;
let templateReady = false;

// Per-test Prisma client
export let prisma: PrismaClient;
let testPool: Pool;

/**
 * Get or create a shared PostgreSQL container with template database.
 */
async function getOrCreateContainer(): Promise<StartedPostgreSqlContainer> {
	if (container) {
		return container;
	}

	// Start PostgreSQL container with default postgres database
	container = await new PostgreSqlContainer("postgres:16-alpine")
		.withDatabase("postgres")
		.withUsername("postgres")
		.withPassword("postgres")
		.start();

	return container;
}

/**
 * Ensure the template database exists and has the schema applied.
 */
async function ensureTemplateDatabase(): Promise<void> {
	if (templateReady) {
		return;
	}

	const host = container.getHost();
	const port = container.getMappedPort(5432);

	adminPool = new Pool({
		host,
		port,
		database: "postgres",
		user: "postgres",
		password: "postgres",
	});

	// Check if template already exists
	const result = await adminPool.query(
		"SELECT 1 FROM pg_database WHERE datname = $1",
		[TEMPLATE_DB]
	);

	if (result.rows.length === 0) {
		// Create template database
		await adminPool.query(`CREATE DATABASE "${TEMPLATE_DB}"`);

		// Apply schema to template using db:push
		const templateConnectionString = `postgresql://postgres:postgres@${host}:${port}/${TEMPLATE_DB}`;

		execSync("pnpm prisma db push --accept-data-loss", {
			cwd: DB_PACKAGE_PATH,
			env: {
				...process.env,
				DATABASE_URL: templateConnectionString,
			},
			stdio: "pipe",
		});

		// Mark template as ready for cloning
		await adminPool.query(
			"UPDATE pg_database SET datistemplate = true WHERE datname = $1",
			[TEMPLATE_DB]
		);
	}

	templateReady = true;
}

/**
 * Create a fresh test database from template.
 */
async function createTestDatabase(): Promise<void> {
	// Drop existing test database if exists
	await adminPool.query(`DROP DATABASE IF EXISTS "${TEST_DB}"`);

	// Create new database from template (instant copy)
	await adminPool.query(
		`CREATE DATABASE "${TEST_DB}" TEMPLATE "${TEMPLATE_DB}"`
	);
}

/**
 * Create Prisma client connected to test database.
 */
function createPrismaClient(): PrismaClient {
	const host = container.getHost();
	const port = container.getMappedPort(5432);

	testPool = new Pool({
		host,
		port,
		database: TEST_DB,
		user: "postgres",
		password: "postgres",
	});

	const adapter = new PrismaPg(testPool);

	return new PrismaClient({ adapter });
}

// Global setup - runs once before all tests
beforeAll(async () => {
	await getOrCreateContainer();
	await ensureTemplateDatabase();
}, 120_000);

// Per-test setup - create fresh database from template
beforeEach(async () => {
	await createTestDatabase();
	prisma = createPrismaClient();
});

// Per-test cleanup
afterEach(async () => {
	if (prisma) {
		await prisma.$disconnect();
	}
	if (testPool) {
		await testPool.end();
	}
});

// Global cleanup
afterAll(async () => {
	if (adminPool) {
		await adminPool.end();
	}
	if (container) {
		await container.stop();
	}
});
