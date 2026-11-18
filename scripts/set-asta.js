import Database from 'better-sqlite3';

const [, , username, mode = 'on'] = process.argv;

if (!username || !['on', 'off'].includes(mode)) {
	console.error('Usage: npm run db:set-asta <username> [on|off]    (default: on)');
	process.exit(1);
}

const makeMember = mode === 'on';
const dbPath = process.env.DATABASE_URL || './data/database.sqlite';

let db;

try {
	db = new Database(dbPath, { fileMustExist: true });

	const user = db.prepare('SELECT id, asta_member FROM user WHERE name = ?').get(username);

	if (!user) {
		console.error(`User '${username}' not found.`);
		process.exitCode = 1;
	} else if (Boolean(user.asta_member) === makeMember) {
		console.log(`User '${username}' is ${makeMember ? 'already' : 'not'} an AStA member.`);
	} else {
		db.prepare('UPDATE user SET asta_member = ? WHERE id = ?').run(makeMember ? 1 : 0, user.id);
		console.log(`User '${username}' is ${makeMember ? 'now' : 'no longer'} an AStA member.`);
	}
} catch (error) {
	console.error(`Error changing the AStA status of '${username}': ${error.message}`);
	process.exitCode(1);
} finally {
	db.close();
}
