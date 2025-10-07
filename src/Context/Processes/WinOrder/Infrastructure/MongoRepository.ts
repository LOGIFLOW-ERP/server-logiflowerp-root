import { MongoRepository } from '@Shared/Infrastructure'
import { IWINOrderMongoRepository } from '../Domain'
import { AuthUserDTO, WINOrderENTITY } from 'logiflowerp-sdk'
import { inject, injectable } from 'inversify'
import { WIN_ORDER_TYPES } from './IoC/types'

@injectable()
export class WINOrderMongoRepository extends MongoRepository<WINOrderENTITY> implements IWINOrderMongoRepository {
    constructor(
        @inject(WIN_ORDER_TYPES.Collection) protected readonly collection: string,
        @inject(WIN_ORDER_TYPES.DB) protected readonly db: string,
    ) {
        super(db, collection, new AuthUserDTO())
    }
}