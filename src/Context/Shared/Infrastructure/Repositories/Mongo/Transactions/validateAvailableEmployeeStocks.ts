import { BadRequestException } from '@Config/exception'
import { StateOrder, EmployeeStockENTITY } from 'logiflowerp-sdk'
import { Collection, Document } from 'mongodb'

// CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA
// CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA
// CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA

interface Props {
    colEmployeeStock: Collection
    colWarehouseReturn: Collection
    pipeline?: Document[]
    _ids?: string[]
}

// CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA
// CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA
// CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA

export async function _validateAvailableEmployeeStocks(params: Props) {
    const { colWarehouseReturn, colEmployeeStock, pipeline, _ids } = params

    if (!_ids && !pipeline) {
        throw new BadRequestException(`Debe enviar "_ids" o "pipeline"`)
    }

    const _pipeline = _ids ? [{ $match: { _id: { $in: _ids } } }] : pipeline
    const dataEmployeeStock = await colEmployeeStock.aggregate<EmployeeStockENTITY>(_pipeline).toArray()
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
                state: { $ne: StateOrder.VALIDADO }
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

    const dataTransit = await colWarehouseReturn.aggregate(pipelineWarehouseReturns).toArray()

    const transitMap = new Map<string, number>()
    for (const item of dataTransit) {
        const key = `${item._id.keySearch}||${item._id.keyDetail}||${item._id.identity}`
        transitMap.set(key, item.totalTransit)
    }

    return dataEmployeeStock.map(employeeStock => {
        const { incomeAmount, amountReturned, amountConsumed, keyDetail, keySearch, employee: { identity } } = employeeStock
        const transit = transitMap.get(`${keySearch}||${keyDetail}||${identity}`) ?? 0
        const available = incomeAmount - amountReturned - amountConsumed - transit
        return {
            keySearch,
            keyDetail,
            identity,
            available
        }
    })
    // CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA
    // CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA
    // CUALQUIER CAMBIO SE DEBE HACER LOS MISMO EN BACKEND ROOT Y LOGISTICA
}