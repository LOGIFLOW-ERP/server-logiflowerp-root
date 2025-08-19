import { ContainerModule } from 'inversify';
import { USER_TYPES } from './types';
import { UserMongoRepository } from '../MongoRepository';
import { UseCaseFind, UseCaseGetByIdentity, UseCaseUpdateOne } from '../../Application';
import { collection, db } from '../config';

export const containerModule = new ContainerModule(bind => {
    bind(USER_TYPES.RepositoryMongo).to(UserMongoRepository)
    bind(USER_TYPES.UseCaseFind).to(UseCaseFind)
    bind(USER_TYPES.UseCaseGetByIdentity).to(UseCaseGetByIdentity)
    bind(USER_TYPES.UseCaseUpdateOne).to(UseCaseUpdateOne)
    bind(USER_TYPES.Collection).toConstantValue(collection)
    bind(USER_TYPES.DB).toConstantValue(db)
})