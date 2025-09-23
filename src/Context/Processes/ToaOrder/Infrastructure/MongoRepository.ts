import { MongoRepository } from '@Shared/Infrastructure'
import { ITOAOrderMongoRepository } from '../Domain'
import { AuthUserDTO, TOAOrderENTITY } from 'logiflowerp-sdk'
import { inject, injectable } from 'inversify'
import { TOA_ORDER_TYPES } from './IoC/types'

@injectable()
export class TOAOrderMongoRepository extends MongoRepository<TOAOrderENTITY> implements ITOAOrderMongoRepository {
    constructor(
        @inject(TOA_ORDER_TYPES.Collection) protected readonly collection: string,
        @inject(TOA_ORDER_TYPES.DB) protected readonly db: string,
    ) {
        super(db, collection, new AuthUserDTO())
    }
}