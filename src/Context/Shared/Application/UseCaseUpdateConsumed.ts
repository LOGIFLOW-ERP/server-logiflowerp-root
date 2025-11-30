import { inject, injectable } from 'inversify'
import {
    collections,
    EmployeeENTITY,
    EmployeeStockENTITY,
    EmployeeStockSerialENTITY,
    ProducType,
    RootCompanyENTITY,
    ScrapingSystem,
    State,
    StateInventory,
    StateStockSerialEmployee,
    StockQuantityEmployee,
    StockType,
    OrderStockENTITY,
    ProductENTITY
} from 'logiflowerp-sdk'
import { SHARED_TYPES } from '@Shared/Infrastructure/IoC/types'
import { AdapterMail } from '@Shared/Infrastructure'
import { CONFIG_TYPES } from '@Config/types'
import { WIN_ORDER_TYPES } from 'src/Context/Processes/WinOrder/Infrastructure/IoC/types'
import { IWINOrderMongoRepository } from 'src/Context/Processes/WinOrder/Domain'

@injectable()
export class UseCaseUpdateConsumed {
    constructor(
        @inject(WIN_ORDER_TYPES.RepositoryMongo) private readonly repositoryWINOrder: IWINOrderMongoRepository,
        @inject(SHARED_TYPES.AdapterMail) private readonly adapterMail: AdapterMail,
        @inject(CONFIG_TYPES.Env) private readonly env: Env,
    ) { }

    async exec() {
        const pipeline = [{ $match: { state: State.ACTIVO, isDeleted: false } }]
        const companies = await this.repositoryWINOrder.select<RootCompanyENTITY>(pipeline, collections.company)

        for (const [i, company] of companies.entries()) {
            try {
                await this.processByCompany(company, i, companies.length)
            } catch (error) {
                console.error(error)
                const plaintextMessage = (error as Error).message
                const subject = `¡Error en UpdateConsumed, empresa ${company.code}!`
                await this.adapterMail.send(this.env.ADMINISTRATOR_EMAILS, subject, plaintextMessage)
            }
        }
    }

    private async processByCompany(company: RootCompanyENTITY, indexCompany: number, companiesLength: number) {
        const pipelineOrdersStock = [{
            $match: {
                state_consumption: StateInventory.PENDIENTE,
                invpool: 'install',
                isDeleted: false
            }
        }]

        if (company.scrapingTargets.some(e => e.system === ScrapingSystem.WIN)) {
            const orderStocks = await this.repositoryWINOrder.select<OrderStockENTITY>(
                pipelineOrdersStock,
                collections.winOrderStock,
                company.code
            )
            await this._processByCompany(orderStocks, company, collections.winOrderStock, indexCompany, companiesLength)
        }

        // Toa etc
    }

    private async _processByCompany(
        orderStocks: OrderStockENTITY[],
        company: RootCompanyENTITY,
        collection: string,
        indexCompany: number,
        companiesLength: number,
    ) {
        for (const [indexOrderStock, orderStock] of orderStocks.entries()) {
            const employeeStock = await this.getStockPersonal(orderStock, company)

            const transactions: ITransaction<any>[] = []

            const transactionEmployeeStock: ITransaction<EmployeeStockENTITY> = {
                database: company.code,
                collection: collections.employeeStock,
                transaction: 'updateOne',
                filter: { _id: employeeStock._id },
                update: {
                    $inc: { amountConsumed: orderStock.quantity }
                }
            }
            transactions.push(transactionEmployeeStock)

            const isSerial = employeeStock.item.producType === ProducType.SERIE

            if (isSerial) {
                const stockPersonalEquipo = await this.getStockPersonalEquipo(employeeStock, orderStock, company)
                const transaction: ITransaction<EmployeeStockSerialENTITY> = {
                    database: company.code,
                    collection: collections.employeeStockSerial,
                    transaction: 'updateOne',
                    filter: { _id: stockPersonalEquipo._id },
                    update: {
                        $set: {
                            state: StateStockSerialEmployee.CONSUMIDO,
                            documentNumber: orderStock.numero_de_peticion,
                            updatedate: new Date()
                        }
                    }
                }
                transactions.push(transaction)
            }

            const transactionOrderStock: ITransaction<OrderStockENTITY> = {
                database: company.code,
                collection,
                transaction: 'updateOne',
                filter: { _id: orderStock._id },
                update: {
                    $set: {
                        state_consumption: StateInventory.PROCESADO
                    }
                }
            }
            transactions.push(transactionOrderStock)

            await this.repositoryWINOrder.executeTransactionBatch(transactions)

            console.info(`Procesado ${indexCompany + 1}/${companiesLength} empresas (${company.code}), procesado ${indexOrderStock + 1}/${orderStocks.length} orden stock`)
        }
    }

    private getStockPersonalEquipo(employeeStock: EmployeeStockENTITY, orderStock: OrderStockENTITY, company: RootCompanyENTITY) {
        const pipeline = [{
            $match: {
                identity: employeeStock.employee.identity,
                keyDetail: employeeStock.keyDetail,
                keySearch: employeeStock.keySearch,
                serial: orderStock.serial,
                state: StateStockSerialEmployee.RESERVADO_CONSUMO,
                isDeleted: false
            }
        }]
        return this.repositoryWINOrder.selectOne<EmployeeStockSerialENTITY>(
            pipeline,
            collections.employeeStockSerial,
            company.code
        )
    }

    private getStockPersonal(orderStock: OrderStockENTITY, company: RootCompanyENTITY) {
        const pipelineEmployeeStock = [{
            $match: {
                _id: orderStock._id_stock,
                state: State.ACTIVO,
                isDeleted: false
            }
        }]
        return this.repositoryWINOrder.selectOne<EmployeeStockENTITY>(
            pipelineEmployeeStock,
            collections.employeeStock,
            company.code
        )
    }
}