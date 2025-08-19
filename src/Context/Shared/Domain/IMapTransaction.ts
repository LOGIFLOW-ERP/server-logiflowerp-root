import { Document, WithId } from 'mongodb'
import { IParamsTransaction } from './IParamsTransaction'

export interface IMapTransaction {
    insertOne<T extends Document>(params: IParamsTransaction<T>): Promise<WithId<T>>
    updateOne<T extends Document>(params: IParamsTransaction<T>): Promise<WithId<T>>
}