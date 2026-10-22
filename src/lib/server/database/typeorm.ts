import { DataSource, type DataSourceOptions } from 'typeorm';

export class TypeOrmDatabase {
	private static INSTANCE: Promise<DataSource> | null = null;

	public static getDb(config: DataSourceOptions): Promise<DataSource> {
		if (!this.INSTANCE) {
			this.INSTANCE = new DataSource(config)
				.initialize()
				.then((fulfilled) => {
					console.info('[TypeOrm] Data Source has been initialized!');
					return fulfilled;
				})
				.catch((err) => {
					throw Error("Database could not be initialized", { cause: err })
				});
		}
		return this.INSTANCE;
	}
}
