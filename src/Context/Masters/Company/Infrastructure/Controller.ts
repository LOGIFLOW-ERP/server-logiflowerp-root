import { inject } from 'inversify'
import { Request, Response } from 'express'
import {
    BaseHttpController,
    httpDelete,
    httpGet,
    httpPost,
    httpPut,
    request,
    response
} from 'inversify-express-utils'
import {
    CreateRootCompanyDTO,
    CreateRootCompanyPERDTO,
    getExchangeNameInitializationCollections,
    UpdateRootCompanyDTO,
    validateCustom,
    validateRequestBody as VRB,
    validateUUIDv4Param as VUUID,
} from 'logiflowerp-sdk'
import { BadRequestException, BadRequestException as BRE } from '@Config/exception'
import {
    UseCaseDeleteOne,
    UseCaseFind,
    UseCaseGetAll,
    UseCaseInsertOne,
    UseCaseInsertOnePER,
    UseCaseUpdateOne
} from '../Application'
import { COMPANY_TYPES } from './IoC'
import { AdapterRabbitMQ, SHARED_TYPES } from '@Shared/Infrastructure'
import { CONFIG_TYPES } from '@Config/types'

export class CompanyController extends BaseHttpController {

    constructor(
        @inject(COMPANY_TYPES.UseCaseDeleteOne) private readonly useCaseDeleteOne: UseCaseDeleteOne,
        @inject(COMPANY_TYPES.UseCaseFind) private readonly useCaseFind: UseCaseFind,
        @inject(COMPANY_TYPES.UseCaseGetAll) private readonly useCaseGetAll: UseCaseGetAll,
        @inject(COMPANY_TYPES.UseCaseInsertOne) private readonly useCaseInsertOne: UseCaseInsertOne,
        @inject(COMPANY_TYPES.UseCaseInsertOnePER) private readonly useCaseInsertOnePER: UseCaseInsertOnePER,
        @inject(COMPANY_TYPES.UseCaseUpdateOne) private readonly useCaseUpdateOne: UseCaseUpdateOne,
        @inject(SHARED_TYPES.AdapterRabbitMQ) private readonly adapterRabbitMQ: AdapterRabbitMQ,
        @inject(CONFIG_TYPES.Env) private readonly env: Env,
    ) {
        super()
    }

    @httpPost('find')
    async find(@request() req: Request, @response() res: Response) {
        await this.useCaseFind.exec(req, res)
    }

    @httpGet('')
    async findAll(@request() req: Request, @response() res: Response) {
        await this.useCaseGetAll.exec(req, res)
    }

    @httpPost('')
    async saveOne(@request() req: Request<{}, {}, CreateRootCompanyPERDTO | CreateRootCompanyDTO>, @response() res: Response) {

        const { country } = req.body
        if (!country) {
            throw new BadRequestException(`El campo "country" es requerido`)
        }

        const countryConfigs: Record<string, { dto: any; useCase: any }> = {
            PER: { dto: CreateRootCompanyPERDTO, useCase: this.useCaseInsertOnePER },
        }

        const config = countryConfigs[country] || { dto: CreateRootCompanyDTO, useCase: this.useCaseInsertOne }

        const validatedBody = await validateCustom(req.body, config.dto, BRE)
        const result = await config.useCase.exec(validatedBody)
        await this.adapterRabbitMQ.publishFanout({ exchange: getExchangeNameInitializationCollections({ NODE_ENV: this.env.NODE_ENV }), message: [result] })
        res.sendStatus(204)
    }

    @httpPut(':_id', VUUID.bind(null, BRE), VRB.bind(null, UpdateRootCompanyDTO, BRE))
    async updateOne(@request() req: Request<ParamsPut, {}, UpdateRootCompanyDTO>, @response() res: Response) {
        await this.useCaseUpdateOne.exec(req.params._id, req.body)
        res.sendStatus(204)
    }

    @httpDelete(':_id', VUUID.bind(null, BRE))
    async deleteOne(@request() req: Request<ParamsDelete>, @response() res: Response) {
        await this.useCaseDeleteOne.exec(req.params._id)
        res.sendStatus(204)
    }

}