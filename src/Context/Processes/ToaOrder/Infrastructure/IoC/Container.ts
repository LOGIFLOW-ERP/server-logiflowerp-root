import { ContainerModule } from 'inversify'
import { TOA_ORDER_TYPES } from './types'
import { UseCaseSave } from '../../Application'
import { collection, db } from '../config'
import { TOAOrderMongoRepository } from '../MongoRepository'

export const containerModule = new ContainerModule(bind => {
    bind(TOA_ORDER_TYPES.RepositoryMongo).to(TOAOrderMongoRepository)
    bind(TOA_ORDER_TYPES.UseCaseSave).to(UseCaseSave)
    bind(TOA_ORDER_TYPES.Collection).toConstantValue(collection)
    bind(TOA_ORDER_TYPES.DB).toConstantValue(db)
})