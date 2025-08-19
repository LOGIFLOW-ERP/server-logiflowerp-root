import { inject } from 'inversify'
import { Request, Response } from 'express'
import {
    BaseHttpController,
    httpGet,
    httpPost,
    request,
    response
} from 'inversify-express-utils'
import {
    UseCaseFind,
    UseCaseGetByIdentity,
} from '../Application'
import { USER_TYPES } from './IoC'

export class UserController extends BaseHttpController {

    constructor(
        @inject(USER_TYPES.UseCaseFind) private readonly useCaseFind: UseCaseFind,
        @inject(USER_TYPES.UseCaseGetByIdentity) private readonly useCaseGetByIdentity: UseCaseGetByIdentity,
    ) {
        super()
    }

    @httpPost('find')
    async find(@request() req: Request, @response() res: Response) {
        await this.useCaseFind.exec(req, res)
    }

    @httpGet(':identity')
    async getByIdentity(@request() req: Request<{ identity: string }>, @response() res: Response) {
        const doc = await this.useCaseGetByIdentity.exec(req.params.identity)
        res.status(200).json(doc)
    }

}