import { inject, injectable } from 'inversify'
import { DataRequestSave, ITOAOrderMongoRepository } from '../Domain'
import { TOA_ORDER_TYPES } from '../Infrastructure/IoC/types'
import {
    collections,
    EmployeeENTITY,
    RequestNumberTTLENTITY,
    RootCompanyENTITY,
    ScrapingSystem,
    State,
    StateInventory,
    TOAOrderENTITY,
    OrderStockENTITY,
    validateCustom
} from 'logiflowerp-sdk'
import { UnprocessableEntityException } from '@Config/exception'

@injectable()
export class UseCaseSave {
    constructor(
        @inject(TOA_ORDER_TYPES.RepositoryMongo) private readonly repository: ITOAOrderMongoRepository,
    ) { }

    async exec(data: DataRequestSave) {
        const companies = await this.getActiveCompanies()
        const orderedData = await this.groupOrdersByCompany(data.data, companies)
        await this.saveData(orderedData)
    }

    private getActiveCompanies() {
        const pipeline = [{ $match: { 'scrapingTargets.system': ScrapingSystem.TOA, state: State.ACTIVO, isDeleted: false } }]
        return this.repository.select<RootCompanyENTITY>(
            pipeline,
            collections.company
        )
    }

    private async groupOrdersByCompany(data: TOAOrderENTITY[], companies: RootCompanyENTITY[]) {
        const orderMap = new Map<string, TOAOrderENTITY[]>()
        for (const order of data) {
            if (!orderMap.has(order.toa_resource_id)) {
                orderMap.set(order.toa_resource_id, [])
            }
            orderMap.get(order.toa_resource_id)!.push(order)
        }

        const result = new Map<string, TOAOrderENTITY[]>()

        const pipeline = [{ $match: { state: State.ACTIVO, isDeleted: false } }]

        for (const company of companies) {
            const personal = await this.repository.select<EmployeeENTITY>(
                pipeline,
                collections.employee,
                company.code
            )

            const toa_resource_ids = new Set(personal.flatMap(e => e.resourceSystem.filter(el => el.system === ScrapingSystem.TOA).map(el => el.resource_id)))

            const companyOrders: TOAOrderENTITY[] = []
            for (const id of toa_resource_ids) {
                const orders = orderMap.get(id)
                if (orders) companyOrders.push(...orders)
            }

            result.set(company.code, companyOrders)
        }

        return result
    }

    private async saveData(orderedData: Map<string, TOAOrderENTITY[]>) {
        for (const [codeCompany, orders] of orderedData) {
            const pipeline = [
                { $match: { numero_de_peticion: { $in: orders.map(e => e.numero_de_peticion) } } }
            ]
            const ordersDB = await this.repository.select(pipeline, collections.toaOrder, codeCompany)

            const ordersMap = new Map(
                ordersDB.map(o => [o.numero_de_peticion, o])
            )

            const transactions: ITransaction<any>[] = []
            const toInsert: TOAOrderENTITY[] = []
            const toTTL: RequestNumberTTLENTITY[] = []
            const toToaOrderStock: OrderStockENTITY[] = []

            for (const order of orders) {
                const exist = ordersMap.get(order.numero_de_peticion)

                if (exist) {
                    if (exist.estado_actividad !== 'Completado') {
                        transactions.push({
                            database: codeCompany,
                            collection: collections.toaOrder,
                            transaction: 'updateOne',
                            filter: { _id: exist._id },
                            update: {
                                $set: {
                                    tecnico: order.tecnico,
                                    toa_resource_id: order.toa_resource_id,
                                    estado_actividad: order.estado_actividad,
                                    settlement_date: order.settlement_date,
                                    inventory: order.inventory,
                                    products_services_contracted: order.products_services_contracted,
                                    fecha_de_cita: order.fecha_de_cita
                                }
                            }
                        })
                    } else {
                        console.warn(`El estado de la orden ${exist.numero_de_peticion} es Completado`)
                    }
                } else {
                    toInsert.push(order)
                }

                if (order.estado_actividad === 'Completado' && !exist) {
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
                        const entity = await validateCustom(obj, OrderStockENTITY, UnprocessableEntityException)
                        toToaOrderStock.push(entity)
                    }
                }
            }

            if (toInsert.length) {
                transactions.push({
                    database: codeCompany,
                    collection: collections.toaOrder,
                    transaction: 'insertMany',
                    docs: toInsert
                })
            }

            if (toTTL.length) {
                transactions.push({
                    collection: collections.toaRequestNumberTTL,
                    transaction: 'insertMany',
                    docs: toTTL
                })
            }

            if (toToaOrderStock.length) {
                transactions.push({
                    database: codeCompany,
                    collection: collections.toaOrderStock,
                    transaction: 'insertMany',
                    docs: toToaOrderStock
                })
            }

            if (transactions.length) {
                await this.repository.executeTransactionBatch(transactions)
            }
        }
    }
}