import { Application } from 'express'
import http from 'http'
import { ContainerGlobal } from './inversify'
import { AdapterSocket, SHARED_TYPES } from '@Shared/Infrastructure'

export function initSocket(expressApp: Application) {

    const httpServer = http.createServer(expressApp)

    const socketService = ContainerGlobal.get<AdapterSocket>(SHARED_TYPES.AdapterSocket)
    socketService.initialize(httpServer)

    return httpServer
}