import { Dirent, globSync } from 'fs'
import { controller } from 'inversify-express-utils'
import { join, resolve, sep } from 'path'

async function initManger(paths: Dirent[]) {
    for (const rute of paths) {

        const filePath = join('../', `${rute.parentPath.split('src').pop()}/${rute.name}`)
        const controllerModule = await import(filePath)

        const controllerClass = controllerModule[Object.keys(controllerModule)[0]]

        const fn = rute.parentPath.split(sep)
        const routePath = `/${fn[fn.length - 3]}/${fn[fn.length - 2]}/`

        controller(routePath)(controllerClass)
    }
}

export const initController = async () => {
    const cwd = resolve(__dirname, '../Context')
    const paths = globSync(['**/Controller.js', '**/Controller.ts'], { withFileTypes: true, cwd })
    await initManger(paths)
}