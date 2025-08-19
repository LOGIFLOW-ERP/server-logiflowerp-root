import { ContainerModule } from 'inversify';
import { SYSTEM_OPTION_ROOT_TYPES } from './types';
import { SystemOptionRootMongoRepository } from '../MongoRepository';
import { UseCaseFind } from '../../Application';
import { collection, db } from '../config';

export const containerModule = new ContainerModule(bind => {
    bind(SYSTEM_OPTION_ROOT_TYPES.RepositoryMongo).to(SystemOptionRootMongoRepository)
    bind(SYSTEM_OPTION_ROOT_TYPES.UseCaseFind).to(UseCaseFind)
    bind(SYSTEM_OPTION_ROOT_TYPES.Collection).toConstantValue(collection)
    bind(SYSTEM_OPTION_ROOT_TYPES.DB).toConstantValue(db)
})