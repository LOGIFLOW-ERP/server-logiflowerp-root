import {
    Application,
    ErrorRequestHandler,
    json,
    NextFunction,
    Request,
    Response,
    text,
    urlencoded
} from 'express'
import cookieParser from 'cookie-parser'
import { env } from './env'
import helmet from 'helmet'
import compression from 'compression'
import cors from 'cors'
import {
    BadRequestException,
    BaseException,
    ConflictException,
    InternalServerException,
    UnauthorizedException
} from './exception'
import { ContainerGlobal } from './inversify'
import { AdapterToken, SHARED_TYPES } from '@Shared/Infrastructure'
import crypto from 'crypto'
import { convertDates } from 'logiflowerp-sdk'
import { MongoServerError } from 'mongodb'

const ALGORITHM = 'aes-256-cbc'
const SECRET_KEY = Buffer.from(env.ENCRYPTION_KEY, 'utf8')

export async function serverConfig(app: Application, rootPath: string) {

    app.use(customLogger)
    app.use(cookieParser())
    app.use(helmet())
    app.use(compression())

    app.disable('x-powered-by')

    const whitelist = env.DOMAINS

    app.use(cors({
        origin: (origin, callback) => {
            if (!origin) {
                return callback(null, true)
            }
            if (whitelist.some(org => org.toLowerCase() === origin?.toLowerCase())) {
                return callback(null, true)
            }
            callback(new Error('Not allowed by CORS'))
        },
        credentials: true
    }))

    authMiddleware(app, rootPath)

    app.use(json({ limit: '10mb' }))
    app.use(text({ limit: '10mb' }))
    app.use(urlencoded({ limit: '10mb', extended: true }))

    if (env.REQUIRE_ENCRYPTION) {
        app.use(decryptMiddleware)
        app.use(encryptResponse)
    }

    app.use(convertDatesMiddleware)

}

export function serverErrorConfig(app: Application) {

    const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {

        console.error(err)

        if (err instanceof MongoServerError) {
            if (err.code === 11000) {
                delete err.errorResponse.keyValue.isDeleted
                const msg = `El recurso ya existe (clave duplicada: ${JSON.stringify(err.errorResponse.keyValue)})`
                res.status(409).send(new ConflictException(msg, true))
                return
            }
        }

        if (err instanceof BaseException) {
            res.status(err.statusCode).json(err)
            return
        }

        res.status(500).json(new InternalServerException('Ocurrió un error inesperado'))

    }

    app.use(errorHandler)

}

function customLogger(req: Request, res: Response, next: NextFunction) {

    const start = Date.now()

    res.on('finish', () => {
        const duration = Date.now() - start
        const status = res.statusCode;

        let color = '\x1b[32m%s\x1b[0m'
        if (status >= 400 && status < 500) color = '\x1b[33m%s\x1b[0m'
        if (status >= 500) color = '\x1b[31m%s\x1b[0m'

        console.log(color, `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`)
    })

    next()

}

function authMiddleware(app: Application, rootPath: string) {
    app.use(async (req, _res, next) => {
        try {
            let serviceNoAuth: boolean = true

            const publicRoutes = [
                `${rootPath}/processes/rootauth/sign-in`,
                `${rootPath}/processes/rootauth/sign-up`,
                `${rootPath}/processes/rootauth/sign-out`,
                `${rootPath}/processes/rootauth/request-password-reset`,
                `${rootPath}/processes/rootauth/reset-password`,
            ]
            const url = req.originalUrl.toLowerCase()

            if (publicRoutes.some(route => route.toLowerCase() === url)) {
                serviceNoAuth = false
            }

            if (!serviceNoAuth) return next()

            const token = req.cookies.authToken || req.headers['authorization']

            if (!token) {
                return next(new UnauthorizedException('No autorizado, token faltante'))
            }

            const adapterToken = ContainerGlobal.get<AdapterToken>(SHARED_TYPES.AdapterToken)
            const decoded = await adapterToken.verify(token)

            if (!decoded) {
                return next(new UnauthorizedException('Token inválido o expirado'))
            }

            req.payloadToken = decoded
            req.user = decoded.user
            req.rootCompany = decoded.rootCompany

            next()
        } catch (error) {
            next(error)
        }
    })
}

function convertDatesMiddleware(req: Request, _res: Response, next: NextFunction) {
    convertDates(req.body)
    next()
}

function decryptMiddleware(req: Request, _res: Response, next: NextFunction) {
    try {
        const { iv, encryptedData } = req.body
        if (iv === undefined || encryptedData === undefined) {
            throw new BadRequestException('Datos inválidos: IV o datos cifrados faltantes')
        }
        req.body = decryptData(iv, encryptedData)
        next()
    } catch (error) {
        next(new BadRequestException(`No se pudo descifrar la data: ${(error as Error).message}`))
    }
}

function encryptResponse(_req: Request, res: Response, next: NextFunction) {
    const oldSend = res.send
    res.send = function (data) {
        try {
            data = encryptData(data)
            return oldSend.call(res, data)
        } catch (error) {
            return oldSend.call(res, { error: 'Error al encriptar la respuesta' })
        }
    }
    next()
}

function encryptData(data: any) {
    const iv = crypto.randomBytes(16)

    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv)
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex')
    encrypted += cipher.final('hex')

    return JSON.stringify({
        iv: iv.toString('hex'),
        encryptedData: encrypted,
    })
}

function decryptData(iv: string, encryptedData: string) {
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, Buffer.from(iv, 'hex'))

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    try {
        return JSON.parse(decrypted)
    } catch (parseError) {
        throw new BadRequestException('Datos descifrados no son un JSON válido')
    }
}
