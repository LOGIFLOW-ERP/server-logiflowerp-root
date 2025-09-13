import { IMongoRepository } from '@Shared/Domain'
import { TOAOrderENTITY } from 'logiflowerp-sdk'

export interface ITOAOrderMongoRepository extends IMongoRepository<TOAOrderENTITY> { }