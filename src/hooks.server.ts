import type { Handle } from '@sveltejs/kit/hooks';
import { type Cookies, redirect, type RequestEvent } from '@sveltejs/kit';
import { checkToken } from '#lib/server/auth/session.ts';
import { db } from '#lib/server/db';
import { userTable } from '#lib/server/db/schema.ts';
import { eq } from 'drizzle-orm';

const loginUrl = (redirectTo?: string) => `/login?redirectTo=${redirectTo}`;

function handleAuth(cookies: Cookies, event: RequestEvent) {
	const sessionToken = cookies.get('session_token');

	if (!sessionToken) return redirect(301, loginUrl(event.url.pathname));

	const userId = checkToken(sessionToken);

	if (!userId) {
		cookies.delete('session_token');
		return redirect(301, loginUrl(event.url.pathname));
	}

	event.locals.userId = userId;
}

export const handle: Handle = async ({ event, resolve }) => {
	const cookies = event.cookies;
	const route = event.route;

	if (route.id?.startsWith('/(auth)')) {
		handleAuth(cookies, event);
	}

	event.locals.user = db
		.select()
		.from(userTable)
		.where(eq(userTable.id, event.locals.userId))
		.get();

	if(event.locals.user){
		event.locals.user.password_hash = '';
	}

	return await resolve(event);
};
