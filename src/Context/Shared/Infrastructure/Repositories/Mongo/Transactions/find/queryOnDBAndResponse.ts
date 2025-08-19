import { IFind } from '@Shared/Domain'
import { Document } from 'mongodb'
import { PassThrough } from 'stream'
import { InternalServerException } from '@Config/exception'

export function queryOnDBAndResponse<T extends Document>(params: IFind) {
    const { pipeline, collection, res } = params
    const cursor = collection.aggregate<T>(pipeline).stream()
    const stream = new PassThrough()

    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    stream.pipe(res)
    let isFirstChunk = true
    stream.write('[')
    cursor.on('data', (doc) => {
        const data = JSON.stringify(doc)
        if (!isFirstChunk) {
            stream.write(',')
        }
        stream.write(data)
        isFirstChunk = false
    })
    cursor.on('end', async () => {
        stream.write(']')
        stream.end()
    })
    cursor.on('error', async (err: any) => {
        console.error('Error leyendo del cursor (0):', err)
        stream.end(']')
        res.end(JSON.stringify(new InternalServerException('Error leyendo del cursor')))
    })
    res.on('close', () => {
        cursor.destroy()
    })
}