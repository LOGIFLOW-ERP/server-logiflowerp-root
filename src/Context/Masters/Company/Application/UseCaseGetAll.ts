import { Response, Request } from 'express'
import { ICompanyMongoRepository } from '../Domain'
import { COMPANY_TYPES } from '../Infrastructure/IoC'
import { inject, injectable } from 'inversify'

@injectable()
export class UseCaseGetAll {

	constructor(
		@inject(COMPANY_TYPES.RepositoryMongo) private readonly repository: ICompanyMongoRepository,
	) { }

	async exec(req: Request, res: Response) {
		await this.repository.find([{ $match: { isDeleted: false } }], req, res)
	}

}
