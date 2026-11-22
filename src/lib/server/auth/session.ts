import { createHash, timingSafeEqual } from 'node:crypto';
import { sessionTable } from '#lib/server/db/schema.ts';
import { db } from '#lib/server/db/index.ts';
import { eq } from 'drizzle-orm';

// The token is a random UUID, so a fast hash is enough (unlike for passwords)
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

const getSession = (sessionId: string) =>
	db.select().from(sessionTable).where(eq(sessionTable.id, sessionId)).get();

export async function checkToken(token: string): Promise<string | undefined> {
	const [id, secret] = token.split(':');
	if (!id || !secret) return undefined;

	const session = getSession(id);
	if (!session) return undefined;

	const expected = Buffer.from(session.token_hash);
	const actual = Buffer.from(hashToken(secret));
	const matches = expected.length === actual.length && timingSafeEqual(expected, actual);

	return matches ? session.userId : undefined;
}

export async function createSession(userId: string): Promise<string> {
	const token = crypto.randomUUID();
	const session = {
		userId,
		token_hash: hashToken(token)
	};

	const { id } = db.insert(sessionTable).values(session).returning().get();

	return `${id}:${token}`;
}

export function deleteSession(sessionId: string) {
	db.delete(sessionTable).where(eq(sessionTable.id, sessionId)).run();
}
