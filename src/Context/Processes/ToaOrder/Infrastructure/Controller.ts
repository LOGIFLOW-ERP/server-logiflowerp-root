import { inject } from 'inversify'
import { Request, Response } from 'express'
import { BadRequestException as BRE } from '@Config/exception'
import {
    BaseHttpController,
    httpPost,
    request,
    response
} from 'inversify-express-utils'
import {
    UseCaseSave
} from '../Application'
import {
    validateRequestBody as VRB
} from 'logiflowerp-sdk'
import { TOA_ORDER_TYPES } from './IoC/types'
import { DataRequestSave } from '../Domain'

export class RootToaOrderController extends BaseHttpController {
    constructor(
        @inject(TOA_ORDER_TYPES.UseCaseSave) private readonly useCaseSave: UseCaseSave,
    ) {
        super()
    }

    @httpPost('save', VRB.bind(null, DataRequestSave, BRE))
    private async save(@request() req: Request, @response() res: Response) {
        await this.useCaseSave.exec(req.body)
        res.sendStatus(204)
    }
}