import { inject, injectable } from 'inversify'
import { ICompanyMongoRepository } from '../Domain'
import { COMPANY_TYPES } from '../Infrastructure/IoC'

@injectable()
export class UseCaseDeleteOne {

    constructor(
        @inject(COMPANY_TYPES.RepositoryMongo) private readonly repository: ICompanyMongoRepository,
    ) { }

    async exec(_id: string) {
        return this.repository.deleteOne({ _id })
    }

}