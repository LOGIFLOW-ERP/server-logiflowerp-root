import { IMongoRepository } from '@Shared/Domain'
import { ScrapingCredentialENTITY } from 'logiflowerp-sdk'

export interface IScrapingCredentialMongoRepository extends IMongoRepository<ScrapingCredentialENTITY> { }