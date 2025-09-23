import { MongoRepository } from '@Shared/Infrastructure/Repositories/Mongo'
import { IScrapingCredentialMongoRepository } from '../Domain'
import { AuthUserDTO, ScrapingCredentialENTITY } from 'logiflowerp-sdk'
import { inject } from 'inversify'
import { SCRAPING_CREDENTIAL_TYPES } from './IoC'

export class ScrapingCredentialMongoRepository extends MongoRepository<ScrapingCredentialENTITY> implements IScrapingCredentialMongoRepository {
    constructor(
        @inject(SCRAPING_CREDENTIAL_TYPES.Collection) protected readonly collection: string,
        @inject(SCRAPING_CREDENTIAL_TYPES.DB) protected readonly db: string,
    ) {
        super(db, collection, new AuthUserDTO())
    }
}