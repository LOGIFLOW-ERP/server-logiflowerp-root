import { Response, Request } from 'express'
import { ICompanyMongoRepository } from '../Domain'
import { inject, injectable } from 'inversify'
import { COMPANY_TYPES } from '../Infrastructure/IoC'

@injectable()
export class UseCaseFind {

	constructor(
		@inject(COMPANY_TYPES.RepositoryMongo) private readonly repository: ICompanyMongoRepository,
	) { }

	async exec(req: Request, res: Response) {
		const pipeline = req.body
		await this.repository.find(pipeline, req, res)
	}

}
