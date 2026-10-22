import 'reflect-metadata';
import { TypeOrmDatabase } from '#lib/server/database/typeorm.ts';
import type { ServerInit } from '@sveltejs/kit/hooks';

export const init: ServerInit = async () => {
	await TypeOrmDatabase.getDb({
		type: 'better-sqlite3',
		database: 'data/database.sqlite',
		logging: true
	});
};
