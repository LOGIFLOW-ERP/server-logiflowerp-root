import { BadRequestException } from '@Config/exception'
import { ContainerGlobal } from '@Config/inversify'
import { IFind } from '@Shared/Domain'
import { AdapterRedis, SHARED_TYPES } from '@Shared/Infrastructure'
import { Document } from 'mongodb'
import { PassThrough } from 'stream'

export async function queryOnDB_WriteRedis_AndResponse<T extends Document>(params: IFind) {
    const { collection, pipeline, key, res } = params

    if (!key) {
        throw new BadRequestException('Falta key en la consulta')
    }

    const cursor = collection.aggregate<T>(pipeline).stream()
    const stream = new PassThrough()
    const redis = ContainerGlobal.get<AdapterRedis>(SHARED_TYPES.AdapterRedis)

    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    stream.pipe(res)
    let isFirstChunk = true
    stream.write('[')
    cursor.on('data', async (doc) => {
        const data = JSON.stringify(doc)
        if (!isFirstChunk) {
            stream.write(',')
        }
        stream.write(data)
        isFirstChunk = false
        await redis.client.xAdd(key, '*', { data })
    })
    cursor.on('end', async () => {
        stream.end(']')
    })
    cursor.on('error', async (err: any) => {
        console.error('Error leyendo del cursor:', err)
        stream.end(']')
        res.status(500).end(JSON.stringify({ statusCode: 500, errorMessage: 'Error leyendo del cursor' }))
    })
    res.on('close', () => {
        console.log('El cliente se desconectó, cerrando flujo. Query on DB write Redis and response')
        cursor.destroy()
    })
}
