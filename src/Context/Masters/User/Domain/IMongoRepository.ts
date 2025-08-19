import { IMongoRepository } from '@Shared/Domain'
import { UserENTITY } from 'logiflowerp-sdk'

export interface IUserMongoRepository extends IMongoRepository<UserENTITY> { }