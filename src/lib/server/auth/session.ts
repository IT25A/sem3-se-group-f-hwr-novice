export class Session {
	constructor(
		public readonly userId: string,
		public readonly session_token: string
	) {}
}

const sessions: Session[] = [];

export function getSessions(userId: string): Session[] {
	return sessions.filter((it) => it.userId === userId);
}

export function checkToken(token: string): string | undefined {
	return sessions.find(it => it.session_token === token)?.userId
}

export function createSession(userId: string): Session {
	const token = crypto.randomUUID();
	const session = new Session(userId, token);
	sessions.push(session);
	return session;
}

export function deleteSession(userId: string, token: string) {
	const session = sessions.find((it) => it.userId === userId && it.session_token === token);
	if (!session) return;
	sessions.splice(sessions.indexOf(session));
}
