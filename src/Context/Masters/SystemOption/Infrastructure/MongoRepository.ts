import { MongoRepository } from '@Shared/Infrastructure'
import { IRootSystemOptionMongoRepository } from '../Domain'
import { AuthUserDTO, SystemOptionENTITY } from 'logiflowerp-sdk'
import { inject, injectable } from 'inversify'
import { SYSTEM_OPTION_TYPES } from './IoC'

@injectable()
export class SystemOptionMongoRepository extends MongoRepository<SystemOptionENTITY> implements IRootSystemOptionMongoRepository {

    constructor(
        @inject(SYSTEM_OPTION_TYPES.Collection) protected readonly collection: string,
        @inject(SYSTEM_OPTION_TYPES.DB) protected readonly db: string,
    ) {
        super(db, collection, new AuthUserDTO())
    }

}