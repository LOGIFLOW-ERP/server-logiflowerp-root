import { CONFIG_TYPES } from '@Config/types'
import { inject, injectable } from 'inversify'
import { Collection, Document } from 'mongodb'
import { createClient, RedisClientType } from 'redis'

@injectable()
export class AdapterRedis {

    private _client: RedisClientType

    constructor(
        @inject(CONFIG_TYPES.Env) private readonly env: Env,
    ) {
        this._client = createClient({ url: env.REDIS_URL })

        this._client.on('connect', () => console.log('\x1b[36m%s\x1b[0m', '>>> Redis conectado'))
        this._client.on('error', (error) => console.error('❌ Redis error:', error.message))
        this._client.on('reconnecting', () => console.warn('🔄 Redis intentando reconectar...'))
        this._client.on('end', () => console.warn('🚫 Redis desconectado'))

        this._client.connect()
    }

    async getKeysCollection<T extends Document>(col: Collection<T>) {
        return await this._client.keys(`${col.dbName}--${col.collectionName}--*`)
    }

    async deleteKeysCollection<T extends Document>(col: Collection<T>) {
        const keys = await this.getKeysCollection(col)
        if (keys.length) {
            await this._client.del(keys)
        }
    }

    get client() {
        return this._client
    }

}