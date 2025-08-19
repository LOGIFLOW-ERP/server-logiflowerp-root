import {
    BadRequestException,
    InternalServerException,
    UnprocessableEntityException
} from '@Config/exception'
import { IParamsTransaction, LogEntity } from '@Shared/Domain'
import { Document, Filter } from 'mongodb'

export async function _insertOne<T extends Document>(params: IParamsTransaction<T>) {

    const { session, client, col, doc, adapterMongo, user } = params

    if (!doc) {
        throw new BadRequestException('Se requiere parámetro doc')
    }

    const response = await col.insertOne(doc, { session })
    if (!response.acknowledged) {
        throw new UnprocessableEntityException('No se pudo guardar el documento')
    }

    const filter = { _id: response.insertedId } as Filter<T>
    const newDocument = await col.findOne(filter, { session, readPreference: 'primary' })
    if (!newDocument) {
        throw new InternalServerException('El documento no se encontró después de la inserción')
    }

    const logDocument: LogEntity<T> = {
        db: col.dbName,
        col: col.collectionName,
        operacion: 'INSERT ONE',
        antiguoValor: null,
        nuevoValor: newDocument,
        fecha: new Date(),
        idUsuario: user._id
    }

    await adapterMongo.insertLog<T>(logDocument, session, client)

    return newDocument

}