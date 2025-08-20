import { IMongoRepository } from '@Shared/Domain'
import { SystemOptionENTITY } from 'logiflowerp-sdk'

export interface ISystemOptionRootMongoRepository extends IMongoRepository<SystemOptionENTITY> { }