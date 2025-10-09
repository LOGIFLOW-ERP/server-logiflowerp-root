import { IMongoRepository } from '@Shared/Domain'
import { WINOrderENTITY } from 'logiflowerp-sdk'

export interface IWINOrderMongoRepository extends IMongoRepository<WINOrderENTITY> { }