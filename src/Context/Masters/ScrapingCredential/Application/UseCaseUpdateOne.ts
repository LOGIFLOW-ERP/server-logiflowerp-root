import { IScrapingCredentialMongoRepository } from '../Domain'
import {
    UpdateScrapingCredentialDTO,
} from 'logiflowerp-sdk'
import { inject, injectable } from 'inversify'
import { SCRAPING_CREDENTIAL_TYPES } from '../Infrastructure/IoC'

@injectable()
export class UseCaseUpdateOne {
    constructor(
        @inject(SCRAPING_CREDENTIAL_TYPES.RepositoryMongo) private readonly repository: IScrapingCredentialMongoRepository,
    ) { }

    async exec(_id: string, dto: UpdateScrapingCredentialDTO) {
        const update = { $set: dto }
        return await this.repository.updateOne({ _id }, update)
    }
}