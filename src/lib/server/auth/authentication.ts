import { db } from '#lib/server/db';
import { User, userTable } from '#lib/server/db/schema.ts';
import { eq } from 'drizzle-orm';
import * as argon2 from 'argon2';
import { createSession, Session } from '#lib/server/auth/session';

export class WrongPasswordError extends Error {
	message = 'User provided wrong password';
}

export function login(username: string, password: string): Session {
	const user: User = db.select().from(userTable).where(eq(userTable.name, username)).limit(1);
	if (!argon2.verify(user.password_hash, password)) {
		throw new WrongPasswordError();
	}

	return createSession(user.id);
}
