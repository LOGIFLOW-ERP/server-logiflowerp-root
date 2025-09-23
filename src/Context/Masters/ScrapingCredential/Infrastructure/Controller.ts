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
    CreateScrapingCredentialDTO,
    UpdateScrapingCredentialDTO,
    validateRequestBody as VRB,
    validateUUIDv4Param as VUUID,
} from 'logiflowerp-sdk'
import { BadRequestException as BRE } from '@Config/exception'
import {
    UseCaseDeleteOne,
    UseCaseFind,
    UseCaseGetAll,
    UseCaseInsertOne,
    UseCaseUpdateOne
} from '../Application'
import { SCRAPING_CREDENTIAL_TYPES } from './IoC'

export class ScrapingCredentialController extends BaseHttpController {

    constructor(
        @inject(SCRAPING_CREDENTIAL_TYPES.UseCaseDeleteOne) private readonly useCaseDeleteOne: UseCaseDeleteOne,
        @inject(SCRAPING_CREDENTIAL_TYPES.UseCaseFind) private readonly useCaseFind: UseCaseFind,
        @inject(SCRAPING_CREDENTIAL_TYPES.UseCaseGetAll) private readonly useCaseGetAll: UseCaseGetAll,
        @inject(SCRAPING_CREDENTIAL_TYPES.UseCaseInsertOne) private readonly useCaseInsertOne: UseCaseInsertOne,
        @inject(SCRAPING_CREDENTIAL_TYPES.UseCaseUpdateOne) private readonly useCaseUpdateOne: UseCaseUpdateOne,
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

    @httpPost('', VRB.bind(null, CreateScrapingCredentialDTO, BRE))
    async saveOne(@request() req: Request<{}, {}, CreateScrapingCredentialDTO>, @response() res: Response) {
        await this.useCaseInsertOne.exec(req.body)
        res.sendStatus(204)
    }

    @httpPut(':_id', VUUID.bind(null, BRE), VRB.bind(null, UpdateScrapingCredentialDTO, BRE))
    async updateOne(@request() req: Request<ParamsPut, {}, UpdateScrapingCredentialDTO>, @response() res: Response) {
        await this.useCaseUpdateOne.exec(req.params._id, req.body)
        res.sendStatus(204)
    }

    @httpDelete(':_id', VUUID.bind(null, BRE))
    async deleteOne(@request() req: Request<ParamsDelete>, @response() res: Response) {
        await this.useCaseDeleteOne.exec(req.params._id)
        res.sendStatus(204)
    }

}