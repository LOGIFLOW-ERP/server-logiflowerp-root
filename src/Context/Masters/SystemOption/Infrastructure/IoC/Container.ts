import { ContainerModule } from 'inversify';
import { SYSTEM_OPTION_TYPES } from './types';
import { SystemOptionMongoRepository } from '../MongoRepository';
import { UseCaseFind } from '../../Application';
import { collection, db } from '../config';

export const containerModule = new ContainerModule(bind => {
    bind(SYSTEM_OPTION_TYPES.RepositoryMongo).to(SystemOptionMongoRepository)
    bind(SYSTEM_OPTION_TYPES.UseCaseFind).to(UseCaseFind)
    bind(SYSTEM_OPTION_TYPES.Collection).toConstantValue(collection)
    bind(SYSTEM_OPTION_TYPES.DB).toConstantValue(db)
})