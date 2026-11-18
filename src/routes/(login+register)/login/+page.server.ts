import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { AuthenticationError, login } from '#lib/server/auth/authentication.ts';
import { redirectTarget } from '#lib/server/auth/redirect.ts';

export const actions: Actions = {
	default: async ({ request, url, cookies }) => {
		const data = await request.formData();
		const username = data.get('username')?.toString().trim() ?? '';
		const password = data.get('password')?.toString() ?? '';

		if (!username || !password) {
			return fail(400, { username, error: 'Bitte Benutzername und Passwort eingeben.' });
		}

		let sessionToken: string;
		try {
			sessionToken = await login(username, password);
		} catch (e: unknown) {
			if (e instanceof AuthenticationError) {
				return fail(401, { username, error: 'Benutzername oder Passwort ist falsch.' });
			}
			throw e;
		}
		cookies.set('session_token', sessionToken, {
			sameSite: 'lax',
			path: '/'
		});

		redirect(303, redirectTarget(url.searchParams.get('redirectTo')));
	}
};
