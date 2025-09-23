import { ContainerModule } from 'inversify';
import { SCRAPING_CREDENTIAL_TYPES } from './types';
import { ScrapingCredentialMongoRepository } from '../MongoRepository';
import {
    UseCaseDeleteOne,
    UseCaseFind,
    UseCaseGetAll,
    UseCaseInsertOne,
    UseCaseUpdateOne
} from '../../Application';
import { collection, db } from '../config';

export const containerModule = new ContainerModule(bind => {
    bind(SCRAPING_CREDENTIAL_TYPES.RepositoryMongo).to(ScrapingCredentialMongoRepository)
    bind(SCRAPING_CREDENTIAL_TYPES.UseCaseDeleteOne).to(UseCaseDeleteOne)
    bind(SCRAPING_CREDENTIAL_TYPES.UseCaseFind).to(UseCaseFind)
    bind(SCRAPING_CREDENTIAL_TYPES.UseCaseGetAll).to(UseCaseGetAll)
    bind(SCRAPING_CREDENTIAL_TYPES.UseCaseInsertOne).to(UseCaseInsertOne)
    bind(SCRAPING_CREDENTIAL_TYPES.UseCaseUpdateOne).to(UseCaseUpdateOne)
    bind(SCRAPING_CREDENTIAL_TYPES.Collection).toConstantValue(collection)
    bind(SCRAPING_CREDENTIAL_TYPES.DB).toConstantValue(db)
})