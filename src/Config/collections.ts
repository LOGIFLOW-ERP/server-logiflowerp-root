import { Dirent, globSync } from 'fs'
import path from 'path'
import { ContainerGlobal } from './inversify'

async function initcollection(paths: Dirent[]) {
    for (let rute of paths) {
        const newPath = path.join('../', `${rute.parentPath.split('src').pop()}/${rute.name}`)
        const { ManagerEntity } = await import(newPath)
        const instance = ContainerGlobal.resolve<any>(ManagerEntity)
        await instance.exec()
    }
}

export const initCollections = async () => {
    const cwd = path.resolve(__dirname, '../Context')
    const paths = globSync(['**/Bootstrap.js', '**/Bootstrap.ts'], { withFileTypes: true, cwd })
    await initcollection(paths)
}