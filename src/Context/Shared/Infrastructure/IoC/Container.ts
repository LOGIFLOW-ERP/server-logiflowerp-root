import { ContainerModule } from 'inversify'
import { SHARED_TYPES } from './types'
import {
    AdapterApiRequest,
    AdapterMail,
    AdapterMongoDB,
    AdapterRabbitMQ,
    AdapterRedis,
    AdapterSocket,
    AdapterToken
} from '../Adapters'
import { Bootstraping } from '@Shared/Bootstraping'
import { BootstrapingDatabaseMongo } from '@Shared/Bootstraping/database'

export const containerModule = new ContainerModule(bind => {
    bind(SHARED_TYPES.AdapterToken).to(AdapterToken).inSingletonScope()
    bind(SHARED_TYPES.AdapterMongoDB).to(AdapterMongoDB).inSingletonScope()
    bind(SHARED_TYPES.AdapterSocket).to(AdapterSocket).inSingletonScope()
    bind(SHARED_TYPES.AdapterRedis).to(AdapterRedis).inSingletonScope()
    bind(SHARED_TYPES.AdapterMail).to(AdapterMail).inSingletonScope()
    bind(SHARED_TYPES.AdapterApiRequest).to(AdapterApiRequest).inSingletonScope()
    bind(SHARED_TYPES.AdapterRabbitMQ).to(AdapterRabbitMQ).inSingletonScope()
    bind(SHARED_TYPES.BootstrapingDatabaseMongo).to(BootstrapingDatabaseMongo)
    bind(SHARED_TYPES.Bootstraping).to(Bootstraping)
})