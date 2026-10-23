import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { login, WrongPasswordError } from '#lib/server/auth/authentication.ts';

export const load: PageServerLoad = async (event) => {
	return {};
};

export const actions: Actions = {
	default: async ({request, cookies}) => {
		const data = await request.formData()
		const username = data.get("username")
		const password = data.get("password")

		if(!username) {
			return fail(400, { username, missing_email: true })
		}

		if(!password) {
			return fail(400, { username, missing_password: true })
		}

		try {
			const session = login(username.toString(), password.toString())
			cookies.set('session_token', session.session_token, {
				sameSite: 'lax',
				path: "/"
			})
			return redirect(302, "/dashboard")
		} catch (e: unknown) {
			if (e instanceof WrongPasswordError) {
				return fail(401, { username, incorrect: true })
			}
		}
	}
}
