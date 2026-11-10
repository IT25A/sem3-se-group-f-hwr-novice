import type { PageServerLoad } from './$types';
import { asc } from 'drizzle-orm';
import { db } from '#lib/server/db/index.ts';
import { moduleTable } from '#lib/server/db/schema.ts';
import { seed } from '#lib/server/db/seed.ts';

export const load: PageServerLoad = () => {
	seed();
	const modules = db.select().from(moduleTable).orderBy(asc(moduleTable.code)).all();
	return { modules };
};
