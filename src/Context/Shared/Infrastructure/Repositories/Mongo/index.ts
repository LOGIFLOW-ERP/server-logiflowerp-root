import { ContainerGlobal } from '@Config/inversify'
import { IMapTransaction, IMongoRepository } from '@Shared/Domain'
import { AdapterMongoDB, AdapterRedis, SHARED_TYPES } from '@Shared/Infrastructure'
import { Request, Response } from 'express'
import { Document, Filter, OptionalUnlessRequiredId, UpdateFilter } from 'mongodb'
import {
    _deleteMany,
    _deleteOne,
    _find,
    _insertMany,
    _insertOne,
    _queryMongoWithRedisMemo,
    _select,
    _selectOne,
    _updateOne,
    _validateAvailableEmployeeStocks
} from './Transactions'
import { BadRequestException } from '@Config/exception'
import { AuthUserDTO, collections } from 'logiflowerp-sdk'

export class MongoRepository<T extends Document> implements IMongoRepository<T> {

    protected database: string
    protected collection: string
    protected adapterMongo: AdapterMongoDB
    protected adapterRedis: AdapterRedis
    protected user: AuthUserDTO

    constructor(database: string, collection: string, user: AuthUserDTO) {
        this.database = database
        this.collection = collection
        this.user = user
        this.adapterMongo = ContainerGlobal.get(SHARED_TYPES.AdapterMongoDB)
        this.adapterRedis = ContainerGlobal.get(SHARED_TYPES.AdapterRedis)
    }

    async find(pipeline: Document[], req: Request, res: Response) {
        try {
            // const baseMatch = { $match: { isDeleted: { $ne: true } } }
            // const finalPipeline = [baseMatch, ...pipeline]
            const finalPipeline = pipeline
            const client = await this.adapterMongo.connection()
            const col = client.db(this.database).collection(this.collection)
            await _find({ collection: col, pipeline: finalPipeline, req, res })
        } catch (error) {
            throw error
        }
    }

    async select<ReturnType extends Document = T>(pipeline: Document[], collection: string = this.collection, database: string = this.database) {
        // const baseMatch = { $match: { isDeleted: { $ne: true } } }
        // const finalPipeline = [baseMatch, ...pipeline]
        const finalPipeline = pipeline
        const client = await this.adapterMongo.connection()
        const col = client.db(database).collection(collection)
        return await _select<ReturnType>({ collection: col, pipeline: finalPipeline })
    }

    async validateAvailableEmployeeStocks({ pipeline, _ids }: { pipeline?: Document[]; _ids?: string[] }, database: string = this.database) {
        // CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA
        // CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA
        // CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA
        const client = await this.adapterMongo.connection()
        const colEmployeeStock = client.db(database).collection(collections.employeeStock)
        const colWarehouseReturn = client.db(database).collection(collections.warehouseReturn)
        const colWinOrder = client.db(database).collection(collections.winOrder)
        const colWinOrderStock = client.db(database).collection(collections.winOrderStock)
        return _validateAvailableEmployeeStocks({ colEmployeeStock, colWarehouseReturn, colWinOrder, colWinOrderStock, pipeline, _ids })
    }

    async selectOne<ReturnType extends Document = T>(pipeline: Document[], collection: string = this.collection, database: string = this.database) {
        // const baseMatch = { $match: { isDeleted: { $ne: true } } }
        // const finalPipeline = [baseMatch, ...pipeline]
        const finalPipeline = pipeline
        const client = await this.adapterMongo.connection()
        const col = client.db(database).collection(collection)
        return await _selectOne<ReturnType>({ collection: col, pipeline: finalPipeline })
    }

    async queryMongoWithRedisMemo<ReturnType extends Document = T>(pipeline: Document[], collection: string = this.collection, database: string = this.database) {
        // const baseMatch = { $match: { isDeleted: { $ne: true } } }
        // const finalPipeline = [baseMatch, ...pipeline]
        const finalPipeline = pipeline
        const client = await this.adapterMongo.connection()
        const col = client.db(database).collection(collection)
        return await _queryMongoWithRedisMemo<ReturnType>({ collection: col, pipeline: finalPipeline })
    }

    async insertOne(doc: OptionalUnlessRequiredId<T>) {
        const client = await this.adapterMongo.connection()
        const session = await this.adapterMongo.openSession(client)
        try {
            const col = client.db(this.database).collection<T>(this.collection)
            await this.adapterMongo.openTransaction(session)
            const result = await _insertOne<T>({ client, col, session, doc, adapterMongo: this.adapterMongo, user: this.user })
            await this.adapterRedis.deleteKeysCollection(col)
            await this.adapterMongo.commitTransaction(session)
            return result
        } catch (error) {
            await this.adapterMongo.rollbackTransaction(session)
            throw error
        } finally {
            await this.adapterMongo.closeSession(session)
        }
    }

    async insertMany(docs: OptionalUnlessRequiredId<T>[]) {
        const client = await this.adapterMongo.connection()
        const session = await this.adapterMongo.openSession(client)
        try {
            const col = client.db(this.database).collection<T>(this.collection)
            await this.adapterMongo.openTransaction(session)
            const result = await _insertMany<T>({ client, col, session, docs, adapterMongo: this.adapterMongo, user: this.user })
            await this.adapterRedis.deleteKeysCollection(col)
            await this.adapterMongo.commitTransaction(session)
            return result
        } catch (error) {
            await this.adapterMongo.rollbackTransaction(session)
            throw error
        } finally {
            await this.adapterMongo.closeSession(session)
        }
    }

    async deleteMany(filter: Filter<T>) {
        const filterWithDeleted = { ...filter, isDeleted: false }
        const client = await this.adapterMongo.connection()
        const session = await this.adapterMongo.openSession(client)
        try {
            const col = client.db(this.database).collection<T>(this.collection)
            await this.adapterMongo.openTransaction(session)
            const result = await _deleteMany<T>({ client, col, session, filter: filterWithDeleted, adapterMongo: this.adapterMongo, user: this.user })
            await this.adapterRedis.deleteKeysCollection(col)
            await this.adapterMongo.commitTransaction(session)
            return result
        } catch (error) {
            await this.adapterMongo.rollbackTransaction(session)
            throw error
        } finally {
            await this.adapterMongo.closeSession(session)
        }
    }

    async updateOne(filter: Filter<T>, update: T[] | UpdateFilter<T>) {
        const filterWithDeleted = { ...filter, isDeleted: false }
        const client = await this.adapterMongo.connection()
        const session = await this.adapterMongo.openSession(client)
        try {
            const col = client.db(this.database).collection<T>(this.collection)
            await this.adapterMongo.openTransaction(session)
            const result = await _updateOne<T>({ client, col, session, filter: filterWithDeleted, update, adapterMongo: this.adapterMongo, user: this.user })
            await this.adapterRedis.deleteKeysCollection(col)
            await this.adapterMongo.commitTransaction(session)
            return result
        } catch (error) {
            await this.adapterMongo.rollbackTransaction(session)
            throw error
        } finally {
            await this.adapterMongo.closeSession(session)
        }
    }

    async deleteOne(filter: Filter<T>) {
        const filterWithDeleted = { ...filter, isDeleted: false }
        const client = await this.adapterMongo.connection()
        const session = await this.adapterMongo.openSession(client)
        try {
            const col = client.db(this.database).collection<T>(this.collection)
            await this.adapterMongo.openTransaction(session)
            const result = await _deleteOne<T>({ client, col, session, filter: filterWithDeleted, adapterMongo: this.adapterMongo, user: this.user })
            await this.adapterRedis.deleteKeysCollection(col)
            await this.adapterMongo.commitTransaction(session)
            return result
        } catch (error) {
            await this.adapterMongo.rollbackTransaction(session)
            throw error
        } finally {
            await this.adapterMongo.closeSession(session)
        }
    }

    async executeTransactionBatch(transactions: ITransaction<T>[]) {
        if (!transactions.length) throw new BadRequestException('El lote de transacciones no puede estar vacío')
        const client = await this.adapterMongo.connection()
        const session = await this.adapterMongo.openSession(client)
        const response: any[] = []
        const keys: string[] = []
        try {
            await this.adapterMongo.openTransaction(session)
            const mapTransaction: IMapTransaction = {
                insertOne: _insertOne,
                updateOne: _updateOne,
                insertMany: _insertMany
            }
            for (const transaction of transactions) {
                if (!mapTransaction[transaction.transaction]) {
                    throw new BadRequestException(`Invalid transaction type: ${transaction.transaction}`)
                }
                const database = transaction.database ? transaction.database : this.database
                const collection = transaction.collection ? transaction.collection : this.collection
                const col = client.db(database).collection<T>(collection)
                const filterWithDeleted = transaction.filter ? { ...transaction.filter, isDeleted: false } : undefined
                const result = await mapTransaction[transaction.transaction]({
                    adapterMongo: this.adapterMongo,
                    client,
                    col,
                    session,
                    doc: transaction.doc,
                    docs: transaction.docs,
                    filter: filterWithDeleted,
                    update: transaction.update,
                    user: this.user
                })
                const _keys = await this.adapterRedis.getKeysCollection(col)
                keys.push(..._keys)
                response.push(result)
            }
            await this.adapterMongo.commitTransaction(session)
            if (keys.length) {
                await this.adapterRedis.client.del(keys)
            }
            return response
        } catch (error) {
            await this.adapterMongo.rollbackTransaction(session)
            throw error
        } finally {
            await this.adapterMongo.closeSession(session)
        }
    }

}