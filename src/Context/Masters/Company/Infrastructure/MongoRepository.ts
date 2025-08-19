import { MongoRepository } from '@Shared/Infrastructure/Repositories/Mongo'
import { ICompanyMongoRepository } from '../Domain'
import { AuthUserDTO, RootCompanyENTITY } from 'logiflowerp-sdk'
import { inject } from 'inversify'
import { COMPANY_TYPES } from './IoC'

export class CompanyMongoRepository extends MongoRepository<RootCompanyENTITY> implements ICompanyMongoRepository {
    constructor(
        @inject(COMPANY_TYPES.Collection) protected readonly collection: string,
        @inject(COMPANY_TYPES.DB) protected readonly db: string,
    ) {
        super(db, collection, new AuthUserDTO())
    }
}