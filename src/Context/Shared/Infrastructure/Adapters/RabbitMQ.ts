import { inject, injectable } from 'inversify'
import { Channel, ChannelModel, connect, ConsumeMessage } from 'amqplib'
import { IParamsPublish, IParamsPublishFanout, IParamsSubscribe, IParamsSubscribeFanout } from '@Shared/Domain'
import { AdapterMail } from './Mail'
import { SHARED_TYPES } from '../IoC'
import { isJSON } from 'logiflowerp-sdk'
import { CONFIG_TYPES } from '@Config/types'

@injectable()
export class AdapterRabbitMQ {

    private connection!: ChannelModel
    private channel!: Channel

    constructor(
        @inject(SHARED_TYPES.AdapterMail) private readonly adapterMail: AdapterMail,
        @inject(CONFIG_TYPES.Env) private readonly env: Env,
    ) { }

    private async connect(url: string = this.env.RABBITMQ_URL) {
        try {
            if (!this.connection || !this.channel) {
                this.connection = await connect(url)
                this.channel = await this.connection.createChannel()
                await this.channel.prefetch(1)
                console.log('\x1b[36m%s\x1b[0m', '>>> Conectado a RabbitMQ')
            }
        } catch (error) {
            console.error(error)
            process.exit(1)
        }
    }

    async publish(params: IParamsPublish) {
        await this.connect()
        const { queue, message, user } = params
        await this.channel.assertQueue(queue, { durable: true })
        const result = this.channel.sendToQueue(
            queue,
            Buffer.from(JSON.stringify(message)),
            {
                persistent: true,
                headers: { user }
            }
        )
        if (!result) {
            throw new Error(`Error al publicar en RabbitMQ (queue: ${queue})`)
        }
    }

    async publishFanout(params: IParamsPublishFanout) {
        await this.connect()
        const { exchange, message, user } = params
        await this.channel.assertExchange(exchange, 'fanout', { durable: true })
        const result = this.channel.publish(
            exchange,
            '',
            Buffer.from(JSON.stringify(message)),
            {
                persistent: true,
                headers: { user }
            }
        )
        if (!result) {
            throw new Error(`Error al publicar en RabbitMQ (fanout: ${exchange})`)
        }
    }

    async subscribe(params: IParamsSubscribe) {
        await this.connect()
        const { queue } = params
        await this.channel.assertQueue(queue, { durable: true })
        this.channel.consume(queue, this.onMessage.bind(this, params))
    }

    async subscribeFanout(params: IParamsSubscribeFanout) {
        await this.connect()
        const { exchange } = params
        await this.channel.assertExchange(exchange, 'fanout', { durable: true })
        const { queue } = await this.channel.assertQueue('', { exclusive: true });
        await this.channel.bindQueue(queue, exchange, '');
        this.channel.consume(queue, this.onMessage.bind(this, { onMessage: params.onMessage, queue }))
    }

    private async onMessage(params: IParamsSubscribe, msg: ConsumeMessage | null) {
        const { onMessage, queue } = params
        try {
            if (!msg) {
                console.error('No hay mensaje')
                return
            }
            try {
                const message = msg
                    ? isJSON(msg.content.toString()) ? JSON.parse(msg.content.toString()) : msg
                    : null
                const user = msg && msg.properties.headers
                    ? msg.properties.headers.user
                    : null
                const result = await onMessage({ message, user })
            } catch (error) {
                console.error(error)
            }
            this.channel.ack(msg)
        } catch (error) {
            try {
                await this.adapterMail.send(
                    this.env.ADMINISTRATOR_EMAILS,
                    `Error al ejecutar onMessage`,
                    undefined,
                    `Se produjo un error al ejecutar onMessage en queue ${queue}`
                )
            } catch (error) {
                console.error(error)
            }
        }
    }

}