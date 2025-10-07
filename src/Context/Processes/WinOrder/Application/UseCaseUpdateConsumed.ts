import { inject, injectable } from 'inversify'
import { WIN_ORDER_TYPES } from '../Infrastructure/IoC/types'
import { IWINOrderMongoRepository } from '../Domain'
import {
    collections,
    EmployeeStockENTITY,
    EmployeeStockSerialENTITY,
    ProducType,
    RootCompanyENTITY,
    State,
    StateInventory,
    StateStockSerialEmployee,
    StockQuantityEmployee,
    StockType,
    TOAOrderStockENTITY
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
        console.info('🚀 Inicio UpdateConsumed')
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
                    const subject = `¡Error en UpdateConsumed, empresa ${company.code}!`
                    await this.adapterMail.send(this.env.ADMINISTRATOR_EMAILS, subject, plaintextMessage)
                }
            }

            //#region WebHook
            const url = `${this.env.HOST_API_SCRAPER}toa`
            const response = await fetch(url, { method: 'POST' })
            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Error ${response.status}: ${errorText}`)
            }
            //#endregion WebHook
        } catch (error) {
            console.error(error)
            const plaintextMessage = (error as Error).message
            const subject = `¡Error en exec UpdateConsumed!`
            try {
                await this.adapterMail.send(this.env.ADMINISTRATOR_EMAILS, subject, plaintextMessage)
            } catch (error) {
                console.error('🔴🔴🔴 ERROR LA ENVIAR CORREO 🔴🔴🔴', error)
            }
        } finally {
            console.info('🚀 Fin UpdateConsumed')
        }
    }

    private async processByCompany(company: RootCompanyENTITY, indexCompany: number, companiesLength: number) {
        const pipelineToaOrdersStock = [{
            $match: {
                state_consumption: StateInventory.PENDIENTE,
                invpool: 'install',
                isDeleted: false
            }
        }]
        const toaOrderStocks = await this.repository.select<TOAOrderStockENTITY>(
            pipelineToaOrdersStock,
            collections.toaOrderStock,
            company.code
        )

        if (!toaOrderStocks.length && companiesLength === 1) {
            await this.wait(30000)
        }

        for (const [indexToaOrderStock, toaOrderStock] of toaOrderStocks.sort((a, b) => b.quantity - a.quantity).entries()) {
            const pipelineEmployeeStock = [{
                $match: {
                    'employee.toa_resource_id': toaOrderStock.toa_resource_id,
                    'item.itemCode': toaOrderStock.itemCode,
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
                toaOrderStock.quantity !== 1 &&
                toaOrderStock.serial.length === 0
            ) {
                throw new Error(`Toa order stock ${toaOrderStock._id} es inconsistente.`)
            }

            if (employeeStocks.length === 1) {
                const available = await this.repository.validateAvailableEmployeeStocks({ _ids: [employeeStocks[0]._id] }, company.code)
                if (available[0].available < 1) { continue }

                const transactions: ITransaction<any>[] = []
                const stock_quantity_employee: StockQuantityEmployee[] = []

                await this.createAndExecuteTransactions(
                    employeeStocks[0],
                    toaOrderStock,
                    company,
                    toaOrderStock.quantity,
                    transactions,
                    stock_quantity_employee
                )

                if (toaOrderStock.quantity > 0) {
                    if (employeeStocks[0].item.producType === ProducType.SERIE) {
                        continue
                    }
                    throw new Error(`No se pudo distribuir la cantidad total del toa order stock ${toaOrderStock._id}`)
                }

                const transactionTOAOrderStock: ITransaction<TOAOrderStockENTITY> = {
                    database: company.code,
                    collection: collections.toaOrderStock,
                    transaction: 'updateOne',
                    filter: { _id: toaOrderStock._id },
                    update: {
                        $set: {
                            state_consumption: StateInventory.PROCESADO,
                            stock_quantity_employee
                        }
                    }
                }
                transactions.push(transactionTOAOrderStock)

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

                const searchMatch = data.find(e => e.available === toaOrderStock.quantity)
                if (searchMatch) {
                    const available = await this.repository.validateAvailableEmployeeStocks({ _ids: [searchMatch._id] }, company.code)
                    if (available[0].available < 1) { continue }

                    await this.createAndExecuteTransactions(
                        searchMatch,
                        toaOrderStock,
                        company,
                        toaOrderStock.quantity,
                        transactions,
                        stock_quantity_employee
                    )

                    if (toaOrderStock.quantity > 0) {
                        if (searchMatch.item.producType === ProducType.SERIE) {
                            continue
                        }
                        throw new Error(`No se pudo distribuir la cantidad total del toa order stock ${toaOrderStock._id}`)
                    }

                    const transactionTOAOrderStock: ITransaction<TOAOrderStockENTITY> = {
                        database: company.code,
                        collection: collections.toaOrderStock,
                        transaction: 'updateOne',
                        filter: { _id: toaOrderStock._id },
                        update: {
                            $set: {
                                state_consumption: StateInventory.PROCESADO,
                                stock_quantity_employee
                            }
                        }
                    }
                    transactions.push(transactionTOAOrderStock)

                    await this.repository.executeTransactionBatch(transactions)
                } else {
                    for (const [i, employeeStock] of data.sort((a, b) => b.available - a.available).entries()) {
                        if (toaOrderStock.quantity < 1) { break }

                        const available = await this.repository.validateAvailableEmployeeStocks({ _ids: [employeeStock._id] }, company.code)
                        if (available[0].available < 1) { continue }

                        if (toaOrderStock.quantity <= available[0].available || i === data.length - 1) {
                            await this.createAndExecuteTransactions(
                                employeeStock,
                                toaOrderStock,
                                company,
                                toaOrderStock.quantity,
                                transactions,
                                stock_quantity_employee
                            )
                        } else {
                            await this.createAndExecuteTransactions(
                                employeeStock,
                                toaOrderStock,
                                company,
                                available[0].available,
                                transactions,
                                stock_quantity_employee
                            )
                        }
                    }

                    if (toaOrderStock.quantity > 0) {
                        if (employeeStocks[0].item.producType === ProducType.SERIE) {
                            continue
                        }
                        throw new Error(`No se pudo distribuir la cantidad total del toa order stock ${toaOrderStock._id}`)
                    }

                    const transactionTOAOrderStock: ITransaction<TOAOrderStockENTITY> = {
                        database: company.code,
                        collection: collections.toaOrderStock,
                        transaction: 'updateOne',
                        filter: { _id: toaOrderStock._id },
                        update: {
                            $set: {
                                state_consumption: StateInventory.PROCESADO,
                                stock_quantity_employee
                            }
                        }
                    }

                    transactions.push(transactionTOAOrderStock)

                    await this.repository.executeTransactionBatch(transactions)
                }
            }

            console.info(`Procesado ${indexCompany + 1}/${companiesLength} empresas (${company.code}), procesado ${indexToaOrderStock + 1}/${toaOrderStocks.length} toa orden stock`)
        }
    }

    private async createAndExecuteTransactions(
        employeeStock: EmployeeStockENTITY,
        toaOrderStock: TOAOrderStockENTITY,
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
                    serial: toaOrderStock.serial,
                    state: StateStockSerialEmployee.POSESION, // o Reservado_consumo
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
                        documentNumber: toaOrderStock.numero_de_peticion,
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
        toaOrderStock.quantity -= amountConsumed
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
}