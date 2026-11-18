import Database from 'better-sqlite3';

const [, , username] = process.argv;

if (!username) {
	console.error('Usage: npm run db:make-asta <username>');
	process.exit(1);
}

const dbPath = process.env.DATABASE_URL || './data/database.sqlite';

const db = new Database(dbPath);

try {
	db.prepare('UPDATE user SET asta_member = true WHERE name = ?').run(username);
	console.log(`User '${username}' made successfully AStA member.`);
} catch (error) {
	console.error(`Error making user '${username}' AStA member: ${error.message}`);
	process.exit(1);
} finally {
	db.close();
}
