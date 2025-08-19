import { UnprocessableEntityException } from '@Config/exception'
import { CONFIG_TYPES } from '@Config/types'
import { inject, injectable } from 'inversify'
import JWT from 'jsonwebtoken'
import { TokenPayloadDTO, validateCustom } from 'logiflowerp-sdk'

@injectable()
export class AdapterToken {

    constructor(
        @inject(CONFIG_TYPES.Env) private readonly env: Env,
    ) { }

    async create(payload: TokenPayloadDTO, secretOrPrivateKey: string = this.env.JWT_KEY, expiresIn?: number) {
        const _payload = await validateCustom(payload, TokenPayloadDTO, UnprocessableEntityException)
        const _secretOrPrivateKey = `${secretOrPrivateKey}${this.env.NODE_ENV}`
        return JWT.sign(JSON.parse(JSON.stringify(_payload)), _secretOrPrivateKey, expiresIn ? { expiresIn } : {})
    }

    async verify(token: string, secretOrPublicKey: string = this.env.JWT_KEY) {
        try {
            const _secretOrPublicKey = `${secretOrPublicKey}${this.env.NODE_ENV}`
            const res = JWT.verify(token, _secretOrPublicKey) as TokenPayloadDTO
            // await new Promise(resolve => setTimeout(resolve, 5000))            
            return await validateCustom(res, TokenPayloadDTO, UnprocessableEntityException)
        } catch (error) {
            console.error(error)
            return null
        }
    }

}