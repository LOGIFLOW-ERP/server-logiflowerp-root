import { globSync, Dirent } from 'fs'
import path from 'path'
import { ContainerGlobal } from './inversify'

async function init(paths: Dirent[]) {
    for (const rute of paths) {
        const newPath = path.join('../', `${rute.parentPath.split('src').pop()}/${rute.name}`.replace('.js', ''))
        const { Worker } = await import(newPath)
        await ContainerGlobal.resolve<any>(Worker).exec()
    }
}

export const subscribeRabbitMQ = async () => {
    const cwd = path.resolve(__dirname, '../Context')
    const paths = globSync(['**/*.worker.js', '**/*.worker.ts'], { withFileTypes: true, cwd })
    await init(paths)
}