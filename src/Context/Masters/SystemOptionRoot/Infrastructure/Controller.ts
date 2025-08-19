import { inject } from 'inversify'
import { Request, Response } from 'express'
import {
    BaseHttpController,
    httpPost,
    request,
    response
} from 'inversify-express-utils'
import { UseCaseFind } from '../Application'
import { SYSTEM_OPTION_ROOT_TYPES } from './IoC'

export class RootSystemOptionRootController extends BaseHttpController {

    constructor(
        @inject(SYSTEM_OPTION_ROOT_TYPES.UseCaseFind) private readonly useCaseFind: UseCaseFind,
    ) {
        super()
    }

    @httpPost('find')
    async find(@request() req: Request, @response() res: Response) {
        await this.useCaseFind.exec(req, res)
    }
}