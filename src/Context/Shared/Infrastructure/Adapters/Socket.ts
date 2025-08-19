import { injectable } from 'inversify'
import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import { InternalServerException } from '@Config/exception'

@injectable()
export class AdapterSocket {

    private io!: Server

    initialize(httpServer: HttpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: "*",
            }
        })

        console.log('\x1b[36m%s\x1b[0m', '>>> Servidor WebSocket iniciado correctamente')

        this.io.on('connection', (socket: Socket) => {
            console.log(`🟢 Cliente conectado: ${socket.id}`)

            // socket.on('message', (msg) => {
            //     console.log(`📩 Mensaje recibido: ${msg}`)
            //     this.io.emit('message', msg)
            // })

            socket.on('disconnect', () => {
                console.log(`🔴 Cliente desconectado: ${socket.id}`)
            })
        })
    }

    getIO() {
        if (!this.io) {
            throw new InternalServerException('Socket.IO no ha sido inicializado.')
        }
        return this.io
    }
}
