import { Response, Request } from 'express'
import { IScrapingCredentialMongoRepository } from '../Domain'
import { SCRAPING_CREDENTIAL_TYPES } from '../Infrastructure/IoC'
import { inject, injectable } from 'inversify'

@injectable()
export class UseCaseGetAll {

	constructor(
		@inject(SCRAPING_CREDENTIAL_TYPES.RepositoryMongo) private readonly repository: IScrapingCredentialMongoRepository,
	) { }

	async exec(req: Request, res: Response) {
		await this.repository.find([{ $match: { isDeleted: false } }], req, res)
	}

}
