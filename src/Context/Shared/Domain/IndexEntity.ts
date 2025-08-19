import { CreateIndexesOptions } from 'mongodb'

export interface IndexEntity<T> {
    campos: Partial<Record<keyof T, number>> & Record<string, number>
    opciones: CreateIndexesOptions
}
