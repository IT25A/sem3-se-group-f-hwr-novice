import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { checkToken } from '#lib/server/auth/session.ts';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const token = cookies.get('session_token');
	const userId = token ? await checkToken(token).catch(() => undefined) : undefined;

	if (userId) redirect(303, '/dashboard');
	return {};
};
