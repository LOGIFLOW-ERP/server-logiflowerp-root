import { inject, injectable } from 'inversify'
import { SHARED_TYPES } from './IoC/types';
import { AdapterRabbitMQ } from './Adapters';
import {
    UseCaseSendMailRegisterUser,
    UseCaseSendMailWelcomeCompany
} from '../Application';
import { getQueueNameMailRegisterUser, getQueueNameMailWelcomeCompany } from 'logiflowerp-sdk';
import { CONFIG_TYPES } from '@Config/types';

@injectable()
export class Worker {

    constructor(
        @inject(SHARED_TYPES.AdapterRabbitMQ) private readonly adapterRabbitMQ: AdapterRabbitMQ,
        @inject(SHARED_TYPES.UseCaseSendMailRegisterUser) private readonly useCaseSendMailRegisterUser: UseCaseSendMailRegisterUser,
        @inject(SHARED_TYPES.UseCaseSendMailWelcomeCompany) private readonly useCaseSendMailWelcomeCompany: UseCaseSendMailWelcomeCompany,
        @inject(CONFIG_TYPES.Env) private readonly env: Env,
    ) { }

    async exec() {
        await this.adapterRabbitMQ.subscribe({
            queue: getQueueNameMailRegisterUser({ NODE_ENV: this.env.NODE_ENV, PREFIX: this.env.PREFIX }),
            onMessage: async ({ message, user }) => {
                return await this.useCaseSendMailRegisterUser.exec(message)
            }
        })
        await this.adapterRabbitMQ.subscribe({
            queue: getQueueNameMailWelcomeCompany({ NODE_ENV: this.env.NODE_ENV, PREFIX: this.env.PREFIX }),
            onMessage: async ({ message, user }) => {
                return await this.useCaseSendMailWelcomeCompany.exec(message)
            }
        })
    }
}