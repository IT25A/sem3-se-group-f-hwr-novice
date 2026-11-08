import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}

const migrationsFolder = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'drizzle');

const client = new Database(databaseUrl);
client.pragma('journal_mode = WAL');

try {
	migrate(drizzle(client), { migrationsFolder });
	console.log('database is up to date');
} finally {
	client.close();
}
