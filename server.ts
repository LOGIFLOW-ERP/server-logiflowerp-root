import 'reflect-metadata'
import express from 'express'
import { InversifyExpressServer } from 'inversify-express-utils'
import { env } from '@Config/env'
import { ContainerGlobal } from '@Config/inversify'
import { serverConfig } from '@Config/server'
import { serverErrorConfig } from '@Config/server'
import { initController } from '@Config/controller'
import { registerContainer } from '@Config/inversify'
import { initCollections } from '@Config/collections'
import { initSocket } from '@Config/socket'
import { subscribeRabbitMQ } from '@Config/subscribeRabbitMQ'
import { registerRoutes } from '@Config/registerRoutes'

const Bootstrap = async () => {

    const PREFIX = env.PREFIX
    const PORT = env.PORT

    console.info('  >> NAME: ', PREFIX)
    console.info('  >> PID : ', process.pid)

    await registerContainer()
    await initCollections()
    await initController()
    await subscribeRabbitMQ()

    const rootPath = `/api/${PREFIX}`
    const app = express()
    const server = new InversifyExpressServer(ContainerGlobal, null, { rootPath }, app)
    server.setConfig((app) => serverConfig(app, rootPath))
    server.setErrorConfig(serverErrorConfig)
    const expressApp = server.build()

    await registerRoutes(rootPath)

    const httpServer = initSocket(expressApp)

    httpServer.listen(PORT, () => {
        console.info('\x1b[32m%s\x1b[0m', `❱❱❱✱ ✱ ✱ Express started on port ${PORT} ✱ ✱ ✱ ❰❰❰`)
    })

}

Bootstrap()