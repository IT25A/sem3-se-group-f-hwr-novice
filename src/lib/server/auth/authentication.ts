import { db } from '#lib/server/db/index.ts';
import { type User, userTable } from '#lib/server/db/schema.ts';
import { eq } from 'drizzle-orm';
import * as argon2 from 'argon2';
import { createSession } from '#lib/server/auth/session.ts';

export class AuthenticationError extends Error {
	message = 'Password or username is incorrect';
}

export class UsernameTakenError extends Error {
	message = 'Username is already taken';
}

export class InvalidCredentialsFormatError extends Error {}

export async function login(username: string, password: string): Promise<string> {
	const user: User | undefined = db
		.select()
		.from(userTable)
		.where(eq(userTable.name, username))
		.limit(1)
		.get();

	if (!user) {
		throw new AuthenticationError();
	}

	if (!(await argon2.verify(user.password_hash, password))) {
		throw new AuthenticationError();
	}

	return createSession(user.id);
}

export async function register(username: string, password: string): Promise<string> {
	username = username.trim();

	if (username.length < 3 || username.length > 32) {
		throw new InvalidCredentialsFormatError('Username must be 3 to 32 characters long');
	}

	if (password.length < 8) {
		throw new InvalidCredentialsFormatError('Password must be at least 8 characters long');
	}

	const password_hash = await argon2.hash(password);

	try {
		const user: User = db
			.insert(userTable)
			.values({ name: username, password_hash })
			.returning()
			.get();

		return createSession(user.id);
	} catch (e) {
		if (isUniqueConstraintError(e)) {
			throw new UsernameTakenError();
		}
		throw e;
	}
}

function isUniqueConstraintError(e: unknown): boolean {
	return (
		e instanceof Error &&
		'code' in e &&
		(e.code === 'SQLITE_CONSTRAINT_UNIQUE' || e.code === 'SQLITE_CONSTRAINT_PRIMARYKEY')
	);
}
