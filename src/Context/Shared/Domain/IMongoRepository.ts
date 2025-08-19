import { Request, Response } from 'express'
import {
    Document,
    Filter,
    OptionalUnlessRequiredId,
    UpdateFilter,
    WithId
} from 'mongodb'

export interface IMongoRepository<T extends Document> {
    find(pipeline: Document[], req: Request, res: Response): Promise<void>
    /**
     * Ejecuta una consulta y devuelve los documentos encontrados.
     * @param query - Pipeline de agregación o consulta.
     * @param collection - Nombre de la colección (opcional).
     * @param database - Nombre de la base de datos (opcional).
     * @returns Arreglo de documentos encontrados.
     */
    select<ReturnType extends Document = T>(query: Document[], collection?: string, database?: string): Promise<ReturnType[]>
    /**
     * Ejecuta una consulta y espera encontrar exactamente un documento.
     * Lanza error si no encuentra ninguno o si encuentra más de uno.
     * @returns El documento encontrado.
     */
    selectOne<ReturnType extends Document = T>(query: Document[], collection?: string, database?: string): Promise<ReturnType>
    insertOne(doc: OptionalUnlessRequiredId<T>): Promise<WithId<T>>
    updateOne(filter: Filter<T>, update: T[] | UpdateFilter<T>): Promise<WithId<T>>
    insertMany(objs: OptionalUnlessRequiredId<T>[]): Promise<WithId<T>[]>
    deleteMany(filter: Filter<T>): Promise<WithId<T>[]>
    deleteOne(filter: Filter<T>): Promise<WithId<T>>
    executeTransactionBatch<R>(transactions: ITransaction<T>[]): Promise<R[]>
    /**
     * Ejecuta una agregación sobre una colección MongoDB y memoriza el resultado en Redis.
     * Si existe una entrada cacheada en Redis para la combinación de base de datos, colección y pipeline,
     * retorna esa directamente. En caso contrario, ejecuta la consulta en MongoDB, guarda el resultado en Redis
     * y lo retorna.
     *
     * Esta función está pensada para consultas repetibles cuyo resultado no cambia frecuentemente,
     * optimizando el rendimiento mediante almacenamiento temporal en caché.
     *
     * @param pipeline - El pipeline de agregación a ejecutar.
     * @param collection - El nombre de la colección sobre la cual se ejecutará el pipeline.
     * @param database - El nombre de la base de datos a consultar.
     * @returns Un arreglo con los documentos encontrados, ya sea desde MongoDB o Redis.
     */
    queryMongoWithRedisMemo<ReturnType extends Document = T>(pipeline: Document[], collection?: string, database?: string): Promise<ReturnType[]>
}