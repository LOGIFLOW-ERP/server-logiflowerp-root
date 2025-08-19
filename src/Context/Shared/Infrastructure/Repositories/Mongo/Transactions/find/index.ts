import { IFind } from '@Shared/Domain'
import { AdapterRedis, SHARED_TYPES } from '@Shared/Infrastructure'
import { queryOnDBAndResponse } from './queryOnDBAndResponse'
import { ContainerGlobal } from '@Config/inversify'
import { queryOnRedis_AndResponse } from './queryOnRedis_AndResponse'
import { queryOnDB_WriteRedis_AndResponse } from './queryOnDB_WriteRedis_AndResponse'

export async function _find(params: IFind) {

    const { req, collection, pipeline } = params

    const key = req.query.key === 'true'
        ? `${collection.dbName}--${collection.collectionName}--${JSON.stringify(pipeline)}`
        : ``

    if (!key) return queryOnDBAndResponse(params)

    // validateNoLookup(pipeline)

    const redis = ContainerGlobal.get<AdapterRedis>(SHARED_TYPES.AdapterRedis)

    await redis.client.xLen(key)
        ? await queryOnRedis_AndResponse({ ...params, key })
        : queryOnDB_WriteRedis_AndResponse({ ...params, key })

}