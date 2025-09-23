import { IScrapingCredentialMongoRepository } from '../Domain';
import {
    CreateScrapingCredentialDTO,
    ScrapingCredentialENTITY,
    validateCustom
} from 'logiflowerp-sdk';
import { UnprocessableEntityException } from '@Config/exception';
import { SCRAPING_CREDENTIAL_TYPES } from '../Infrastructure/IoC';
import { inject, injectable } from 'inversify';

@injectable()
export class UseCaseInsertOne {
    constructor(
        @inject(SCRAPING_CREDENTIAL_TYPES.RepositoryMongo) private readonly repository: IScrapingCredentialMongoRepository,
    ) { }

    async exec(dto: CreateScrapingCredentialDTO) {
        const _entity = new ScrapingCredentialENTITY()
        _entity.set(dto)
        _entity._id = crypto.randomUUID()
        const entity = await validateCustom(_entity, ScrapingCredentialENTITY, UnprocessableEntityException)
        await this.repository.insertOne(entity)
    }
}