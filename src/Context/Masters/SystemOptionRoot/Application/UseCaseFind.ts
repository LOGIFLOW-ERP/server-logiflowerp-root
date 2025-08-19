import { Response, Request } from 'express'
import { ISystemOptionRootMongoRepository } from '../Domain'
import { inject, injectable } from 'inversify'
import { SYSTEM_OPTION_TYPES } from '../Infrastructure/IoC'

@injectable()
export class UseCaseFind {

	constructor(
		@inject(SYSTEM_OPTION_TYPES.RepositoryMongo) private readonly repository: ISystemOptionRootMongoRepository,
	) { }

	async exec(req: Request, res: Response) {
		const pipeline = req.body
		await this.repository.find(pipeline, req, res)
	}

}
