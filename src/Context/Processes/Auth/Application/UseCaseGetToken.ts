import { AdapterToken, SHARED_TYPES } from '@Shared/Infrastructure'
import { inject, injectable } from 'inversify'
import { db_root, TokenPayloadDTO, UserENTITY } from 'logiflowerp-sdk'

@injectable()
export class UseCaseGetToken {

    constructor(
        @inject(SHARED_TYPES.AdapterToken) private readonly adapterToken: AdapterToken,
    ) { }

    async exec(user: UserENTITY) {
        const payload = this.generatePayloadToken(user)
        const token = await this.adapterToken.create(payload, undefined, 43200) // const expiresIn = 12 * 60 * 60; // = 43200 o '12h'
        return { token, user: payload.user }
    }

    private generatePayloadToken(entity: UserENTITY) {
        const payload = new TokenPayloadDTO()
        payload.user.set(entity)
        payload.rootCompany.code = db_root
        return payload
    }

}