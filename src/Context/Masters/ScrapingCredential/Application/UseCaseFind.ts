import { Response, Request } from 'express'
import { IScrapingCredentialMongoRepository } from '../Domain'
import { inject, injectable } from 'inversify'
import { SCRAPING_CREDENTIAL_TYPES } from '../Infrastructure/IoC'

@injectable()
export class UseCaseFind {

	constructor(
		@inject(SCRAPING_CREDENTIAL_TYPES.RepositoryMongo) private readonly repository: IScrapingCredentialMongoRepository,
	) { }

	async exec(req: Request, res: Response) {
		const pipeline = req.body
		await this.repository.find(pipeline, req, res)
	}

}
