import { db } from '#lib/server/db/index.ts';
import { type User, userTable } from '#lib/server/db/schema.ts';
import { eq } from 'drizzle-orm';
import * as argon2 from 'argon2';
import { createSession, Session } from '#lib/server/auth/session.ts';

export class AuthenticationError extends Error {
	message = 'Password or username is incorrect';
}

export async function login(username: string, password: string): Promise<Session> {
	const user: User | undefined = db.select().from(userTable).where(eq(userTable.name, username)).limit(1).get();

	if(!user) {
		throw new AuthenticationError();
	}

	if (!(await argon2.verify(user.password_hash, password))) {
		throw new AuthenticationError();
	}

	return createSession(user.id);
}
