import { inject, injectable } from 'inversify'
import { DataRequestSave, ITOAOrderMongoRepository } from '../Domain'
import { TOA_ORDER_TYPES } from '../Infrastructure/IoC/types'
import {
    collections,
    EmployeeENTITY,
    RootCompanyENTITY,
    State,
    TOAOrderENTITY
} from 'logiflowerp-sdk'

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
        const pipeline = [{ $match: { state: State.ACTIVO, isDeleted: false } }]
        return this.repository.select<RootCompanyENTITY>(
            pipeline,
            collections.company
        )
    }

    private async groupOrdersByCompany(data: TOAOrderENTITY[], companies: RootCompanyENTITY[]) {
        const orderMap = new Map<number, TOAOrderENTITY[]>()
        for (const order of data) {
            if (!orderMap.has(order.toa_resource_id)) {
                orderMap.set(order.toa_resource_id, [])
            }
            orderMap.get(order.toa_resource_id)!.push(order)
        }

        const result = new Map<string, TOAOrderENTITY[]>()

        const pipeline = [{ $match: { state: State.ACTIVO, isDeleted: false } }]

        for (const company of companies) {
            let personal = await this.repository.select<EmployeeENTITY>(
                pipeline,
                collections.employee,
                company.code
            )

            const toa_resource_ids = new Set(personal.map(e => e.toa_resource_id))

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
        for (const [clave, valor] of orderedData) {
            if (!valor.length) {
                continue
            }

            const transactions: ITransaction<any>[] = []

            const transaction: ITransaction<TOAOrderENTITY> = {
                database: clave,
                collection: collections.toaOrder,
                transaction: 'insertMany',
                docs: valor
            }
            transactions.push(transaction)
            await this.repository.executeTransactionBatch(transactions)
        }
    }
}