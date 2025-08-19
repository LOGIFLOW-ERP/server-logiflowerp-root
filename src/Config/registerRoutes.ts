import { ContainerGlobal } from './inversify'
import { getRouteInfo, RouteInfo } from 'inversify-express-utils'
import { AuthUserDTO, builSystemOption, collections, db_root, SystemOptionENTITY } from 'logiflowerp-sdk'
import { UnprocessableEntityException } from './exception'
import { env } from './env'
import { MongoRepository } from '@Shared/Infrastructure'
import { styleText } from 'util'

export async function registerRoutes(rootPath: string) {
    const routes = getRouteInfo(ContainerGlobal)
    try {
        const repositoryMongoSystemOption = new MongoRepository<SystemOptionENTITY>(db_root, collections.systemOptionRoot, new AuthUserDTO())

        const execRoot = async (rawData: RouteInfo[], rootPath: string, prefix: string) => {
            const dataDB = await repositoryMongoSystemOption.select([{ $match: { prefix, root: true } }])
            const rawDataAux = rawData.filter(e => e.controller.startsWith('Root'))
            const { _ids, newData } = await builSystemOption({
                dataDB,
                prefix,
                rawData: rawDataAux,
                rootPath,
                UnprocessableEntityException,
                root: true
            })
            if (_ids.length) {
                await repositoryMongoSystemOption.deleteMany({ _id: { $in: _ids } })
            }
            if (newData.length) {
                await repositoryMongoSystemOption.insertMany(newData)
            }
        }

        const execNoRoot = async (rawData: RouteInfo[], rootPath: string, prefix: string) => {
            const dataDB = await repositoryMongoSystemOption.select([{ $match: { prefix, root: false } }])
            const rawDataAux = rawData.filter(e => !e.controller.startsWith('Root'))
            const { _ids, newData } = await builSystemOption({
                dataDB,
                prefix,
                rawData: rawDataAux,
                rootPath,
                UnprocessableEntityException
            })
            if (_ids.length) {
                await repositoryMongoSystemOption.deleteMany({ _id: { $in: _ids } })
            }
            if (newData.length) {
                await repositoryMongoSystemOption.insertMany(newData)
            }
        }

        await execRoot(routes, rootPath, env.PREFIX)
        await execNoRoot(routes, rootPath, env.PREFIX)
        console.log(styleText('yellow', '>>> Routes registered successfully.'))
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}