import { IMongoRepository } from '@Shared/Domain'
import { SystemOptionENTITY } from 'logiflowerp-sdk'

export interface ISystemOptionMongoRepository extends IMongoRepository<SystemOptionENTITY> { }