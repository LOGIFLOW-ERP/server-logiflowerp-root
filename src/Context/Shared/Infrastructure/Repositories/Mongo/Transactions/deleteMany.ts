import { BadRequestException, InternalServerException, UnprocessableEntityException } from '@Config/exception'
import { IParamsTransaction, LogEntity } from '@Shared/Domain'
import { Document } from 'mongodb'

export async function _deleteMany<T extends Document>(params: IParamsTransaction<T>) {

    const { session, client, col, adapterMongo, filter, user } = params

    if (!filter) {
        throw new BadRequestException('Se requiere parámetro filter')
    }

    const documents = await col.find(filter, { session, readPreference: 'primary' }).toArray()
    if (!documents.length) {
        throw new InternalServerException('No se encontró documentos con filtros indicados')
    }

    // const response = await col.deleteMany(filter, { session })
    // if (!response.acknowledged) {
    //     throw new UnprocessableEntityException('No se eliminaron los documentos')
    // }

    // if (documents.length !== response.deletedCount) {
    //     throw new InternalServerException('No se eliminaron los documentos')
    // }

    const response = await col.updateMany(filter, { $set: { isDeleted: true } as any }, { session })
    if (!response.acknowledged) {
        throw new UnprocessableEntityException('No se eliminaron los documentos')
    }

    if (documents.length !== response.upsertedCount) {
        throw new InternalServerException('No se eliminaron los documentos')
    }

    const logDocument: LogEntity<T> = {
        db: col.dbName,
        col: col.collectionName,
        operacion: 'DELETE MANY',
        antiguoValor: documents,
        nuevoValor: null,
        fecha: new Date(),
        idUsuario: user._id
    }

    await adapterMongo.insertLog<T>(logDocument, session, client)

    return documents

}