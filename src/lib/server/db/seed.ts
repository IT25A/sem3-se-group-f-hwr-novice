import { db } from '../db/index.ts';
import { moduleTable, lessonTable } from '../db/schema.ts';
import { BASELINE } from '../lessons/baseline.ts';
import { MODULE_CATALOG } from '../modules/catalog.ts';
import { lessonKey, describeLesson } from '../lessons/parser.ts';

let done = false;

export function seed() {
	if (done) return;

	for (const module of MODULE_CATALOG) {
		db.insert(moduleTable)
			.values(module)
			.onConflictDoUpdate({ target: moduleTable.code, set: module })
			.run();
	}

	if (!db.select().from(lessonTable).limit(1).get()) {
		const moduleIds = new Map(
			db
				.select()
				.from(moduleTable)
				.all()
				.map((module) => [module.code, module.id])
		);

		const rows = BASELINE.map((line) => {
			const [code, kind, title, location, start, end, lecturer, pause, note] = line.split('|');
			const startsAt = new Date(start);
			return {
				key: lessonKey(code, title, startsAt),
				module_id: moduleIds.get(code) ?? null,
				kind,
				title,
				location,
				description: describeLesson({ lecturer, note, pause: Number(pause) }),
				starts_at: startsAt,
				ends_at: new Date(end)
			};
		});
		db.insert(lessonTable).values(rows).run();
	}

	done = true;
}
