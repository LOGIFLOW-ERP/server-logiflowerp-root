import { inject, injectable } from 'inversify'
import { WIN_ORDER_TYPES } from '../Infrastructure/IoC/types'
import { IWINOrderMongoRepository } from '../Domain'
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
    WINOrderStockENTITY
} from 'logiflowerp-sdk'
import { AdapterMail, SHARED_TYPES } from '@Shared/Infrastructure'
import { CONFIG_TYPES } from '@Config/types'

@injectable()
export class UseCaseUpdateConsumed {
    constructor(
        @inject(WIN_ORDER_TYPES.RepositoryMongo) private readonly repository: IWINOrderMongoRepository,
        @inject(SHARED_TYPES.AdapterMail) private readonly adapterMail: AdapterMail,
        @inject(CONFIG_TYPES.Env) private readonly env: Env,
    ) { }

    async exec() {
        console.info('🚀 Inicio UpdateConsumed WIN')
        try {
            const pipeline = [{ $match: { state: State.ACTIVO, isDeleted: false } }]
            const companies = await this.repository.select<RootCompanyENTITY>(pipeline, collections.company)

            if (!companies.length) {
                await this.wait(30000)
            }

            for (const [i, company] of companies.entries()) {
                try {
                    await this.processByCompany(company, i, companies.length)
                } catch (error) {
                    console.error(error)
                    const plaintextMessage = (error as Error).message
                    const subject = `¡Error en UpdateConsumed WIN, empresa ${company.code}!`
                    await this.adapterMail.send(this.env.ADMINISTRATOR_EMAILS, subject, plaintextMessage)
                }
            }

            //#region WebHook
            const url = `${this.env.HOST_API_SCRAPER}win`
            const response = await fetch(url, { method: 'POST' })
            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Error ${response.status}: ${errorText}`)
            }
            //#endregion WebHook
        } catch (error) {
            console.error(error)
            const plaintextMessage = (error as Error).message
            const subject = `¡Error en exec UpdateConsumed WIN!`
            try {
                await this.adapterMail.send(this.env.ADMINISTRATOR_EMAILS, subject, plaintextMessage)
            } catch (error) {
                console.error('🔴🔴🔴 ERROR LA ENVIAR CORREO WIN 🔴🔴🔴', error)
            }
        } finally {
            console.info('🚀 Fin UpdateConsumed WIN')
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
        const orderStocks = await this.repository.select<WINOrderStockENTITY>(
            pipelineOrdersStock,
            collections.winOrderStock,
            company.code
        )

        if (!orderStocks.length && companiesLength === 1) {
            await this.wait(30000)
        }

        for (const [indexOrderStock, orderStock] of orderStocks.sort((a, b) => b.quantity - a.quantity).entries()) {
            const personel = await this.searchPersonel(orderStock, company)
            const pipelineEmployeeStock = [{
                $match: {
                    'employee.identity': personel.identity,
                    'item.itemCode': orderStock.itemCode,
                    stockType: StockType.NUEVO,
                    state: State.ACTIVO,
                    isDeleted: false
                }
            }]
            const employeeStocks = await this.repository.select<EmployeeStockENTITY>(
                pipelineEmployeeStock,
                collections.employeeStock,
                company.code
            )

            if (employeeStocks.length === 0) { continue }

            if (
                employeeStocks[0].item.producType === ProducType.SERIE &&
                orderStock.quantity !== 1 &&
                orderStock.serial.length === 0
            ) {
                throw new Error(`WIN order stock ${orderStock._id} es inconsistente.`)
            }

            if (employeeStocks.length === 1) {
                const available = await this.repository.validateAvailableEmployeeStocks({ _ids: [employeeStocks[0]._id] }, company.code)
                if (available[0].available < 1) { continue }

                const transactions: ITransaction<any>[] = []
                const stock_quantity_employee: StockQuantityEmployee[] = []

                await this.createAndExecuteTransactions(
                    employeeStocks[0],
                    orderStock,
                    company,
                    orderStock.quantity,
                    transactions,
                    stock_quantity_employee
                )

                if (orderStock.quantity > 0) {
                    if (employeeStocks[0].item.producType === ProducType.SERIE) {
                        continue
                    }
                    throw new Error(`No se pudo distribuir la cantidad total del win order stock ${orderStock._id}`)
                }

                const transactionOrderStock: ITransaction<WINOrderStockENTITY> = {
                    database: company.code,
                    collection: collections.winOrderStock,
                    transaction: 'updateOne',
                    filter: { _id: orderStock._id },
                    update: {
                        $set: {
                            state_consumption: StateInventory.PROCESADO,
                            stock_quantity_employee
                        }
                    }
                }
                transactions.push(transactionOrderStock)

                await this.repository.executeTransactionBatch(transactions)
            } else {
                const availables = await this.repository.validateAvailableEmployeeStocks({ _ids: employeeStocks.map(e => e._id) }, company.code)
                const data = employeeStocks
                    .map(e => {
                        const stock = availables.filter(el => el.identity === e.employee.identity && el.keyDetail === e.keyDetail && el.keySearch === e.keySearch)
                        if (stock.length !== 1) {
                            throw new Error(
                                `Hay ${stock.length} resultados en validateAvailableEmployeeStocks identity: ${e.employee.identity}, keyDetail: ${e.keyDetail}, keySearch: ${e.keySearch}`
                            )
                        }
                        return { ...e, available: stock[0].available } as EmployeeStockENTITY & { available: number }
                    })
                    .filter(e => e.available > 0)

                if (data.length === 0) {
                    continue
                }

                const transactions: ITransaction<any>[] = []
                const stock_quantity_employee: StockQuantityEmployee[] = []

                const searchMatch = data.find(e => e.available === orderStock.quantity)
                if (searchMatch) {
                    const available = await this.repository.validateAvailableEmployeeStocks({ _ids: [searchMatch._id] }, company.code)
                    if (available[0].available < 1) { continue }

                    await this.createAndExecuteTransactions(
                        searchMatch,
                        orderStock,
                        company,
                        orderStock.quantity,
                        transactions,
                        stock_quantity_employee
                    )

                    if (orderStock.quantity > 0) {
                        if (searchMatch.item.producType === ProducType.SERIE) {
                            continue
                        }
                        throw new Error(`No se pudo distribuir la cantidad total del win order stock ${orderStock._id}`)
                    }

                    const transactionOrderStock: ITransaction<WINOrderStockENTITY> = {
                        database: company.code,
                        collection: collections.winOrderStock,
                        transaction: 'updateOne',
                        filter: { _id: orderStock._id },
                        update: {
                            $set: {
                                state_consumption: StateInventory.PROCESADO,
                                stock_quantity_employee
                            }
                        }
                    }
                    transactions.push(transactionOrderStock)

                    await this.repository.executeTransactionBatch(transactions)
                } else {
                    for (const [i, employeeStock] of data.sort((a, b) => b.available - a.available).entries()) {
                        if (orderStock.quantity < 1) { break }

                        const available = await this.repository.validateAvailableEmployeeStocks({ _ids: [employeeStock._id] }, company.code)
                        if (available[0].available < 1) { continue }

                        if (orderStock.quantity <= available[0].available || i === data.length - 1) {
                            await this.createAndExecuteTransactions(
                                employeeStock,
                                orderStock,
                                company,
                                orderStock.quantity,
                                transactions,
                                stock_quantity_employee
                            )
                        } else {
                            await this.createAndExecuteTransactions(
                                employeeStock,
                                orderStock,
                                company,
                                available[0].available,
                                transactions,
                                stock_quantity_employee
                            )
                        }
                    }

                    if (orderStock.quantity > 0) {
                        if (employeeStocks[0].item.producType === ProducType.SERIE) {
                            continue
                        }
                        throw new Error(`No se pudo distribuir la cantidad total del win order stock ${orderStock._id}`)
                    }

                    const transactionOrderStock: ITransaction<WINOrderStockENTITY> = {
                        database: company.code,
                        collection: collections.winOrderStock,
                        transaction: 'updateOne',
                        filter: { _id: orderStock._id },
                        update: {
                            $set: {
                                state_consumption: StateInventory.PROCESADO,
                                stock_quantity_employee
                            }
                        }
                    }

                    transactions.push(transactionOrderStock)

                    await this.repository.executeTransactionBatch(transactions)
                }
            }

            console.info(`Procesado ${indexCompany + 1}/${companiesLength} empresas (${company.code}), procesado ${indexOrderStock + 1}/${orderStocks.length} win orden stock`)
        }
    }

    private async createAndExecuteTransactions(
        employeeStock: EmployeeStockENTITY,
        orderStock: WINOrderStockENTITY,
        company: RootCompanyENTITY,
        amountConsumed: number,
        transactions: ITransaction<any>[],
        stockQuantityEmployee: StockQuantityEmployee[]
    ) {

        if (employeeStock.item.producType === ProducType.SERIE) {
            const pipeline = [{
                $match: {
                    identity: employeeStock.employee.identity,
                    keySearch: employeeStock.keySearch,
                    keyDetail: employeeStock.keyDetail,
                    serial: orderStock.serial,
                    state: StateStockSerialEmployee.RESERVADO_CONSUMO_WIN, // posesion o Reservado_consumo
                    isDeleted: false
                }
            }]
            const employeeStockSerial = await this.repository.select<EmployeeStockSerialENTITY>(
                pipeline,
                collections.employeeStockSerial,
                company.code
            )

            if (employeeStockSerial.length === 0) {
                return false
            }

            if (employeeStockSerial.length > 1) {
                throw new Error(
                    `Hay ${employeeStockSerial.length} resultados para stock personal serie ${JSON.stringify(pipeline[0].$match)}`
                )
            }

            const transaction: ITransaction<EmployeeStockSerialENTITY> = {
                database: company.code,
                collection: collections.employeeStockSerial,
                transaction: 'updateOne',
                filter: { _id: employeeStockSerial[0]._id },
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

        const transactionEmployeeStock: ITransaction<EmployeeStockENTITY> = {
            database: company.code,
            collection: collections.employeeStock,
            transaction: 'updateOne',
            filter: { _id: employeeStock._id },
            update: {
                $inc: { amountConsumed }
            }
        }
        transactions.push(transactionEmployeeStock)
        orderStock.quantity -= amountConsumed
        const _item = new StockQuantityEmployee()
        _item._id_stock_employee = employeeStock._id
        _item.quantity = amountConsumed
        stockQuantityEmployee.push(_item)
    }

    private async wait(ms: number) {
        console.log(`⌛ Esperando ${ms / 1000}s ...`)
        await new Promise((resolve) => setTimeout(resolve, ms))
        console.log(`⌛ Fin espera ${ms / 1000}s`)
    }

    private searchPersonel(orderStock: WINOrderStockENTITY, company: RootCompanyENTITY) {
        const pipeline = [{
            $match: {
                'resourceSystem.resource_id': orderStock.resource_id,
                'resourceSystem.system': ScrapingSystem.WIN,
                isDeleted: false,
                state: State.ACTIVO
            }
        }]
        return this.repository.selectOne<EmployeeENTITY>(pipeline, collections.employee, company.code)
    }
}