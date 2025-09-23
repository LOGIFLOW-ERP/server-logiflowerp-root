import { IUserMongoRepository } from '@Masters/User/Domain'
import { USER_TYPES } from '@Masters/User/Infrastructure/IoC'
import { AdapterToken, SHARED_TYPES } from '@Shared/Infrastructure'
import { inject, injectable } from 'inversify'
import { AuthUserDTO, db_root, State, TokenPayloadDTO, UserENTITY } from 'logiflowerp-sdk'

@injectable()
export class UseCaseGetTokenApp {

    constructor(
        @inject(USER_TYPES.RepositoryMongo) private readonly repository: IUserMongoRepository,
        @inject(SHARED_TYPES.AdapterToken) private readonly adapterToken: AdapterToken,
    ) { }

    async exec(_user: AuthUserDTO) {
        const user = await this.searchUser(_user.email)
        const payload = this.generatePayloadToken(user)
        const token = await this.adapterToken.create(payload)
        return { token, user: payload.user }
    }

    private generatePayloadToken(entity: UserENTITY) {
        const payload = new TokenPayloadDTO()
        payload.user.set(entity)
        payload.rootCompany.code = db_root
        return payload
    }

    private async searchUser(email: string) {
        const pipeline = [{ $match: { email, state: State.ACTIVO, isDeleted: false } }]
        const result = await this.repository.selectOne(pipeline)
        return result
    }
}