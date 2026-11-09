import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { type Module, moduleTable } from '#lib/server/db/schema.ts';

export const load: PageServerLoad = async ({ locals }) => {
	const modules: Module[] = db.select().from(moduleTable).where(eq(moduleTable.user_id, locals.user.id)).all();
	return { modules };
};

export const actions = {
	'add-module': async ({ request, locals }) => {
        const userId = locals.user.id;

		const data = await request.formData();
		const name = String(data.get('name'))?.trim();

		if (!name || !userId) {
            return fail(400, { error: 'Invalid name or user ID', name, userId });
		}

		const newModule = await db.insert(moduleTable).values({
            user_id: userId,
            name
        }).returning().get();

        if (!newModule) {
            return fail(409, { error: 'Failed to create module' });
        }

		return { success: true };
	},
	'delete-module': async ({ request, locals }) => {
        const userId = locals.user.id;

		const data = await request.formData();
		const id = String(data.get('id'));

		if (!id || !userId) {
			return fail(400, { error: 'Invalid module ID or user ID' });
		}

		const deletedModule = await db.delete(moduleTable).where(eq(moduleTable.id, id)).returning().get();
		if (!deletedModule) {
			return fail(404, { error: 'Module not found' });
		}

		return { success: true };
	}
} satisfies Actions;