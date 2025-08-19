import { BadRequestException, InternalServerException, UnprocessableEntityException } from '@Config/exception'
import { IParamsTransaction, LogEntity } from '@Shared/Domain'
import { Document, Filter } from 'mongodb'

export async function _insertMany<T extends Document>(params: IParamsTransaction<T>) {

    const { session, client, col, docs, adapterMongo ,user} = params

    if (!docs) {
        throw new BadRequestException('Se requiere parámetro docs')
    }

    if (!docs.length) {
        throw new BadRequestException('Se requiere al menos un elemento en el parámetro docs')
    }

    const response = await col.insertMany(docs, { session })
    if (!response.acknowledged) {
        throw new UnprocessableEntityException('No se pudo guardar los documentos')
    }

    const filter = { _id: { $in: Object.values(response.insertedIds) } } as Filter<T>
    const newsDocuments = await col.find(filter, { session, readPreference: 'primary' }).toArray()
    if (newsDocuments.length !== response.insertedCount) {
        throw new InternalServerException('Los documentos no se encontraron después de la inserción')
    }

    const logDocument: LogEntity<T> = {
        db: col.dbName,
        col: col.collectionName,
        operacion: 'INSERT MANY',
        antiguoValor: null,
        nuevoValor: newsDocuments,
        fecha: new Date(),
        idUsuario: user._id
    }

    await adapterMongo.insertLog<T>(logDocument, session, client)

    return newsDocuments

}