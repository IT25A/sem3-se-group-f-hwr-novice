import { db } from './db/index.ts';
import { moduleTable } from './db/schema.ts';
import { MODULE_CATALOG } from './catalog.ts';

let done = false;

export function seed() {
	if (done) return;

	for (const module of MODULE_CATALOG) {
		db.insert(moduleTable)
			.values(module)
			.onConflictDoUpdate({ target: moduleTable.code, set: module })
			.run();
	}
	done = true;
}
