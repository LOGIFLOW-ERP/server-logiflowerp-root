import { AdapterMail } from '@Shared/Infrastructure/Adapters/Mail';
import { SHARED_TYPES } from '@Shared/Infrastructure/IoC/types';
import { inject, injectable } from 'inversify'
import { RootCompanyENTITY } from 'logiflowerp-sdk'
import path from 'path'
import fs from 'fs'

@injectable()
export class UseCaseSendMailWelcomeCompany {

    constructor(
        @inject(SHARED_TYPES.AdapterMail) private readonly adapterMail: AdapterMail,
    ) { }

    async exec(entity: RootCompanyENTITY) {
        const HTMLMessage = this.prepareHTMLmessage(entity)
        const subject = `🎉 Bienvenido a Logiflow ERP: ¡Tu cuenta está lista!`
        await this.adapterMail.send(entity.email, subject, undefined, HTMLMessage)
        return `${this.constructor.name} ejecutado correctamente.`
    }

    private prepareHTMLmessage(entity: RootCompanyENTITY) {
        const filePath = path.join(__dirname, '../../../../public/WelcomeRootCompany.html')
        const html = fs.readFileSync(filePath, 'utf-8')
            .replaceAll('{{empresa}}', entity.companyname)
            .replaceAll('{{codEmpresa}}', entity.code.toLowerCase())
            .replaceAll('{{DNI}}', entity.identityManager)
        return html
    }

}