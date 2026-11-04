import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { deleteSession } from '#lib/server/auth/session.ts';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	deleteSession(locals.sessionToken.split(':')[0]);
	cookies.delete("session_token")
	redirect(303, '/');
};
