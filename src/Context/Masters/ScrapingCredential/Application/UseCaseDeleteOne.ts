import { inject, injectable } from 'inversify'
import { IScrapingCredentialMongoRepository } from '../Domain'
import { SCRAPING_CREDENTIAL_TYPES } from '../Infrastructure/IoC'

@injectable()
export class UseCaseDeleteOne {

    constructor(
        @inject(SCRAPING_CREDENTIAL_TYPES.RepositoryMongo) private readonly repository: IScrapingCredentialMongoRepository,
    ) { }

    async exec(_id: string) {
        return this.repository.deleteOne({ _id })
    }

}