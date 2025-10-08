import { inject, injectable } from 'inversify'
import { DataRequestSave, IWINOrderMongoRepository } from '../Domain'
import { WIN_ORDER_TYPES } from '../Infrastructure/IoC/types'
import {
    collections,
    RequestNumberTTLENTITY,
    StateInventory,
    WINOrderENTITY,
    WINOrderStockENTITY,
    validateCustom,
    StateOrderWin
} from 'logiflowerp-sdk'
import { UnprocessableEntityException } from '@Config/exception'

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
            { $match: { numero_de_peticion: { $in: orders.map(e => e.numero_de_peticion) } } }
        ]
        const ordersDB = await this.repository.select(pipeline, collections.winOrder, codeCompany)

        const ordersMap = new Map(
            ordersDB.map(o => [o.numero_de_peticion, o])
        )

        const transactions: ITransaction<any>[] = []
        const toInsert: WINOrderENTITY[] = []
        const toTTL: RequestNumberTTLENTITY[] = []
        const toWinOrderStock: WINOrderStockENTITY[] = []

        for (const order of orders) {
            const exist = ordersMap.get(order.numero_de_peticion)

            if (exist) {
                order.inventory = exist.inventory
                if (exist.estado !== StateOrderWin.FINALIZADA) {
                    transactions.push({
                        database: codeCompany,
                        collection: collections.winOrder,
                        transaction: 'updateOne',
                        filter: { _id: exist._id },
                        update: {
                            $set: {
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
                    console.warn(`El estado de la orden ${exist.numero_de_peticion} es Completado`)
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
                for (const inv of order.inventory) {
                    const obj = {
                        ...inv,
                        ...order,
                        _id: crypto.randomUUID(),
                        state_consumption: StateInventory.PENDIENTE,
                        state_replacement: StateInventory.PENDIENTE,
                        isDeleted: false,
                        stock_quantity_employee: []
                    } as any
                    const entity = await validateCustom(obj, WINOrderStockENTITY, UnprocessableEntityException)
                    toWinOrderStock.push(entity)
                }
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

        if (toWinOrderStock.length) {
            transactions.push({
                database: codeCompany,
                collection: collections.winOrderStock,
                transaction: 'insertMany',
                docs: toWinOrderStock
            })
        }

        if (transactions.length) {
            await this.repository.executeTransactionBatch(transactions)
        }
    }
}