import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ cookies }) => {
	if(cookies.get("session_token")) redirect(304, "/dashboard")
	return {}
};
