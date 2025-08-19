import { WithId } from 'mongodb'
import { TypeOperation } from './TypeOperation'

export interface LogEntity<T> {
    db: string
    col: string
    operacion: TypeOperation
    antiguoValor: WithId<T> | WithId<T>[] | null
    nuevoValor: WithId<T> | WithId<T>[] | null
    fecha: Date
    idUsuario: string
}
