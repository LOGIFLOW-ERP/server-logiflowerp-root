import { IndexEntity } from '@Shared/Domain'
import { BootstrapingDatabaseMongo } from './database'
import { Document } from 'mongodb'
import { inject, injectable } from 'inversify'
import { SHARED_TYPES } from '@Shared/Infrastructure/IoC/types'

@injectable()
export class Bootstraping {

    constructor(
        @inject(SHARED_TYPES.BootstrapingDatabaseMongo) private databaseBootstrap: BootstrapingDatabaseMongo
    ) { }

    async exec(database: string, collection: string, indexes: IndexEntity<Document>[]) {
        await this.databaseBootstrap.exec(database, collection, indexes)
    }

}