import { AdapterMongoDB } from '@Shared/Infrastructure'
import { AuthUserDTO } from 'logiflowerp-sdk'
import {
    ClientSession,
    Collection,
    Document,
    Filter,
    MongoClient,
    OptionalUnlessRequiredId,
    UpdateFilter
} from 'mongodb'

export interface IParamsTransaction<T extends Document> {
    session: ClientSession
    client: MongoClient
    col: Collection<T>
    doc?: OptionalUnlessRequiredId<T>
    docs?: OptionalUnlessRequiredId<T>[]
    filter?: Filter<T>
    update?: T[] | UpdateFilter<T>
    adapterMongo: AdapterMongoDB
    user: AuthUserDTO
}