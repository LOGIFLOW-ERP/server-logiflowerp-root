import { State } from 'logiflowerp-sdk'
import { IUserMongoRepository } from '../Domain'
import { inject, injectable } from 'inversify'
import { USER_TYPES } from '../Infrastructure/IoC'

@injectable()
export class UseCaseGetByIdentity {

	constructor(
		@inject(USER_TYPES.RepositoryMongo) private readonly repository: IUserMongoRepository,
	) { }

	async exec(identity: string) {
		const pipeline = [{ $match: { identity, state: State.ACTIVO, isDeleted: false } }]
		const result = await this.repository.selectOne(pipeline)
		const { password, root, emailVerified, state, _id, ...user } = result
		return user
	}

}
