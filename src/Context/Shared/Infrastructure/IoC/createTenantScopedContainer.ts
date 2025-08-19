import { ContainerGlobal } from '@Config/inversify';
import { interfaces } from 'inversify';
import { SHARED_TYPES } from './types';
import { AuthUserDTO } from 'logiflowerp-sdk';

export function createTenantScopedContainer(
    symbolUseCase: symbol,
    symbolRepositoryMongo: symbol,
    constructorUseCase: interfaces.Newable<unknown>,
    constructorMongoRepository: interfaces.Newable<unknown>,
    database: string,
    collection: string,
    user: AuthUserDTO
) {
    const childContainer = ContainerGlobal.createChild()
    childContainer.bind('database').toConstantValue(database)
    childContainer.bind('collection').toConstantValue(collection)
    childContainer.bind(SHARED_TYPES.User).toConstantValue(user)
    childContainer.bind(symbolRepositoryMongo).to(constructorMongoRepository)
    childContainer.bind(symbolUseCase).to(constructorUseCase)
    return childContainer
}