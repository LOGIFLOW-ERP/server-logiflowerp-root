import { InternalServerException } from '@Config/exception'
import { CONFIG_TYPES } from '@Config/types'
import { LogEntity } from '@Shared/Domain'
import { info } from 'console'
import { inject, injectable } from 'inversify'
import { ClientSession, MongoClient, ReadConcern, ReadPreference } from 'mongodb'

@injectable()
export class AdapterMongoDB {

    private clientInstance: MongoClient | null = null

    constructor(
        @inject(CONFIG_TYPES.Env) private readonly env: Env,
    ) { }

    async connection(uri = this.env.MONGO_URI, retries = 5): Promise<MongoClient> {
        if (this.clientInstance) return this.clientInstance
        try {
            this.clientInstance = await MongoClient.connect(uri, {
                // directConnection: false,
                maxPoolSize: 10,
                minPoolSize: 2
            })
            info('\x1b[36m%s\x1b[0m', '>>> Conectado a Mongo')
            process.on('SIGINT', async () => {
                await this.closeConnection()
                process.exit(0)
            })
            process.on('SIGTERM', async () => {
                await this.closeConnection()
                process.exit(0)
            })
            return this.clientInstance
        } catch (error) {
            if ((error as Error).message.includes('EADDRINUSE') && retries > 0) {
                console.warn(`Reintentando conexión... (${5 - retries + 1}/5)`);
                await new Promise(resolve => setTimeout(resolve, 1000))
                return await this.connection(uri, retries - 1)
            }
            console.error(error)
            const msg = 'No es posible establecer conexión con la base de datos'
            throw new InternalServerException(msg)
        }
    }

    async closeConnection() {
        if (this.clientInstance) {
            await this.clientInstance.close(true)
            info('Desconectado de Mongo')
            this.clientInstance = null
        }
    }

    async openSession(client: MongoClient) {
        try {
            await client.db().command({ ping: 1 })
        } catch (error) {
            console.error(error)
            const msg = 'No se puede iniciar sesión porque la conexión no está establecida.'
            throw new InternalServerException(msg)
        }
        return client.startSession({
            causalConsistency: true,
            defaultTransactionOptions: {
                readPreference: ReadPreference.primaryPreferred
            }
        })
    }

    async closeSession(session: ClientSession) {
        try {
            if (!session.hasEnded) {
                if (session.inTransaction()) {
                    console.warn('Abortando transacción antes de cerrar sesión.')
                    await session.abortTransaction()
                }
                await session.endSession()
            }
        } catch (error) {
            console.error('Error al cerrar la sesión:', error)
        }
    }

    async openTransaction(session: ClientSession) {
        if (session.inTransaction()) {
            throw new InternalServerException('Ya existe una transacción iniciada.')
        }
        try {
            session.startTransaction({
                readConcern: {
                    level: ReadConcern.SNAPSHOT
                },
                writeConcern: {
                    w: 1
                }
            })
        } catch (error) {
            console.error(error)
            throw new InternalServerException('Error al iniciar la transacción.')
        }
    }

    async commitTransaction(session: ClientSession) {
        if (!session.inTransaction()) {
            throw new InternalServerException('No existe una transacción.')
        }
        await session.commitTransaction()
    }

    async rollbackTransaction(session: ClientSession) {
        try {
            if (!session.inTransaction()) {
                throw new InternalServerException('No existe una transacción.')
            }
            await session.abortTransaction()
        } catch (error) {
            console.error('Error al hacer rollback:', error)
        }
    }

    async insertLog<T>(obj: LogEntity<T>, session: ClientSession, client: MongoClient) {
        const col = client.db(`LOG_${obj.db}`).collection(obj.col)
        await col.insertOne(obj, { session })
    }

}