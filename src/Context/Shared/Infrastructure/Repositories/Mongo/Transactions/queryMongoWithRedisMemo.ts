import { InternalServerException } from '@Config/exception'
import { ContainerGlobal } from '@Config/inversify'
import { IFind } from '@Shared/Domain'
import { AdapterRedis, SHARED_TYPES } from '@Shared/Infrastructure'
import { Document } from 'mongodb'

export async function _queryMongoWithRedisMemo<T extends Document>(params: Pick<IFind, 'collection' | 'pipeline'>) {

    const { collection, pipeline } = params

    const key = `${collection.dbName}--${collection.collectionName}--${JSON.stringify(pipeline)}`
    const lockKey = `lock:${key}`
    const redis = ContainerGlobal.get<AdapterRedis>(SHARED_TYPES.AdapterRedis)

    // Verificar si ya hay datos en Redis
    const exist = await redis.client.xLen(key)
    if (exist) {
        const result = await redis.client.xRead({ key, id: '0-0' })
        if (!result) {
            throw new InternalServerException(`No se encontraron datos en el stream de Redis para la clave solicitada ${key}.`);
        }
        return result.flatMap(e =>
            e.messages.map(m => JSON.parse(m.message.data) as T)
        )
    }

    // Intentar tomar el lock
    const initialTTL = 10000; // 10s
    const lock = await redis.client.set(lockKey, 'locked', {
        NX: true,
        PX: initialTTL,
    });

    if (!lock) {
        // Otro proceso tiene el lock → esperar a que los datos estén listos
        const timeout = 30000; // 30s máximo para esperar
        const interval = 200;  // cada cuánto chequear
        let waited = 0;

        while (waited < timeout) {
            const existLater = await redis.client.xLen(key);
            if (existLater) {
                const result = await redis.client.xRead({ key, id: '0-0' });
                return result?.flatMap(e =>
                    e.messages.map(m => JSON.parse(m.message.data) as T)
                ) ?? [];
            }
            await new Promise(r => setTimeout(r, interval));
            waited += interval;
        }

        throw new InternalServerException(`Timeout esperando que los datos se escriban en Redis para la clave ${key}`);
    }

    // Este proceso tiene el lock → mantenerlo vivo
    let keepAlive = true;
    const renewalInterval = initialTTL / 2;

    const renewer = setInterval(async () => {
        if (!keepAlive) return;
        // Renovar el lock si sigue activo
        await redis.client.set(lockKey, 'locked', { PX: initialTTL });
    }, renewalInterval);

    // Acceder a MongoDB y escribir en Redis
    try {
        const documents = await collection.aggregate<T>(pipeline).toArray();
        for (const doc of documents) {
            await redis.client.xAdd(key, '*', { data: JSON.stringify(doc) });
        }
        return documents;
    } finally {
        // Liberar lock y detener keep-alive
        keepAlive = false;
        clearInterval(renewer);
        await redis.client.del(lockKey);
    }
}
