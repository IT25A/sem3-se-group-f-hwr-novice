import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { AuthenticationError, login } from '#lib/server/auth/authentication.ts';

export const actions: Actions = {
	default: async ({ request,url, cookies }) => {
		const data = await request.formData();
		const username = data.get('username');
		const password = data.get('password');

		if (!username) {
			return fail(400, { username, missing_email: true });
		}

		if (!password) {
			return fail(400, { username, missing_password: true });
		}

		try {
			const session = await login(username.toString(), password.toString());
			cookies.set('session_token', session.session_token, {
				sameSite: 'lax',
				path: '/'
			});

			const redirectTo = url.searchParams.get("redirectTo") ?? "/dashboard"

			redirect(303, redirectTo);
		} catch (e: unknown) {
			if (e instanceof AuthenticationError) {
				return fail(401, { username, incorrect: true });
			} else {
				throw e;
			}
		}
	}
};
