import { ContainerModule } from 'inversify'
import { WIN_ORDER_TYPES } from './types'
import { UseCaseSave, UseCaseUpdateConsumed } from '../../Application'
import { collection, db } from '../config'
import { WINOrderMongoRepository } from '../MongoRepository'

export const containerModule = new ContainerModule(bind => {
    bind(WIN_ORDER_TYPES.DB).toConstantValue(db)
    bind(WIN_ORDER_TYPES.Collection).toConstantValue(collection)
    bind(WIN_ORDER_TYPES.RepositoryMongo).to(WINOrderMongoRepository)
    bind(WIN_ORDER_TYPES.UseCaseSave).to(UseCaseSave)
    bind(WIN_ORDER_TYPES.UseCaseUpdateConsumed).to(UseCaseUpdateConsumed)
})