import { Container } from 'inversify'
import { Dirent, globSync } from 'fs'
import { join, resolve } from 'path'

let ContainerGlobal: Container
const _container = new Container()

async function merge(paths: Dirent[]) {
    for (const rute of paths) {
        const filePath = join(__dirname, '../', `${rute.parentPath.split('src').pop()}/${rute.name}`)
        const { containerModule } = await import(filePath)
        _container.load(containerModule)
    }
    return _container
}

export const registerContainer = async () => {
    const cwd = resolve(__dirname, '../../src')
    const paths = globSync(['**/Container.ts', '**/Container.js'], { withFileTypes: true, cwd })
    ContainerGlobal = await merge(paths)
}

export { ContainerGlobal }
