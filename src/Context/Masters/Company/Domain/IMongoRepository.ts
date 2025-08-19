import { IMongoRepository } from '@Shared/Domain'
import { RootCompanyENTITY } from 'logiflowerp-sdk'

export interface ICompanyMongoRepository extends IMongoRepository<RootCompanyENTITY> { }