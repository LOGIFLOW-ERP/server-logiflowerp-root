import { BadRequestException } from '@Config/exception'
import { StateOrder, EmployeeStockENTITY, StateInventory, OrderStockENTITY, WINOrderENTITY, StateInternalOrderWin } from 'logiflowerp-sdk'
import { Collection, Document } from 'mongodb'

// CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA
// CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA
// CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA

interface Props {
    colEmployeeStock: Collection
    colWarehouseReturn: Collection
    colWinOrder: Collection
    colWinOrderStock: Collection
    pipeline?: Document[]
    _ids?: string[]
}

// CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA
// CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA
// CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA

export async function _validateAvailableEmployeeStocks(params: Props) {
    const { colWarehouseReturn, colEmployeeStock, colWinOrder, colWinOrderStock, pipeline, _ids } = params

    if (!_ids && !pipeline) {
        throw new BadRequestException(`Debe enviar "_ids" o "pipeline"`)
    }

    const _pipeline = _ids ? [{ $match: { _id: { $in: _ids } } }] : pipeline
    const dataEmployeeStock = await colEmployeeStock.aggregate<EmployeeStockENTITY>(_pipeline, { readPreference: 'primary' }).toArray()
    const keys = dataEmployeeStock.reduce((acc: { keysDetail: string[]; keysSearch: string[], identities: string[] }, el) => {
        acc.keysDetail.push(el.keyDetail)
        acc.keysSearch.push(el.keySearch)
        acc.identities.push(el.employee.identity)
        return acc
    }, { keysDetail: [], keysSearch: [], identities: [] })

    // CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA
    // CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA
    // CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA

    const pipelineWarehouseReturns = [
        {
            $match: {
                'detail.keySearch': { $in: keys.keysSearch },
                'detail.keyDetail': { $in: keys.keysDetail },
                'carrier.identity': { $in: keys.identities },
                state: { $ne: StateOrder.VALIDADO },
                isDeleted: false
            }
        },
        {
            $unwind: '$detail'
        },
        {
            $match: {
                'detail.keySearch': { $in: keys.keysSearch },
                'detail.keyDetail': { $in: keys.keysDetail },
            }
        },
        {
            $group: {
                _id: {
                    keySearch: '$detail.keySearch',
                    keyDetail: '$detail.keyDetail',
                    identity: '$carrier.identity'
                },
                totalTransit: { $sum: '$detail.amount' }
            }
        }
    ]

    // CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA
    // CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA
    // CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA

    const dataTransit = await colWarehouseReturn.aggregate(pipelineWarehouseReturns, { readPreference: 'primary' }).toArray()

    const transitMap = new Map<string, number>()
    for (const item of dataTransit) {
        const key = `${item._id.keySearch}||${item._id.keyDetail}||${item._id.identity}`
        transitMap.set(key, item.totalTransit)
    }

    const dataReturn: {
        keySearch: string,
        keyDetail: string,
        identity: string,
        available: number
    }[] = []

    for (const employeeStock of dataEmployeeStock) {
        const pipeline = [{
            $match: {
                'inventory._id_stock': employeeStock._id,
                estado_interno: { $ne: StateInternalOrderWin.FINALIZADA },
                isDeleted: false
            }
        }]

        const dataWinOrders = await colWinOrder.aggregate<WINOrderENTITY>(pipeline).toArray()
        const transitWinOrders = dataWinOrders.reduce((acc, winOrder) => {
            return acc += winOrder.inventory.reduce((acc2, inventory) => {
                if (inventory._id_stock === employeeStock._id) {
                    return acc2 += inventory.quantity
                }
                return acc2
            }, 0)
        }, 0)

        const pipelineWinOrderStock = [{
            $match: {
                _id_stock: employeeStock._id,
                state_consumption: StateInventory.PENDIENTE,
                isDeleted: false
            }
        }]
        const dataWinOrderStock = await colWinOrderStock.aggregate<OrderStockENTITY>(pipelineWinOrderStock).toArray()
        const transitWinOrderStock = dataWinOrderStock.reduce((acc, winOrder) => {
            return acc += winOrder.quantity
        }, 0)

        const { incomeAmount, amountReturned, amountConsumed, keyDetail, keySearch, employee: { identity } } = employeeStock
        const transit = transitMap.get(`${keySearch}||${keyDetail}||${identity}`) ?? 0
        const available = incomeAmount - amountReturned - amountConsumed - transit - transitWinOrders - transitWinOrderStock
        dataReturn.push({
            keySearch,
            keyDetail,
            identity,
            available
        })
    }

    return dataReturn
    // CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA
    // CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA
    // CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA
}