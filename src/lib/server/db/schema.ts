import { sqliteTable, text, integer, primaryKey, uniqueIndex } from 'drizzle-orm/sqlite-core';

export type Course = {
	id: string;
	study: string;
	course_part: string;
	cohort: number;
	synced_at: Date | null;
};

export const courseTable = sqliteTable(
	'course',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		study: text('study').notNull(),
		course_part: text('course_part').notNull(),
		cohort: integer('cohort').notNull(),
		synced_at: integer('synced_at', { mode: 'timestamp' })
	},
	(table) => [uniqueIndex('course_unique').on(table.study, table.course_part, table.cohort)]
);

export type User = {
	id: string;
	name: string;
	password_hash: string;
	course_id: string | null;
	asta_member: boolean;
};

export const userTable = sqliteTable('user', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').unique().notNull(),
	password_hash: text('password_hash').notNull(),
	course_id: text('course_id').references(() => courseTable.id, { onDelete: 'set null' }),
	asta_member: integer('asta_member', { mode: 'boolean' }).default(false)
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
	presence_le: number;
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
	presence_le: integer('presence_le').notNull().default(0),
	exam_le: integer('exam_le').notNull().default(0),
	self_study_le: integer('self_study_le').notNull().default(0)
});

export type StoredLesson = {
	id: string;
	key: string;
	course_id: string;
	module_id: string | null;
	kind: string;
	title: string;
	location: string;
	description: string;
	starts_at: Date;
	ends_at: Date;
};

export const lessonTable = sqliteTable(
	'lesson',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		key: text('key').notNull(),
		course_id: text('course_id')
			.notNull()
			.references(() => courseTable.id, { onDelete: 'cascade' }),
		module_id: text('module_id').references(() => moduleTable.id, { onDelete: 'set null' }),
		kind: text('kind').notNull(),
		title: text('title').notNull(),
		location: text('location').notNull().default(''),
		description: text('description').notNull().default(''),
		starts_at: integer('starts_at', { mode: 'timestamp' }).notNull(),
		ends_at: integer('ends_at', { mode: 'timestamp' }).notNull()
	},
	(table) => [uniqueIndex('lesson_course_key').on(table.course_id, table.key)]
);

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

enum EventType {
	PRIVATE = 'private',
	PUBLIC = 'public',
	GLOBAL = 'global'
}

export type Event = {
	id: string;
	user_id: string;
	type: EventType;
	title: string;
	start: Date;
	end: Date | null;
	location: string;
	description: string | null;
};

export const eventTable = sqliteTable('events', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	user_id: text('user_id')
		.notNull()
		.references(() => userTable.id, { onDelete: 'cascade' }),
	type: text('type', { enum: ['private', 'public', 'global'] }),
	title: text('title').notNull(),
	start: integer('start', { mode: 'timestamp' }).notNull(),
	end: integer('end', { mode: 'timestamp' }),
	time: text('time').notNull(),
	location: text('location').notNull(),
	description: text('description')
});

export type ModulePass = {
	user_id: string;
	module_id: string;
	passed_at: Date;
};

export const modulePassTable = sqliteTable(
	'module_pass',
	{
		user_id: text('user_id')
			.notNull()
			.references(() => userTable.id, { onDelete: 'cascade' }),
		module_id: text('module_id')
			.notNull()
			.references(() => moduleTable.id, { onDelete: 'cascade' }),
		passed_at: integer('passed_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(table) => [primaryKey({ columns: [table.user_id, table.module_id] })]
);
