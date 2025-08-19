import { MongoRepository } from '@Shared/Infrastructure'
import { ISystemOptionRootMongoRepository } from '../Domain'
import { AuthUserDTO, SystemOptionENTITY } from 'logiflowerp-sdk'
import { inject, injectable } from 'inversify'
import { SYSTEM_OPTION_TYPES } from './IoC'

@injectable()
export class SystemOptionRootMongoRepository extends MongoRepository<SystemOptionENTITY> implements ISystemOptionRootMongoRepository {

    constructor(
        @inject(SYSTEM_OPTION_TYPES.Collection) protected readonly collection: string,
        @inject(SYSTEM_OPTION_TYPES.DB) protected readonly db: string,
    ) {
        super(db, collection, new AuthUserDTO())
    }

}