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
    UseCaseChangePassword,
    UseCaseGetToken,
    UseCaseRequestPasswordReset,
    UseCaseResetPassword,
    UseCaseSignIn,
    UseCaseSignUp,
} from '../Application'
import {
    ChangePasswordDTO,
    CompanyDTO,
    CreateUserDTO,
    EmployeeAuthDTO,
    ProfileDTO,
    ResetPasswordDTO,
    ResponseSignIn,
    SignInDTO,
    validateRequestBody as VRB
} from 'logiflowerp-sdk'
import { AdapterRabbitMQ, SHARED_TYPES } from '@Shared/Infrastructure'
import { DataRequestPasswordResetDTO } from '../Domain'
import { AUTH_TYPES } from './IoC'
import { CONFIG_TYPES } from '@Config/types'

export class RootAuthController extends BaseHttpController {
    constructor(
        @inject(SHARED_TYPES.AdapterRabbitMQ) private readonly adapterRabbitMQ: AdapterRabbitMQ,
        @inject(AUTH_TYPES.UseCaseSignUp) private readonly useCaseSignUp: UseCaseSignUp,
        @inject(AUTH_TYPES.UseCaseRequestPasswordReset) private readonly useCaseRequestPasswordReset: UseCaseRequestPasswordReset,
        @inject(AUTH_TYPES.UseCaseResetPassword) private readonly useCaseResetPassword: UseCaseResetPassword,
        @inject(AUTH_TYPES.UseCaseGetToken) private readonly useCaseGetToken: UseCaseGetToken,
        @inject(AUTH_TYPES.UseCaseSignIn) private readonly useCaseSignIn: UseCaseSignIn,
        @inject(AUTH_TYPES.UseCaseChangePassword) private readonly useCaseChangePassword: UseCaseChangePassword,
        @inject(CONFIG_TYPES.Env) private readonly env: Env,
    ) {
        super()
    }

    @httpPost('sign-up', VRB.bind(null, CreateUserDTO, BRE))
    async saveOne(@request() req: Request<{}, {}, CreateUserDTO>, @response() res: Response) {
        const newDoc = await this.useCaseSignUp.exec(req.body)
        res.status(201).json(newDoc)
    }

    @httpPost('request-password-reset', VRB.bind(null, DataRequestPasswordResetDTO, BRE))
    async requestPasswordReset(@request() req: Request<{}, {}, DataRequestPasswordResetDTO>, @response() res: Response) {
        await this.useCaseRequestPasswordReset.exec(req.body.email)
        res.sendStatus(204)
    }

    @httpPost('reset-password', VRB.bind(null, ResetPasswordDTO, BRE))
    async resetPassword(@request() req: Request<{}, {}, ResetPasswordDTO>, @response() res: Response) {
        await this.useCaseResetPassword.exec(req.body.token, req.body.password)
        res.sendStatus(204)
    }

    @httpPost('change-password', VRB.bind(null, ChangePasswordDTO, BRE))
    async changePassword(@request() req: Request<{}, {}, ChangePasswordDTO>, @response() res: Response) {
        await this.useCaseChangePassword.exec(req.user, req.body)
        res.sendStatus(204)
    }

    @httpPost('sign-in', VRB.bind(null, SignInDTO, BRE))
    async signIn(@request() req: Request<{}, {}, SignInDTO>, @response() res: Response) {
        const { user } = await this.useCaseSignIn.exec(req.body)
        const { token, user: userResponse } = await this.useCaseGetToken.exec(user)
        res.cookie(
            'authToken',
            token,
            {
                httpOnly: true,
                secure: true,
                sameSite: 'strict'
            }
        )
        const response: ResponseSignIn = {
            user: userResponse,
            dataSystemOptions: [],
            root: true,
            tags: [],
            company: new CompanyDTO(),
            profile: new ProfileDTO(),
            personnel: new EmployeeAuthDTO()
        }
        res.status(200).json(response)
    }

    @httpPost('sign-out')
    async signOut(@request() _req: Request, @response() res: Response) {
        res.clearCookie('authToken')
        res.sendStatus(204)
    }
}