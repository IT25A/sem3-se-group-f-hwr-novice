import Database from 'better-sqlite3';
import * as argon2 from 'argon2';

const [, , username, password] = process.argv;

if (!username || !password) {
    console.error('Usage: npm run db:create-user <username> <password>');
    process.exit(1);
}

const dbPath = process.env.DATABASE_URL || './data/database.sqlite';

const db = new Database(dbPath);
const hash = await argon2.hash(password);

try {
    db.prepare('INSERT INTO user (id, name, password_hash) VALUES (?, ?, ?)').run(username, username, hash);
    console.log(`User '${username}' created successfully.`);
} catch (error) {
    console.error(`Error creating user '${username}': ${error.message}`);
    process.exit(1);
} finally {
    db.close();
}