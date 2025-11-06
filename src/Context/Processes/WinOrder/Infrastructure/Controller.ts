import { inject } from 'inversify'
import { Request, Response } from 'express'
import { BadRequestException as BRE, ServiceUnavailableException } from '@Config/exception'
import {
    BaseHttpController,
    httpPost,
    request,
    response
} from 'inversify-express-utils'
import {
    UseCaseSave,
    // UseCaseUpdateConsumed
} from '../Application'
import {
    validateRequestBody as VRB
} from 'logiflowerp-sdk'
import { WIN_ORDER_TYPES } from './IoC/types'
import { DataRequestSave } from '../Domain'
import { CONFIG_TYPES } from '@Config/types'

export class RootWinOrderController extends BaseHttpController {
    constructor(
        @inject(WIN_ORDER_TYPES.UseCaseSave) private readonly useCaseSave: UseCaseSave,
        // @inject(WIN_ORDER_TYPES.UseCaseUpdateConsumed) private readonly useCaseUpdateConsumed: UseCaseUpdateConsumed,
        @inject(CONFIG_TYPES.Env) private readonly env: Env,
    ) {
        super()
    }

    @httpPost('save', VRB.bind(null, DataRequestSave, BRE))
    private async save(@request() req: Request, @response() res: Response) {
        if (!this.env.JOB_WIN) {
            throw new ServiceUnavailableException('El servicio de rastreo no está disponible')
        }
        await this.useCaseSave.exec(req.body)
        res.sendStatus(204)
    }

    // @httpPost('update-consumed')
    // private async updateConsumed(@request() req: Request, @response() res: Response) {
    //     if (!this.env.JOB_WIN) {
    //         throw new ServiceUnavailableException('El servicio de rastreo no está disponible')
    //     }
    //     this.useCaseUpdateConsumed.exec()
    //     res.sendStatus(204)
    // }
}