import { inject, injectable } from 'inversify'
import { ISystemOptionRootMongoRepository } from '@Masters/SystemOptionRoot/Domain'
import { SYSTEM_OPTION_ROOT_TYPES } from '@Masters/SystemOptionRoot/Infrastructure/IoC'

@injectable()
export class UseCaseGetSystemOptionRoot {
    constructor(
        @inject(SYSTEM_OPTION_ROOT_TYPES.RepositoryMongo) private readonly repository: ISystemOptionRootMongoRepository,
    ) { }

    async exec() {
        const pipeline = [{ $match: {} }]
        const dataSystemOptions = await this.repository.select(pipeline)
        return { dataSystemOptions }
    }

}