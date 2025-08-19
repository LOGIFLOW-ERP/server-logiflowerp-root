import { IFind } from '@Shared/Domain';
import { Document } from 'mongodb';

export async function _select<T extends Document>(params: Pick<IFind, 'collection' | 'pipeline'>) {
    const { collection, pipeline } = params
    return await collection.aggregate<T>(pipeline).toArray()
}