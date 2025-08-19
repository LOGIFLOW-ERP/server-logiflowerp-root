import { BadRequestException } from '@Config/exception'
import { ContainerGlobal } from '@Config/inversify'
import { IFind } from '@Shared/Domain'
import { AdapterRedis, SHARED_TYPES } from '@Shared/Infrastructure'
import { PassThrough } from 'stream'

export async function queryOnRedis_AndResponse(params: IFind) {
    const { key, res } = params

    if (!key) {
        throw new BadRequestException('Falta key en la consulta')
    }

    const stream = new PassThrough()
    const redis = ContainerGlobal.get<AdapterRedis>(SHARED_TYPES.AdapterRedis)

    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    stream.pipe(res)
    let isFirstChunk = true
    stream.write('[')
    const result = await redis.client.xRead({ key, id: '0-0' })
    if (result) {
        for (const { messages } of result) {
            for (const { message } of messages) {
                const data = message.data
                if (!isFirstChunk) {
                    stream.write(',')
                }
                stream.write(data)
                isFirstChunk = false
            }
        }
    }
    stream.end(']')
    res.on('close', () => {
        console.log('El cliente se desconectó, cerrando flujo. Query on Redis and response')
    })
}