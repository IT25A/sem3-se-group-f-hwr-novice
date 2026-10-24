import { db } from '#lib/server/db';
import { type User, userTable } from '#lib/server/db/schema.ts';
import { eq } from 'drizzle-orm';
import * as argon2 from 'argon2';
import { createSession, Session } from '#lib/server/auth/session';

export class AuthenticationError extends Error {
	message = 'Password or username is incorrect';
}

export function login(username: string, password: string): Session {
	const user: User = db.select().from(userTable).where(eq(userTable.name, username)).limit(1).get();

	if(!user) {
		throw new AuthenticationError();
	}

	if (!argon2.verify(user.password_hash, password)) {
		throw new AuthenticationError();
	}

	return createSession(user.id);
}
