import { CreateIndexesOptions, IndexSpecification } from 'mongodb'

export interface IndexesEntity {
    value: IndexSpecification
    opt: CreateIndexesOptions
}