import { CONFIG_TYPES } from '@Config/types'
import { inject, injectable } from 'inversify'
import { createTransport, Transporter, } from 'nodemailer'

@injectable()
export class AdapterMail {

    private transporter: Transporter

    constructor(
        @inject(CONFIG_TYPES.Env) private readonly env: Env,
    ) {
        this.transporter = this.createTransporter()
    }

    private createTransporter() {
        return createTransport({
            host: this.env.SMTP_HOST,
            port: this.env.SMTP_PORT,
            secure: this.env.SMTP_SECURE,
            auth: {
                user: this.env.EMAIL_USER,
                pass: this.env.EMAIL_PASS
            }
        })
    }

    async send(
        recipients: string | string[],
        subject: string,
        plaintextMessage: string | Buffer<ArrayBufferLike> | undefined,
        HTMLMessage: string | Buffer<ArrayBufferLike> | undefined
    ) {
        try {
            const info = await this.transporter.sendMail({
                from: `"Logiflow ERP" <${this.env.EMAIL_USER}>`,
                to: recipients,
                subject,
                text: plaintextMessage,
                html: HTMLMessage
            })
            console.log('Message sent: %s', info.messageId)
        } catch (error) {
            console.error('Error al enviar el correo electrónico:', error)
            throw error
        }
    }

}