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
            await this._processByCompany(orderStocks, company, collections.winOrderStock, indexCompany, companiesLength, ScrapingSystem.WIN)
        }

        // Toa etc
    }

    private async _processByCompany(
        orderStocks: OrderStockENTITY[],
        company: RootCompanyENTITY,
        collection: string,
        indexCompany: number,
        companiesLength: number,
        system: ScrapingSystem
    ) {
        const products = await this.searchDataProducts(company)
        for (const [indexOrderStock, orderStock] of orderStocks.entries()) {
            const personel = await this.searchPersonel(orderStock, company, system)
            const product = this.searchProduct(orderStock.itemCode, products)

            const isSerial = product.producType === ProducType.SERIE

            if (isSerial) {
                const transactions: ITransaction<any>[] = []
                const stock_quantity_employee: StockQuantityEmployee[] = []

                const stockPersonalEquipo = await this.getStockPersonalEquipos(personel, orderStock, company)

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

                const employeeStock = await this.getStockPersonalAux(personel, company, stockPersonalEquipo)

                // const _item = new StockQuantityEmployee()
                // _item.quantity = orderStock.quantity
                // _item._id_stock_employee = employeeStock._id
                // stock_quantity_employee.push(_item)

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

                const transactionOrderStock: ITransaction<OrderStockENTITY> = {
                    database: company.code,
                    collection,
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
                await this.repositoryWINOrder.executeTransactionBatch(transactions)
                continue
            }

            const transactions: ITransaction<any>[] = []
            const stock_quantity_employee: StockQuantityEmployee[] = []

            const employeeStocks = await this.getStockPersonal(personel, orderStock, company)
            const dataStockPersonalAvailable = await this.addAvailableStockPersonal(employeeStocks, company)

            if (dataStockPersonalAvailable.length) {
                const searchMatch = dataStockPersonalAvailable.find(e => e.available === orderStock.quantity)
                if (searchMatch) {
                    const _item = new StockQuantityEmployee()
                    // _item.quantity = orderStock.quantity
                    // _item._id_stock_employee = searchMatch._id

                    stock_quantity_employee.push(_item)
                    const transactionEmployeeStock: ITransaction<EmployeeStockENTITY> = {
                        database: company.code,
                        collection: collections.employeeStock,
                        transaction: 'updateOne',
                        filter: { _id: searchMatch._id },
                        update: {
                            $inc: { amountConsumed: orderStock.quantity }
                        }
                    }
                    transactions.push(transactionEmployeeStock)
                } else {
                    for (const stockPersonal of dataStockPersonalAvailable) {
                        if (orderStock.quantity <= 0) { break }
                        const amountConsumed = Math.min(orderStock.quantity, stockPersonal.available)
                        const _item = new StockQuantityEmployee()
                        // _item.quantity = amountConsumed
                        // _item._id_stock_employee = stockPersonal._id

                        stock_quantity_employee.push(_item)
                        const transactionEmployeeStock: ITransaction<EmployeeStockENTITY> = {
                            database: company.code,
                            collection: collections.employeeStock,
                            transaction: 'updateOne',
                            filter: { _id: stockPersonal._id },
                            update: {
                                $inc: { amountConsumed }
                            }
                        }
                        transactions.push(transactionEmployeeStock)
                        orderStock.quantity -= amountConsumed
                    }
                }
            }

            const transactionOrderStock: ITransaction<OrderStockENTITY> = {
                database: company.code,
                collection,
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
            await this.repositoryWINOrder.executeTransactionBatch(transactions)

            console.info(`Procesado ${indexCompany + 1}/${companiesLength} empresas (${company.code}), procesado ${indexOrderStock + 1}/${orderStocks.length} orden stock`)
        }
    }

    private async addAvailableStockPersonal(employeeStocks: EmployeeStockENTITY[], company: RootCompanyENTITY) {
        const availables = await this.repositoryWINOrder.validateAvailableEmployeeStocks({ _ids: employeeStocks.map(e => e._id) }, company.code)
        const data = employeeStocks
            .map(e => {
                const stock = availables.filter(el => el.identity === e.employee.identity && el.keyDetail === e.keyDetail && el.keySearch === e.keySearch)
                if (stock.length !== 1) {
                    throw new Error(
                        `Hay ${stock.length} resultados en validateAvailableEmployeeStocks identity: ${e.employee.identity}, keyDetail: ${e.keyDetail}, keySearch: ${e.keySearch}`
                    )
                }
                return { ...e, available: stock[0].available } as EmployeeStockENTITY
            })
            .filter(e => e.available > 0)
        return data
    }

    private getStockPersonalEquipos(employee: EmployeeENTITY, orderStock: OrderStockENTITY, company: RootCompanyENTITY) {
        const pipeline = [{
            $match: {
                identity: employee.identity,
                itemCode: orderStock.itemCode,
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

    private getStockPersonalAux(personel: EmployeeENTITY, company: RootCompanyENTITY, stockPersonalEquipo: EmployeeStockSerialENTITY) {
        const pipelineEmployeeStock = [{
            $match: {
                'employee.identity': personel.identity,
                keySearch: stockPersonalEquipo.keySearch,
                keyDetail: stockPersonalEquipo.keyDetail,
                stockType: StockType.NUEVO,
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

    private getStockPersonal(personel: EmployeeENTITY, orderStock: OrderStockENTITY, company: RootCompanyENTITY) {
        const pipelineEmployeeStock = [{
            $match: {
                'employee.identity': personel.identity,
                'item.itemCode': orderStock.itemCode,
                stockType: StockType.NUEVO,
                state: State.ACTIVO,
                isDeleted: false
            }
        }]
        return this.repositoryWINOrder.select<EmployeeStockENTITY>(
            pipelineEmployeeStock,
            collections.employeeStock,
            company.code
        )
    }

    private searchPersonel(orderStock: OrderStockENTITY, company: RootCompanyENTITY, system: ScrapingSystem) {
        const pipeline = [{
            $match: {
                'resourceSystem.resource_id': orderStock.resource_id,
                'resourceSystem.system': system,
                isDeleted: false,
                state: State.ACTIVO
            }
        }]
        return this.repositoryWINOrder.selectOne<EmployeeENTITY>(pipeline, collections.employee, company.code)
    }

    private searchProduct(code: string, products: ProductENTITY[]) {
        const product = products.find(product => product.itemCode === code)
        if (!product) {
            throw new Error(`No se encontro el producto con el codigo ${code}`)
        }
        return product
    }

    private searchDataProducts(company: RootCompanyENTITY) {
        const pipeline = [{
            $match: {
                isDeleted: false,
                state: State.ACTIVO
            }
        }]
        return this.repositoryWINOrder.select<ProductENTITY>(pipeline, collections.product, company.code)
    }
}