import { TokenPayloadDTO } from 'logiflowerp-sdk'

export interface IParamsPublish {
    queue: string
    message: any
    user?: TokenPayloadDTO
}

export interface IParamsPublishFanout {
    exchange: string
    message: any
    user?: TokenPayloadDTO
}