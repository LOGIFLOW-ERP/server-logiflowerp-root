import { IMongoRepository } from '@Shared/Domain'
import { SystemOptionENTITY } from 'logiflowerp-sdk'

export interface IRootSystemOptionMongoRepository extends IMongoRepository<SystemOptionENTITY> { }