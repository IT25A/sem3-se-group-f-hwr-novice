import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export type User = {
	id: string;
	name: string;
	password_hash: string;
};

export const userTable = sqliteTable('user', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').unique().notNull(),
	password_hash: text('password_hash').notNull()
});

export type Session = {
	id: string;
	userId: string;
	token_hash: string;
};

export const sessionTable = sqliteTable('session', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text()
		.references(() => userTable.id, { onDelete: 'cascade' })
		.notNull(),
	token_hash: text().notNull()
});

export type Module = {
	id: string;
	code: string;
	name: string;
	lp: number;
	exam_le: number;
	self_study_le: number;
};

export const moduleTable = sqliteTable('module', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	code: text('code').notNull().unique(),
	name: text('name').notNull(),
	lp: integer('lp').notNull(),
	exam_le: integer('exam_le').notNull().default(0),
	self_study_le: integer('self_study_le').notNull().default(0)
});

export type StoredLesson = {
	id: string;
	key: string;
	module_id: string | null;
	kind: string;
	title: string;
	location: string;
	description: string;
	starts_at: Date;
	ends_at: Date;
};

export const lessonTable = sqliteTable('lesson', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	key: text('key').notNull().unique(),
	module_id: text('module_id').references(() => moduleTable.id, { onDelete: 'set null' }),
	kind: text('kind').notNull(),
	title: text('title').notNull(),
	location: text('location').notNull().default(''),
	description: text('description').notNull().default(''),
	starts_at: integer('starts_at', { mode: 'timestamp' }).notNull(),
	ends_at: integer('ends_at', { mode: 'timestamp' }).notNull()
});

export type Pomodoro = {
	id: string;
	user_id: string;
	module_id: string | null;
	type: 'work' | 'break';
	planned_duration: number;
	started_at: Date;
	ended_at: Date | null;
	status: 'running' | 'completed' | 'cancelled';
};

export const pomodoroTable = sqliteTable('pomodoro', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	user_id: text('user_id')
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade' }),
	module_id: text('module_id').references(() => moduleTable.id, { onDelete: 'set null' }),
	type: text('type', { enum: ['work', 'break'] }).notNull(),
	planned_duration: integer('planned_duration').notNull(),
	started_at: integer('started_at', { mode: 'timestamp' }).notNull(),
	ended_at: integer('ended_at', { mode: 'timestamp' }),
	status: text('status', { enum: ['running', 'completed', 'cancelled'] })
		.notNull()
		.default('running')
});

export type AstaEvent = {
	id: string;
	user_id: string;
	title: string;
	date: string;
	time: string;
	location: string;
};

export const astaEventTable = sqliteTable('asta_event', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	user_id: text('user_id')
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	date: text('date').notNull(),
	time: text('time').notNull(),
	location: text('location').notNull()
});
