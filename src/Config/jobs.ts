import { globSync } from 'fs'
import { join, resolve } from 'path'
import { env } from './env'
import { ContainerGlobal } from './inversify'

async function _initJobs(paths: any[]) {
  const managers: any[] = []
  for (const rute of paths) {
    const newPath = join(__dirname, '../', `${rute.parentPath.split('src').pop()}/${rute.name}`)
    const { Job } = await import(newPath)
    ContainerGlobal.resolve<any>(Job)
  }
  return managers
}

export const initJobs = async () => {
  if (!env.JOBS) return
  const cwd = resolve(__dirname, '../../src')
  const paths = globSync([`**/*.job.js`, `**/*.job.ts`], { withFileTypes: true, cwd })
  await _initJobs(paths)
}