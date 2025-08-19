import {
    BadRequestException,
    InternalServerException,
    NotFoundException
} from '@Config/exception'
import { IParamsTransaction, LogEntity } from '@Shared/Domain'
import { Document } from 'mongodb'

export async function _updateOne<T extends Document>(params: IParamsTransaction<T>) {

    const { filter, col, session, update, adapterMongo, client, user } = params

    if (!filter || !update) {
        throw new BadRequestException('Se requieren parámetros filter y update')
    }

    const oldDocument = await col.findOne(filter, { session, readPreference: 'primary' })
    if (!oldDocument) {
        throw new NotFoundException('Documento no encontrado')
    }

    const updateResult = await col.updateOne(filter, update, { session })
    if (!updateResult.acknowledged) {
        throw new InternalServerException('No se pudo actualizar el documento')
    }

    const newDocument = await col.findOne(filter, { session, readPreference: 'primary' })
    if (!newDocument) {
        throw new InternalServerException('No se pudo recuperar el documento actualizado')
    }

    const logDocument: LogEntity<T> = {
        db: col.dbName,
        col: col.collectionName,
        operacion: 'UPDATE ONE',
        antiguoValor: oldDocument,
        nuevoValor: newDocument,
        fecha: new Date(),
        idUsuario: user._id
    }

    await adapterMongo.insertLog<T>(logDocument, session, client)

    return newDocument

}