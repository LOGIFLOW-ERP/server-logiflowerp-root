import { TokenPayloadDTO } from 'logiflowerp-sdk'

export interface IParamsSubscribe {
    queue: string
    onMessage: (params: IParamsOnMessage) => Promise<string>
}

export interface IParamsSubscribeFanout {
    exchange: string
    onMessage: (params: IParamsOnMessage) => Promise<string>
}

interface IParamsOnMessage {
    message: any
    user: TokenPayloadDTO | null
}