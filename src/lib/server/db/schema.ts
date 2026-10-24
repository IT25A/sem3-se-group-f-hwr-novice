import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export type User = {
	id: string,
	name: string,
	password_hash: string
}

export const userTable = sqliteTable("user", {
	id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
	name: text("name").unique().notNull(),
	password_hash: text("password_hash").notNull()
})
