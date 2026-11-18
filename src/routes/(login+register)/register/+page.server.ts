import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import {
	register,
	InvalidCredentialsFormatError,
	UsernameTakenError
} from '#lib/server/auth/authentication.ts';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = data.get('username')?.toString().trim() ?? '';
		const password = data.get('password')?.toString() ?? '';
		const repetition = data.get('repetition')?.toString() ?? '';

		if (username.length < 3 || username.length > 32) {
			return fail(400, { username, error: 'Der Benutzername braucht 3 bis 3 Zeichen.' });
		}

		if (password.length < 8) {
			return fail(400, { username, error: 'Das Passwort braucht mindestens 8 Zeichen.' });
		}

		if (password !== repetition) {
			return fail(400, { username, error: 'Die Passwörter stimmen nicht überein.' });
		}

		let sessionToken: string;
		try {
			sessionToken = await register(username, password);
		} catch (e: unknown) {
			if (e instanceof UsernameTakenError) {
				return fail(409, { username, error: 'DIeser Benutzername ist schon vergeben.' });
			}
			if (e instanceof InvalidCredentialsFormatError) {
				return fail(400, { username, error: 'Benutzername oder Passwort ist ungültig.' });
			}
			throw e;
		}

		cookies.set('session_token', sessionToken, {
			sameSite: 'lax',
			path: '/'
		});

		redirect(303, '/dashboard');
	}
};
