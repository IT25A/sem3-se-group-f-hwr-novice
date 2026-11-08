import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { register, InvalidCredentialsFormatError, UsernameTakenError } from '#lib/server/auth/authentication.ts';

export const actions: Actions = {
    default: async ({ request, cookies }) => {
        const data = await request.formData();
        const username = data.get('username');
        const password = data.get('password');
        const repetition = data.get('repetition');

        if (!username) {
            return fail(400, { username, missing_username: true });
        }

        if (!password) {
            return fail(400, { username, missing_password: true });
        }

        if (!repetition) {
            return fail(400, { username, missing_repetition: true });
        }

        if (password !== repetition) {
            return fail(400, { username, password_mismatch: true });
        }

        try {
            const sessionToken = await register(username.toString(), password.toString());

            cookies.set('session_token', sessionToken, {
                sameSite: 'lax',
                path: '/'
            });

            throw redirect(303, '/dashboard');
        } catch (e: unknown) {
            if (e instanceof UsernameTakenError) {
                return fail(409, { username, username_taken: true});
            }
            if (e instanceof InvalidCredentialsFormatError) {
                return fail(400, { username, invalid_credentials: true });
            }
            throw e;
        }
    }
};
