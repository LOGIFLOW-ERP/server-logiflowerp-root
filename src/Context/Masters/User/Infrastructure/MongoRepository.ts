import { MongoRepository } from '@Shared/Infrastructure'
import { IUserMongoRepository } from '../Domain'
import { AuthUserDTO, UserENTITY } from 'logiflowerp-sdk'
import { inject, injectable } from 'inversify'
import { USER_TYPES } from './IoC'

@injectable()
export class UserMongoRepository extends MongoRepository<UserENTITY> implements IUserMongoRepository {
    constructor(
        @inject(USER_TYPES.Collection) protected readonly collection: string,
        @inject(USER_TYPES.DB) protected readonly db: string,
    ) {
        super(db, collection, new AuthUserDTO())
    }
}