import axios, { AxiosRequestConfig } from 'axios'
import { injectable } from 'inversify'

@injectable()
export class AdapterApiRequest {

    async post<T>(url: string, data?: any, config?: AxiosRequestConfig<any> | undefined) {
        const result = await axios.post<T>(url, data, config)
        return result.data
    }

    async get<T>(url: string, config?: AxiosRequestConfig<any> | undefined) {
        const result = await axios.get<T>(url, config)
        return result.data
    }

}