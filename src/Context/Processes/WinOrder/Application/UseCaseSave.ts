import { inject, injectable } from 'inversify'
import { DataRequestSave, IWINOrderMongoRepository } from '../Domain'
import { WIN_ORDER_TYPES } from '../Infrastructure/IoC/types'
import {
    collections,
    RequestNumberTTLENTITY,
    WINOrderENTITY,
    StateOrderWin,
} from 'logiflowerp-sdk'

@injectable()
export class UseCaseSave {
    constructor(
        @inject(WIN_ORDER_TYPES.RepositoryMongo) private readonly repository: IWINOrderMongoRepository,
    ) { }

    async exec(data: DataRequestSave) {
        await this.saveData(data.db, data.data)
    }

    private async saveData(codeCompany: string, orders: WINOrderENTITY[]) {

        const pipeline = [
            {
                $match: {
                    numero_de_peticion: { $in: orders.map(e => e.numero_de_peticion) }
                }
            }
        ]
        const ordersDB = await this.repository.select(pipeline, collections.winOrder, codeCompany)

        const ordersMap = new Map(
            ordersDB.map(o => [o.numero_de_peticion, o])
        )

        const transactions: ITransaction<any>[] = []
        const toInsert: WINOrderENTITY[] = []
        const toTTL: RequestNumberTTLENTITY[] = []

        for (const order of orders) {
            const exist = ordersMap.get(order.numero_de_peticion)

            if (exist) {
                if (exist.estado !== StateOrderWin.FINALIZADA) {
                    transactions.push({
                        database: codeCompany,
                        collection: collections.winOrder,
                        transaction: 'updateOne',
                        filter: { _id: exist._id },
                        update: {
                            $set: {
                                tecnico: order.tecnico,
                                resource_id: order.resource_id,
                                fecha_visita: order.fecha_visita,
                                inicio_visita: order.inicio_visita,
                                fin_visita: order.fin_visita,
                                motivo_regestion: order.motivo_regestion,
                                motivo_cancelacion: order.motivo_cancelacion,
                                motivo_suspension: order.motivo_suspension,
                                estado: order.estado,
                                fecha_estado: order.fecha_estado,
                                prioridad: order.prioridad,
                                historial_estados: order.historial_estados,
                            }
                        }
                    })
                } else {
                    console.warn(`El estado de la orden ${exist.numero_de_peticion} es ${exist.estado}`)
                    toTTL.push({
                        _id: crypto.randomUUID(),
                        createdAt: new Date(),
                        numero_de_peticion: order.numero_de_peticion
                    } as RequestNumberTTLENTITY)
                }
            } else {
                toInsert.push(order)
            }
            if (order.estado === StateOrderWin.FINALIZADA) {
                toTTL.push({
                    _id: crypto.randomUUID(),
                    createdAt: new Date(),
                    numero_de_peticion: order.numero_de_peticion
                } as RequestNumberTTLENTITY)
            }
        }

        if (toInsert.length) {
            transactions.push({
                database: codeCompany,
                collection: collections.winOrder,
                transaction: 'insertMany',
                docs: toInsert
            })
        }

        if (toTTL.length) {
            transactions.push({
                database: codeCompany,
                collection: collections.winRequestNumberTTL,
                transaction: 'insertMany',
                docs: toTTL
            })
        }

        if (transactions.length) {
            await this.repository.executeTransactionBatch(transactions)
        }
    }
}