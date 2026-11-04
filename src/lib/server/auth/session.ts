import { sessionTable } from '#lib/server/db/schema.ts';
import { db } from '#lib/server/db/index.ts';
import { eq } from 'drizzle-orm';
import * as argon2 from 'argon2';

const getSession = (sessionId: string) =>
	db.select().from(sessionTable).where(eq(sessionTable.id, sessionId)).get();

export async function checkToken(token: string): Promise<string | undefined> {
	const [id, secret] = token.split(':');
	const session = getSession(id);
	if (!session) return undefined;
	return (await argon2.verify(session.token_hash, secret)) ? session.userId : undefined;
}

export async function createSession(userId: string): Promise<string> {
	const token = crypto.randomUUID();
	const session = {
		userId,
		token_hash: await argon2.hash(token)
	};

	const { id } = db.insert(sessionTable).values(session).returning().get();

	return `${id}:${token}`;
}

export function deleteSession(sessionId: string) {
	db.delete(sessionTable).where(eq(sessionTable.id, sessionId))
}
