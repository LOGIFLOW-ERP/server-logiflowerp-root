import { IndexEntity } from '@Shared/Domain'
import { collection, db } from './Infrastructure/config'
import { Bootstraping } from '@Shared/Bootstraping'
import { SystemOptionENTITY } from 'logiflowerp-sdk'
import { inject } from 'inversify'
import { SHARED_TYPES } from '@Shared/Infrastructure'

export class ManagerEntity {
    private database = db
    private collection = collection
    private indexes: IndexEntity<SystemOptionENTITY>[] = [
        {
            campos: { key: 1, root: 1 },
            opciones: { name: 'idx_key_root', unique: true }
        }
    ]

    constructor(
        @inject(SHARED_TYPES.Bootstraping) private bootstrap: Bootstraping,
    ) { }

    async exec() {
        console.info(`➽  Configurando ${this.collection} en ${this.database} ...`)
        await this.bootstrap.exec(this.database, this.collection, this.indexes)
        console.info(`➽  Configuración de ${this.collection} en ${this.database} completada`)
    }
}