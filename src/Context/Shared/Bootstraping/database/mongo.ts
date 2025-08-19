import { IndexEntity, IndexesEntity } from '@Shared/Domain'
import { AdapterMongoDB } from '@Shared/Infrastructure/Adapters/MongoDB'
import { SHARED_TYPES } from '@Shared/Infrastructure/IoC/types'
import { inject, injectable } from 'inversify'
import { Document, IndexDescription } from 'mongodb'

@injectable()
export class BootstrapingDatabaseMongo {

    private indexes: IndexesEntity[] = []

    constructor(
        @inject(SHARED_TYPES.AdapterMongoDB) private adapterMongo: AdapterMongoDB
    ) { }

    async exec(database: string, collection: string, indexes: IndexEntity<Document>[]) {
        await this.createCollection(database, collection)
        this.generateIndexes(indexes)
        await this.createIndexes(database, collection)
    }

    private async createCollection(database: string, collection: string) {
        const client = await this.adapterMongo.connection()
        const db = client.db(database)
        const collections = await db.listCollections().toArray()
        if (!collections.some(col => col.name === collection)) {
            await db.createCollection(collection)
        }
    }

    private async createIndexes(database: string, collection: string) {
        const client = await this.adapterMongo.connection()
        const db = client.db(database)
        const col = db.collection(collection)

        const existingIndexes: IndexDescription[] = await col.listIndexes().toArray()
        const existingIndexMap = new Map<string, any>()

        for (const index of existingIndexes) {
            if (!index.name) continue
            if (index.name !== '_id_') {
                existingIndexMap.set(index.name, index)
            }
        }

        if (this.indexes.length === 0) {
            for (const indexName of existingIndexMap.keys()) {
                console.log(`Eliminando índice: ${indexName}`)
                await col.dropIndex(indexName)
            }
            return
        }

        const newIndexNames = new Set(this.indexes.map(i => i.opt.name))

        for (const indexName of existingIndexMap.keys()) {
            if (!newIndexNames.has(indexName)) {
                console.log(`Índice eliminado: ${indexName}`)
                await col.dropIndex(indexName)
            }
        }

        for (const row of this.indexes) {

            if (!row.opt.name) continue

            const existingIndex = existingIndexMap.get(row.opt.name)

            if (existingIndex) {
                if (
                    JSON.stringify(existingIndex.key) !== JSON.stringify(row.value) ||
                    existingIndex.unique !== row.opt.unique
                ) {
                    console.log(`Índice cambiado: ${row.opt.name}, eliminando y recreando...`)
                    await col.dropIndex(row.opt.name)
                    await col.createIndex(row.value, row.opt)
                }
            } else {
                console.log(`Índice nuevo: ${row.opt.name}, creándolo...`);
                await col.createIndex(row.value, row.opt)
            }
        }

    }

    private generateIndexes(indexes: IndexEntity<Document>[]) {
        for (const row of indexes) {
            this.indexes.push({
                opt: row.opciones,
                value: row.campos
            })
        }
    }

}